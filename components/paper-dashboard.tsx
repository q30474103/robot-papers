'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight, BookOpen, Bookmark, CalendarDays, CheckCircle2, Clock3,
  FileDown, FileText, History, Images, LibraryBig, Lightbulb, Moon,
  RefreshCw, Search, Sparkles, Sun, Tags, Target, TrendingUp, Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type Paper = {
  id: string; shortName: string; title: string; authors: string[]; paperDate: string;
  collectedDate: string; venue: string; venueTier: string; status: string; source: string;
  url: string; arxivId: string; tags: string[]; directions: string[]; summary: string;
  problem: string; method: string; results: string; strengths: string; limitations: string;
  improvements: string; readingAdvice: string; figures: string[]; markdownUrl: string; pdfUrl: string;
};
type LibraryData = {
  generatedAt: string; sourceRoot: string; papers: Paper[];
  categories: { name: string; count: number }[];
};
type ViewMode = 'today' | 'history' | 'favorites';

const navigation = [
  { id: 'today' as const, label: '今日推荐', icon: FileText },
  { id: 'history' as const, label: '历史日报', icon: History },
  { id: 'favorites' as const, label: '我的收藏', icon: Bookmark },
];
const formatDate = (date: string) => {
  if (!date) return '日期待补充';
  const [year, month, day] = date.split('-');
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
};
const splitParagraphs = (value: string) => value.split(/\n+/).map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);

function PaperLink({ href, children }: { href: string; children: ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent">
      {children}
    </a>
  );
}

function DetailSection({ icon: Icon, title, content, tone = 'default' }: {
  icon: typeof Lightbulb; title: string; content: string;
  tone?: 'default' | 'positive' | 'warning' | 'research';
}) {
  if (!content) return null;
  const toneClass = {
    default: 'border-border bg-card',
    positive: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/25',
    warning: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/25',
    research: 'border-primary/25 bg-primary/5',
  }[tone];
  return (
    <section className={cn('rounded-2xl border p-4', toneClass)}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" />{title}</h3>
      <div className="space-y-2 text-sm leading-6 text-muted-foreground">
        {splitParagraphs(content).map((paragraph, index) => <p key={`${title}-${index}`}>{paragraph}</p>)}
      </div>
    </section>
  );
}

