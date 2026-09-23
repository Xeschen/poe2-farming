// Refresh the complete image catalogue from PoEDB Korean pages, not from seed strategies.
// Run explicitly; ordinary builds/tests use the checked-in images without network access.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { editorData } from '../src/editor-data.js';
const checkedAt = new Date().toISOString().slice(0, 10);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['Tablet', 'Waystones', 'Atlas_passive_skill', 'Masters_of_the_Atlas'];
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
await mkdir('test-results', { recursive: true });
await mkdir('assets/poedb', { recursive: true });
try {
  const page = await browser.newPage(), documents = {};
  for (const name of sources) {
    const url = `https://poe2db.tw/kr/${name}`;
    if (process.argv.includes('--snapshots')) documents[name] = await readFile(`test-results/assets-${name}.html`, 'utf8');
    else {
      const response = await fetch(url, { headers: { Referer: 'https://poe2db.tw/', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw Error(`${response.status}: ${url}`);
      documents[name] = await response.text();
      await writeFile(`test-results/assets-${name}.html`, documents[name]);
    }
  }
  const extracted = await page.evaluate(documents => {
    const rows = [];
    for (const [kind, html] of Object.entries(documents)) {
      const d = new DOMParser().parseFromString(html, 'text/html');
      if (kind === 'Masters_of_the_Atlas') {
        for (const cell of d.querySelectorAll('.flex-grow-1')) {
          const img = cell.parentElement.querySelector('img');
          if (!cell.querySelector('.magicitem') || !img?.alt) continue;
          rows.push({ kind: 'master', id: img.alt, name: cell.firstElementChild.firstChild.textContent.trim(), imageUrl: img.getAttribute('src'), sourceUrl: `https://poe2db.tw/kr/${kind}` });
        }
      } else if (kind === 'Atlas_passive_skill') {
        for (const a of d.querySelectorAll('a.PassiveSkills')) {
          const cell = a.closest('.flex-grow-1'), img = cell?.parentElement.querySelector('img');
          if (!img) continue;
          rows.push({ kind: 'atlas', id: a.getAttribute('href').replace(/^\/kr\//, ''), name: a.textContent.trim(), imageUrl: img.getAttribute('src'), sourceUrl: new URL(a.getAttribute('href'), 'https://poe2db.tw/kr/').href });
        }
      } else {
        for (const img of d.querySelectorAll('img')) {
          const a = img.closest('a'), href = a?.getAttribute('href');
          if (!href || img.classList.contains('league_minimap')) continue;
          const named = [...d.querySelectorAll('a')].find(x => x.getAttribute('href')?.replace(/^\/kr\//, '') === href.replace(/^\/kr\//, '') && x.textContent.trim());
          const name = (named?.querySelector('.uniqueName') || named)?.textContent.trim();
          const imageUrl = img.getAttribute('src');
          if (kind === 'Tablet' && imageUrl?.includes('/PrecursorTablets/')) rows.push({ kind: 'tablet', id: href, name, imageUrl, sourceUrl: new URL(href, 'https://poe2db.tw/kr/').href });
          const tier = decodeURIComponent(href).match(/^Waystone_\(Tier_(\d+)\)$/)?.[1];
          if (kind === 'Waystones' && tier && Number(tier) <= 16) rows.push({ kind: 'waystone', id: `tier-${tier}`, name, tier: Number(tier), imageUrl, sourceUrl: new URL(href, 'https://poe2db.tw/kr/').href });
        }
      }
    }
    return [...new Map(rows.map(r => [`${r.kind}:${r.id}`, r])).values()];
  }, documents);
  for (const [kind, list] of [['atlas', editorData.atlas], ['master', editorData.masters]]) for (const entry of list) {
    if (!extracted.some(r => r.kind === kind && r.id === entry.id && r.name === entry.name)) throw Error(`PoEDB image/name mismatch: ${kind}:${entry.id} ${entry.name}`);
  }
  const glossary = JSON.parse(await readFile('data/glossary.ko.json', 'utf8'));
  for (const term of glossary.terms.filter(t => t.kind === '서판')) if (!extracted.some(r => r.kind === 'tablet' && r.name === term.nameKo)) throw Error(`Missing tablet: ${term.nameKo}`);
  for (let tier = 1; tier <= 16; tier++) if (!extracted.some(r => r.kind === 'waystone' && r.tier === tier)) throw Error(`Missing tier ${tier}`);
  const files = new Map();
  for (const row of extracted) {
    const url = new URL(row.imageUrl);
    if (url.origin !== 'https://cdn.poe2db.tw' || !url.pathname.endsWith('.webp')) throw Error(`Unexpected image source ${row.imageUrl}`);
    if (!files.has(row.imageUrl)) files.set(row.imageUrl, { path: `assets/poedb/${hash(row.imageUrl).slice(0, 20)}.webp` });
  }
  const queue = [...files.entries()]; let complete = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const [url, file] = queue.shift();
      const response = await fetch(url, { headers: { Referer: 'https://poe2db.tw/', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw Error(`${response.status}: ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw Error(`Not WebP: ${url}`);
      await writeFile(file.path, bytes);
      Object.assign(file, { sha256: hash(bytes), bytes: bytes.length });
      complete++; if (complete % 40 === 0) console.log(`Images: ${complete}/${files.size}`);
    }
  }));
  const assets = extracted.map(row => ({ ...row, ...files.get(row.imageUrl) }));
  await writeFile('src/image-assets.js', `// PoEDB Korean image mapping. Generated by scripts/refresh-image-assets.mjs.\nexport const imageCatalogue = ${JSON.stringify({ checkedAt, credits: 'Game artwork © Grinding Gear Games. Image references: PoEDB (poe2db.tw).', assets }, null, 2)};\n`);
  console.log(JSON.stringify({ entries: assets.length, files: files.size, bytes: [...files.values()].reduce((n, f) => n + f.bytes, 0), groups: Object.fromEntries(['tablet','waystone','atlas','master'].map(k => [k, assets.filter(a => a.kind === k).length])) }));
} finally { await browser.close(); }
