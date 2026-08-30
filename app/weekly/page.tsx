import type { Metadata } from 'next';

import { WeeklyDetail } from '@/components/weekly-detail';

export const metadata: Metadata = {
  title: '研读周报｜Robot Papers',
  description: '按网页章节阅读每周具身智能论文总结、方法脉络和研究问题。',
};

export default function WeeklyPage() {
  return <WeeklyDetail />;
}
