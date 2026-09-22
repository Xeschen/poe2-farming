import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { publicFiles } from './release-files.mjs';
import { readLibrary, validateLibrary } from './library-overrides.mjs';

async function filesIn(folder, prefix = '') {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `배포 심볼릭 링크 금지: ${prefix}${entry.name}`);
    if (entry.isDirectory()) result.push(...await filesIn(`${folder}/${entry.name}`, `${prefix}${entry.name}/`));
    else result.push(prefix + entry.name);
  }
  return result;
}
const files = await filesIn('dist');
assert.deepEqual(files.sort(), [...publicFiles].sort(), '배포 파일은 허용 목록과 정확히 일치해야 합니다.');
const library = JSON.parse(await readFile('dist/data/library.ko.json', 'utf8'));
assert.deepEqual(library, await readLibrary('.'), '운영자 수정이 빌드에 반영되어야 합니다.');
await validateLibrary('.', library);
let bytes = 0;
for (const file of files) {
  bytes += (await lstat(`dist/${file}`)).size;
  const content = await readFile(`dist/${file}`, 'utf8');
  assert.doesNotMatch(content, /libraryAdmin|local-library-admin|LOCAL_ADMIN_START|X-Admin-Token|\/__admin\//, `관리 기능 잔류: ${file}`);
  if (file.endsWith('.js')) for (const match of content.matchAll(/(?:from\s*|import\s*\()\s*['"](\.\.?\/[^'"]+)['"]/g)) {
    const dependency = posix.normalize(posix.join(posix.dirname(file), match[1]));
    assert.ok(publicFiles.includes(dependency), `배포 모듈 누락: ${file} → ${dependency}`);
  }
}
// This is a bounded check of Git upload candidates, not a guarantee against every secret format.
const candidates = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
for (const file of candidates) {
  assert.ok(!/(^|\/)(?:test-results|backups|local-data|node_modules|dist)(\/|$)|\.personal\.json$|(^|\/)\.env(?:$|\.)/.test(file), `공개 제외 파일이 Git 대상에 포함됨: ${file}`);
  const content = await readFile(resolve(file), 'utf8').catch(e => { if (e.code === 'ENOENT') return ''; throw e; });
  assert.doesNotMatch(content, /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/, `자격 증명 형식 발견: ${file}`);
}
console.log(`Release check passed: ${files.length} public files, ${(bytes / 1024 / 1024).toFixed(2)} MiB, ${library.strategies.length} methods, ${library.sources.length} sources; admin excluded, overrides included, Git upload candidates checked.`);
console.log(JSON.stringify(library.strategies.map(m => ({ name: m.name, patch: m.patch, masterChoices: m.masters.choices.map(c => `${c.name} ${c.nodes.length}/4`), atlasVerified: m.atlas.fullTreeVerified, unresolved: m.unresolved.length })), null, 2));
