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
