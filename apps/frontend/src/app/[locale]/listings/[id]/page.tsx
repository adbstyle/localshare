'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Listing } from '@localshare/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactButtons } from '@/components/listings/contact-buttons';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, formatRelativeDate, shouldShowPrice } from '@/lib/utils';
import { Edit, Trash2, MapPin, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getImageUrl = (url: string) => {
    // R2 URLs are already absolute
    if (url.startsWith('http')) return url;
    // Local uploads need API URL prefix
    return `${apiUrl}${url}`;
  };

  const fetchListing = useCallback(async () => {
    try {
      const { data } = await api.get<Listing>(`/listings/${params.id}`);
      setListing(data);
    } catch (error) {
      toast({
        title: t('errors.notFound'),
        description: t('listings.notFoundDescription'),
        variant: 'destructive',
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [params.id, toast, t, router]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleDelete = async () => {
    try {
      await api.delete(`/listings/${params.id}`);
      toast({
        variant: 'success',
        title: t('listings.deleted'),
      });
      router.push('/');
    } catch (error) {
      toast({
        title: t('errors.generic'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const isOwner = user?.id === listing.creatorId;
  const images = listing.images || [];

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <article>
            <Card>
              <CardHeader>
                <div className="relative">
                  <div>
                    {/* LEVEL 1: Type & Category */}
                    <div className="flex items-center gap-2 mb-6" role="group" aria-label="Listing type and category">
                      <Badge variant="secondary" className="text-sm">
                        {t(`listings.types.${listing.type}`)}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        {t(`listings.categories.${listing.category}`)}
                      </Badge>
                    </div>

                    {/* LEVEL 2: Title */}
                    <h1 className="text-3xl font-bold leading-tight mb-4 break-words">
                      {listing.title}
                    </h1>

                    {/* LEVEL 3: Price (muted, not primary) */}
                    {listing.price !== null && shouldShowPrice(listing.type) && (
                      <p
                        className="text-xl font-semibold text-muted-foreground mb-6"
                        aria-label={`Preis: ${formatPrice(listing.price, listing.priceTimeUnit, t)}`}
                      >
                        {formatPrice(listing.price, listing.priceTimeUnit, t)}
                      </p>
                    )}
                  </div>

                  {/* Edit/Delete buttons (owner only) */}
                  {isOwner && (
                    <div className="absolute top-0 right-0 z-10">
                      {/* Desktop: Direct buttons */}
                      <div className="hidden md:flex gap-2">
                        <Link href={`/listings/${listing.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            {t('common.edit')}
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('common.delete')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('listings.deleteConfirm')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('common.actionCannotBeUndone')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Mobile: Dropdown menu */}
                      <div className="md:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-5 w-5" />
                              <span className="sr-only">{t('common.actions')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild className="py-3">
                              <Link href={`/listings/${listing.id}/edit`} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </Link>
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="cursor-pointer text-destructive focus:text-destructive py-3"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('listings.deleteConfirm')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('common.actionCannotBeUndone')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                                    {t('common.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* LEVEL 4: Images - CONDITIONAL (only if exists) */}
                {images.length > 0 && (
                  <figure aria-label="Produktbilder">
                    {/* Main Image */}
                    <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={getImageUrl(images[selectedImageIndex].url)}
                        alt={`${listing.title} - Ansicht ${selectedImageIndex + 1} von ${images.length}`}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                        {images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImageIndex === index
                                ? 'border-primary'
                                : 'border-transparent'
                            }`}
                            aria-label={`Bild ${index + 1} von ${images.length} anzeigen`}
                          >
                            <Image
                              src={getImageUrl(image.url)}
                              alt={`${listing.title} - Vorschau ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </figure>
                )}

                {/* LEVEL 5: Description */}
                {listing.description && (
                  <section aria-label={t('listings.description')}>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {listing.description}
                    </p>
                  </section>
                )}

                {/* LEVEL 6 & 7: Metadata */}
                <dl className="space-y-4">
                  {/* LEVEL 6: Creation Date (relative time) */}
                  <div className="text-sm text-muted-foreground pt-4 border-t">
                    <dt className="inline">{t('listings.createdAt')}: </dt>
                    <dd className="inline">
                      <time dateTime={listing.createdAt}>
                        {formatRelativeDate(listing.createdAt, locale)}
                      </time>
                    </dd>
                  </div>

                  {/* LEVEL 7: Shared With */}
                  {listing.visibility && listing.visibility.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <dt className="inline">{t('listings.sharedWith')}: </dt>
                      <dd className="inline">
                        {listing.visibility.map((vis, index) => (
                          <span key={index}>
                            {vis.community?.name || vis.group?.name}
                            {index < listing.visibility.length - 1 && ', '}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </article>
        </div>

        {/* Sidebar - Contact Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>{isOwner ? t('listings.yourListing') : t('listings.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOwner && listing.creator ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('listings.author')}</p>
                    <p className="font-semibold">
                      {listing.creator.firstName} {listing.creator.lastName}
                    </p>
                  </div>

                  {listing.creator.homeAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('listings.address')}</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm">{listing.creator.homeAddress}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">{t('listings.contactVia')}</p>
                    <ContactButtons
                      email={listing.creator.email}
                      phoneNumber={listing.creator.phoneNumber}
                      title={listing.title}
                    />
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>{t('listings.yourListingDescription')}</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold mb-2">{t('listings.visibleToOthers')}:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• {t('listings.email')}: {user?.email}</li>
                      <li>• {t('listings.address')}: {user?.homeAddress}</li>
                      {user?.phoneNumber && <li>• {t('listings.phone')}: {user.phoneNumber}</li>}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
