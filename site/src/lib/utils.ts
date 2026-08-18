import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并 Tailwind 类名（与扩展侧 cn 同实现）
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
