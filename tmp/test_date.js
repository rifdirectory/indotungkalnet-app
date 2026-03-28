import { getJakartaNow } from './src/lib/dateUtils.js';
const now = getJakartaNow();
console.log('Jakarta Now:', now);
const [date, time] = now.split(' ');
console.log('Jakarta Date:', date);
console.log('Jakarta Time:', time);
