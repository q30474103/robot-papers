'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { emptyLibrary, type LibraryData, type Paper, type WeeklySummary } from '@/lib/paper-types';
import { cn } from '@/lib/utils';

function contentBlocks(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function tableCells(row: string) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isTableDivider(cells: string[]) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));
}

function MarkdownTable({ rows }: { rows: string[] }) {
  const parsedRows = rows.map(tableCells);
  const header = parsedRows[0] || [];
  const hasDivider = isTableDivider(parsedRows[1] || []);
  const body = parsedRows.slice(hasDivider ? 2 : 1);
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-muted/30 lg:block">
        <table className="w-full table-fixed border-collapse text-left text-[11px] xl:text-xs">
          <thead className="bg-muted/75 text-foreground">
            <tr>
              {header.map((cell, index) => <th key={`head-${index}`} className="border-b px-3 py-3 font-semibold break-words whitespace-normal">{cell}</th>)}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="align-top even:bg-background/45">
                {header.map((_, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`} className="border-b px-3 py-3 leading-6 text-muted-foreground break-words whitespace-normal">{row[cellIndex] || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 lg:hidden">
        {body.map((row, rowIndex) => (
          <article key={`mobile-row-${rowIndex}`} className="rounded-xl border bg-muted/25 p-3">
            {header.map((label, cellIndex) => (
              <div key={`mobile-cell-${rowIndex}-${cellIndex}`} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b py-2.5 last:border-0">
                <span className="text-[11px] font-semibold leading-5 text-foreground">{label}</span>
                <span className="break-words text-xs leading-5 text-muted-foreground">{row[cellIndex] || '—'}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

function ReadingText({ value }: { value: string }) {
  if (!value) return <p className="text-sm leading-7 text-muted-foreground">本期暂未补充。</p>;
  const blocks = contentBlocks(value);
  if (blocks.length >= 2 && blocks.every((block) => block.startsWith('|'))) {
    return <MarkdownTable rows={blocks} />;
  }
  return (
    <div className="space-y-3 text-sm leading-7 text-muted-foreground">
      {blocks.map((block, index) => {
        const isBullet = /^[-•*]\s*/.test(block);
        const text = block.replace(/^[-•*]\s*/, '');
        if (isBullet) {
          return (
            <div key={`${index}-${block.slice(0, 18)}`} className="flex gap-2.5">
              <span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary/70" />
              <p className="min-w-0 flex-1">{text}</p>
            </div>
          );
        }
        return (
          <p
            key={`${index}-${block.slice(0, 18)}`}
            className="whitespace-pre-wrap"
          >
            {text}
          </p>
        );
      })}
    </div>
  );
}

function ReportSection({
  icon: Icon,
  title,
  content,
  tone = 'default',
}: {
  icon: typeof Lightbulb;
  title: string;
  content: string;
  tone?: 'default' | 'positive' | 'warning' | 'research';
}) {
  const tones = {
    default: 'border-border bg-card',
    positive: 'border-emerald-200 bg-emerald-50/65 dark:border-emerald-900 dark:bg-emerald-950/25',
    warning: 'border-amber-200 bg-amber-50/65 dark:border-amber-900 dark:bg-amber-950/25',
    research: 'border-primary/25 bg-primary/5',
  };
  return (
    <section className={cn('rounded-2xl border p-5 sm:p-6', tones[tone])}>
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      <ReadingText value={content} />
    </section>
  );
}

function formatPeriod(start: string, end: string) {
  return start && end ? `${start} — ${end}` : '日期待补充';
}

function paragraphSummary(value: string) {
  return (value.split(/\n\s*\n/)[0] || value).replace(/\s+/g, ' ').trim();
}

export function WeeklyDetail() {
  const [report, setReport] = useState<WeeklySummary | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('report');
    fetch('/data/papers.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((value: LibraryData) => {
        const library = { ...emptyLibrary, ...value, weeklySummaries: value.weeklySummaries || [] };
        setPapers(library.papers || []);
        setReport(library.weeklySummaries.find((item) => item.id === id) || null);
      })
      .catch(() => {
        setReport(null);
        setPapers([]);
      })
      .finally(() => setLoaded(true));
  }, []);

  const paperLookup = useMemo(() => new Map(papers.map((paper) => [paper.shortName, paper])), [papers]);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <BookOpen className="mx-auto mb-3 size-8 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">正在打开研读周报…</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">未找到这期周报</h1>
          <p className="mt-2 text-sm text-muted-foreground">周报可能尚未同步，或者链接已经变更。</p>
          <Button variant="default" onClick={goBack} className="mt-5">
            <ArrowLeft className="size-4" />返回论文库
          </Button>
        </div>
      </div>
    );
  }

  const summary = report.summaryParagraph || paragraphSummary(report.overview);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft />返回论文库
          </Button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="size-4" /></div>
            <span className="hidden sm:inline">Robot Papers · 研读周报</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:text-violet-300">研读周报</Badge>
          <Badge variant="outline"><CalendarRange className="mr-1 size-3" />{formatPeriod(report.weekStart, report.weekEnd)}</Badge>
          <Badge variant="secondary">{report.paperCount} 篇论文</Badge>
          <span className="text-xs text-muted-foreground">生成于 {report.generatedDate}</span>
        </div>
        <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{report.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">把本周真实阅读记录串成方法脉络、学习收获与下一步研究问题。</p>

        <section className="mt-7 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold sm:text-lg">
            <Sparkles className="size-4 text-primary" />一段话总结
          </h2>
          <p className="max-w-none text-sm leading-7 text-foreground/85 sm:text-base sm:leading-7">
            {summary || '本期周报暂未生成一段话总结。'}
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="space-y-5">
            <ReportSection icon={BookOpen} title="本周阅读与共同方向" content={report.overview} />
            <ReportSection icon={Sparkles} title="我学到了什么" content={report.learned} tone="positive" />
            <ReportSection icon={TrendingUp} title="跨论文的方法脉络" content={report.methodMap} />
            <ReportSection icon={Lightbulb} title="我的思考" content={report.reflections} tone="research" />
            <ReportSection icon={Target} title="可延伸的研究问题" content={report.questions} />
            <ReportSection icon={CheckCircle2} title="下周精读建议" content={report.nextWeek} tone="warning" />
            <Button variant="outline" onClick={goBack} className="mt-2"><ArrowLeft />返回论文库</Button>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-22 lg:self-start">
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary" />本期论文</h2>
              <div className="space-y-2">
                {report.paperShortNames.map((name) => {
                  const paper = paperLookup.get(name);
                  return paper ? (
                    <a key={name} href={`/paper?paper=${encodeURIComponent(paper.id)}`} className="block rounded-lg border bg-background px-3 py-2 text-xs font-medium transition-colors hover:border-primary/35 hover:bg-accent">
                      {name}<span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">{paper.title}</span>
                    </a>
                  ) : <div key={name} className="rounded-lg border bg-background px-3 py-2 text-xs font-medium">{name}</div>;
                })}
              </div>
            </section>
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Tags className="size-4 text-primary" />共同方向</h2>
              <div className="flex flex-wrap gap-1.5">{report.directions.map((direction) => <Badge key={direction} variant="secondary">{direction}</Badge>)}</div>
            </section>
            <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">阅读提示</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">点击上方论文名称可回到结构化分析页，图像会按顺序展示并支持点击放大。</p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
