import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Robot Papers｜具身智能论文库',
  description: '本地优先的具身智能论文日报、图解与研究机会知识库',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
