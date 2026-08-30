'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Save, Settings2, Wifi, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AiConfig = {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  systemPrompt: string;
};

type Draft = {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
};

const fallbackDraft: Draft = {
  enabled: true,
  provider: 'codex-automation',
  baseUrl: 'https://api.openai.com/v1',
  model: '',
  apiKey: '',
  systemPrompt: '',
};

export function AiSettings({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: (config: AiConfig) => void }) {
  const [draft, setDraft] = useState<Draft>(fallbackDraft);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMessage('');
    setError('');
    window.robotPapers?.getAiConfig().then((config) => {
      setDraft({
        enabled: config.enabled,
        provider: config.provider,
        baseUrl: config.baseUrl,
        model: config.model,
        apiKey: '',
        systemPrompt: config.systemPrompt,
      });
      setHasApiKey(config.hasApiKey);
      setMaskedKey(config.apiKeyMasked);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [open]);

  if (!open) return null;

  const update = (field: keyof Draft, value: string | boolean) => setDraft((current) => ({ ...current, [field]: value }));
  const usesCodex = draft.provider === 'codex-automation';

  const testConnection = async () => {
    if (!window.robotPapers) {
      setError('请从 Electron 桌面版打开此页面，浏览器预览不支持 AI 调用。');
      return;
    }
    setBusy(true);
    setMessage('正在测试 AI 连接…');
    setError('');
    try {
      const result = await window.robotPapers.testAiConnection(draft);
      setMessage(`连接成功：${result.message || '模型已响应'}`);
    } catch (reason) {
      setMessage('');
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!window.robotPapers) {
      setError('请从 Electron 桌面版打开此页面。');
      return;
    }
    setBusy(true);
    setMessage('正在保存 AI 配置…');
    setError('');
    try {
      const saved = await window.robotPapers.saveAiConfig(draft);
      setHasApiKey(saved.hasApiKey);
      setMaskedKey(saved.apiKeyMasked);
      setDraft((current) => ({ ...current, apiKey: '' }));
      setMessage(usesCodex ? '已切换为 Codex 定时任务模式，不会消耗 OpenAI API 余额。' : 'API 配置已保存。');
      onSaved?.(saved);
    } catch (reason) {
      setMessage('');
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="ai-settings-title" className="flex items-center gap-2 text-base font-semibold"><Settings2 className="size-4 text-primary" />AI 配置</h2>
            <p className="mt-1 text-xs text-muted-foreground">推荐使用 Codex 定时任务；只有兼容 API 模式才需要单独的 API 额度。</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭"><X /></Button>
        </header>
        <div className="min-h-0 space-y-5 overflow-y-auto p-5">
          <label className="flex items-start gap-3 rounded-xl border bg-muted/25 p-3 text-sm">
            <input type="checkbox" checked={draft.enabled} onChange={(event) => update('enabled', event.target.checked)} className="mt-0.5 size-4 accent-primary" />
            <span><span className="font-medium">启用 AI 生成</span><span className="mt-1 block text-xs text-muted-foreground">关闭后仍可浏览本地论文，但“生成日报/周报”按钮不会调用模型。</span></span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">生成方式</span>
            <select value={draft.provider} onChange={(event) => update('provider', event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <option value="codex-automation">Codex 定时任务（推荐，无需 API Key）</option>
              <option value="openai-compatible">兼容 OpenAI 的 API（单独计费）</option>
            </select>
          </label>
          {usesCodex ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
              <p className="font-medium text-primary">已由 Codex 负责论文分析</p>
              <p className="mt-1 text-muted-foreground">每天 10:00 生成论文日报、周日 12:00 生成研读周报，并写入 D:\paper。Robot Papers 只读取和展示文件，不会请求 OpenAI API，也不需要粘贴 API Key。</p>
            </div>
          ) : (
            <>
              <label className="block space-y-1.5 text-sm"><span className="font-medium">模型名称</span><input value={draft.model} onChange={(event) => update('model', event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="例如 gpt-5.4-mini / deepseek-chat" /></label>
              <label className="block space-y-1.5 text-sm"><span className="font-medium">API 地址</span><input value={draft.baseUrl} onChange={(event) => update('baseUrl', event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="https://api.openai.com/v1" /><span className="block text-xs text-muted-foreground">这会使用服务商的 API 余额，与 Codex 额度分开。</span></label>
              <label className="block space-y-1.5 text-sm"><span className="flex items-center gap-1.5 font-medium"><KeyRound className="size-3.5 text-primary" />API Key {hasApiKey && <span className="font-normal text-emerald-600">（已保存 {maskedKey}，留空则保持不变）</span>}</span><input type="password" value={draft.apiKey} onChange={(event) => update('apiKey', event.target.value)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={hasApiKey ? '已保存，留空保持不变' : '粘贴 API Key'} autoComplete="new-password" /></label>
              <label className="block space-y-1.5 text-sm"><span className="font-medium">系统提示词</span><textarea value={draft.systemPrompt} onChange={(event) => update('systemPrompt', event.target.value)} className="min-h-56 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm leading-6 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="使用内置具身智能论文分析提示词" /></label>
            </>
          )}
          {message && <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4 shrink-0" />{message}</p>}
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-700 dark:text-red-300">{error}</p>}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t bg-muted/20 px-5 py-4">
          {!usesCodex && <Button variant="outline" onClick={testConnection} disabled={busy}><Wifi />测试 API 连接</Button>}
          <Button onClick={save} disabled={busy}><Save />{busy ? '处理中…' : '保存配置'}</Button>
        </footer>
      </section>
    </div>
  );
}
