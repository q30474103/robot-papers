'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileDown,
  FileText,
  Images,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ZoomIn,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { emptyLibrary, type LibraryData, type Paper, type PaperFigure } from '@/lib/paper-types';
import { cn } from '@/lib/utils';

function splitParagraphs(value: string) {
  return value.split(/\n+/).map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);
}

function ActionLink({ href, children }: { href: string; children: ReactNode }) {
  if (!href) return null;
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:border-primary/35 hover:bg-accent">{children}</a>;
}

function InternalActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:border-primary/35 hover:bg-accent">{children}</a>;
}

function DetailSection({ icon: Icon, title, content, tone = 'default' }: {
  icon: typeof Lightbulb;
  title: string;
  content: string;
  tone?: 'default' | 'positive' | 'warning' | 'research';
}) {
  if (!content) return null;
  const tones = {
    default: 'border-border bg-card',
    positive: 'border-emerald-200 bg-emerald-50/65 dark:border-emerald-900 dark:bg-emerald-950/25',
    warning: 'border-amber-200 bg-amber-50/65 dark:border-amber-900 dark:bg-amber-950/25',
    research: 'border-primary/25 bg-primary/5',
  };
  return (
    <section className={cn('rounded-2xl border p-5', tones[tone])}>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Icon className="size-4 text-primary" />{title}</h2>
      <div className="space-y-2 text-sm leading-7 text-muted-foreground">
        {splitParagraphs(content).map((paragraph, index) => <p key={`${title}-${index}`}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function FigureReading({ figure, shortName }: { figure: PaperFigure; shortName: string }) {
  const label = figure.kind === 'results' ? '结果图解' : '方法图解';
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <figure className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/35 px-5 py-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-primary">
            <Images className="size-3.5" />图 {figure.order} · {label}
          </p>
          <h2 className="text-base font-semibold">{figure.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full cursor-zoom-in bg-white p-3 text-left sm:p-5"
          aria-label={`放大查看 ${figure.title}`}
        >
          <img
            src={figure.url}
            alt={`${shortName} ${figure.title}`}
            className="mx-auto max-h-[520px] w-full object-contain"
          />
          <span className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ZoomIn className="size-3.5" />点击放大
          </span>
        </button>
        <figcaption className="border-t px-5 py-4">
          <p className="mb-2 text-xs font-semibold text-foreground">读图说明</p>
          <div className="space-y-2 text-sm leading-7 text-muted-foreground">
            {figure.explanation
              ? splitParagraphs(figure.explanation).map((paragraph, index) => <p key={`${figure.url}-${index}`}>{paragraph}</p>)
              : <p>这张图来自论文主文；当前笔记尚未补充独立图解，建议结合前后的方法或实验段落阅读。</p>}
          </div>
          <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <ZoomIn className="size-3" />放大查看
          </button>
        </figcaption>
      </figure>

      <DialogContent className="h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden bg-zinc-950 p-0 text-white ring-white/15 sm:h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{figure.title}</DialogTitle>
          <DialogDescription>{shortName} 论文图片放大预览</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-8">
          <img
            src={figure.url}
            alt={`${shortName} ${figure.title} 放大图`}
            className="max-h-[calc(100vh-7rem)] max-w-full object-contain"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{figure.title}</p>
            <p className="mt-0.5 text-xs text-zinc-400">按 Esc、点击背景或右上角按钮关闭</p>
          </div>
          <span className="shrink-0 text-xs text-zinc-400">图 {figure.order}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PaperDetail() {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('paper');
    fetch('/data/papers.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((value: LibraryData) => setPaper((value.papers || emptyLibrary.papers).find((item) => item.id === id) || null))
      .finally(() => setLoaded(true));
  }, []);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  if (!loaded) {
    return <div className="grid min-h-screen place-items-center bg-background"><div className="text-center"><BookOpen className="mx-auto mb-3 size-8 animate-pulse text-primary" /><p className="text-sm text-muted-foreground">正在读取论文分析…</p></div></div>;
  }

  if (!paper) {
    return <div className="grid min-h-screen place-items-center bg-background p-6"><div className="text-center"><h1 className="text-xl font-semibold">未找到这篇论文</h1><p className="mt-2 text-sm text-muted-foreground">论文可能尚未同步，或者链接已经变更。</p><a href="/" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><ArrowLeft className="size-4" />返回论文库</a></div></div>;
  }

  const figureDetails = paper.figureDetails?.length
    ? paper.figureDetails
    : paper.figures.map((url, index) => ({
        url,
        title: `图 ${index + 1}`,
        explanation: '',
        kind: index === 0 ? 'method' as const : 'results' as const,
        order: index + 1,
      }));
  const methodFigures = figureDetails.filter((figure) => figure.kind === 'method');
  const resultFigures = figureDetails.filter((figure) => figure.kind === 'results');

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={goBack}><ArrowLeft />返回论文库</Button>
          <div className="flex items-center gap-2 text-sm font-semibold"><div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="size-4" /></div><span className="hidden sm:inline">Robot Papers</span></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge>{paper.shortName}</Badge><Badge variant="outline">{paper.venue}</Badge><Badge variant="secondary"><CalendarDays className="mr-1 size-3" />推荐于 {paper.collectedDate}</Badge>
        </div>
        <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{paper.title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{paper.authors.join('、')}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ActionLink href={paper.pdfUrl}><FileDown className="size-4" />PDF 原文</ActionLink>
          <InternalActionLink href={`/paper?paper=${encodeURIComponent(paper.id)}`}><FileText className="size-4" />网页笔记</InternalActionLink>
          <ActionLink href={paper.url}><ArrowUpRight className="size-4" />官方页面</ActionLink>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"><Sparkles className="size-3.5" />一句话结论</p>
              <p className="text-base font-medium leading-7">{paper.summary}</p>
            </section>

            <DetailSection icon={Target} title="研究问题" content={paper.problem} />
            <DetailSection icon={Zap} title="核心方法" content={paper.method} />
            {methodFigures.map((figure) => <FigureReading key={figure.url} figure={figure} shortName={paper.shortName} />)}
            <DetailSection icon={TrendingUp} title="实验与关键结果" content={paper.results} />
            {resultFigures.map((figure) => <FigureReading key={figure.url} figure={figure} shortName={paper.shortName} />)}
            <DetailSection icon={CheckCircle2} title="工作优点" content={paper.strengths} tone="positive" />
            <DetailSection icon={Lightbulb} title="局限性" content={paper.limitations} tone="warning" />
            <DetailSection icon={Sparkles} title="可改进点与后续研究机会" content={paper.improvements} tone="research" />
            <DetailSection icon={BookOpen} title="阅读建议" content={paper.readingAdvice} />
            <Button variant="outline" onClick={goBack} className="mt-2"><ArrowLeft />返回论文库</Button>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-22 lg:self-start">
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">论文信息</h2>
              <dl className="space-y-3 text-xs">
                <div><dt className="text-muted-foreground">首发日期</dt><dd className="mt-1 font-medium">{paper.paperDate || '待补充'}</dd></div>
                <div><dt className="text-muted-foreground">发表场所</dt><dd className="mt-1 font-medium">{paper.venue}</dd></div>
                <div><dt className="text-muted-foreground">状态</dt><dd className="mt-1 font-medium">{paper.status || paper.venueTier}</dd></div>
                {paper.arxivId && <div><dt className="text-muted-foreground">arXiv</dt><dd className="mt-1 font-medium">{paper.arxivId}</dd></div>}
              </dl>
            </section>
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">研究方向</h2>
              <div className="flex flex-wrap gap-1.5">{paper.directions.map((direction) => <Badge key={direction} variant="secondary">{direction}</Badge>)}</div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
