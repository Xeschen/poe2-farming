import { resolve } from 'node:path';
import { createLocalServer } from './local-server.mjs';
const args = process.argv.slice(2), admin = args.includes('--admin');
const root = resolve(args.find(arg => !arg.startsWith('--')) || '.');
const port = Number(process.env.PORT || 4173);
createLocalServer(root, { admin }).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}${admin ? ' · 로컬 라이브러리 관리 모드' : ''}`));
