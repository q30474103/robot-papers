import type { Metadata } from 'next';

import { PaperDetail } from '@/components/paper-detail';

export const metadata: Metadata = {
  title: '论文研究分析｜Robot Papers',
  description: '查看论文方法、实验结果、优点、局限性和后续研究机会。',
};

export default function PaperPage() {
  return <PaperDetail />;
}
