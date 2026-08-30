const { app, BrowserWindow, Menu, Tray, dialog, net, protocol, session, shell, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { DEFAULT_AI_PROMPT } = require('./ai-defaults.cjs');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'robot-papers',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const DEFAULT_PAPER_ROOT = process.platform === 'win32'
  ? 'D:\\paper'
  : path.join(os.homedir(), 'Robot-Papers');
let PAPER_ROOT = process.env.ROBOT_PAPERS_ROOT || DEFAULT_PAPER_ROOT;
let APP_CONFIG = { paperRoot: PAPER_ROOT, ai: {} };
let mainWindow = null;
let tray = null;
let isQuitting = false;
let syncInProgress = null;
let scheduledAiInProgress = null;
let scheduledAiRetryAt = 0;
let scheduleTimer = null;

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadPaperRootConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
    APP_CONFIG = config && typeof config === 'object' ? config : {};
    if (!process.env.ROBOT_PAPERS_ROOT && typeof APP_CONFIG.paperRoot === 'string' && APP_CONFIG.paperRoot.trim()) {
      PAPER_ROOT = path.resolve(APP_CONFIG.paperRoot.trim());
    }
  } catch {
    APP_CONFIG = { paperRoot: PAPER_ROOT, ai: {} };
  }
  APP_CONFIG.paperRoot = PAPER_ROOT;
  APP_CONFIG.ai = APP_CONFIG.ai && typeof APP_CONFIG.ai === 'object' ? APP_CONFIG.ai : {};
}

function writeAppConfig(nextConfig) {
  APP_CONFIG = {
    ...APP_CONFIG,
    ...nextConfig,
    paperRoot: PAPER_ROOT,
    ai: { ...(APP_CONFIG.ai || {}), ...(nextConfig.ai || {}) },
  };
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(APP_CONFIG, null, 2), 'utf8');
}

function aiSnapshot() {
  const ai = APP_CONFIG.ai || {};
  return {
    enabled: ai.enabled !== false,
    provider: ai.provider || 'codex-automation',
    baseUrl: ai.baseUrl || 'https://api.openai.com/v1',
    model: ai.model || '',
    hasApiKey: Boolean(ai.apiKey),
    apiKeyMasked: ai.apiKey ? `${String(ai.apiKey).slice(0, 4)}••••${String(ai.apiKey).slice(-4)}` : '',
    systemPrompt: ai.systemPrompt || DEFAULT_AI_PROMPT,
  };
}

function normalizeAiConfig(input = {}) {
  const current = APP_CONFIG.ai || {};
  const next = {
    enabled: input.enabled !== false,
    provider: String(input.provider || current.provider || 'codex-automation').trim(),
    baseUrl: String(input.baseUrl || current.baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, ''),
    model: String(input.model || current.model || '').trim(),
    systemPrompt: String(input.systemPrompt || current.systemPrompt || DEFAULT_AI_PROMPT).trim(),
  };
  const apiKey = String(input.apiKey || '').trim();
  if (apiKey) next.apiKey = apiKey;
  else if (current.apiKey) next.apiKey = current.apiKey;
  return next;
}

function getAiRequestConfig(input = {}) {
  const merged = normalizeAiConfig({ ...APP_CONFIG.ai, ...input });
  if (merged.enabled === false) throw new Error('AI 生成功能已关闭，请在“AI 配置”中启用。');
  if (merged.provider === 'codex-automation') {
    throw new Error('当前使用 Codex 定时任务模式：日报和周报由 Codex 生成并写入本地，本软件不会调用 OpenAI API。');
  }
  if (!merged.baseUrl) throw new Error('请先填写 AI API 地址。');
  if (!merged.model) throw new Error('请先填写 AI 模型名称。');
  return merged;
}

