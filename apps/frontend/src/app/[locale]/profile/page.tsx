'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema } from '@localshare/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, LogOut } from 'lucide-react';
import { useRouter, usePathname } from '@/navigation';

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser, logout } = useAuth();
  const t = useTranslations();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      homeAddress: '',
      phoneNumber: '',
      preferredLanguage: 'de',
    },
  });

  // Populate form when user data becomes available
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        homeAddress: user.homeAddress || '',
        phoneNumber: user.phoneNumber || '',
        preferredLanguage: user.preferredLanguage || 'de',
      });
    }
  }, [user, reset]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const previousLanguage = user?.preferredLanguage || 'de';

      await api.patch('/users/me', data);
      await fetchUser();

      // If language changed, navigate to new locale URL
      if (data.preferredLanguage && data.preferredLanguage !== previousLanguage) {
        // pathname from usePathname() excludes locale prefix, so we add the new locale
        const newPath = `/${data.preferredLanguage}${pathname}`;
        window.location.href = newPath;
      }

      toast({
        title: t('profile.profileUpdated'),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      toast({
        title: t('profile.accountDeleted'),
        variant: 'success',
      });
      await logout();
    } catch (error) {
      toast({
        title: t('errors.generic'),
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localshare-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: t('profile.dataExported'),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const preferredLanguage = watch('preferredLanguage');

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.title')}</CardTitle>
            <CardDescription>
              {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('profile.firstName')} *</Label>
                  <Input
                    id="firstName"
                    maxLength={50}
                    {...register('firstName')}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">{t('profile.lastName')} *</Label>
                  <Input
                    id="lastName"
                    maxLength={50}
                    {...register('lastName')}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="homeAddress">{t('profile.homeAddress')} *</Label>
                <Input
                  id="homeAddress"
                  {...register('homeAddress')}
                  className={errors.homeAddress ? 'border-destructive' : ''}
                />
                {errors.homeAddress && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.homeAddress.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">
                  {t('profile.phoneNumber')} ({t('common.optional')})
                </Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="+41791234567"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('profile.phoneHint')}
                </p>
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="preferredLanguage">
                  {t('profile.preferredLanguage')}
                </Label>
                <Select
                  value={preferredLanguage}
                  onValueChange={(value) => setValue('preferredLanguage', value)}
                >
                  <SelectTrigger id="preferredLanguage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('profile.languageHint')}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? t('common.loading') : t('profile.exportData')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('profile.accountManagement')}
            </CardTitle>
            <CardDescription>
              {t('profile.accountManagementDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Logout */}
              <div>
                <h3 className="text-sm font-medium mb-2">{t('profile.logoutSection')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('profile.logoutDescription')}
                </p>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </div>

              {/* Delete Account */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium mb-2 text-destructive">
                  {t('profile.deleteAccount')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('profile.deleteAccountWarning')}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('profile.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('profile.deleteAccount')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('profile.deleteAccountConfirm')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
