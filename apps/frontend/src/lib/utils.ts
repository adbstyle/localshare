import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ListingType } from '@localshare/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'de-CH'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Determines if a listing should display a price based on its type
 * Only SELL and RENT types have prices
 * @param type - The listing type
 * @returns true if price should be displayed (SELL or RENT), false otherwise
 */
export function shouldShowPrice(type: ListingType): boolean {
  return type === ListingType.SELL || type === ListingType.RENT;
}
