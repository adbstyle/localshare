'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Step = {
  key: 'join' | 'offer' | 'find' | 'arrange';
  illustration: string;
  illustrationAlt: string;
};

const steps: Step[] = [
  {
    key: 'join',
    illustration: '/images/how-it-works/step-1-community.jpg',
    illustrationAlt: 'Nachbarschaft von oben mit Menschen die winken',
  },
  {
    key: 'offer',
    illustration: '/images/how-it-works/step-2-create-listing.jpg',
    illustrationAlt: 'Person am Marktstand mit Laptop und Gegenständen',
  },
  {
    key: 'find',
    illustration: '/images/how-it-works/step-3-search.jpg',
    illustrationAlt: 'Person am Laptop mit Such-Elementen',
  },
  {
    key: 'arrange',
    illustration: '/images/how-it-works/step-4-exchange.jpg',
    illustrationAlt: 'Zwei Personen tauschen Paket vor Häusern',
  },
];

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

          {/* 4-Step Flow with Illustrations */}
          <div className="space-y-8 lg:space-y-16">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={`flex flex-col lg:flex-row gap-8 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Illustration Side */}
                <div className="w-full lg:w-1/2">
                  <img
                    src={step.illustration}
                    alt={step.illustrationAlt}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full max-w-sm lg:max-w-md mx-auto rounded-2xl"
                  />
                </div>

                {/* Text Side */}
                <div className="w-full lg:w-1/2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="text-primary">{index + 1}.</span>
                    {t(`steps.${step.key}.title`)}
                  </h3>
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
