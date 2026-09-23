// Only these files may be published. Adding a runtime asset requires review here.
import { imageCatalogue } from '../src/image-assets.js';
export const publicFiles = [
  '.nojekyll', 'index.html', 'styles.css',
  'data/library.ko.json', 'data/glossary.ko.json',
  ...['app', 'catalog', 'comparison', 'details', 'editor', 'editor-data', 'legacy',
    'master-view', 'model', 'play', 'trade', 'trade-data', 'trade-ui', 'usability', 'waystones', 'image-assets', 'visual-setup'].map(name => `src/${name}.js`),
  'src/trade-data-LICENSE.txt', 'assets/poedb/CREDITS.txt',
  ...new Set(imageCatalogue.assets.map(a => a.path))
];

export function stripLocalAdmin(source) {
  let inside = false, blocks = 0;
  const output = [];
  for (const line of source.split(/\r?\n/)) {
    if (line.trim() === '// LOCAL_ADMIN_START') {
      if (inside) throw Error('Nested local admin build marker');
      inside = true; blocks++; continue;
    }
    if (line.trim() === '// LOCAL_ADMIN_END') {
      if (!inside) throw Error('Unmatched local admin build marker');
      inside = false; continue;
    }
    if (!inside) output.push(line);
  }
  if (inside || !blocks) throw Error('Missing local admin build boundary');
  const result = output.join('\n');
  if (/libraryAdmin|libraryRevision|local-admin|__admin\/|local-library-admin/.test(result)) throw Error('Local admin code remains in public app');
  return result;
}
