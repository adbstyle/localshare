'use client';

import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Listing } from '@localshare/shared';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactButtons } from './contact-buttons';

interface ListingContactCardProps {
  listing: Listing;
  isOwner: boolean;
}

/** Sidebar: the creator's contact details, or for the owner what others will see. */
export function ListingContactCard({ listing, isOwner }: ListingContactCardProps) {
  const t = useTranslations();

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>{isOwner ? t('listings.yourListing') : t('listings.contact')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isOwner && listing.creator ? (
          <CreatorContact creator={listing.creator} title={listing.title} />
        ) : (
          <OwnContactPreview />
        )}
      </CardContent>
    </Card>
  );
}

function CreatorContact({ creator, title }: { creator: NonNullable<Listing['creator']>; title: string }) {
  const t = useTranslations('listings');

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{t('author')}</p>
        <p className="font-semibold">
          {creator.firstName} {creator.lastName}
        </p>
      </div>

      {creator.homeAddress && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t('address')}</p>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm">{creator.homeAddress}</p>
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <p className="text-sm font-semibold mb-3">{t('contactVia')}</p>
        <ContactButtons email={creator.email} phoneNumber={creator.phoneNumber} title={title} />
      </div>
    </>
  );
}

function OwnContactPreview() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="text-sm text-muted-foreground">
      <p>{t('listings.yourListingDescription')}</p>
      <div className="mt-4 pt-4 border-t">
        <p className="font-semibold mb-2">{t('listings.visibleToOthers')}:</p>
        <ul className="space-y-1 text-xs">
          <li>• {t('listings.email')}: {user?.email}</li>
          <li>• {t('listings.address')}: {user?.homeAddress || t('profile.noAddress')}</li>
          {user?.phoneNumber && <li>• {t('listings.phone')}: {user.phoneNumber}</li>}
        </ul>
      </div>
    </div>
  );
}
