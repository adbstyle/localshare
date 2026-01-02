import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ListingType, PriceTimeUnit } from '@localshare/shared';

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

export function formatPrice(
  price: number,
  priceTimeUnit?: PriceTimeUnit | null,
  t?: (key: string) => string
): string {
  const formattedPrice = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

  // If priceTimeUnit exists and translation function provided, append time unit
  if (priceTimeUnit && t) {
    const timeUnitText = t(`listings.timeUnits.${priceTimeUnit}`);
    return `${formattedPrice} ${timeUnitText}`;
  }

  return formattedPrice;
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

/**
 * Formats a date as relative time (e.g., "vor 2 Tagen") for dates within 30 days,
 * otherwise returns absolute date format
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'de-CH')
 * @returns Formatted date string (relative or absolute)
 */
export function formatRelativeDate(
  date: string | Date,
  locale: string = 'de-CH'
): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // Handle future dates (defensive programming for timezone edge cases)
  if (diffInSeconds < 0) {
    return formatDate(date, locale);
  }

  // For dates older than 30 days: return absolute date
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  if (diffInSeconds > THIRTY_DAYS) {
    return formatDate(date, locale);
  }

  // Calculate relative time using Intl.RelativeTimeFormat
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });

  if (diffInSeconds < 60) {
    return rtf.format(-Math.floor(diffInSeconds), 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
}
