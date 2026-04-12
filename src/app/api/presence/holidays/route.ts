import { NextResponse } from 'next/server';
import { getDetailedHolidays } from '@/lib/holidayUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const holidays = await getDetailedHolidays(year);

    return NextResponse.json({
      success: true,
      data: holidays.map(h => ({
        date: h.date,
        name: h.description
      }))
    });
  } catch (error) {
    console.error('Holiday API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
