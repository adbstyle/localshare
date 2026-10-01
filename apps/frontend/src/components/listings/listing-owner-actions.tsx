'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Edit, MoreVertical, Trash2 } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { useDeleteListing } from '@/lib/api/listings';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Edit and delete for the listing's owner: buttons on desktop, a menu on mobile. */
export function ListingOwnerActions({ listingId }: { listingId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();
  const deleteListing = useDeleteListing(listingId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editHref = `/listings/${listingId}/edit`;

  const handleDelete = () =>
    deleteListing.mutate(undefined, {
      onSuccess: () => {
        toast({ variant: 'success', title: t('listings.deleted') });
        router.push('/');
      },
      onError: (error) => {
        setConfirmOpen(false);
        showError(error, 'errors.unexpectedError');
      },
    });

  return (
    <div className="absolute top-0 right-0 z-10">
      <div className="hidden md:flex gap-2">
        <Link href={editHref}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        </Link>
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t('common.delete')}
        </Button>
      </div>

      <div className="md:hidden">
        {/* modal=false: the menu must release focus to the confirm dialog it opens */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="py-3">
              <Link href={editHref} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setConfirmOpen(true)}
              className="cursor-pointer text-destructive focus:text-destructive py-3"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('listings.deleteConfirm')}
        description={t('common.actionCannotBeUndone')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        pending={deleteListing.isPending}
      />
    </div>
  );
}