export function PaperDashboard() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [mode, setMode] = useState<ViewMode>('today');
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('全部方向');
  const [selected, setSelected] = useState<Paper | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    fetch('/data/papers.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ generatedAt: '', sourceRoot: 'D:\\paper', papers: [], categories: [] }));
    const saved = window.localStorage.getItem('robot-papers-favorites');
    if (saved) setFavorites(JSON.parse(saved));
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const latestDate = data?.papers[0]?.collectedDate || '';
  const visiblePapers = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLocaleLowerCase();
    return data.papers.filter((paper) => {
      const inMode = mode === 'history' || (mode === 'today' && paper.collectedDate === latestDate) ||
        (mode === 'favorites' && favorites.includes(paper.id));
      const inDirection = direction === '全部方向' || paper.directions.includes(direction);
      const searchable = `${paper.shortName} ${paper.title} ${paper.authors.join(' ')} ${paper.venue} ${paper.directions.join(' ')}`.toLocaleLowerCase();
      return inMode && inDirection && (!needle || searchable.includes(needle));
    });
  }, [data, direction, favorites, latestDate, mode, query]);

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
  const heading = mode === 'today' ? '今天值得读什么？' : mode === 'history' ? '论文日报归档' : '我的精读清单';
  const subheading = mode === 'today' ? `${formatDate(latestDate)} · 从新作与本年度未推荐佳作中精选` :
    mode === 'history' ? '按推荐日期检索你的具身智能研究脉络' : '保存在当前浏览器中的重点论文';

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
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、作者、机构、方向或会议…" className="h-10 rounded-xl bg-muted/70 pl-9 shadow-none" />
          </div>
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
                  return <button key={item.id} onClick={() => setMode(item.id)} className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    mode === item.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}><Icon className="size-4" />{item.label}{item.id === 'favorites' && favorites.length > 0 && <span className="ml-auto rounded-full bg-background/20 px-1.5 text-[10px]">{favorites.length}</span>}</button>;
                })}
              </nav>
            </div>
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><LibraryBig className="size-4 text-primary" />本地优先</div>
              <p className="text-xs leading-5 text-muted-foreground">原文、图解和 Obsidian 笔记均从 {data?.sourceRoot || 'D:\\paper'} 同步，网站不上传你的论文库。</p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-primary"><Clock3 className="size-3.5" /> 每日 10:00</p>
              <p className="text-xs leading-5 text-muted-foreground">新论文优先；不足时补充本年度未推荐的高质量工作。</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 flex flex-wrap gap-2 pb-1 md:hidden">
            {navigation.map((item) => <Button key={item.id} variant={mode === item.id ? 'default' : 'outline'} onClick={() => setMode(item.id)}><item.icon /> {item.label}</Button>)}
          </div>
          <section className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-primary">Research radar</Badge>
              {direction !== '全部方向' && <button onClick={() => setDirection('全部方向')} className="text-xs text-muted-foreground hover:text-foreground">{direction} ×</button>}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1><p className="mt-2 text-sm text-muted-foreground">{subheading}</p></div>
              <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-500" />{data ? `${data.papers.length} 篇已入库` : '正在读取论文库'}</div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(30,64,175,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-4">
              <div><h2 className="text-sm font-semibold">{mode === 'today' ? '今日精选论文' : mode === 'history' ? '全部历史论文' : '已收藏论文'}</h2><p className="mt-1 text-xs text-muted-foreground">每篇均包含中文总结、局限性和可执行的研究改进方向</p></div>
              <Badge variant="outline">{visiblePapers.length} 篇</Badge>
            </div>
            {visiblePapers.length === 0 ? (
              <div className="grid min-h-64 place-items-center p-8 text-center"><div><BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/50" /><p className="text-sm font-medium">没有匹配的论文</p><p className="mt-1 text-xs text-muted-foreground">可以清除搜索词或切换方向筛选。</p></div></div>
            ) : <div className="divide-y">{visiblePapers.map((paper) => (
              <article key={paper.id} className="group p-5 transition-colors hover:bg-muted/25">
                <div className="flex gap-4">
                  <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary sm:grid">{paper.figures.length ? <Images className="size-5" /> : <FileText className="size-5" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{paper.shortName}</Badge><Badge variant="outline">{paper.venue}</Badge>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CalendarDays className="size-3" /> 推荐于 {paper.collectedDate}</span>
                    </div>
                    <button onClick={() => setSelected(paper)} className="text-left"><h3 className="text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">{paper.title}</h3></button>
                    {paper.authors.length > 0 && <p className="mt-1 truncate text-xs text-muted-foreground">{paper.authors.join('、')}</p>}
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{paper.summary || '总结正在完善。'}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">{paper.directions.slice(0, 6).map((item) => <button key={item} onClick={() => setDirection(item)}><Badge variant="secondary" className="font-normal hover:text-primary">{item}</Badge></button>)}</div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => setSelected(paper)}>查看研究分析 <ArrowUpRight /></Button>
                      <PaperLink href={paper.pdfUrl}><FileDown /> PDF</PaperLink><PaperLink href={`/paper?paper=${encodeURIComponent(paper.id)}`}><FileText /> 网页笔记</PaperLink>
                      <button onClick={() => toggleFavorite(paper.id)} className={cn('ml-auto grid size-8 place-items-center rounded-lg transition-colors hover:bg-accent', favorites.includes(paper.id) ? 'text-amber-500' : 'text-muted-foreground')} aria-label={favorites.includes(paper.id) ? '取消收藏' : '收藏'}>
                        <Bookmark className={cn('size-4', favorites.includes(paper.id) && 'fill-current')} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}</div>}
          </section>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-22 space-y-5">
            <section className="rounded-2xl border bg-card shadow-sm">
              <div className="border-b px-4 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><Tags className="size-4 text-primary" /> 关注方向</h2><p className="mt-1 text-xs text-muted-foreground">点击筛选，分类由笔记与语义规则生成</p></div>
              <div className="max-h-[520px] space-y-1 overflow-y-auto p-2">
                <button onClick={() => setDirection('全部方向')} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-xs', direction === '全部方向' ? 'bg-accent text-primary' : 'hover:bg-muted')}><span className="mr-2 size-1.5 rounded-full bg-primary" />全部方向<span className="ml-auto text-muted-foreground">{data?.papers.length || 0}</span></button>
                {data?.categories.map((category) => <button key={category.name} onClick={() => setDirection(category.name)} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-xs transition-colors', direction === category.name ? 'bg-accent text-primary' : 'hover:bg-muted')}><span className="mr-2 size-1.5 rounded-full bg-primary/70" /><span className="truncate">{category.name}</span><span className="ml-auto text-muted-foreground">{category.count}</span></button>)}
              </div>
            </section>
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-primary" /> 当前研究框架</p>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-2"><Target className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>不仅回答“做了什么”，还判断证据是否支撑结论。</span></div>
                <div className="flex gap-2"><Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>单列可改进点、可证伪假设和后续实验入口。</span></div>
                <div className="flex gap-2"><Images className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>主图与关键结果直接嵌入 Obsidian 笔记。</span></div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[min(780px,96vw)] overflow-y-auto sm:max-w-[780px]">
          {selected && <>
            <SheetHeader className="border-b p-5 pr-14">
              <div className="mb-2 flex flex-wrap gap-2"><Badge>{selected.shortName}</Badge><Badge variant="outline">{selected.venue}</Badge><Badge variant="secondary">推荐于 {selected.collectedDate}</Badge></div>
              <SheetTitle className="text-xl font-bold leading-7">{selected.title}</SheetTitle><SheetDescription>{selected.authors.join('、')}</SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2"><PaperLink href={selected.pdfUrl}><FileDown /> PDF 原文</PaperLink><PaperLink href={`/paper?paper=${encodeURIComponent(selected.id)}`}><FileText /> 网页笔记</PaperLink><PaperLink href={selected.url}><ArrowUpRight /> 官方页面</PaperLink></div>
            </SheetHeader>
            <div className="space-y-4 px-5 pb-8">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"><Sparkles className="size-3.5" /> 一句话结论</p><p className="text-sm font-medium leading-6">{selected.summary}</p></div>
              {selected.figures.length > 0 && <section><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Images className="size-4 text-primary" /> 论文主图</h3><div className="grid gap-3 sm:grid-cols-2">{selected.figures.map((figure, index) => <a key={figure} href={figure} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border bg-white"><img src={figure} alt={`${selected.shortName} 论文图 ${index + 1}`} className="h-52 w-full object-contain" /><p className="border-t px-3 py-2 text-xs text-muted-foreground">图 {index + 1} · 点击查看原图</p></a>)}</div></section>}
              <DetailSection icon={Target} title="研究问题" content={selected.problem} /><DetailSection icon={Zap} title="核心方法" content={selected.method} />
              <DetailSection icon={TrendingUp} title="实验与关键结果" content={selected.results} /><DetailSection icon={CheckCircle2} title="工作优点" content={selected.strengths} tone="positive" />
              <DetailSection icon={Lightbulb} title="局限性" content={selected.limitations} tone="warning" /><DetailSection icon={Sparkles} title="可改进点与后续研究机会" content={selected.improvements} tone="research" />
              <DetailSection icon={BookOpen} title="阅读建议" content={selected.readingAdvice} />
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
