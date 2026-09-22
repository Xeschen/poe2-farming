import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { copyMethod, envelope, validateData } from '../src/model.js';

export const revisionOf = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function readOverrides(root) {
  try { return JSON.parse(await readFile(join(root, 'data/library-overrides.ko.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { version: 1, methods: [] }; throw error; }
}
export function applyOverrides(library, overrides) {
  if (overrides.version !== 1 || !Array.isArray(overrides.methods)) throw Error('관리 수정 파일 형식을 확인하세요.');
  const result = structuredClone(library), seen = new Set();
  for (const method of overrides.methods) {
    const index = result.strategies.findIndex(m => m.id === method.id);
    if (index < 0 || seen.has(method.id)) throw Error(`관리 수정 대상 ID를 확인하세요: ${method.id}`);
    seen.add(method.id); result.strategies[index] = structuredClone(method);
  }
  return result;
}
export async function readLibrary(root) {
  const base = JSON.parse(await readFile(join(root, 'data/library.ko.json'), 'utf8'));
  return applyOverrides(base, await readOverrides(root));
}
export async function validateLibrary(root, library) {
  const { terms } = JSON.parse(await readFile(join(root, 'data/glossary.ko.json'), 'utf8'));
  const errors = validateData(envelope(library.strategies.map(m => copyMethod(library, m))), terms);
  if (errors.length) throw Object.assign(Error(errors.join('\n')), { status: 422 });
}
export async function saveMethod(root, { revision, method }) {
  const library = await readLibrary(root);
  if (revision !== revisionOf(library)) throw Object.assign(Error('원본이 다른 곳에서 변경되었습니다. 입력 내용을 복사해 보관한 뒤 새로고침하여 다시 편집하세요.'), { status: 409 });
  const original = library.strategies.find(m => m.id === method?.id);
  if (!original) throw Object.assign(Error('기존 기본 자료만 수정할 수 있습니다.'), { status: 422 });
  const editable = ['name', 'notes', 'patch', 'budget', 'goals', 'content', 'summary', 'tablets', 'waystone', 'map', 'atlas', 'masters', 'supplies', 'steps', 'stopConditions', 'constraints', 'unresolved'];
  const next = structuredClone(original);
  for (const key of editable) if (Object.hasOwn(method, key)) next[key] = structuredClone(method[key]);
  for (const key of ['tablets', 'waystone', 'atlas', 'masters']) if (next[key] && typeof next[key] === 'object') next[key].evidence = structuredClone(original[key].evidence);
  for (const key of ['atlas', 'masters']) {
    const verified = key === 'atlas' ? 'fullTreeVerified' : 'fullSetupVerified';
    if (next[key] && !original[key][verified]) next[key][verified] = false;
  }
  const overrides = await readOverrides(root);
  overrides.methods = [...overrides.methods.filter(m => m.id !== next.id), next];
  const result = applyOverrides(library, overrides);
  await validateLibrary(root, result);
  const target = join(root, 'data/library-overrides.ko.json'), temp = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(overrides, null, 2) + '\n', { flag: 'wx' });
    await rename(temp, target);
  } finally { await rm(temp, { force: true }); }
  return { library: result, revision: revisionOf(result) };
}
