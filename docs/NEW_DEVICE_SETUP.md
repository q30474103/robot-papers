# 新设备配置：Robot Papers + Codex

## 准备工作

1. 安装 Robot Papers，并选择论文库根目录，默认是 `D:\paper`。
2. 安装并登录 ChatGPT/Codex 桌面端。
3. 如果需要保留历史去重记录，将旧设备的整个论文库复制到新设备。
4. 在 Robot Papers 的“AI 配置”中选择“Codex 定时任务”。

需要访问本地文件的定时任务运行时，电脑必须开机，并保持 ChatGPT/Codex 桌面端运行。

## 一次性初始化提示词

在新设备的 Codex 对话中粘贴以下内容：

```text
请在这台设备上完成 Robot Papers 的本地联动配置。优先读取 `%APPDATA%\Robot Papers\config.json` 中的 `paperRoot`，不要输出配置文件全文；如果配置不存在，使用 `D:\paper`。不要使用 OpenAI API，也不要要求 API Key。

创建并启用两个本地定时任务，使用 Asia/Shanghai 时区：

1. “具身智能论文日报”：每天 10:00 运行。首次创建后立即试运行。检索自上次成功运行以来的新论文；首次回溯 7 天。覆盖 VLA、VLA+RL、模仿学习、世界模型、WAM、Diffusion Policy、强化微调、LoRA/Adapter、持续学习、跨具身迁移、长时程规划、操作、导航、人形、部署加速、安全、鲁棒性和评测。优先 ICRA、RSS、CoRL、IROS、NeurIPS、ICML、ICLR、CVPR、ICCV、ECCV、AAAI、IJCAI、T-RO、RA-L、IJRR、Science Robotics、TPAMI、IJCV、JMLR 和 Nature Machine Intelligence。核验一手来源，轻量搜索，确定最重要的 3–5 篇后停止，并检查历史目录去重。

PDF 保存为 `{paperRoot}\原文\YYYY-MM-DD\ShortName.pdf`；中文 Obsidian 笔记保存为 `{paperRoot}\obsidian\YYYY-MM-DD\ShortName.md`。文件名只用官方简称，不加日期。每篇提取 2–4 张最重要的主图，按正文顺序插入并逐图解释。笔记必须分析研究问题、核心方法、实验、优点、局限、具体改进点、可证伪假设、最小实验、基线、指标和复现资源。更新 `{paperRoot}\obsidian\具身智能论文索引.md`，然后运行 Robot Papers 自带的安全同步脚本。

2. “具身智能研读周报”：每周日 12:00 运行。只读取本周一 00:00 到运行时间内真实存在的本地论文笔记。只选择最有价值且联系紧密的几篇综合，不要机械罗列全部论文。开头写一段话总结：本周重点论文、共同方向、对该方向的判断、当前缺口和下周计划。保存到 `{paperRoot}\obsidian\研读周报\YYYY-MM-DD_to_YYYY-MM-DD.md`，然后同步 Robot Papers。

如果需要本地文件或网络权限，打开权限流程。创建完成后汇报两个任务的启用状态、运行时间、实际论文库路径、首次试运行结果和软件同步状态。
```

## 验证

- Robot Papers 能打开并显示本地论文库。
- Codex 的“定时任务”中能看到两个启用任务。
- 日报时间为每天 10:00，周报时间为周日 12:00。
- 新生成文件位于安装时选择的论文库，而不是源码目录。
