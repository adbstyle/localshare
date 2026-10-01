'use client';

import { useTranslations } from 'next-intl';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getPageNumbers } from '@/lib/utils/pagination';

interface ListingsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function ListingsPagination({ page, pageSize, total, onPageChange }: ListingsPaginationProps) {
  const t = useTranslations('common');
  const totalPages = Math.ceil(total / pageSize);

  const go = (target: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (target >= 1 && target <= totalPages && target !== page) onPageChange(target);
  };
  const disabledClass = (disabled: boolean) => (disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer');

  return (
    <div className="mt-8">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              previousText={t('previous')}
              href="#"
              onClick={go(page - 1)}
              className={disabledClass(page <= 1)}
            />
          </PaginationItem>
          {getPageNumbers(page, totalPages).map((item, idx) => (
            <PaginationItem key={idx}>
              {item === 'ellipsis' ? (
                <PaginationEllipsis srText={t('morePages')} />
              ) : (
                <PaginationLink href="#" onClick={go(item)} isActive={item === page} className="cursor-pointer">
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              nextText={t('next')}
              href="#"
              onClick={go(page + 1)}
              className={disabledClass(page >= totalPages)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="text-center mt-4 text-sm text-muted-foreground">
        {t('showingResults', {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
          total,
        })}
      </div>
    </div>
  );
}
