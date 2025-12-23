'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function BetaBadge() {
  const t = useTranslations();
  const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || 'feedback@localshare.ch';

  const handleFeedback = () => {
    window.location.href = `mailto:${feedbackEmail}?subject=LocalShare Feedback`;
  };

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {t('common.beta')}
      </span>
      <Button variant="ghost" size="sm" onClick={handleFeedback}>
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('common.feedback')}
      </Button>
    </div>
  );
}
