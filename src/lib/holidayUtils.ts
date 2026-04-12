/**
 * Utility to fetch and filter Indonesian National Holidays
 * using the api-hari-libur.vercel.app public API.
 */

interface Holiday {
  date: string;
  description: string;
}

// Simple in-memory cache for the current session
const holidayCache: Record<number, any[]> = {};

export async function getNationalHolidays(year: number): Promise<string[]> {
  const detailed = await getDetailedHolidays(year);
  return detailed.map(h => h.date);
}

export async function getDetailedHolidays(year: number): Promise<any[]> {
  // Use official SKB 3 Menteri 2026 data for accuracy
  if (year === 2026) {
    return [
      { date: '2026-01-01', description: 'Tahun Baru 2026 Masehi' },
      { date: '2026-01-16', description: 'Isra\' Mi\'raj Nabi Muhammad SAW' },
      { date: '2026-02-17', description: 'Tahun Baru Imlek 2577 Kongzili' },
      { date: '2026-02-18', description: 'Cuti Bersama Tahun Baru Imlek' },
      { date: '2026-03-18', description: 'Cuti Bersama Hari Suci Nyepi' },
      { date: '2026-03-19', description: 'Hari Suci Nyepi (Tahun Baru Saka 1948)' },
      { date: '2026-03-20', description: 'Cuti Bersama Idul Fitri 1447H' },
      { date: '2026-03-21', description: 'Hari Raya Idul Fitri 1447H' },
      { date: '2026-03-22', description: 'Hari Raya Idul Fitri 1447H' },
      { date: '2026-03-23', description: 'Cuti Bersama Idul Fitri 1447H' },
      { date: '2026-03-24', description: 'Cuti Bersama Idul Fitri 1447H' },
      { date: '2026-04-03', description: 'Wafat Yesus Kristus' },
      { date: '2026-04-05', description: 'Kebangkitan Yesus Kristus (Paskah)' },
      { date: '2026-05-01', description: 'Hari Buruh Internasional' },
      { date: '2026-05-14', description: 'Kenaikan Yesus Kristus' },
      { date: '2026-05-15', description: 'Cuti Bersama Kenaikan Yesus Kristus' },
      { date: '2026-05-27', description: 'Hari Raya Idul Adha 1447H' },
      { date: '2026-05-28', description: 'Cuti Bersama Idul Adha 1447H' },
      { date: '2026-05-31', description: 'Hari Raya Waisak 2570 BE' },
      { date: '2026-06-01', description: 'Hari Lahir Pancasila' },
      { date: '2026-06-16', description: 'Tahun Baru Islam 1448H' },
      { date: '2026-08-17', description: 'Proklamasi Kemerdekaan RI' },
      { date: '2026-08-25', description: 'Maulid Nabi Muhammad SAW' },
      { date: '2026-12-24', description: 'Cuti Bersama Hari Raya Natal' },
      { date: '2026-12-25', description: 'Hari Raya Natal' },
    ];
  }

  if (holidayCache[year]) return holidayCache[year];

  try {
    const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`, {
      next: { revalidate: 86400 }
    });
    const result = await res.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      holidayCache[year] = result.data;
      return result.data;
    }
  } catch (error) {
    console.error(`Failed to fetch holidays for ${year}:`, error);
  }

  return [];
}

/**
 * Calculates work days excluding Sundays and National Holidays
 */
export async function calculateTotalWorkDays(year: number, month: number): Promise<number> {
  const lastDay = new Date(year, month, 0).getDate();
  const holidays = await getNationalHolidays(year);
  
  let workDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const date = new Date(year, month - 1, d);
    
    // Exclude Sundays (day 0) and holidays found in the list
    if (date.getDay() !== 0 && !holidays.includes(dateStr)) {
      workDays++;
    }
  }

  return workDays;
}
