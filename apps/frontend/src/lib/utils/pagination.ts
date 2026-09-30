export type PageItem = number | 'ellipsis';

/** Page numbers to render: all pages up to 7, otherwise first, last and the current neighbourhood. */
export function getPageNumbers(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageItem[] = [1];
  if (page > 3) pages.push('ellipsis');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}
