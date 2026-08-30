import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const releaseRoot = path.join(projectRoot, 'release');
const packagedRoot = path.join(releaseRoot, 'Robot Papers-win32-x64');
const stagingRoot = path.join(releaseRoot, 'installer-staging');
const installerPath = path.join(releaseRoot, 'Robot Papers-Setup.exe');
const sedPath = path.join(releaseRoot, 'robot-papers-installer.sed');
const iexpressPath = process.env.SystemRoot
  ? path.join(process.env.SystemRoot, 'System32', 'iexpress.exe')
  : 'iexpress.exe';

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, fullPath));
    else if (entry.isFile()) files.push(path.relative(root, fullPath));
  }
  return files;
}

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

function runIExpress() {
  return new Promise((resolve, reject) => {
    const child = spawn(iexpressPath, ['/N', sedPath], { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`IExpress exited with code ${code}.`)));
  });
}

if (!await exists(packagedRoot)) throw new Error('Packaged Robot Papers was not found. Run electron:package first.');
if (!await exists(iexpressPath) && !process.env.SystemRoot) throw new Error('Windows IExpress was not found.');

await rm(stagingRoot, { recursive: true, force: true });
await mkdir(stagingRoot, { recursive: true });
await cp(path.join(projectRoot, 'scripts', 'install-wizard.ps1'), path.join(stagingRoot, 'install-wizard.ps1'));
await cp(path.join(projectRoot, 'scripts', 'install-wizard.cmd'), path.join(stagingRoot, 'install-wizard.cmd'));
await runProcess('tar.exe', ['-cf', path.join(stagingRoot, 'payload.tar'), '-C', packagedRoot, '.']);

const files = (await listFiles(stagingRoot)).sort();
const strings = files.map((relative, index) => `FILE${index}="${relative.replaceAll('/', '\\')}"`).join('\n');
const sourceEntries = files.map((_, index) => `%FILE${index}%=`).join('\n');
const sed = `[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName="${installerPath}"
FriendlyName=Robot Papers Setup
AppLaunched=install-wizard.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
${strings}
[SourceFiles]
SourceFiles0=${stagingRoot}\\
[SourceFiles0]
${sourceEntries}
`;

await writeFile(sedPath, sed, 'utf8');
await rm(installerPath, { force: true });
try {
  await runIExpress();
} finally {
  await rm(sedPath, { force: true });
  await rm(stagingRoot, { recursive: true, force: true });
}

if (!await exists(installerPath)) throw new Error('IExpress completed but the installer file was not created.');
console.log(`Robot Papers 安装包已生成：${installerPath}`);
