'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Listing } from '@localshare/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactButtons } from '@/components/listings/contact-buttons';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, formatDate, shouldShowPrice } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, MapPin, Calendar, Tag, Share2 } from 'lucide-react';
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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const { data } = await api.get<Listing>(`/listings/${params.id}`);
      setListing(data);
    } catch (error) {
      toast({
        title: t('errors.notFound'),
        description: 'Listing not found',
        variant: 'destructive',
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0">
              {images.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div className="relative h-96 bg-muted">
                    <Image
                      src={`${apiUrl}${images[selectedImageIndex].url}`}
                      alt={listing.title}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 p-4">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                        >
                          <Image
                            src={`${apiUrl}${image.url}`}
                            alt={`${listing.title} - ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground">No images</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listing Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{t(`listings.types.${listing.type}`)}</Badge>
                    <Badge variant="outline">{t(`listings.categories.${listing.category}`)}</Badge>
                  </div>
                  <CardTitle className="text-3xl mb-2">{listing.title}</CardTitle>
                  {listing.price !== null && shouldShowPrice(listing.type) && (
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(listing.price, listing.priceTimeUnit, t)}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Link href={`/listings/${listing.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('listings.deleteConfirm')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
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
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(listing.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t(`listings.categories.${listing.category}`)}
                  </span>
                </div>
              </div>

              {/* Shared With */}
              {listing.visibility && listing.visibility.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{t('listings.sharedWith')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {listing.visibility.map((vis, index) => (
                      <Badge key={index} variant="secondary">
                        {vis.community?.name || vis.group?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Contact Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>{isOwner ? 'Your Listing' : t('listings.contact')}</CardTitle>
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
                  <p>This is your listing. Other users will see your contact information here.</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold mb-2">Visible to others:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Email: {user?.email}</li>
                      <li>• Address: {user?.homeAddress}</li>
                      {user?.phoneNumber && <li>• Phone: {user.phoneNumber}</li>}
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
