# LocalShare Frontend

Next.js 14 Progressive Web App for neighborhood sharing.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with backend API URL

# Start development server
npm run dev
# Open http://localhost:3000
```

## 📊 Implementation Status

**Overall**: 50% Complete

### ✅ Completed (50%)
- Project setup with Next.js 14 App Router
- TypeScript configuration
- Tailwind CSS + shadcn/ui design system
- i18n (German/French) with next-intl
- Authentication (Login page, OAuth callback)
- Profile page (view/edit/delete/export)
- Listings page (grid view with filters)
- Legal pages (Privacy, Terms, Imprint)
- PWA configuration (manifest + service worker)
- Layout (Header, Footer, Beta badge)

### 🚧 Remaining (50%)
- Listings detail page
- Listings create/edit pages with image upload
- Communities module (list, detail, create, edit, join, leave)
- Groups module (list, detail, create, edit, join, leave)
- Contact buttons (Email, Signal, WhatsApp)
- Error boundaries and 404 page
- Loading skeletons
- Responsive testing

See [FRONTEND_IMPLEMENTATION_GUIDE.md](../../FRONTEND_IMPLEMENTATION_GUIDE.md) for detailed implementation plan.

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl
- **API**: Axios with interceptors
- **State**: Global state pattern (see use-auth.ts)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   └── [locale]/          # Locale-based routing
│       ├── layout.tsx     # Locale layout with i18n
│       ├── page.tsx       # Home (login or listings)
│       ├── auth/
│       │   └── callback/  # OAuth callback
│       ├── profile/       # User profile
│       ├── privacy/       # Privacy policy
│       ├── terms/         # Terms of service
│       ├── imprint/       # Imprint
│       └── offline/       # PWA offline page
│
├── components/
│   ├── ui/                # shadcn/ui components (12)
│   ├── layout/            # Header, Footer
│   ├── auth/              # Login page
│   └── listings/          # Listing components
│
├── lib/
│   ├── api.ts             # Axios client with auth
│   └── utils.ts           # Utilities (cn, formatDate, formatPrice)
│
├── hooks/
│   ├── use-auth.ts        # Global auth state
│   └── use-toast.ts       # Toast notifications
│
└── i18n.ts                # i18n configuration

messages/
├── de.json                # German translations
└── fr.json                # French translations

public/
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── icons/                 # App icons (need to add)
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check
```

## 🌐 i18n (Internationalization)

### Supported Languages
- German (de) - Default
- French (fr)

### Usage in Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations();

  return <h1>{t('common.appName')}</h1>;
}
```

### Adding New Translations

Edit `messages/de.json` and `messages/fr.json`:

```json
{
  "myFeature": {
    "title": "My Title",
    "description": "My description"
  }
}
```

## 🎨 Using UI Components

### Import from shadcn/ui

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Available Components
- Button (variants: default, outline, destructive, ghost, link)
- Input, Textarea, Label
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Checkbox
- Select, SelectTrigger, SelectContent, SelectItem
- Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
- AlertDialog (for confirmations)
- Toast (for notifications)
- Badge

## 🔐 Authentication

### Using the Auth Hook

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Pages

The `useAuth` hook automatically redirects unauthenticated users.
Just use it in your page component:

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function ProtectedPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Or redirect in useEffect
  }

  return <div>Protected content</div>;
}
```

## 📡 API Calls

### Using the API Client

```typescript
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useMyFeature() {
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data } = await api.get('/my-endpoint');
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  return { fetchData };
}
```

The API client automatically:
- Adds auth token to requests
- Refreshes token when expired
- Redirects to login on 401

## 📱 PWA Features

### Manifest
- `/manifest.json` - App metadata and icons
- Installable on iOS, Android, Desktop
- Standalone display mode

### Service Worker
- `/sw.js` - Caches assets for offline use
- Network-first strategy
- Offline fallback page at `/offline`

### Testing PWA

1. Build production version: `npm run build && npm start`
2. Open Chrome DevTools → Application
3. Check "Manifest" and "Service Workers"
4. Test "Add to Home Screen"

## 🎯 Next Steps for Developers

### Priority 1: Complete Listings Module
1. Create listing detail page (`/listings/[id]/page.tsx`)
   - Display full info, images, contact buttons
2. Create listing form (`/listings/create/page.tsx`)
   - Multi-step or single form
   - Image upload with preview
   - Visibility selector
3. Create image upload component
4. Create contact buttons (Email, Signal, WhatsApp)

### Priority 2: Communities Module
1. Communities list (`/communities/page.tsx`)
2. Community detail (`/communities/[id]/page.tsx`)
3. Create/edit dialogs
4. Join via invite page (`/communities/join/page.tsx`)
5. useCommunities hook

### Priority 3: Groups Module
(Similar to Communities)

See [FRONTEND_IMPLEMENTATION_GUIDE.md](../../FRONTEND_IMPLEMENTATION_GUIDE.md) for complete details.

## 🐛 Common Issues

### "Module not found" errors
```bash
npm install
npm run dev
```

### i18n not working
Check that middleware.ts is correctly configured and locale is in URL.

### API calls failing
1. Check backend is running on port 3001
2. Check NEXT_PUBLIC_API_URL in .env
3. Check CORS settings in backend

### Styles not applying
1. Restart dev server
2. Check Tailwind config
3. Verify className syntax

## 📚 Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [next-intl](https://next-intl-docs.vercel.app/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

## 🤝 Contributing

1. Follow existing code patterns
2. Use TypeScript strict mode
3. Add translations for all user-facing text
4. Test on mobile and desktop
5. Follow accessibility guidelines

---

**Frontend Status**: 50% Complete | [See Full Implementation Guide](../../FRONTEND_IMPLEMENTATION_GUIDE.md)
