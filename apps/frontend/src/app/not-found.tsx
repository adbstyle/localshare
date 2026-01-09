import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import de from '../../messages/de.json';

const t = de.pages.notFound;

export default function NotFound() {
  return (
    <html lang="de">
      <body className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FileQuestion className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">{t.title}</h2>
          <p className="text-muted-foreground mb-8">
            {t.description}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/de">
              <Button>{t.backHome}</Button>
            </Link>
            <Link href="/de/listings">
              <Button variant="outline">{t.viewListings}</Button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
