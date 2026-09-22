import { mkdir, copyFile, rm, readFile, writeFile, lstat, realpath } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { readLibrary, validateLibrary } from './library-overrides.mjs';
import { publicFiles, stripLocalAdmin } from './release-files.mjs';
const library = await readLibrary('.');
await validateLibrary('.', library);
const app = stripLocalAdmin(await readFile('src/app.js', 'utf8'));
const root = await realpath('.'), target = resolve(root, 'dist');
// Never recursively remove a symlink, an arbitrary argument or a path outside this project.
if (target !== root + sep + 'dist') throw Error('Unexpected build directory');
const existing = await lstat(target).catch(e => { if (e.code !== 'ENOENT') throw e; });
if (existing?.isSymbolicLink()) throw Error('Build directory must not be a symbolic link');
if (existing && await realpath(target) !== target) throw Error('Unexpected resolved build directory');
await rm(target, { recursive: true, force: true });
for (const file of publicFiles) {
  const destination = resolve(target, file);
  await mkdir(dirname(destination), { recursive: true });
  if (file === 'src/app.js') await writeFile(destination, app);
  else if (file === 'data/library.ko.json') await writeFile(destination, JSON.stringify(library, null, 2) + '\n');
  else await copyFile(file, destination);
}
console.log('Static app built in dist/ (relative URLs support GitHub Pages subpaths).');
