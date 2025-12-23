# 🎨 Frontend Implementation Guide

## ✅ What's Already Created

The frontend foundation has been set up with:

```
✅ Next.js 14 with App Router
✅ TypeScript configuration
✅ Tailwind CSS + shadcn/ui components (10 components)
✅ i18n configuration (German + French)
✅ API client with auth interceptors
✅ Shared types package with Zod schemas
✅ PWA-ready configuration
```

## 📋 Remaining Implementation Tasks

### 1. App Router Structure (Priority 1)

Create the following folder structure in `apps/frontend/src/app/[locale]/`:

```
apps/frontend/src/app/
├── [locale]/
│   ├── layout.tsx                    # Root layout with nav, footer, Beta badge
│   ├── page.tsx                      # Home/listings page
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx              # OAuth callback handler
│   ├── profile/
│   │   └── page.tsx                  # User profile page
│   ├── communities/
│   │   ├── page.tsx                  # List communities
│   │   ├── [id]/
│   │   │   └── page.tsx              # Community details
│   │   └── join/
│   │       └── page.tsx              # Join via invite link
│   ├── groups/
│   │   ├── page.tsx                  # List groups
│   │   ├── [id]/
│   │   │   └── page.tsx              # Group details
│   │   └── join/
│   │       └── page.tsx              # Join via invite link
│   ├── listings/
│   │   ├── [id]/
│   │   │   └── page.tsx              # Listing details
│   │   ├── create/
│   │   │   └── page.tsx              # Create listing
│   │   └── [id]/edit/
│   │       └── page.tsx              # Edit listing
│   ├── privacy/
│   │   └── page.tsx                  # Privacy policy
│   ├── terms/
│   │   └── page.tsx                  # Terms of service
│   └── imprint/
│       └── page.tsx                  # Imprint (Impressum)
```

### 2. Core Components (Priority 1)

#### Layout Components

**`apps/frontend/src/components/layout/header.tsx`**
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from '@/components/language-switch';
import { BetaBadge } from '@/components/beta-badge';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const t = useTranslations();
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t('common.appName')}</h1>
          <BetaBadge />
        </div>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/listings">{t('nav.listings')}</Link>
              <Link href="/communities">{t('nav.communities')}</Link>
              <Link href="/groups">{t('nav.groups')}</Link>
              <Link href="/profile">{t('nav.profile')}</Link>
              <Button variant="outline" onClick={logout}>{t('nav.logout')}</Button>
            </>
          ) : (
            <Button asChild><Link href="/auth/login">{t('auth.login')}</Link></Button>
          )}
          <LanguageSwitch />
        </nav>
      </div>
    </header>
  );
}
```

**`apps/frontend/src/components/layout/footer.tsx`**
```typescript
export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t mt-auto">
      <div className="container py-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.madeWith')} ❤️ {t('footer.in')} {t('footer.switzerland')}
          </p>
          <nav className="flex gap-4 text-sm">
            <Link href="/privacy">{t('legal.privacy')}</Link>
            <Link href="/terms">{t('legal.terms')}</Link>
            <Link href="/imprint">{t('legal.imprint')}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
```

**`apps/frontend/src/components/beta-badge.tsx`**
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function BetaBadge() {
  const t = useTranslations();
  const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'feedback@localshare.ch';

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {t('common.beta')}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.location.href = `mailto:${feedbackEmail}?subject=LocalShare Feedback`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('common.feedback')}
      </Button>
    </div>
  );
}
```

**`apps/frontend/src/components/language-switch.tsx`**
```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[80px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="de">DE</SelectItem>
        <SelectItem value="fr">FR</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### 3. Authentication Hook & Pages (Priority 1)

**`apps/frontend/src/hooks/use-auth.ts`**
```typescript
'use client';

import { create } from 'zustand';
import { api, handleApiError } from '@/lib/api';
import { User } from '@localshare/shared';
import { useEffect } from 'react';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  fetchUser: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch (error) {
      set({ user: null, loading: false });
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      set({ user: null });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
}));

export function useAuth() {
  const { user, loading, fetchUser, logout, setUser } = useAuthStore();

  useEffect(() => {
    if (!user && !loading) {
      fetchUser();
    }
  }, []);

  return { user, loading, fetchUser, logout, setUser };
}
```

**`apps/frontend/src/app/[locale]/page.tsx`** (Home - Login or Listings)
```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ListingsPage } from '@/components/listings/listings-page';
import { LoginPage } from '@/components/auth/login-page';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;
  return <ListingsPage />;
}
```

**`apps/frontend/src/components/auth/login-page.tsx`**
```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import Link from 'next/link';

