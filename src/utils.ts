import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parse, differenceInSeconds } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDate(dateStr: string) {
  // Convert "2026/07/14 19:00:00 +0000" to "2026-07-14T19:00:00+0000"
  const safeDateStr = dateStr.replace(/\//g, '-').replace(' ', 'T').replace(' +', '+');
  return new Date(safeDateStr);
}

export function calculateEventStatus(dateStr: string) {
  const date = parseDate(dateStr);
  if (isNaN(date.getTime())) return 'upcoming';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours > 3) {
    return 'finished';
  } else if (diffInHours >= 0 && diffInHours <= 3) {
    return 'live';
  } else {
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return 'today';
    }
    return 'upcoming';
  }
}

export function formatMatchTime(dateStr: string) {
  const date = parseDate(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return format(date, 'MMM dd, yyyy • HH:mm OOOO');
}

export function getUptimeParts(dateStr: string) {
  const date = parseDate(dateStr);
  const now = new Date();
  const diff = differenceInSeconds(now, date);
  
  if (diff <= 0) {
    return { h: '00', m: '00', s: '00', totalM: '00' };
  }
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const totalM = Math.floor(diff / 60);
  
  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
    totalM: totalM.toString().padStart(2, '0')
  };
}

export function getCountdownParts(dateStr: string) {
  const date = parseDate(dateStr);
  const now = new Date();
  const diff = differenceInSeconds(date, now);
  
  if (diff <= 0) {
    return { h: '00', m: '00', s: '00' };
  }

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0')
  };
}
