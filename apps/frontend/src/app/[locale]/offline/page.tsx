'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <WifiOff className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Sie sind offline</h1>
        <p className="text-muted-foreground mb-6">
          Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.
        </p>
        <Button onClick={() => window.location.reload()}>
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}
