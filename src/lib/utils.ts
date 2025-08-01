import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const multiFormatDateString = (dateString: string): string => {
  const date = new Date(dateString);

  // Menggunakan date-fns untuk format "time ago"
  return formatDistanceToNow(date, {
    addSuffix: true,
  });
};
