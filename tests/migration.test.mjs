import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blankRecord, envelope, parseBackup, createStore, STORAGE_KEY, validateData} from '../src/model.js';
const terms = JSON.parse(readFileSync(new URL('../data/glossary.ko.json', import.meta.url))).terms;
function previous(version) {
  const kept = blankRecord(); kept.method.name = '개인 세팅'; kept.method.notes = '보존할 메모';
  kept.method.kind = 'map'; kept.method.budget = {amount:12,currency:'엑잘티드 오브',basis:'map'};
  const retired = blankRecord(); retired.method.id = 'tablet-crafting-sale'; retired.method.kind = 'crafting';
  retired.method.tablets.usage = 'materials'; retired.method.investment = 'variable';
  for (const key of ['waystone','map','atlas','masters']) retired.method[key] = null;
  const records = [kept, retired];
  if (version === 1) for (const r of records) { delete r.method.content; delete r.method.tablets.usage; }
  return {...envelope(records), schemaVersion:version};
}
for (const version of [1,2,3,4]) test(`v${version} removes discontinued records from storage and subsequent backups`, () => {
  const old = previous(version), raw = JSON.stringify(old);
  const {data,note} = parseBackup(raw, terms);
  assert.equal(data.schemaVersion,6); assert.equal(data.records.length,1); assert.match(note,/제외된 기록 1개/);
  const r = data.records[0]; assert.equal(r.id,old.records[0].id); assert.equal(r.method.notes,'보존할 메모');
  assert.equal(r.method.budget.amount,12); assert.equal('basis' in r.method.budget,false); assert.equal('kind' in r.method,false);
  let saved = raw;
  const store = createStore({getItem:()=>saved,setItem:(key,value)=>{assert.equal(key,STORAGE_KEY); saved=value;}}, terms);
  assert.deepEqual(store.read(),data); assert.deepEqual(JSON.parse(saved),data);
  assert.deepEqual(parseBackup(JSON.stringify(envelope(store.read().records)),terms).data,data);
  assert.doesNotMatch(saved,/tablet-crafting-sale|crafting|materials/);
});
test('migration can remove every old record and rejects invalid remaining data without overwriting storage', () => {
  const old = previous(3); old.records.shift();
  assert.deepEqual(parseBackup(JSON.stringify(old),terms).data,envelope([]));
  const broken = previous(3); broken.records[0].method.name = '';
  const raw = JSON.stringify(broken);
  const store = createStore({getItem:()=>raw,setItem:()=>assert.fail('invalid migrations must not write')},terms);
  assert.throws(()=>store.read());
});
test('current schema rejects removed category, material mode and absent setup objects', () => {
  const record = blankRecord(); record.method.kind = 'map';
  assert.ok(validateData(envelope([record]),terms).some(e=>e.includes('kind')));
  delete record.method.kind; record.method.tablets.usage='materials';
  assert.ok(validateData(envelope([record]),terms).length);
  record.method.tablets.usage='unknown'; record.method.map=null;
  assert.ok(validateData(envelope([record]),terms).length);
});
test('legacy batch cost is retained as a note instead of relabeled as cost per map', () => {
  const old = previous(3); old.records[0].method.budget.basis='batch';
  const m = parseBackup(JSON.stringify(old),terms).data.records[0].method;
  assert.equal(m.budget.amount,null); assert.match(m.notes,/12 엑잘티드 오브/); assert.match(m.notes,/보존할 메모/);
});

for (const version of [1,2,3,4]) test(`v${version} moves correction advice into editable cautions and retains its source`, () => {
  const old = previous(version), record = old.records[0];
  const correction = { text: '내 세팅의 주의사항', url: 'https://www.youtube.com/watch?v=Mi3d9GtgwkI&lc=comment',
    supersedes: { videoId: 'Mi3d9GtgwkI', startSeconds: 1783, url: 'https://www.youtube.com/watch?v=Mi3d9GtgwkI&t=1783s' } };
  record.method.corrections = [correction];
  record.method.constraints = [{ text: '기존 주의사항', evidence: null }];
  const before = structuredClone(old);
  const data = parseBackup(JSON.stringify(old), terms).data, migrated = data.records[0];
  assert.equal(migrated.id, record.id);
  assert.equal(migrated.updatedAt, record.updatedAt);
  assert.equal(migrated.method.notes, record.method.notes);
  assert.deepEqual(migrated.method.constraints, [...record.method.constraints, { text: correction.text, evidence: null, sourceUrl: correction.url }]);
  assert.equal('corrections' in migrated.method, false);
  assert.doesNotMatch(JSON.stringify(data), /supersedes|1783s/);
  assert.deepEqual(parseBackup(JSON.stringify(data), terms).data, data);
  assert.deepEqual(old, before);
});

test('malformed legacy corrections and unsafe caution links cannot replace stored data', () => {
  for (const corrections of [null, {}, [{ text: '주의', url: 'javascript:alert(1)' }], [{ text: '', url: 'https://example.com' }], [{ text: '주의', url: 'https://example.com', extra: 'unrecognized' }]]) {
    const old = previous(4); old.records[0].method.corrections = corrections;
    const raw = JSON.stringify(old);
    const store = createStore({ getItem: () => raw, setItem: () => assert.fail('invalid migration must not overwrite storage') }, terms);
    assert.throws(() => store.read());
  }
  const record = blankRecord(); record.method.constraints = [{ text: '주의', evidence: null, sourceUrl: 'javascript:alert(1)' }];
  assert.ok(validateData(envelope([record]), terms).length);
  record.method.constraints = []; record.method.corrections = [];
  assert.ok(validateData(envelope([record]), terms).some(e => e.includes('corrections')));
});
