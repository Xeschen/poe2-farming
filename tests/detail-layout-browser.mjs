import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const root=process.env.APP_URL || 'http://127.0.0.1:4173/';
const key='poe2-farming:detail-layout';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_PATH ? {executablePath:process.env.BROWSER_PATH}:{})});
try {
  for(const width of [1440,960,390,320]) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,isMobile:width<700});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(root+'?method=azmeri-strongbox');
    const compact=page.getByRole('button',{name:'컴팩트형',exact:true});
    const openOutline=async()=>{
      await page.locator('#reading-toc-toggle').waitFor({state:'attached'});
      const toggle=page.locator('#reading-toc-toggle');
      if(await toggle.isVisible() && await toggle.getAttribute('aria-expanded')==='false') await toggle.click();
    };
    await openOutline();
    await compact.waitFor();
    assert.equal(await compact.innerText(),'','layout control is icon-only');
    assert.equal(await compact.locator('svg').count(),1);
    assert.equal(await page.locator('#reading-toc .detail-view-controls').count(),0,'layout buttons outside outline box');
    assert.doesNotMatch(await page.locator('#reading-toc').innerText(),/이 페이지/);
    const controlsBox=await page.locator('.detail-view-controls').boundingBox(), firstLink=await page.locator('#reading-toc a').first().boundingBox();
    assert.ok(controlsBox.y+controlsBox.height<=firstLink.y,'layout icons above outline links');
    if(width>1000) {const nav=await page.locator('#reading-toc').boundingBox();assert.ok(Math.abs(900-nav.y-nav.height-24)<2,'outline anchored to bottom');}
    await page.screenshot({path:`test-results/detail-layout-controls-${width}.png`});
    assert.equal(await page.locator('#content').getAttribute('data-detail-layout'),'comfortable');
    const before=await page.locator('.detail-main').textContent();
    const height=await page.locator('.detail-main').evaluate(e=>e.getBoundingClientRect().height);
    const stored=await page.evaluate(()=>Object.entries(localStorage));
    await compact.click();
    assert.equal(await compact.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.detail-main').textContent(),before,'no information removed');
    assert.ok(await page.locator('.detail-main').evaluate(e=>e.getBoundingClientRect().height)<height,'compact layout reduces height');
    assert.deepEqual(await page.evaluate(k=>Object.entries(localStorage).filter(([name])=>name!==k),key),stored,'personal data untouched');
    if(width<=1000) await page.keyboard.press('Escape');
    const checkColumns=async expected=>{
      const a=await page.locator('#tablets').boundingBox(), b=await page.locator('#waystone').boundingBox();
      assert.equal(Math.abs(a.y-b.y)<2,expected,'automatic section columns');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
    };
    await checkColumns(await page.locator('#content').evaluate(e=>e.clientWidth>=900));
    await page.locator('.detail-layout').screenshot({path:`test-results/detail-layout-compact-${width}.png`});
    for(const point of [0,0.5,1]) {
      await page.evaluate(p=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*p,behavior:'instant'}),point);
      const control=page.locator(width<=1000 ? '#reading-toc-toggle' : '#reading-toc');
      const r=await control.boundingBox();
      assert.ok(r.y>=0 && r.y+r.height<=901,'outline reachable at top, middle and bottom');
    }
    if(width<=1000) {
      await page.locator('#reading-toc-toggle').click();
      assert.equal(await page.locator('#reading-toc-toggle').getAttribute('aria-expanded'),'true');
      await page.screenshot({path:`test-results/detail-toc-open-${width}.png`});
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#reading-toc-toggle').evaluate(e=>e===document.activeElement),true);
      await page.locator('#content [data-compare]').click();
      await page.waitForFunction(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--compare-tray-height'))===document.querySelector('#compare-tray').getBoundingClientRect().height);
      const launcher=await page.locator('#reading-toc-toggle').boundingBox(), tray=await page.locator('#compare-tray').boundingBox();
      assert.ok(launcher.y+launcher.height<=tray.y,`outline launcher clears comparison tray: ${JSON.stringify({width,launcher,tray})}`);
      await page.locator('#content [data-compare]').click();
      await page.locator('#reading-toc-toggle').click();
      await page.locator('#sources > summary').click();
      assert.equal(await page.locator('#reading-toc').isVisible(),false,'outside click closes outline');
      await page.locator('#sources > summary').click();
    } else await page.screenshot({path:'test-results/detail-toc-desktop.png'});
    const ability=page.locator('.master-icon-strip .visual-node').first();
    const bounds=await ability.boundingBox(); assert.ok(bounds.width>=44 && bounds.height>=44,'touch target retained');
    await ability.click(); await page.locator('.visual-term-card').waitFor(); await page.keyboard.press('Escape');
    await page.locator('.tablet-card [data-trade]').first().click();
    await page.locator('#trade-dialog[open]').waitFor(); await page.keyboard.press('Escape');
    await page.locator('#tablets > summary').click();
    await openOutline();
    await page.getByRole('button',{name:'기본형',exact:true}).click();
    assert.equal(await page.locator('#tablets').getAttribute('open'),null,'collapse retained across layouts');
    await compact.focus(); await page.keyboard.press('Space');
    assert.equal(await compact.evaluate(e=>e===document.activeElement),true,'focus preserved');
    await openOutline();
    await page.locator('[data-detail-section=tablets]').click();
    assert.notEqual(await page.locator('#tablets').getAttribute('open'),null,'outline reopens section');
    await page.reload(); await openOutline(); await compact.waitFor();
    assert.equal(await compact.getAttribute('aria-pressed'),'true','preference survives reload');
    await page.goto(root+'?view=library'); await page.locator('.browse-card').first().waitFor();
    assert.equal(await page.locator('#content').getAttribute('data-detail-layout'),null,'reading layout does not affect library');
    await page.goto(root+'?method=azmeri-strongbox'); await openOutline(); await compact.waitFor();
    assert.equal(await compact.getAttribute('aria-pressed'),'true');
    if(width===1440) {
      await page.setViewportSize({width:720,height:500}); await checkColumns(false);
      assert.equal(await page.locator('#reading-toc-toggle').isVisible(),true,'short narrow viewport has persistent outline launcher');
      await page.locator('#reading-toc-toggle').click();
      const outline=await page.locator('#reading-toc').boundingBox();
      assert.ok(outline.y>=0 && outline.y+outline.height<=500);
      await page.setViewportSize({width:1440,height:900}); await checkColumns(true);
      await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('storage disabled');};});
      await page.getByRole('button',{name:'기본형',exact:true}).click();
      assert.equal(await page.locator('#content').getAttribute('data-detail-layout'),'comfortable');
      assert.match(await page.locator('#toast').innerText(),/현재 화면에 적용/);
    }
    assert.deepEqual(errors,[]); await context.close();
  }
  console.log('PASS: compact/comfortable layouts, responsive columns, reduced height, persistence, untouched records, collapse/focus retention, icons and trade, storage fallback');
} finally {await browser.close();}
