export const getJakartaNow = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  // 'en-CA' is used as it consistently produces YYYY-MM-DD format
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(new Date());
  
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};

export const formatToJakartaDate = (date: string | Date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat with a specific locale and options to be more deterministic
  // but even better, just format it manually to avoid SSR mismatch
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  };
  
  // Get parts specifically for Jakarta
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(d);
  const find = (type: string) => parts.find(p => p.type === type)?.value;
  
  const day = find('day');
  const monthIdx = parseInt(find('month') || '1') - 1;
  const year = find('year');
  
  return `${day} ${months[monthIdx]} ${year}`;
};

export const formatToJakartaDateTime = (date: string | Date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const dateStr = formatToJakartaDate(d);
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(d);
  const find = (type: string) => parts.find(p => p.type === type)?.value;
  
  return `${dateStr} ${find('hour')}:${find('minute')}`;
};
