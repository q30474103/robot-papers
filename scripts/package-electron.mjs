import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const electronDist = path.join(projectRoot, 'node_modules', 'electron', 'dist');
const releaseRoot = path.join(projectRoot, 'release');
const targetRoot = path.join(releaseRoot, 'Robot Papers-win32-x64');
const resourcesRoot = path.join(targetRoot, 'resources');
const appRoot = path.join(resourcesRoot, 'app');

const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
if (!packageJson.version) throw new Error('package.json 缺少版本号。');

await mkdir(releaseRoot, { recursive: true });
await rm(targetRoot, { recursive: true, force: true });
await cp(electronDist, targetRoot, { recursive: true });
await rename(path.join(targetRoot, 'electron.exe'), path.join(targetRoot, 'Robot Papers.exe'));

await mkdir(path.join(appRoot, 'electron'), { recursive: true });
await mkdir(path.join(resourcesRoot, 'scripts'), { recursive: true });
await mkdir(path.join(resourcesRoot, 'assets'), { recursive: true });

await cp(path.join(projectRoot, 'electron', 'main.cjs'), path.join(appRoot, 'electron', 'main.cjs'));
await cp(path.join(projectRoot, 'electron', 'preload.cjs'), path.join(appRoot, 'electron', 'preload.cjs'));
await cp(path.join(projectRoot, 'electron', 'ai-defaults.cjs'), path.join(appRoot, 'electron', 'ai-defaults.cjs'));
await cp(path.join(projectRoot, 'dist-electron', 'renderer'), path.join(resourcesRoot, 'renderer'), { recursive: true });
await cp(path.join(projectRoot, 'scripts', 'sync-library.mjs'), path.join(resourcesRoot, 'scripts', 'sync-library.mjs'));
await cp(path.join(projectRoot, 'assets', 'robot-papers-icon.ico'), path.join(resourcesRoot, 'assets', 'robot-papers-icon.ico'));
await cp(path.join(projectRoot, 'assets', 'robot-papers-icon.png'), path.join(resourcesRoot, 'assets', 'robot-papers-icon.png'));

await writeFile(
  path.join(appRoot, 'package.json'),
  JSON.stringify({
    name: 'robot-papers',
    productName: 'Robot Papers',
    version: packageJson.version,
    description: packageJson.description,
    main: 'electron/main.cjs',
    private: true,
  }, null, 2),
  'utf8',
);

console.log(`Electron 桌面版已生成：${targetRoot}`);
