export type Paper = {
  id: string;
  shortName: string;
  title: string;
  authors: string[];
  paperDate: string;
  collectedDate: string;
  venue: string;
  venueTier: string;
  status: string;
  source: string;
  url: string;
  arxivId: string;
  tags: string[];
  directions: string[];
  summary: string;
  problem: string;
  method: string;
  results: string;
  strengths: string;
  limitations: string;
  improvements: string;
  readingAdvice: string;
  figures: string[];
  figureDetails: PaperFigure[];
  markdownUrl: string;
  pdfUrl: string;
};

export type PaperFigure = {
  url: string;
  title: string;
  explanation: string;
  kind: 'method' | 'results';
  order: number;
};

export type WeeklySummary = {
  id: string;
  title: string;
  weekStart: string;
  weekEnd: string;
  generatedDate: string;
  paperCount: number;
  paperShortNames: string[];
  directions: string[];
  summaryParagraph: string;
  overview: string;
  learned: string;
  methodMap: string;
  reflections: string;
  questions: string;
  nextWeek: string;
  markdownUrl: string;
};

export type DailyReport = {
  id: string;
  title: string;
  generatedDate: string;
  overview: string;
  markdownUrl: string;
};

export type LibraryData = {
  generatedAt: string;
  sourceRoot: string;
  papers: Paper[];
  categories: { name: string; count: number }[];
  weeklySummaries: WeeklySummary[];
  dailyReports: DailyReport[];
};

export const emptyLibrary: LibraryData = {
  generatedAt: '',
  sourceRoot: 'D:\\paper',
  papers: [],
  categories: [],
  weeklySummaries: [],
  dailyReports: [],
};
