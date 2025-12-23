import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <FileQuestion className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Seite nicht gefunden</h2>
        <p className="text-muted-foreground mb-8">
          Die Seite, nach der Sie suchen, existiert nicht oder wurde verschoben.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Zur Startseite</Button>
          </Link>
          <Link href="/listings">
            <Button variant="outline">Anzeigen ansehen</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
