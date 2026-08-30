'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, FileText, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { emptyLibrary, type DailyReport, type LibraryData } from '@/lib/paper-types';

function renderMarkdown(markdown: string): ReactNode[] {
  const source = markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*/, '');
  const lines = source.split(/\r?\n/);
  return lines.map((line, index) => {
    const value = line.trim();
    if (!value) return <div key={`space-${index}`} className="h-2" />;
    if (value.startsWith('# ')) return <h1 key={index} className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value.slice(2)}</h1>;
    if (value.startsWith('## ')) return <h2 key={index} className="mt-7 border-b pb-2 text-lg font-semibold">{value.slice(3)}</h2>;
    if (value.startsWith('### ')) return <h3 key={index} className="mt-5 text-base font-semibold text-primary">{value.slice(4)}</h3>;
    if (/^[-*]\s+/.test(value)) return <div key={index} className="flex gap-2 text-sm leading-7 text-muted-foreground"><span className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" /><span>{value.replace(/^[-*]\s+/, '')}</span></div>;
    return <p key={index} className="text-sm leading-7 text-muted-foreground">{value}</p>;
  });
}

export function DailyDetail() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('report');
    fetch('/data/papers.json', { cache: 'no-store' })
      .then((response) => response.json())
      .then((value) => {
        const library = { ...emptyLibrary, ...(value as LibraryData) };
        const selected = (library.dailyReports || []).find((item) => item.id === id) || null;
        setReport(selected);
        if (!selected) return '';
        return fetch(selected.markdownUrl, { cache: 'no-store' }).then((response) => response.ok ? response.text() : '');
      })
      .then((content) => { if (typeof content === 'string') setMarkdown(content); })
      .finally(() => setLoaded(true));
  }, []);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  if (!loaded) return <div className="grid min-h-screen place-items-center bg-background"><p className="text-sm text-muted-foreground">正在打开晨间简报…</p></div>;
  if (!report) return <div className="grid min-h-screen place-items-center bg-background p-6 text-center"><div><h1 className="text-xl font-semibold">未找到这期日报</h1><Button className="mt-5" onClick={goBack}><ArrowLeft />返回论文库</Button></div></div>;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={goBack}><ArrowLeft />返回论文库</Button>
          <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4 text-primary" />Robot Papers · 晨间简报</div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2"><Badge><FileText className="mr-1 size-3" />AI 日报</Badge><Badge variant="outline"><CalendarDays className="mr-1 size-3" />{report.generatedDate}</Badge></div>
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary"><Sparkles className="size-4" />由已配置模型根据本地入库论文生成</div>
          <article className="max-w-5xl">{markdown ? renderMarkdown(markdown) : <p className="text-sm leading-7 text-muted-foreground">{report.overview}</p>}</article>
        </section>
      </main>
    </div>
  );
}
