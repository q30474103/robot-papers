import { readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const releaseRoot = path.join(projectRoot, 'release');
const packagedRoot = path.join(releaseRoot, 'Robot Papers-win32-x64');
const installerPath = path.join(releaseRoot, 'Robot-Papers-Setup.exe');
const setupScript = path.join(projectRoot, 'installer', 'Robot-Papers.iss');
const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));

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
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}.`)));
  });
}

async function findCompiler() {
  const candidates = [
    process.env.INNO_SETUP_COMPILER,
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Inno Setup 6', 'ISCC.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Inno Setup 6', 'ISCC.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Inno Setup 6', 'ISCC.exe'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

if (!await exists(packagedRoot)) throw new Error('Packaged Robot Papers was not found. Run electron:package first.');
if (!await exists(setupScript)) throw new Error(`Inno Setup script was not found: ${setupScript}`);
if (!packageJson.version) throw new Error('package.json is missing a version.');
const compiler = await findCompiler();
if (!compiler) {
  throw new Error('Inno Setup 6 was not found. Install it or set INNO_SETUP_COMPILER to ISCC.exe.');
}

await rm(installerPath, { force: true });
await runProcess(compiler, [
  '/Qp',
  `/DMyAppVersion=${packageJson.version}`,
  `/DProjectRoot=${projectRoot}`,
  setupScript,
]);

if (!await exists(installerPath)) throw new Error('Inno Setup completed but the installer file was not created.');
console.log(`Robot Papers 标准安装包已生成：${installerPath}`);
