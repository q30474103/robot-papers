import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/app/globals.css';
import { PaperDashboardV2 } from '@/components/paper-dashboard-v2';
import { PaperDetail } from '@/components/paper-detail';
import { WeeklyDetail } from '@/components/weekly-detail';
import { DailyDetail } from '@/components/daily-detail';

function DesktopApp() {
  if (window.location.pathname === '/paper') return <PaperDetail />;
  if (window.location.pathname === '/weekly') return <WeeklyDetail />;
  if (window.location.pathname === '/daily') return <DailyDetail />;
  return <PaperDashboardV2 />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Robot Papers renderer root is missing.');

createRoot(root).render(
  <StrictMode>
    <DesktopApp />
  </StrictMode>,
);
