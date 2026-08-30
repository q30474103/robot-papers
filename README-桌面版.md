# Robot Papers Windows 桌面版

Robot Papers 现在提供 Windows Electron 桌面版。它直接读取本机的 `D:\paper`，不会把论文上传到网站服务器。

## 启动

双击桌面上的 **Robot Papers** 快捷方式即可。若尚未安装，也可以在本目录双击 `启动-Robot-Papers.cmd`。

## 安装包（推荐）

双击 `release\Robot-Papers-Setup.exe`，标准安装向导会引导选择论文库根目录、安装位置，以及桌面/开始菜单/开机启动快捷方式。默认使用 Codex 定时任务模式，无需 API Key；只有在软件的“AI 配置”中主动切换到兼容 API 模式时才需要填写模型与 API Key。论文库根目录默认是 `D:\paper`，也可以改成其他位置；配置会保存到 `%APPDATA%\Robot Papers\config.json`。

安装包由 `构建-Robot-Papers-安装包.cmd` 生成，输出在 `release\Robot-Papers-Setup.exe`。本地构建需要先安装 Inno Setup 6；GitHub 发布工作流会自动准备该工具。首次安装完成后会自动使用向导中选择的论文库路径；以后直接运行新版安装包即可覆盖更新，论文库和原有 AI 配置会保留。

## 卸载

可使用以下任一方式正式卸载：

- Windows“设置 → 应用 → 已安装的应用 → Robot Papers → 卸载”
- 开始菜单“Robot Papers → 卸载 Robot Papers”
- 安装目录中的 `Uninstall\unins000.exe`

卸载会移除程序、桌面/开始菜单/开机启动快捷方式，但默认保留 `%APPDATA%\Robot Papers\config.json` 和论文库目录，防止误删 PDF、图片、日报、周报及 Obsidian 笔记。如需彻底清理，可在确认不再需要后手动删除这两处数据。

## 便携式安装或更新

双击本目录的 `安装-Robot-Papers.cmd`。程序会安装到：

`%LOCALAPPDATA%\Programs\Robot Papers`

安装脚本会同时创建或更新桌面、开始菜单快捷方式。更新前请先关闭 Robot Papers 窗口；如果程序正在运行，Windows 可能锁定部分文件。

## 数据位置

- 原文 PDF：`D:\paper\原文\YYYY-MM-DD`
- Obsidian 笔记：`D:\paper\obsidian\YYYY-MM-DD`
- 研读周报：`D:\paper\obsidian\研读周报`

应用启动时会同步一次数据，托盘菜单也提供“刷新论文库”。

## AI 联动

默认使用 **Codex 定时任务**：Codex 负责联网检索、论文分析和写入 `D:\paper`，Robot Papers 只同步并展示本地文件。这条方式使用 Codex 账号的任务额度，不调用 OpenAI API，也不需要 API Key。

软件仍保留“兼容 OpenAI 的 API”选项，供确实有独立 API 余额或第三方兼容服务的用户使用；API 计费与 Codex 额度相互独立。

- 每日 10:00：当天已有真实论文入库且尚未生成日报时，自动生成晨间简报。
- 每周日 12:00：汇总最近一周已入库论文并生成研读周报。
- 错过时间：由 Codex 的任务记录显示本次运行状态，软件启动后刷新本地结果。
- 生成位置：日报保存到 `obsidian\日报`，周报保存到 `obsidian\研读周报`。

AI 只分析已经进入本地论文库的资料。论文搜索、下载 PDF 和提取图片属于上游采集任务；如果上游当天没有获取到真实论文，软件不会凭空生成论文内容。安装向导默认创建 Windows 登录启动快捷方式，以便定时检查持续运行。

当前安装包尚未配置商业代码签名证书，首次运行时 Windows 仍可能显示来源提示；这不影响标准安装、覆盖更新和卸载。若要彻底消除 SmartScreen 的未知发布者提示，需要后续购买并配置 Windows 代码签名证书。

Linux 用户请查看 [README-Linux.md](README-Linux.md)。
