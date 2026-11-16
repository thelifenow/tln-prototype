import type { ISODate } from '../types';

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const today = (): ISODate => toISODate(new Date());

export function addDays(iso: ISODate, days: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Next date (from today) whose month/day is given; used for "by March 1". */
export function nextMonthDay(month: number, day: number): ISODate {
  const now = new Date();
  let dt = new Date(now.getFullYear(), month - 1, day);
  if (dt < now) dt = new Date(now.getFullYear() + 1, month - 1, day);
  return toISODate(dt);
}

export function prettyDate(iso?: ISODate): string {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function prettyDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Sabbath: Friday sundown (18:00) to Saturday sundown (18:00), simulated. */
export function isSabbath(d = new Date()): boolean {
  const day = d.getDay();
  const h = d.getHours();
  return (day === 5 && h >= 18) || (day === 6 && h < 18);
}