export function LoginPage() {
  const t = useTranslations();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleLogin = (provider: 'google' | 'microsoft') => {
    if (!acceptedTerms) {
      alert(t('auth.mustAcceptTerms'));
      return;
    }
    window.location.href = `${apiUrl}/api/v1/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{t('auth.welcome')}</CardTitle>
          <CardDescription>{t('auth.welcomeText')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" size="lg" onClick={() => handleLogin('google')}>
            {t('auth.loginWith')} {t('auth.google')}
          </Button>
          <Button className="w-full" size="lg" variant="outline" onClick={() => handleLogin('microsoft')}>
            {t('auth.loginWith')} {t('auth.microsoft')}
          </Button>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(!!checked)} />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              {t('auth.acceptTerms')}{' '}
              <Link href="/terms" className="underline">{t('auth.termsOfService')}</Link>
              {' '}{t('auth.and')}{' '}
              <Link href="/privacy" className="underline">{t('auth.privacyPolicy')}</Link>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**`apps/frontend/src/app/[locale]/auth/callback/page.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      fetchUser().then(() => {
        router.push('/');
      });
    } else {
      router.push('/');
    }
  }, [searchParams, router, fetchUser]);

  return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
}
```

### 4. Communities Module (Priority 2)

Create the following files:

- `apps/frontend/src/components/communities/community-card.tsx` - Display community in list
- `apps/frontend/src/components/communities/community-list.tsx` - List all communities
- `apps/frontend/src/components/communities/community-form.tsx` - Create/edit form
- `apps/frontend/src/components/communities/community-details.tsx` - Full details view
- `apps/frontend/src/components/communities/delete-community-dialog.tsx` - Confirm deletion
- `apps/frontend/src/hooks/use-communities.ts` - API calls for communities

### 5. Groups Module (Priority 2)

Similar structure to communities:

- `apps/frontend/src/components/groups/group-card.tsx`
- `apps/frontend/src/components/groups/group-list.tsx`
- `apps/frontend/src/components/groups/group-form.tsx`
- `apps/frontend/src/components/groups/group-details.tsx`
- `apps/frontend/src/components/groups/delete-group-dialog.tsx`
- `apps/frontend/src/hooks/use-groups.ts`

### 6. Listings Module (Priority 2)

- `apps/frontend/src/components/listings/listing-card.tsx` - Display listing in grid
- `apps/frontend/src/components/listings/listing-list.tsx` - Grid of listings
- `apps/frontend/src/components/listings/listing-filters.tsx` - Filter UI
- `apps/frontend/src/components/listings/listing-form.tsx` - Create/edit form with image upload
- `apps/frontend/src/components/listings/listing-details.tsx` - Full listing view
- `apps/frontend/src/components/listings/image-upload.tsx` - Image upload component
- `apps/frontend/src/components/listings/contact-buttons.tsx` - Email, Signal, WhatsApp buttons
- `apps/frontend/src/hooks/use-listings.ts` - API calls for listings

**Image Upload Implementation:**

```typescript
// apps/frontend/src/components/listings/image-upload.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';

export function ImageUpload({ listingId, onUpload }: { listingId: string; onUpload: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 3));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      await api.post(`/listings/${listingId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Images uploaded successfully' });
      onUpload();
      setFiles([]);
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <Label htmlFor="image-upload" className="cursor-pointer">
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2">Upload up to 3 images (max 10MB each)</p>
        </div>
      </Label>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {files.map((file, idx) => (
            <div key={idx} className="relative">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-32 object-cover rounded" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      )}
    </div>
  );
}
```

**Contact Buttons Implementation:**

```typescript
// apps/frontend/src/components/listings/contact-buttons.tsx
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Phone } from 'lucide-react';

export function ContactButtons({ email, phoneNumber, title }: { email: string; phoneNumber?: string | null; title: string }) {
  const handleEmail = () => {
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(title)}`;
  };

  const handleSignal = () => {
    if (phoneNumber) {
      window.open(`https://signal.me/#p/${phoneNumber.replace(/[^+\d]/g, '')}`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (phoneNumber) {
      const phone = phoneNumber.replace(/[^\d]/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(title)}`, '_blank');
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleEmail}>
        <Mail className="h-4 w-4 mr-2" />
        Email
      </Button>
      {phoneNumber && (
        <>
          <Button variant="outline" onClick={handleSignal}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Signal
          </Button>
          <Button variant="outline" onClick={handleWhatsApp}>
            <Phone className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </>
      )}
    </div>
  );
}
```

### 7. Legal Pages (Priority 3)

**`apps/frontend/src/app/[locale]/privacy/page.tsx`**
```typescript
export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-4xl font-bold mb-6">Datenschutzerklärung</h1>
      <div className="prose prose-slate max-w-none">
        <h2>1. Datenerhebung</h2>
        <p>Wir erheben folgende Daten:</p>
        <ul>
          <li>E-Mail-Adresse, Vor- und Nachname (von Google/Microsoft SSO)</li>
          <li>Hausadresse (von Ihnen angegeben)</li>
          <li>Telefonnummer (optional)</li>
          <li>Inhalt Ihrer Anzeigen</li>
        </ul>

        <h2>2. Verwendung der Daten</h2>
        <p>Ihre Daten werden ausschliesslich zur Bereitstellung der App-Funktionalität verwendet...</p>

        <h2>3. SSO-Provider</h2>
        <p>Wir nutzen Google und Microsoft für die Authentifizierung...</p>

        <h2>4. Ihre Rechte</h2>
        <ul>
          <li>Recht auf Auskunft</li>
          <li>Recht auf Löschung (Account löschen in den Einstellungen)</li>
          <li>Recht auf Datenexport (DSGVO-Export)</li>
        </ul>

        <h2>5. Kontakt</h2>
        <p>Datenschutz-Anfragen: privacy@localshare.ch</p>
      </div>
    </div>
  );
}
```

Similar pages for `/terms` and `/imprint`.

### 8. PWA Configuration (Priority 3)

**`apps/frontend/public/manifest.json`**
```json
{
  "name": "LocalShare - Nachbarschaft teilen",
  "short_name": "LocalShare",
  "description": "Teilen Sie mit Ihrer Nachbarschaft",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**`apps/frontend/public/sw.js`** (Service Worker)
```javascript
const CACHE_NAME = 'localshare-v1';
const urlsToCache = [
  '/',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/offline');
      });
    })
  );
});
```

Add to `apps/frontend/src/app/[locale]/layout.tsx`:
```typescript
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3b82f6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### 9. Profile Page