async function callChatCompletions(input, userContent, options = {}) {
  const ai = getAiRequestConfig(input);
  const headers = { 'Content-Type': 'application/json' };
  if (ai.apiKey) headers.Authorization = `Bearer ${ai.apiKey}`;
  const isOpenAi = /^https:\/\/api\.openai\.com(?:\/|$)/i.test(ai.baseUrl);
  const requestBody = {
    model: ai.model,
    messages: [
      { role: isOpenAi ? 'developer' : 'system', content: ai.systemPrompt || DEFAULT_AI_PROMPT },
      { role: 'user', content: userContent },
    ],
  };
  if (isOpenAi) {
    requestBody.max_completion_tokens = options.maxTokens ?? 7000;
  } else {
    requestBody.max_tokens = options.maxTokens ?? 7000;
    requestBody.temperature = options.temperature ?? 0.2;
  }
  const response = await fetch(`${ai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  const raw = await response.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (!response.ok) {
    const detail = body?.error?.message || raw.slice(0, 500) || `HTTP ${response.status}`;
    throw new Error(`AI 请求失败（${response.status}）：${detail}`);
  }
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI 返回了空内容。');
  return content.trim();
}

function localDateString(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function yamlQuotedList(values = []) {
  return `[${values.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(', ')}]`;
}

function paperContext(papers, kind, reportDate) {
  return [
    `任务类型：${kind === 'weekly' ? '本周研读周报' : '今日论文日报'}`,
    `报告日期：${reportDate}`,
    `候选论文数量：${papers.length}`,
    '以下资料来自本地 Obsidian 论文库，字段为空时不要自行补全：',
    ...papers.map((paper, index) => [
      `\n[论文 ${index + 1}]`,
      `项目缩写：${paper.shortName || ''}`,
      `标题：${paper.title || ''}`,
      `作者：${(paper.authors || []).join('、')}`,
      `日期：${paper.paperDate || paper.collectedDate || ''}`,
      `收录日期：${paper.collectedDate || ''}`,
      `会议/期刊：${paper.venue || ''}`,
      `方向：${(paper.directions || []).join('、')}`,
      `原文链接：${paper.url || '未提供'}`,
      `一句话结论：${paper.summary || '未提供'}`,
      `研究问题：${paper.problem || '未提供'}`,
      `核心方法：${paper.method || '未提供'}`,
      `实验结果：${paper.results || '未提供'}`,
      `优点：${paper.strengths || '未提供'}`,
      `局限性：${paper.limitations || '未提供'}`,
      `可改进点：${paper.improvements || '未提供'}`,
      `阅读建议：${paper.readingAdvice || '未提供'}`,
      `图片说明：${(paper.figureDetails || []).map((figure) => `图${figure.order} ${figure.title}：${figure.explanation || '未提供'}`).join('；') || '未提供'}`,
    ].join('\n')),
  ].join('\n');
}

async function saveAiDocument(payload) {
  const kind = payload?.kind === 'weekly' ? 'weekly' : 'daily';
  const markdown = String(payload?.markdown || '').trim();
  if (!markdown) throw new Error('没有可保存的 AI 内容。');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(payload?.date || '')) ? payload.date : localDateString();
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(String(payload?.weekStart || '')) ? payload.weekStart : date;
  const reportRoot = kind === 'weekly'
    ? path.join(PAPER_ROOT, 'obsidian', '研读周报')
    : path.join(PAPER_ROOT, 'obsidian', '日报');
  fs.mkdirSync(reportRoot, { recursive: true });
  const fileName = kind === 'weekly'
    ? String(payload?.fileName || `${weekStart}_to_${date}.md`).replace(/[^\w.-]+/g, '_')
    : `${date}.md`;
  const target = path.join(reportRoot, fileName.endsWith('.md') ? fileName : `${fileName}.md`);
  const paperShortNames = Array.isArray(payload?.paperShortNames) ? payload.paperShortNames.filter(Boolean) : [];
  const directions = Array.isArray(payload?.directions) && payload.directions.length ? payload.directions.filter(Boolean) : ['具身智能'];
  const normalizedMarkdown = markdown.startsWith('---')
    ? markdown
    : kind === 'weekly'
      ? `---\ntitle: "研读周报｜${weekStart} — ${date}"\nweek_start: "${weekStart}"\nweek_end: "${date}"\ngenerated_date: "${date}"\npaper_count: ${paperShortNames.length}\npaper_short_names: ${yamlQuotedList(paperShortNames)}\ndirections: ${yamlQuotedList(directions)}\ntags: [weekly-review, ai-generated]\n---\n\n${markdown}`
      : `---\ntitle: "晨间简报｜${date}"\ngenerated_date: "${date}"\ntags: [daily-brief, ai-generated]\n---\n\n${markdown}`;
  fs.writeFileSync(target, normalizedMarkdown.endsWith('\n') ? normalizedMarkdown : `${normalizedMarkdown}\n`, 'utf8');
  await runLibrarySync();
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('robot-papers:library-updated');
  return { path: target, fileName: path.basename(target) };
}

async function runScheduledAiJobs() {
  if (scheduledAiInProgress) return scheduledAiInProgress;
  if (Date.now() < scheduledAiRetryAt) return;
  scheduledAiInProgress = (async () => {
    const ai = APP_CONFIG.ai || {};
    if (ai.provider === 'codex-automation' || ai.enabled === false || !ai.model || !ai.baseUrl) return;
    const dataPath = path.join(runtimePublicRoot(), 'data', 'papers.json');
    if (!fs.existsSync(dataPath)) return;
    const library = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const papers = Array.isArray(library.papers) ? library.papers : [];
    const now = new Date();
    const today = localDateString(now);
    const minutes = now.getHours() * 60 + now.getMinutes();

    const dailyTarget = path.join(PAPER_ROOT, 'obsidian', '日报', `${today}.md`);
    const dailyPapers = papers.filter((paper) => paper.collectedDate === today).slice(0, 8);
    if (minutes >= 10 * 60 && dailyPapers.length && !fs.existsSync(dailyTarget)) {
      const markdown = await callChatCompletions({}, paperContext(dailyPapers, 'daily', today), { maxTokens: 7000 });
      await saveAiDocument({ kind: 'daily', date: today, markdown });
    }

    if (now.getDay() !== 0 || minutes < 12 * 60) return;
    const weekStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const weekStart = localDateString(weekStartDate);
    const weeklyTarget = path.join(PAPER_ROOT, 'obsidian', '研读周报', `${weekStart}_to_${today}.md`);
    const weeklyPapers = papers.filter((paper) => paper.collectedDate >= weekStart && paper.collectedDate <= today).slice(0, 12);
    if (!weeklyPapers.length || fs.existsSync(weeklyTarget)) return;
    const markdown = await callChatCompletions({}, paperContext(weeklyPapers, 'weekly', today), { maxTokens: 8000 });
    await saveAiDocument({
      kind: 'weekly',
      date: today,
      weekStart,
      fileName: `${weekStart}_to_${today}.md`,
      markdown,
      paperShortNames: weeklyPapers.map((paper) => paper.shortName),
      directions: [...new Set(weeklyPapers.flatMap((paper) => paper.directions || []))],
    });
  })().catch((error) => {
    scheduledAiRetryAt = Date.now() + 30 * 60 * 1000;
    console.error('Scheduled AI report failed:', error);
  }).finally(() => { scheduledAiInProgress = null; });
  return scheduledAiInProgress;
}

function registerAiIpc() {
  ipcMain.handle('robot-papers:get-ai-config', () => aiSnapshot());
  ipcMain.handle('robot-papers:save-ai-config', (_event, input) => {
    const next = normalizeAiConfig(input || {});
    writeAppConfig({ ai: next });
    scheduledAiRetryAt = 0;
    if (next.provider !== 'codex-automation') setImmediate(() => { void runScheduledAiJobs(); });
    return aiSnapshot();
  });
  ipcMain.handle('robot-papers:test-ai-connection', async (_event, input) => {
    if (String(input?.provider || APP_CONFIG.ai?.provider || '') === 'codex-automation') {
      return { ok: true, message: 'Codex 定时任务已启用；无需 API Key。' };
    }
    const response = await callChatCompletions(input || {}, '请只回复“连接成功”。', { maxTokens: 16, temperature: 0 });
    return { ok: true, message: response };
  });
  ipcMain.handle('robot-papers:generate-ai', async (_event, payload) => {
    const kind = payload?.kind === 'weekly' ? 'weekly' : 'daily';
    const context = String(payload?.context || '').trim();
    if (!context) throw new Error('没有可供 AI 分析的论文资料。');
    const markdown = await callChatCompletions(payload?.config || {}, context, { maxTokens: kind === 'weekly' ? 8000 : 7000 });
    return { kind, markdown };
  });
  ipcMain.handle('robot-papers:save-ai-document', (_event, payload) => saveAiDocument(payload));
}

function appResource(...parts) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...parts)
    : path.join(__dirname, '..', ...parts);
}

function rendererRoot() {
  return app.isPackaged
    ? appResource('renderer')
    : path.join(__dirname, '..', 'dist-electron', 'renderer');
}

function runtimePublicRoot() {
  return path.join(app.getPath('userData'), 'runtime-public');
}

function safeResolve(root, relativePath) {
  const normalizedRoot = path.resolve(root);
  const candidate = path.resolve(normalizedRoot, relativePath.replace(/^[/\\]+/, ''));
  if (candidate === normalizedRoot || candidate.startsWith(`${normalizedRoot}${path.sep}`)) return candidate;
  return null;
}

function sourceLibraryFile(relativePath) {
  const normalized = relativePath.replace(/^[/\\]+/, '');
  const segments = normalized.split('/').filter(Boolean);
  if (!segments.length) return null;

  if (segments[0] === 'weekly') {
    return safeResolve(path.join(PAPER_ROOT, 'obsidian', '研读周报'), segments.slice(1).join(path.sep));
  }
  if (segments[0] === 'daily') {
    return safeResolve(path.join(PAPER_ROOT, 'obsidian', '日报'), segments.slice(1).join(path.sep));
  }

  const [date, ...rest] = segments;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !rest.length) return null;
  const targetRoot = rest.at(-1).toLowerCase().endsWith('.pdf')
    ? path.join(PAPER_ROOT, '原文', date)
    : path.join(PAPER_ROOT, 'obsidian', date);
  return safeResolve(targetRoot, rest.join(path.sep));
}

function responseForFile(filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new Response('Not found', { status: 404 });
  }
  return net.fetch(pathToFileURL(filePath).toString());
}

function registerLocalProtocol() {
  protocol.handle('robot-papers', (request) => {
    const requestUrl = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    if (pathname === '/' || pathname === '/paper') {
      return responseForFile(path.join(rendererRoot(), 'index.html'));
    }
    if (pathname.startsWith('/assets/')) {
      return responseForFile(safeResolve(rendererRoot(), pathname));
    }
    if (pathname.startsWith('/data/')) {
      return responseForFile(safeResolve(runtimePublicRoot(), pathname));
    }
    if (pathname.startsWith('/library/')) {
      return responseForFile(sourceLibraryFile(pathname.slice('/library/'.length)));
    }
    return responseForFile(path.join(rendererRoot(), 'index.html'));
  });
}

function runLibrarySync() {
  if (syncInProgress) return syncInProgress;
  syncInProgress = new Promise((resolve, reject) => {
    const script = app.isPackaged
      ? appResource('scripts', 'sync-library.mjs')
      : path.join(__dirname, '..', 'scripts', 'sync-library.mjs');
    fs.mkdirSync(runtimePublicRoot(), { recursive: true });

    const child = spawn(process.execPath, [script], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        ROBOT_PAPERS_ROOT: PAPER_ROOT,
        ROBOT_PAPERS_PUBLIC_ROOT: runtimePublicRoot(),
        ROBOT_PAPERS_COPY_LIBRARY: 'false',
      },
    });

    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(errorOutput.trim() || `论文库同步进程退出，代码 ${code}`));
    });
  }).finally(() => { syncInProgress = null; });
  return syncInProgress;
}

function secureWindowOptions(extra = {}) {
  return {
    backgroundColor: '#f5f7fb',
    autoHideMenuBar: true,
    icon: appResource('assets', process.platform === 'win32' ? 'robot-papers-icon.ico' : 'robot-papers-icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(app.getAppPath(), 'electron', 'preload.cjs'),
      webSecurity: true,
    },
    ...extra,
  };
}

function openDocumentWindow(url) {
  const preview = new BrowserWindow(secureWindowOptions({ width: 1120, height: 820, parent: mainWindow || undefined }));
  preview.loadURL(url);
}

function configureNavigation(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    let parsed;
    try { parsed = new URL(url); } catch { return { action: 'deny' }; }
    if (parsed.protocol === 'https:') {
      shell.openExternal(url);
    } else if (parsed.protocol === 'robot-papers:') {
      openDocumentWindow(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).protocol === 'robot-papers:') return;
    } catch {}
    event.preventDefault();
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow(secureWindowOptions({
    title: 'Robot Papers',
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    show: false,
  }));
  configureNavigation(mainWindow);
  mainWindow.loadURL('robot-papers://app/');
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

async function refreshLibrary() {
  try {
    await runLibrarySync();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reloadIgnoringCache();
  } catch (error) {
    dialog.showErrorBox('Robot Papers 同步失败', error instanceof Error ? error.message : String(error));
  }
}

function createTray() {
  tray = new Tray(appResource('assets', process.platform === 'win32' ? 'robot-papers-icon.ico' : 'robot-papers-icon.png'));
  tray.setToolTip('Robot Papers · 具身智能论文库');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开 Robot Papers', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: '刷新论文库', click: refreshLibrary },
    { label: '打开论文目录', click: () => shell.openPath(PAPER_ROOT) },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    loadPaperRootConfig();
    registerAiIpc();
    registerLocalProtocol();
    try {
      await runLibrarySync();
    } catch (error) {
      dialog.showErrorBox('Robot Papers 启动失败', error instanceof Error ? error.message : String(error));
      app.quit();
      return;
    }
    createMainWindow();
    createTray();
    void runScheduledAiJobs();
    scheduleTimer = setInterval(() => { void runScheduledAiJobs(); }, 60 * 1000);
  });

  app.on('before-quit', () => {
    isQuitting = true;
    if (scheduleTimer) clearInterval(scheduleTimer);
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) app.quit();
  });
  app.on('activate', () => {
    if (mainWindow) mainWindow.show();
    else createMainWindow();
  });
}
