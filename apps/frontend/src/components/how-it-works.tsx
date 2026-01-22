'use client';

import { useTranslations } from 'next-intl';
import { Users, Camera, Search, HeartHandshake } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const steps = [
  { key: 'join', Icon: Users },
  { key: 'offer', Icon: Camera },
  { key: 'find', Icon: Search },
  { key: 'arrange', Icon: HeartHandshake },
] as const;

const faqKeys = ['payment', 'visibility', 'app', 'access', 'offers'] as const;

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <>
      {/* So funktioniert's Section - Light Background */}
      <div className="w-full bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            {t('title')}
          </h2>

          {/* 4-Step Flow */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-primary">{index + 1}.</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t(`steps.${step.key}.title`)}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t(`steps.${step.key}.text`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gut zu wissen Section - Colored Background */}
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('faq.title')}
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {faqKeys.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-left">
                  {t(`faq.${key}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-400">
                  {t(`faq.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
}
