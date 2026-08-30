'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Bot,
  Bookmark,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileDown,
  FileText,
  History,
  Images,
  LibraryBig,
  Lightbulb,
  Moon,
  NotebookTabs,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Sun,
  Tags,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { emptyLibrary, type DailyReport, type LibraryData, type Paper, type WeeklySummary } from '@/lib/paper-types';
import { AiSettings } from '@/components/ai-settings';

type ViewMode = 'today' | 'history' | 'favorites' | 'weekly';

const navigation = [
  { id: 'today' as const, label: '今日推荐', icon: FileText },
  { id: 'history' as const, label: '历史日报', icon: History },
  { id: 'favorites' as const, label: '我的收藏', icon: Bookmark },
  { id: 'weekly' as const, label: '研读周报', icon: NotebookTabs },
];

function formatDate(date: string) {
  if (!date) return '日期待补充';
  const [year, month, day] = date.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function excerpt(value: string, length = 170) {
  const normalized = value.replace(/\s+/g, ' ').replace(/^•\s*/gm, '').trim();
  return normalized.length > length ? `${normalized.slice(0, length).trim()}…` : normalized;
}

function buildAiContext(papers: Paper[], kind: 'daily' | 'weekly', latestDate: string) {
  const latestTime = latestDate ? new Date(`${latestDate}T23:59:59`).getTime() : Date.now();
  const selected = papers
    .filter((paper) => kind === 'daily' ? paper.collectedDate === latestDate : latestTime - new Date(`${paper.collectedDate}T23:59:59`).getTime() <= 7 * 24 * 60 * 60 * 1000)
    .slice(0, kind === 'daily' ? 8 : 12);
  return [
    `任务类型：${kind === 'daily' ? '今日论文日报' : '本周研读周报'}`,
    `报告日期：${latestDate || new Date().toISOString().slice(0, 10)}`,
    `候选论文数量：${selected.length}`,
    '以下资料来自本地 Obsidian 论文库，字段为空时不要自行补全：',
    ...selected.map((paper, index) => [
      `\n[论文 ${index + 1}]`,
      `项目缩写：${paper.shortName}`,
      `标题：${paper.title}`,
      `作者：${paper.authors.join('、')}`,
      `日期：${paper.paperDate || paper.collectedDate}`,
      `收录日期：${paper.collectedDate}`,
      `会议/期刊：${paper.venue}`,
      `方向：${paper.directions.join('、')}`,
      `原文链接：${paper.url || '未提供'}`,
      `一句话结论：${paper.summary || '未提供'}`,
      `研究问题：${paper.problem || '未提供'}`,
      `核心方法：${paper.method || '未提供'}`,
      `实验结果：${paper.results || '未提供'}`,
      `优点：${paper.strengths || '未提供'}`,
      `局限性：${paper.limitations || '未提供'}`,
      `可改进点：${paper.improvements || '未提供'}`,
      `阅读建议：${paper.readingAdvice || '未提供'}`,
      `图片说明：${paper.figureDetails?.map((figure) => `图${figure.order} ${figure.title}：${figure.explanation || '未提供'}`).join('；') || '未提供'}`,
    ].join('\n')),
  ].join('\n');
}

function PaperLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof FileText }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent"
    >
      <Icon className="size-3.5" />
      {label}
    </a>
  );
}

