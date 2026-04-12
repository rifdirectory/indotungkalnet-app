'use client';

import dynamic from 'next/dynamic';

const AttendanceReportContent = dynamic(
  () => import('./AttendanceReportContent'),
  { ssr: false }
);

export default function AttendanceReportPage() {
  return <AttendanceReportContent />;
}
