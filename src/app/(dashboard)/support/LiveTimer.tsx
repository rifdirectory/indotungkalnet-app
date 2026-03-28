'use client';

import React, { useState, useEffect } from 'react';

const LiveTimer = ({ createdAt, createdTimeStr, status, finishedAt }: any) => {
  const [currentDuration, setCurrentDuration] = useState('00:00:00');

  useEffect(() => {
    let interval: any;
    
    const parseJakarta = (val: any) => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      const str = String(val);
      
      // 1. Standard SQL/Jakarta format: YYYY-MM-DD HH:mm:ss
      // This is now our primary format from getJakartaNow()
      const m1 = str.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
      if (m1) {
        const d = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]), Number(m1[4]), Number(m1[5]), Number(m1[6]));
        if (!isNaN(d.getTime())) return d;
      }

      // 2. ISO format with Z or Offset
      if (str.includes('Z') || (str.includes('T') && str.includes('+'))) {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;
      }

      // 3. ID Locale fallback: DD/MM/YYYY, HH.mm.ss
      const m2 = str.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})[, ]+\s*(\d{1,2})[\.:](\d{2})[\.:](\d{2})/);
      if (m2) {
        const d = new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]), Number(m2[4]), Number(m2[5]), Number(m2[6]));
        if (!isNaN(d.getTime())) return d;
      }
      
      const fallback = new Date(str);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    const formatDiff = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const update = () => {
      // Prioritize createdTimeStr as it's the raw DB string "YYYY-MM-DD HH:mm:ss"
      const start = parseJakarta(createdTimeStr || createdAt);
      if (!start) return;

      const startTime = start.getTime();
      const now = Date.now();
      
      const getProcessedDiff = (referenceTime: number, startT: number) => {
        // Since we now parse everything as LOCAL time, diff should be direct
        return Math.max(0, Math.floor((referenceTime - startT) / 1000));
      };

      if (status === 'Selesai') {
        const end = parseJakarta(finishedAt) || new Date();
        const finalDiff = getProcessedDiff(end.getTime(), startTime);
        setCurrentDuration(formatDiff(finalDiff));
        return;
      }

      const currentDiff = getProcessedDiff(now, startTime);
      setCurrentDuration(formatDiff(currentDiff));
    };

    update();
    if (status !== 'Selesai') {
      interval = setInterval(update, 1000);
    }
    return () => clearInterval(interval);
  }, [createdAt, createdTimeStr, status, finishedAt]);

  return <>{currentDuration}</>;
};

export default LiveTimer;
