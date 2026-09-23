import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { imageCatalogue } from '../src/image-assets.js';
const root=process.env.APP_URL || 'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH}:{})});
const seed=JSON.parse(await readFile('data/library.ko.json','utf8'));
await mkdir('test-results',{recursive:true});
try {
  for(const width of [1265,960,390,320]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,isMobile:width<700});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(root+'?method=azmeri-strongbox');
    await page.locator('.tablet-card').first().waitFor();
    assert.equal(await page.locator('.tablet-card').count(),2);
    assert.match(await page.locator('.tablet-count').first().innerText(),/3개/);
    assert.equal(await page.locator('.atlas-icon-strip .visual-node').count(),seed.strategies[0].atlas.nodes.length);
    assert.equal(await page.locator('.master-icon-strip .visual-node').count(),24);
    assert.equal(await page.locator('.master-icon-strip [data-recorded=true]').count(),8);
    assert.equal(await page.locator('.master-icon-strip [data-recorded=false]').count(),16);
    const cells=await page.locator('.master-icon-strip').first().locator('.master-map-card').evaluateAll(items=>items.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y};}));
    assert.equal(new Set(cells.map(c=>c.x)).size,3);
    assert.equal(new Set(cells.map(c=>c.y)).size,4);
    for(const [affix,letter] of [['prefix','P'],['suffix','S']]) {
      for(const label of await page.locator(`.affix-label.${affix}`).all()) assert.equal(await label.innerText(),letter);
    }
    const tablet=page.locator('.tablet-card').first(), trade=tablet.locator('[data-trade]');
    const cardBounds=await tablet.boundingBox(), buttonBounds=await trade.boundingBox();
    assert.ok(Math.abs(cardBounds.width-buttonBounds.width)<=2 && Math.abs(cardBounds.height-buttonBounds.height)<=2,'trade button fills the card');
    assert.equal(await tablet.locator('a,button').count(),1,'one interactive target for entire item');
    if(width>=700) {
      await page.mouse.move(0,0);
      assert.equal(await tablet.locator('.item-trade-hint').evaluate(e=>getComputedStyle(e).opacity),'0');
      await trade.hover();
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('.tablet-card .item-trade-hint')).opacity==='1');
      if(width===1265) await tablet.screenshot({path:'test-results/visual-tablet-hover.png'});
    }
    await trade.click({position:{x:12,y:35}});
    await page.getByRole('dialog').filter({hasText:'거래소'}).waitFor();
    await page.keyboard.press('Escape');
    assert.doesNotMatch(await page.locator('.waystone-card').innerText(),/타락 여부 미확인|속성 미확인/);
    const node=page.locator('.atlas-icon-strip .visual-node').first();
    await node.scrollIntoViewIfNeeded();
    if(width<700) await node.tap(); else await node.hover();
    await page.locator('.visual-term-card').waitFor();
    assert.equal(await page.locator('.visual-term-card .chosen').innerText(),'풀');
    assert.equal(await page.locator('.visual-term-card .chosen').getAttribute('aria-current'),'true');
    assert.doesNotMatch(await page.locator('.visual-term-card').innerText(),/이 세팅의 선택|이 세팅에서 고른 선택지/);
    assert.equal(await page.locator('.visual-term-card .selection').count(),0);
    assert.ok(await page.locator('.visual-term-card .all-node-choices').isVisible());
    assert.equal(await page.locator('.visual-term-card details').count(),0);
    const box=await page.locator('.visual-term-card').boundingBox();
    assert.ok(box.x>=0 && box.x+box.width<=width+1 && box.y>=0 && box.y+box.height<=901);
    await page.screenshot({path:`test-results/visual-tooltip-${width}.png`});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.term-card').count(),0);
    const ability=page.locator('.master-icon-strip .is-selected .visual-node').last();
    if(width<700) await ability.tap(); else { await ability.focus(); await page.keyboard.press('Enter'); }
    await page.locator('.term-card').waitFor();
    assert.match(await page.locator('.term-card').innerText(),/힐다.*선택한 능력/s);
    if(width>=700) {await page.keyboard.press('ArrowDown'); assert.equal(await page.locator('.close-term').evaluate(e=>e===document.activeElement),true);}
    await page.locator('.close-term').click();
    assert.equal(await page.locator('.term-card').count(),0);
    const unselected=page.locator('.master-icon-strip [data-recorded=false] .visual-node').first();
    await unselected.click();
    assert.match(await page.locator('.term-card').innerText(),/선택하지 않은 능력/);
    await page.keyboard.press('Escape');
    await page.locator('#setup').screenshot({path:`test-results/visual-setup-${width}.png`});
    await page.locator('#tablets').screenshot({path:`test-results/visual-tablets-${width}.png`});
    await page.locator('#waystone').screenshot({path:`test-results/visual-waystone-${width}.png`});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
    await page.locator('[data-trade=waystone]').focus();
    await page.keyboard.press('Space');
    await page.getByRole('dialog').filter({hasText:'거래소'}).waitFor();
    await page.keyboard.press('Escape');
    if(width===1265) {
      // Decode every preloaded resource, including images absent from all current seed methods.
      const failed=await page.evaluate(async paths=>{
        const failures=[];
        for(const path of paths) {const img=new Image();img.src=path;try{await img.decode();if(!img.naturalWidth) failures.push(path);}catch{failures.push(path);}}
        return failures;
      },[...new Set(imageCatalogue.assets.map(a=>'./'+a.path))]);
      assert.deepEqual(failed,[]);
    }
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('PASS: complete image catalogue decodes, compact conditions, selected icons, hover/keyboard/touch overlays, trade access and 1265/960/390/320 layout');
} finally {await browser.close();}
