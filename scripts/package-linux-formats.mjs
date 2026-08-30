import { chmod, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const releaseRoot = path.join(projectRoot, 'release');
const packagedRoot = path.join(releaseRoot, 'Robot-Papers-linux-x64');
const debRoot = path.join(releaseRoot, 'deb-root');
const appDir = path.join(releaseRoot, 'Robot-Papers.AppDir');
const debPath = path.join(releaseRoot, 'Robot-Papers-linux-amd64.deb');
const iconPath = path.join(projectRoot, 'assets', 'robot-papers-icon.png');

const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
if (!packageJson.version) throw new Error('package.json 缺少版本号。');

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

function desktopEntry(executable) {
  return `[Desktop Entry]
Type=Application
Name=Robot Papers
Comment=Local-first embodied AI paper reader
Exec=${executable} %U
Icon=robot-papers
Terminal=false
Categories=Science;Education;
StartupWMClass=Robot Papers
`;
}

if (process.platform !== 'linux' || process.arch !== 'x64') {
  throw new Error('Linux 安装包必须在 Linux x64 环境构建。请使用仓库自带的 GitHub Actions 工作流。');
}
if (!await exists(path.join(packagedRoot, 'robot-papers'))) {
  throw new Error('没有找到 Linux 便携应用。请先运行 electron:linux。');
}

await rm(debRoot, { recursive: true, force: true });
await rm(appDir, { recursive: true, force: true });
await rm(debPath, { force: true });

const debAppRoot = path.join(debRoot, 'opt', 'robot-papers');
const debBinRoot = path.join(debRoot, 'usr', 'bin');
const debDesktopRoot = path.join(debRoot, 'usr', 'share', 'applications');
const debIconRoot = path.join(debRoot, 'usr', 'share', 'icons', 'hicolor', '512x512', 'apps');
await mkdir(path.join(debRoot, 'DEBIAN'), { recursive: true });
await mkdir(debBinRoot, { recursive: true });
await mkdir(debDesktopRoot, { recursive: true });
await mkdir(debIconRoot, { recursive: true });
await cp(packagedRoot, debAppRoot, { recursive: true });
await cp(iconPath, path.join(debIconRoot, 'robot-papers.png'));
await writeFile(path.join(debBinRoot, 'robot-papers'), '#!/bin/sh\nexec /opt/robot-papers/robot-papers "$@"\n', 'utf8');
await chmod(path.join(debBinRoot, 'robot-papers'), 0o755);
await chmod(path.join(debAppRoot, 'robot-papers'), 0o755);
const debSandbox = path.join(debAppRoot, 'chrome-sandbox');
if (await exists(debSandbox)) await chmod(debSandbox, 0o4755);
await writeFile(path.join(debDesktopRoot, 'robot-papers.desktop'), desktopEntry('robot-papers'), 'utf8');
await writeFile(
  path.join(debRoot, 'DEBIAN', 'control'),
  `Package: robot-papers
Version: ${packageJson.version}
Section: science
Priority: optional
Architecture: amd64
Maintainer: Robot Papers
Depends: libgtk-3-0, libnss3, libasound2 | libasound2t64, libxss1, libgbm1
Description: Local-first embodied AI paper reader
 Robot Papers organizes VLA, imitation learning and world-model papers,
 local Obsidian notes, daily briefs and weekly research reviews.
`,
  'utf8',
);
await runProcess('dpkg-deb', ['--root-owner-group', '--build', debRoot, debPath]);

const appImageAppRoot = path.join(appDir, 'usr', 'lib', 'robot-papers');
const appImageBinRoot = path.join(appDir, 'usr', 'bin');
const appImageDesktopRoot = path.join(appDir, 'usr', 'share', 'applications');
const appImageIconRoot = path.join(appDir, 'usr', 'share', 'icons', 'hicolor', '512x512', 'apps');
await mkdir(appImageBinRoot, { recursive: true });
await mkdir(appImageDesktopRoot, { recursive: true });
await mkdir(appImageIconRoot, { recursive: true });
await cp(packagedRoot, appImageAppRoot, { recursive: true });
await cp(iconPath, path.join(appDir, 'robot-papers.png'));
await cp(iconPath, path.join(appImageIconRoot, 'robot-papers.png'));
await writeFile(path.join(appDir, 'robot-papers.desktop'), desktopEntry('robot-papers'), 'utf8');
await writeFile(path.join(appImageDesktopRoot, 'robot-papers.desktop'), desktopEntry('robot-papers'), 'utf8');
await writeFile(
  path.join(appImageBinRoot, 'robot-papers'),
  '#!/bin/sh\nAPPDIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"\nexec "$APPDIR/usr/lib/robot-papers/robot-papers" "$@"\n',
  'utf8',
);
await writeFile(
  path.join(appDir, 'AppRun'),
  '#!/bin/sh\nAPPDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\nexec "$APPDIR/usr/lib/robot-papers/robot-papers" "$@"\n',
  'utf8',
);
await chmod(path.join(appDir, 'AppRun'), 0o755);
await chmod(path.join(appImageBinRoot, 'robot-papers'), 0o755);
await chmod(path.join(appImageAppRoot, 'robot-papers'), 0o755);

console.log(`Robot Papers Debian 安装包已生成：${debPath}`);
console.log(`Robot Papers AppDir 已生成：${appDir}`);
