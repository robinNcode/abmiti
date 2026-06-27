// src/core/utils/date.ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export function formatDate(date: string | Date, fmt = 'DD MMM YYYY'): string {
    return dayjs(date).format(fmt);
}

export function formatRelative(date: string | Date): string {
    return dayjs(date).fromNow();
}

export function formatMonth(month: number, year: number): string {
    return dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMMM YYYY');
}

export function currentMonth(): { month: number; year: number } {
    const now = dayjs();
    return { month: now.month() + 1, year: now.year() };
}
