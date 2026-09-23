import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { imageCatalogue } from '../src/image-assets.js';
import { editorData } from '../src/editor-data.js';
import { imageFor, waystoneImage, waystoneCard, tabletCard, compactOptions, propertyValue } from '../src/visual-setup.js';
import { blankRecord, makeModifier } from '../src/model.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const ctx = { esc, rich: esc, term: esc };

test('all supported combinations have local, source-matched, intact image assets', async () => {
  const terms = JSON.parse(await readFile('data/glossary.ko.json','utf8')).terms;
  for (const t of terms.filter(t => t.kind === '서판')) assert.ok(imageFor('tablet',t.nameKo), t.nameKo);
  for (const n of editorData.atlas) assert.equal(imageFor('atlas',n.name)?.id,n.id,n.name);
  for (const n of editorData.masters) assert.equal(imageFor('master',n.name)?.id,n.id,n.name);
  for (let tier=1;tier<=16;tier++) assert.ok(waystoneImage(tier), `tier ${tier}`);
  assert.equal(waystoneImage(null), undefined, 'unknown tier must not masquerade as tier 1');
  for (const a of imageCatalogue.assets) {
    assert.match(a.path,/^assets\/poedb\/[a-f0-9]{20}\.webp$/);
    assert.ok(a.sourceUrl.startsWith('https://poe2db.tw/kr/'));
    assert.ok(a.imageUrl.startsWith('https://cdn.poe2db.tw/image/'));
    const bytes=await readFile(a.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
});

test('compact cards preserve numeric boundaries, zero, priorities and unconfirmed conditions', () => {
  const w=blankRecord().method.waystone;
  assert.match(waystoneCard(w,false,ctx),/경로석 조건 미확인/);
  w.tier=16; w.affixCount=8; w.corrupted=false;
  w.properties={ itemRarity:{min:0,max:0}, packSize:{min:null,max:25}, revives:{min:1,max:null} };
  const html=waystoneCard(w,false,ctx);
  assert.match(html,/16등급/); assert.match(html,/비타락/); assert.match(html,/0%/); assert.match(html,/25% 이하/); assert.match(html,/1회 이상/);
  assert.doesNotMatch(html,/몬스터 희귀도|타락 여부 미확인|속성 미확인/);
  assert.equal(propertyValue({min:10,max:20},'%'),'10~20%');
  const mod=editorData.modifiers.find(m=>m.numeric), option=makeModifier(mod.id,'avoid',0);
  assert.match(compactOptions([option],ctx),/회피/); assert.match(compactOptions([option],ctx),/≥0/);
  const t={name:'의식 서판',count:null,status:'optional',options:[],optionRequirement:'unknown'};
  assert.match(tabletCard(t,0,false,ctx),/개수 미확인/); assert.match(tabletCard(t,0,false,ctx),/속성 미확인/);
  t.optionRequirement='unrestricted'; assert.match(tabletCard(t,0,false,ctx),/속성 제한 없음/);
  const before=JSON.stringify(w); waystoneCard(w,true,ctx); assert.equal(JSON.stringify(w),before);
});
