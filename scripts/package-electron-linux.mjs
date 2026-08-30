import { chmod, cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const electronDist = path.join(projectRoot, 'node_modules', 'electron', 'dist');
const releaseRoot = path.join(projectRoot, 'release');
const targetRoot = path.join(releaseRoot, 'Robot-Papers-linux-x64');
const resourcesRoot = path.join(targetRoot, 'resources');
const appRoot = path.join(resourcesRoot, 'app');
const archivePath = path.join(releaseRoot, 'Robot-Papers-linux-x64.tar.gz');

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  throw new Error('Linux 便携包必须在 Linux x64 环境构建。请使用仓库自带的 GitHub Actions 工作流。');
}
if (!await exists(path.join(electronDist, 'electron'))) {
  throw new Error('没有找到 Linux Electron 运行时。请先在 Linux x64 环境运行 pnpm install。');
}

const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
if (!packageJson.version) throw new Error('package.json 缺少版本号。');

await mkdir(releaseRoot, { recursive: true });
await rm(targetRoot, { recursive: true, force: true });
await rm(archivePath, { force: true });
await cp(electronDist, targetRoot, { recursive: true });
await rename(path.join(targetRoot, 'electron'), path.join(targetRoot, 'robot-papers'));
await chmod(path.join(targetRoot, 'robot-papers'), 0o755);

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

await runProcess('tar', ['-czf', archivePath, '-C', releaseRoot, path.basename(targetRoot)]);
console.log(`Robot Papers Linux 便携包已生成：${archivePath}`);
