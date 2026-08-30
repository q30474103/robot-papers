#ifndef MyAppVersion
  #define MyAppVersion "0.4.0"
#endif

#ifndef ProjectRoot
  #define ProjectRoot ".."
#endif

#define MyAppName "Robot Papers"
#define MyAppExeName "Robot Papers.exe"
#define MyAppPublisher "Robot Papers"
#define MyAppUrl "https://github.com/zzw-rgb/robot-papers"

[Setup]
AppId={{3A20AB0E-4AD4-4D4A-A3F4-6555063A51DF}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppUrl}
AppSupportURL={#MyAppUrl}/issues
AppUpdatesURL={#MyAppUrl}/releases/latest
VersionInfoVersion={#MyAppVersion}.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Installer
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
DefaultDirName={localappdata}\Programs\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
UsePreviousAppDir=yes
UsePreviousGroup=yes
UsePreviousTasks=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
OutputDir={#ProjectRoot}\release
OutputBaseFilename=Robot-Papers-Setup
SetupIconFile={#ProjectRoot}\assets\robot-papers-icon.ico
LicenseFile={#ProjectRoot}\LICENSE
Uninstallable=yes
CreateUninstallRegKey=yes
UninstallDisplayName={#MyAppName}
UninstallDisplayIcon={app}\resources\assets\robot-papers-icon.ico
UninstallFilesDir={app}\Uninstall
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
WizardResizable=no
CloseApplications=yes
RestartApplications=no
SetupLogging=yes

[Languages]
Name: "chinesesimp"; MessagesFile: "compiler:Default.isl"

[LangOptions]
LanguageName=简体中文
LanguageID=$0804
LanguageCodePage=936

[Messages]
SetupAppTitle=安装
SetupWindowTitle=安装 - %1
UninstallAppTitle=卸载
UninstallAppFullTitle=%1 卸载
InformationTitle=信息
ConfirmTitle=确认
ErrorTitle=错误
ButtonBack=< 上一步(&B)
ButtonNext=下一步(&N) >
ButtonInstall=安装(&I)
ButtonOK=确定
ButtonCancel=取消
ButtonYes=是(&Y)
ButtonNo=否(&N)
ButtonFinish=完成(&F)
ButtonBrowse=浏览(&B)...
ButtonWizardBrowse=浏览(&R)...
ButtonNewFolder=新建文件夹(&M)
ClickNext=点击“下一步”继续，或点击“取消”退出安装程序。
BrowseDialogTitle=浏览文件夹
BrowseDialogLabel=在下面的列表中选择一个文件夹，然后点击“确定”。
NewFolderName=新建文件夹
WelcomeLabel1=欢迎使用 [name] 安装向导
WelcomeLabel2=即将在您的计算机上安装 [name/ver]。%n%n建议您在继续安装前关闭其他应用程序。
WizardLicense=许可协议
LicenseLabel=请在继续安装前阅读以下重要信息。
LicenseLabel3=请阅读下列许可协议。在继续安装前您必须同意这些协议条款。
LicenseAccepted=我同意此协议(&A)
LicenseNotAccepted=我不同意此协议(&D)
WizardSelectDir=选择安装位置
SelectDirDesc=您想将 [name] 安装在哪里？
SelectDirLabel3=安装程序将把 [name] 安装到下面的文件夹。
SelectDirBrowseLabel=点击“下一步”继续；如需更改位置，请点击“浏览”。
WizardSelectTasks=选择附加任务
SelectTasksDesc=您希望安装程序执行哪些附加任务？
SelectTasksLabel2=选择需要的附加任务，然后点击“下一步”。
WizardReady=准备安装
ReadyLabel1=安装程序已准备好安装 [name]。
ReadyLabel2a=点击“安装”继续；如需修改设置，请点击“上一步”。
ReadyLabel2b=点击“安装”继续。
ReadyMemoDir=安装位置：
ReadyMemoTasks=附加任务：
WizardPreparing=正在准备安装
PreparingDesc=安装程序正在准备安装 [name]。
ApplicationsFound=以下应用程序正在使用即将更新的文件。建议允许安装程序自动关闭这些应用程序。
CloseApplications=自动关闭应用程序(&A)
DontCloseApplications=不要关闭应用程序(&D)
WizardInstalling=正在安装
InstallingLabel=安装程序正在安装 [name]，请稍候。
FinishedHeadingLabel=完成 [name] 安装向导
FinishedLabelNoIcons=安装程序已在您的计算机中安装 [name]。
FinishedLabel=安装程序已安装 [name]，现在可以通过快捷方式启动。
ClickFinish=点击“完成”退出安装程序。
RunEntryExec=运行 %1
SetupAborted=安装程序未完成安装。%n%n请修正问题后重新运行安装程序。
StatusClosingApplications=正在关闭应用程序...
StatusCreateDirs=正在创建目录...
StatusExtractFiles=正在提取文件...
StatusCreateIcons=正在创建快捷方式...
StatusCreateRegistryEntries=正在创建注册表条目...
StatusSavingUninstall=正在保存卸载信息...
StatusRunProgram=正在完成安装...
ConfirmUninstall=确认要完全移除 %1 及其程序组件吗？论文库和个人配置会保留。
UninstallStatusLabel=正在从您的计算机中移除 %1，请稍候。
UninstalledAll=已从您的计算机中移除 %1。论文库和个人配置仍然保留。
WizardUninstalling=卸载状态
StatusUninstalling=正在卸载 %1...

[CustomMessages]
chinesesimp.PaperRootCaption=选择论文库
chinesesimp.PaperRootDescription=论文和 Obsidian 笔记保存在哪里？
chinesesimp.PaperRootSubCaption=请选择论文库根目录。安装和卸载程序都不会删除这里的论文、图片或笔记。
chinesesimp.PaperRootRequired=请选择有效的论文库目录。
chinesesimp.PaperRootCreateFailed=无法创建论文库目录，请选择其他位置。
chinesesimp.DesktopTask=创建桌面快捷方式
chinesesimp.StartupTask=登录 Windows 时自动启动（用于定时日报和周报）
chinesesimp.LaunchTask=启动 Robot Papers
chinesesimp.UninstallShortcut=卸载 Robot Papers

[Tasks]
Name: "desktopicon"; Description: "{cm:DesktopTask}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "startup"; Description: "{cm:StartupTask}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Files]
Source: "{#ProjectRoot}\release\Robot Papers-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#ProjectRoot}\scripts\write-install-config.ps1"; DestDir: "{app}\resources\installer"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\resources\assets\robot-papers-icon.ico"
Name: "{group}\{cm:UninstallShortcut}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\resources\assets\robot-papers-icon.ico"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: startup

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\resources\installer\write-install-config.ps1"" -PaperRoot ""{code:GetPaperRoot}"""; StatusMsg: "{cm:PaperRootDescription}"; Flags: runhidden waituntilterminated; Check: ShouldWriteConfig
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchTask}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[Code]
var
  PaperRootPage: TInputDirWizardPage;

function ExistingPaperRoot: String;
begin
  Result := 'D:\paper';
  RegQueryStringValue(HKCU, 'Software\Robot Papers', 'PaperRoot', Result);
end;

procedure InitializeWizard;
begin
  PaperRootPage := CreateInputDirPage(
    wpSelectDir,
    CustomMessage('PaperRootCaption'),
    CustomMessage('PaperRootDescription'),
    CustomMessage('PaperRootSubCaption'),
    False,
    SetupMessage(msgNewFolderName)
  );
  PaperRootPage.Add('');
  PaperRootPage.Values[0] := ExistingPaperRoot;
end;

function GetPaperRoot(Param: String): String;
begin
  Result := Trim(ExpandConstant('{param:PAPERROOT|}'));
  if Result = '' then
    Result := Trim(PaperRootPage.Values[0]);
end;

function ShouldWriteConfig: Boolean;
begin
  Result := ExpandConstant('{param:SKIPCONFIG|0}') <> '1';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  TargetDir: String;
begin
  Result := True;
  if CurPageID = PaperRootPage.ID then
  begin
    TargetDir := Trim(PaperRootPage.Values[0]);
    if TargetDir = '' then
    begin
      MsgBox(CustomMessage('PaperRootRequired'), mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if not ForceDirectories(TargetDir) then
    begin
      MsgBox(CustomMessage('PaperRootCreateFailed'), mbError, MB_OK);
      Result := False;
    end;
  end;
end;
