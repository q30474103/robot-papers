# Robot Papers Linux 桌面版

Linux 版本提供 `.deb`、AppImage 和 x86_64 便携包。

## Ubuntu / Debian（推荐）

下载 `Robot-Papers-linux-amd64.deb`，然后运行：

```bash
sudo apt install ./Robot-Papers-linux-amd64.deb
```

安装后可从应用菜单打开 **Robot Papers**，也可以在终端运行 `robot-papers`。

## AppImage

下载 `Robot-Papers-x86_64.AppImage`，然后运行：

```bash
chmod +x Robot-Papers-x86_64.AppImage
./Robot-Papers-x86_64.AppImage
```

AppImage 不写入系统目录，适合 Fedora、openSUSE、Arch Linux 等桌面发行版。

## 便携压缩包

从 [最新 Release](https://github.com/zzw-rgb/robot-papers/releases/latest) 下载 `Robot-Papers-linux-x64.tar.gz`，然后运行：

```bash
tar -xzf Robot-Papers-linux-x64.tar.gz
cd Robot-Papers-linux-x64
chmod +x robot-papers
./robot-papers
```

默认论文库是 `~/Robot-Papers`。如需使用其他目录，可在启动前设置：

```bash
ROBOT_PAPERS_ROOT="$HOME/paper" ./robot-papers
```

应用配置保存在 `~/.config/Robot Papers/config.json`。论文、Obsidian 笔记和生成数据仍只保存在本机。

## 系统要求

- 64 位 Linux 桌面环境
- `.deb` 会声明 Electron/Chromium 所需的 GTK、NSS、ALSA 等桌面运行库
- AppImage 和便携包要求系统已具有常见 Linux 桌面运行库
- 支持系统托盘的桌面环境可获得完整的隐藏与退出体验

日报、周报和 Codex 定时任务配置见 [docs/NEW_DEVICE_SETUP.md](docs/NEW_DEVICE_SETUP.md)。Linux 安装包目前未进行发行版签名。
