'use client';

import dynamic from 'next/dynamic';

const SchedulePageContent = dynamic(
  () => import('./SchedulePageContent'),
  { ssr: false }
);

export default function SchedulePage() {
  return <SchedulePageContent />;
}
