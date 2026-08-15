import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并 Tailwind class，冲突时以后者为准
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
