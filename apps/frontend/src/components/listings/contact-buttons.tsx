'use client';

import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ContactButtonsProps {
  email: string;
  phoneNumber?: string | null;
  title: string;
}

export function ContactButtons({ email, phoneNumber, title }: ContactButtonsProps) {
  const t = useTranslations();

  const handleEmail = () => {
    const subject = encodeURIComponent(`LocalShare: ${title}`);
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  const handleSignal = () => {
    if (!phoneNumber) return;
    // Signal deep link format: https://signal.me/#p/+41791234567
    const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
    window.open(`https://signal.me/#p/${cleanPhone}`, '_blank');
  };

  const handleWhatsApp = () => {
    if (!phoneNumber) return;
    // WhatsApp format: https://wa.me/41791234567?text=...
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    const text = encodeURIComponent(`Hi! I'm interested in: ${title}`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleEmail} className="w-full justify-start">
        <Mail className="h-4 w-4 mr-2" />
        {t('listings.email')}
      </Button>

      {phoneNumber && (
        <>
          <Button
            variant="outline"
            onClick={handleSignal}
            className="w-full justify-start"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Signal
          </Button>

          <Button
            variant="outline"
            onClick={handleWhatsApp}
            className="w-full justify-start"
          >
            <Phone className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </>
      )}
    </div>
  );
}