**`apps/frontend/src/app/[locale]/profile/page.tsx`**
```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema } from '@localshare/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, fetchUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      homeAddress: user?.homeAddress || '',
      phoneNumber: user?.phoneNumber || '',
      preferredLanguage: user?.preferredLanguage || 'de',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.patch('/users/me', data);
      await fetchUser();
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure? This cannot be undone.')) {
      try {
        await api.delete('/users/me');
        window.location.href = '/';
      } catch (error) {
        toast({ title: 'Delete failed', variant: 'destructive' });
      }
    }
  };

  const handleExportData = async () => {
    try {
      const { data } = await api.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `localshare-data-${new Date().toISOString()}.json`;
      a.click();
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...form.register('firstName')} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...form.register('lastName')} />
            </div>
            <div>
              <Label htmlFor="homeAddress">Home Address</Label>
              <Input id="homeAddress" {...form.register('homeAddress')} />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number (E.164 format)</Label>
              <Input id="phoneNumber" {...form.register('phoneNumber')} placeholder="+41791234567" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>Save Changes</Button>
              <Button type="button" variant="outline" onClick={handleExportData}>
                Export Data (GDPR)
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t">
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
cd apps/frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Progress Tracking

### Core Infrastructure ✅
- [x] Next.js 14 setup
- [x] TypeScript configuration
- [x] Tailwind + shadcn/ui
- [x] i18n (de/fr)
- [x] API client
- [x] Shared types package

### Authentication & User
- [ ] Login page
- [ ] OAuth callback handler
- [ ] Profile page
- [ ] Auth hook (useAuth)
- [ ] Protected route wrapper

### Communities
- [ ] List communities
- [ ] Create community
- [ ] Community details
- [ ] Edit community
- [ ] Delete community
- [ ] Join via invite link
- [ ] Copy invite link
- [ ] Leave community

### Groups
- [ ] List groups
- [ ] Create group
- [ ] Group details
- [ ] Edit group
- [ ] Delete group
- [ ] Join via invite link
- [ ] Leave group

### Listings
- [ ] List/grid view
- [ ] Filters (type, category, search)
- [ ] Create listing
- [ ] Edit listing
- [ ] Delete listing
- [ ] Listing details
- [ ] Image upload (up to 3)
- [ ] Contact buttons (Email, Signal, WhatsApp)

### Legal & Misc
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Imprint page
- [ ] Beta badge + feedback button
- [ ] Language switcher
- [ ] PWA manifest
- [ ] Service worker
- [ ] Offline page

## 🎯 Implementation Priority

1. **Phase 1 (Critical)**: Auth, Profile, Layout
2. **Phase 2 (Core Features)**: Communities, Groups, Listings
3. **Phase 3 (Polish)**: Legal pages, PWA, Beta badge

## 📝 Notes

- All components should use `'use client'` directive for client-side interactivity
- Use `useTranslations()` hook for i18n in all components
- Follow Swiss design principles: clean, minimal, high contrast
- Ensure accessibility (WCAG 2.1 AA)
- Mobile-first responsive design (320px - 2560px)
- Use toast notifications for user feedback
- Implement proper error handling with try/catch
- Add loading states for all async operations

## 🔗 Useful Resources

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

**Total Estimated Files**: ~60-80 files
**Total Estimated Lines**: ~6,000-8,000 lines of code
**Estimated Implementation Time**: 2-3 weeks for one developer

The frontend foundation is solid. Follow this guide to complete the implementation systematically!
