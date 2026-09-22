import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {copyMethod, envelope, parseBackup, validateData} from '../src/model.js';
import {optionRequirementText, groupedTablets, canLinkInProse, progressFor, preparationItems, nextRun} from '../src/usability.js';
import {tradePlan} from '../src/trade.js';
import {comparisonRows} from '../src/catalog.js';
const seed=JSON.parse(readFileSync(new URL('../data/library.ko.json',import.meta.url)));
const terms=JSON.parse(readFileSync(new URL('../data/glossary.ko.json',import.meta.url))).terms;
const method=seed.strategies.find(m=>m.id==='abyss-currency');
test('unknown and explicitly unrestricted options survive copy, comparison, trade and backup',()=>{
  const record=copyMethod(seed,method), item=record.method.tablets.items[2];
  assert.equal(optionRequirementText(item),'속성 제한 없음');
  assert.match(tradePlan(record.method,'tablet',2).notes[0],/속성 제한 없음/);
  assert.ok(comparisonRows([{method}]).find(r=>r.id==='options').values[0].some(v=>v.includes('속성 제한 없음')));
  assert.deepEqual(parseBackup(JSON.stringify(envelope([record])),terms).data.records,[record]);
  const legacy=structuredClone(record); delete legacy.method.tablets.items[2].optionRequirement;
  const restored=parseBackup(JSON.stringify({...envelope([legacy]),schemaVersion:5}),terms).data;
  assert.equal(restored.schemaVersion,6); assert.deepEqual(restored.records,[legacy]);
  assert.equal(optionRequirementText(restored.records[0].method.tablets.items[2]),'속성 미확인');
  assert.match(tradePlan(legacy.method,'tablet',2).notes[0],/미확인/);
  item.options.push(structuredClone(record.method.tablets.items[0].options[0]));
  assert.ok(validateData(envelope([record]),terms).some(e=>e.includes('제한 없음')));
});
test('tablet totals preserve unknown quantities and different priorities',()=>{
  assert.deepEqual(groupedTablets(method),[{name:'심연 서판',status:'required',count:3,configurations:3}]);
  const m=structuredClone(method); m.tablets.items[1].count=null; m.tablets.items[2].status='optional';
  assert.equal(groupedTablets(m)[0].count,null); assert.equal(groupedTablets(m)[1].status,'optional');
});
test('automatic prose links respect word boundaries and Korean particles',()=>{
  assert.equal(canLinkInProse('신성한 오브를 사용한다.',0,'신성한 오브'),true);
  assert.equal(canLinkInProse('접두신성한 오브',2,'신성한 오브'),false);
  assert.equal(canLinkInProse('산산조각',0,'산'),false);
});
test('run progress is isolated per method and invalidated by setting changes',()=>{
  const cache=new Map(), m=structuredClone(method), original=JSON.stringify(m);
  const state=progressFor(cache,'base:abyss-currency',m); state.checked.push(0); state.step=2;
  assert.equal(progressFor(cache,'base:abyss-currency',m).step,2);
  assert.equal(progressFor(cache,'personal-one',m).step,0);
  m.tablets.items[0].count=2;
  const next=progressFor(cache,'base:abyss-currency',m); assert.equal(next.changed,true); assert.deepEqual(next.checked,[]); assert.equal(next.step,0);
  assert.equal(JSON.stringify(method),original);
});
test('preparation exposes distinct tablet roles and keeps reviewed duplicate supplies as explanations',()=>{
  const m=structuredClone(method), items=preparationItems(m);
  assert.equal(items.filter(i=>i.trade==='tablet').length,3);
  assert.equal(new Set(items.filter(i=>i.trade==='tablet').map(i=>i.role)).size,3);
  assert.equal(items[2].role,'속성 제한 없음');
  for (const text of m.supplies) {
    assert.ok(items.some(i=>i.notes?.includes(text)));
    assert.ok(!items.some(i=>i.text===text));
  }
  m.supplies.push(m.supplies[0]+'와 별도의 재료');
  assert.ok(preparationItems(m).some(i=>i.text===m.supplies.at(-1)), 'edited or unfamiliar supplies remain independent');
  m.tablets.items=[];
  assert.ok(preparationItems(m).some(i=>i.text===m.supplies[0]), 'without the structured object its reference must remain checkable');
  for (const m of seed.strategies) {
    const items=preparationItems(m);
    for (const text of [...m.supplies,...m.map.conditions]) assert.ok(items.some(i=>i.text===text||i.notes?.includes(text)),m.id+': '+text);
  }
});
test('next run resets only user-selected preparation and uses the chosen repeat entry point',()=>{
  const cache=new Map(), m=structuredClone(method), state=progressFor(cache,'a',m);
  state.checked=[0,1,3]; state.step=2;
  nextRun(state);
  assert.deepEqual(state.checked,[0,1,3]); assert.equal(state.step,0);
  state.repeat=[0,3]; state.startStep=1; state.step=2;
  nextRun(state);
  assert.deepEqual(state.checked,[1]); assert.equal(state.step,1); assert.equal(state.round,3);
  assert.equal(progressFor(cache,'b',m).repeat.length,0);
  m.notes='changed';
  const reset=progressFor(cache,'a',m);
  assert.deepEqual(reset.repeat,[]); assert.equal(reset.startStep,0); assert.equal(reset.round,1); assert.equal(reset.changed,true);
});
