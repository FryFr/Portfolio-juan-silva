import { type RenderOptions, render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

type Locale = 'es' | 'en';

const messagesByLocale: Record<Locale, typeof esMessages> = {
  es: esMessages,
  en: enMessages,
};

type Options = Omit<RenderOptions, 'wrapper'> & { locale?: Locale };

export function renderWithIntl(ui: ReactElement, { locale = 'es', ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
