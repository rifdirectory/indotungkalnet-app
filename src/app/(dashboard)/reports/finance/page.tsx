'use client';

import dynamic from 'next/dynamic';

const FinanceReportContent = dynamic(
  () => import('./FinanceReportContent'),
  { ssr: false }
);

export default function FinanceReportPage() {
  return <FinanceReportContent />;
}