function PaperCard({
  paper,
  favorite,
  onToggleFavorite,
  onDirection,
}: {
  paper: Paper;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onDirection: (direction: string) => void;
}) {
  const detailUrl = `/paper?paper=${encodeURIComponent(paper.id)}`;
  return (
    <article className="group p-5 transition-colors hover:bg-muted/25">
      <div className="flex gap-4">
        <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary sm:grid">
          {paper.figures.length ? <Images className="size-5" /> : <FileText className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{paper.shortName}</Badge>
            <Badge variant="outline">{paper.venue}</Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3" /> 推荐于 {paper.collectedDate}
            </span>
          </div>
          <a href={detailUrl} className="block focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <h3 className="text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">{paper.title}</h3>
          </a>
          {paper.authors.length > 0 && <p className="mt-1 truncate text-xs text-muted-foreground">{paper.authors.join('、')}</p>}
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{paper.summary || '总结正在完善。'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {paper.directions.slice(0, 6).map((direction) => (
              <button key={direction} onClick={() => onDirection(direction)}>
                <Badge variant="secondary" className="font-normal hover:text-primary">{direction}</Badge>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={detailUrl} className={cn(buttonVariants({ size: 'sm' }))}>
              查看分析 <ArrowUpRight />
            </a>
            <PaperLink href={paper.pdfUrl} label="PDF" icon={FileDown} />
            <a
              href={detailUrl}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent"
            >
              <FileText className="size-3.5" />
              网页笔记
            </a>
            <button
              onClick={() => onToggleFavorite(paper.id)}
              className={cn('ml-auto grid size-8 place-items-center rounded-lg transition-colors hover:bg-accent', favorite ? 'text-amber-500' : 'text-muted-foreground')}
              aria-label={favorite ? '取消收藏' : '收藏'}
            >
              <Bookmark className={cn('size-4', favorite && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function WeeklyCard({ report }: { report: WeeklySummary }) {
  return (
    <article className="p-5 transition-colors hover:bg-muted/25">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <BookMarked className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:text-violet-300">研读周报</Badge>
            <Badge variant="outline">{report.paperCount} 篇</Badge>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarRange className="size-3" /> {report.weekStart} — {report.weekEnd}
            </span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{report.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{excerpt(report.summaryParagraph || report.overview, 320)}</p>
          {report.paperShortNames.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.paperShortNames.map((name) => <Badge key={name} variant="secondary">{name}</Badge>)}
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" /> 学到了什么</p>
              <p className="text-xs leading-5 text-muted-foreground">{excerpt(report.learned, 150) || '等待本周总结生成。'}</p>
            </div>
            <div className="rounded-xl border bg-background/70 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><Lightbulb className="size-3.5" /> 关键思考</p>
              <p className="text-xs leading-5 text-muted-foreground">{excerpt(report.reflections, 150) || '等待本周总结生成。'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`/weekly?report=${encodeURIComponent(report.id)}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent"
            >
              <FileText className="size-3.5" />
              网页阅读周报
            </a>
            <span className="text-[11px] text-muted-foreground">生成于 {report.generatedDate}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function DailyReportCard({ report }: { report: DailyReport }) {
  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className="mb-2 flex items-center gap-2"><Badge className="bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/15 dark:text-cyan-300">AI 日报</Badge><span className="text-xs text-muted-foreground">{report.generatedDate}</span></div><h3 className="font-semibold">{report.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{excerpt(report.overview, 220)}</p></div>
        <a href={`/daily?report=${encodeURIComponent(report.id)}`} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent"><FileText className="size-3.5" />网页阅读日报</a>
      </div>
    </article>
  );
}

export function PaperDashboardV2() {
  const [data, setData] = useState<LibraryData>(emptyLibrary);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<ViewMode>('today');
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('全部方向');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<{ kind: 'daily' | 'weekly'; markdown: string; path?: string } | null>(null);

  const reloadLibrary = () => {
    fetch('/data/papers.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((value) => {
        const library = value as LibraryData;
        setData({ ...emptyLibrary, ...library, weeklySummaries: library.weeklySummaries || [], dailyReports: library.dailyReports || [] });
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    reloadLibrary();
    setLoaded(true);
    try {
      const saved = window.localStorage.getItem('robot-papers-favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      setFavorites([]);
    }
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const unsubscribe = window.robotPapers?.onLibraryUpdated(reloadLibrary);
    return unsubscribe;
  }, []);

  const latestDate = data.papers[0]?.collectedDate || '';
  const visiblePapers = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return data.papers.filter((paper) => {
      const inMode = mode === 'history' || (mode === 'today' && paper.collectedDate === latestDate) || (mode === 'favorites' && favorites.includes(paper.id));
      const inDirection = direction === '全部方向' || paper.directions.includes(direction);
      const searchable = `${paper.shortName} ${paper.title} ${paper.authors.join(' ')} ${paper.venue} ${paper.directions.join(' ')}`.toLocaleLowerCase();
      return mode !== 'weekly' && inMode && inDirection && (!needle || searchable.includes(needle));
    });
  }, [data.papers, direction, favorites, latestDate, mode, query]);

  const visibleWeekly = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return data.weeklySummaries.filter((report) => {
      const searchable = `${report.title} ${report.paperShortNames.join(' ')} ${report.directions.join(' ')} ${report.overview} ${report.learned} ${report.reflections}`.toLocaleLowerCase();
      return !needle || searchable.includes(needle);
    });
  }, [data.weeklySummaries, query]);

  const toggleFavorite = (paperId: string) => {
    setFavorites((current) => {
      const next = current.includes(paperId) ? current.filter((id) => id !== paperId) : [...current, paperId];
      window.localStorage.setItem('robot-papers-favorites', JSON.stringify(next));
      return next;
    });
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const generateAiReport = async (kind: 'daily' | 'weekly') => {
    if (!window.robotPapers) {
      setAiError('请从 Electron 桌面版打开，浏览器预览不能调用 AI。');
      setAiMessage('');
      return;
    }
    const latest = latestDate || new Date().toISOString().slice(0, 10);
    const context = buildAiContext(data.papers, kind, latest);
    setAiBusy(true);
    setAiMessage(`正在生成${kind === 'daily' ? '今日日报' : '本周周报'}…`);
    setAiError('');
    try {
      const result = await window.robotPapers.generateAi({ kind, context });
      const weekStart = kind === 'weekly'
        ? new Date(new Date(`${latest}T12:00:00`).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : latest;
      const selectedPapers = kind === 'weekly'
        ? data.papers.filter((paper) => paper.collectedDate >= weekStart && paper.collectedDate <= latest).slice(0, 12)
        : data.papers.filter((paper) => paper.collectedDate === latest).slice(0, 8);
      const saved = await window.robotPapers.saveAiDocument({
        kind,
        date: latest,
        weekStart,
        fileName: kind === 'weekly' ? `${weekStart}_to_${latest}.md` : `${latest}.md`,
        markdown: result.markdown,
        paperShortNames: selectedPapers.map((paper) => paper.shortName),
        directions: [...new Set(selectedPapers.flatMap((paper) => paper.directions))],
      });
      setAiResult({ ...result, path: saved.path });
      setAiMessage(`已生成并保存到 ${saved.path}`);
      reloadLibrary();
    } catch (reason) {
      setAiMessage('');
      setAiError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setAiBusy(false);
    }
  };

  const copy = {
    today: ['今天值得读什么？', `${formatDate(latestDate)} · 从新作与本年度未推荐佳作中精选`],
    history: ['论文日报归档', '按推荐日期检索你的具身智能研究脉络'],
    favorites: ['我的精读清单', '保存在当前浏览器中的重点论文'],
    weekly: ['研读周报', '把一周的论文串成方法脉络、学习收获和下一步研究问题'],
  }[mode];

  const paperMode = mode !== 'weekly';
  const resultCount = paperMode ? visiblePapers.length : visibleWeekly.length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-fit items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20"><BookOpen className="size-5" /></div>
            <div className="hidden sm:block"><p className="text-sm font-bold leading-4 tracking-tight">Robot Papers</p><p className="mt-0.5 text-[11px] text-muted-foreground">具身智能论文知识库</p></div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'weekly' ? '搜索周报、论文或研究方向…' : '搜索标题、作者、方向或会议…'} className="h-10 rounded-xl bg-muted/70 pl-9 shadow-none" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setAiOpen(true)} aria-label="AI 配置"><Settings2 /></Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换深色模式">{dark ? <Sun /> : <Moon />}</Button>
          <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground lg:flex"><RefreshCw className="size-3.5 text-primary" />本地库已同步</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 md:grid-cols-[210px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[210px_minmax(0,1fr)_280px]">
        <aside className="hidden md:block">
          <div className="sticky top-22 space-y-6">
            <div>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Workspace</p>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { setMode(item.id); setDirection('全部方向'); }} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors', mode === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                      <Icon className="size-4" />{item.label}
                      {item.id === 'favorites' && favorites.length > 0 && <span className="ml-auto rounded-full bg-background/20 px-1.5 text-[10px]">{favorites.length}</span>}
                      {item.id === 'weekly' && data.weeklySummaries.length > 0 && <span className="ml-auto rounded-full bg-background/20 px-1.5 text-[10px]">{data.weeklySummaries.length}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><LibraryBig className="size-4 text-primary" />本地优先</div>
              <p className="text-xs leading-5 text-muted-foreground">原文、图解、日报与周报都从 {data.sourceRoot || 'D:\\paper'} 同步，网站不会上传论文库。</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary"><Clock3 className="size-3.5" /> 每日 10:00 · 周日 12:00</p>
              <p className="text-xs leading-5 text-muted-foreground">AI 使用已入库真实论文生成日报，并在周日回顾方法主线、学习收获与研究思考。</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-2 pb-1 md:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              return <Button key={item.id} variant={mode === item.id ? 'default' : 'outline'} onClick={() => setMode(item.id)}><Icon />{item.label}</Button>;
            })}
          </div>
          <section className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-primary">{mode === 'weekly' ? 'Weekly synthesis' : 'Research radar'}</Badge>
              {paperMode && direction !== '全部方向' && <button onClick={() => setDirection('全部方向')} className="text-xs text-muted-foreground hover:text-foreground">{direction} ×</button>}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{copy[0]}</h1><p className="mt-2 text-sm text-muted-foreground">{copy[1]}</p></div>
              <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-500" />{loaded ? `${resultCount} ${mode === 'weekly' ? '期周报' : '篇论文'}` : '正在读取知识库'}</div>
            </div>
          </section>

          {mode === 'history' && data.dailyReports.length > 0 && (
            <section className="mb-5">
              <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold">AI 晨间简报</h2><p className="mt-1 text-xs text-muted-foreground">由软件使用本地已入库论文和当前 AI 配置生成</p></div><Badge variant="outline">{data.dailyReports.length} 期</Badge></div>
              <div className="grid gap-3 2xl:grid-cols-2">{data.dailyReports.slice(0, 4).map((report) => <DailyReportCard key={report.id} report={report} />)}</div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(30,64,175,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
              <div><h2 className="text-sm font-semibold">{mode === 'today' ? '今日精选论文' : mode === 'history' ? '全部历史论文' : mode === 'favorites' ? '已收藏论文' : '每周学习总结'}</h2><p className="mt-1 text-xs text-muted-foreground">{mode === 'weekly' ? '不是逐篇复述，而是归纳一周共同方向、方法脉络与可继续追问的问题' : '点击论文标题或“查看分析”进入完整独立页面'}</p></div>
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{resultCount} {mode === 'weekly' ? '期' : '篇'}</Badge><Button variant="outline" size="sm" onClick={() => generateAiReport(mode === 'weekly' ? 'weekly' : 'daily')} disabled={aiBusy}><Bot />{aiBusy ? '生成中…' : mode === 'weekly' ? 'AI 生成周报' : 'AI 生成日报'}</Button></div>
            </div>

            {mode === 'weekly' ? (
              visibleWeekly.length === 0 ? (
                <div className="grid min-h-72 place-items-center p-8 text-center">
                  <div className="max-w-md"><NotebookTabs className="mx-auto mb-3 size-9 text-primary/45" /><p className="text-sm font-semibold">第一期研读周报将在周日 12:00 自动生成</p><p className="mt-2 text-xs leading-5 text-muted-foreground">它会汇总上一周真实入库的论文，提炼共同方向、学到的内容、关键思考和下周研究建议。</p></div>
                </div>
              ) : <div className="divide-y">{visibleWeekly.map((report) => <WeeklyCard key={report.id} report={report} />)}</div>
            ) : visiblePapers.length === 0 ? (
              <div className="grid min-h-64 place-items-center p-8 text-center"><div><BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/50" /><p className="text-sm font-medium">没有匹配的论文</p><p className="mt-1 text-xs text-muted-foreground">可以清除搜索词或切换方向筛选。</p></div></div>
            ) : <div className="divide-y">{visiblePapers.map((paper) => <PaperCard key={paper.id} paper={paper} favorite={favorites.includes(paper.id)} onToggleFavorite={toggleFavorite} onDirection={setDirection} />)}</div>}
          </section>
          {(aiMessage || aiError || aiResult) && (
            <section className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              {aiMessage && <p className="text-xs font-medium text-primary">{aiMessage}</p>}
              {aiError && <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300">{aiError}</p>}
              {aiResult && !aiBusy && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-primary">查看本次 AI 输出</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border bg-background p-4 text-xs leading-6">{aiResult.markdown}</pre></details>}
            </section>
          )}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-22 space-y-5">
            {paperMode ? (
              <section className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b px-4 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><Tags className="size-4 text-primary" />关注方向</h2><p className="mt-1 text-xs text-muted-foreground">点击筛选方向与方法标签</p></div>
                <div className="max-h-[520px] space-y-1 overflow-y-auto p-2">
                  <button onClick={() => setDirection('全部方向')} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-xs', direction === '全部方向' ? 'bg-accent text-primary' : 'hover:bg-muted')}><span className="mr-2 size-1.5 rounded-full bg-primary" />全部方向<span className="ml-auto text-muted-foreground">{data.papers.length}</span></button>
                  {data.categories.map((category) => <button key={category.name} onClick={() => setDirection(category.name)} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-xs transition-colors', direction === category.name ? 'bg-accent text-primary' : 'hover:bg-muted')}><span className="mr-2 size-1.5 rounded-full bg-primary/70" /><span className="truncate">{category.name}</span><span className="ml-auto text-muted-foreground">{category.count}</span></button>)}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border bg-card p-4 shadow-sm">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><NotebookTabs className="size-4 text-primary" />周报内容结构</p>
                <div className="space-y-3 text-xs text-muted-foreground">
                  {['本周阅读与共同方向', '真正学到的核心规律', '跨论文的方法脉络', '我的思考与争议点', '可延伸研究问题', '下周精读建议'].map((item, index) => <div key={item} className="flex gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{index + 1}</span><span className="pt-0.5">{item}</span></div>)}
                </div>
              </section>
            )}
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-primary" />研究整理原则</p>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-2"><Target className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>区分论文结论、证据边界与可继续验证的问题。</span></div>
                <div className="flex gap-2"><Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>把多篇论文连接成方法演进，而不是简单罗列摘要。</span></div>
              </div>
            </section>
          </div>
        </aside>
      </div>
      <AiSettings open={aiOpen} onClose={() => setAiOpen(false)} onSaved={() => { setAiError(''); setAiMessage('AI 配置已保存。'); }} />
    </div>
  );
}
