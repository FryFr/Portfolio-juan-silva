import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { FloatingWhatsApp } from '@/features/contact/ui/floating-whatsapp';
import { CursorProvider } from '@/features/cursor/context/cursor-provider';
import { siteConfig } from '@/shared/config/site';
import { routing } from '@/shared/i18n/routing';
import { Footer } from '@/shared/ui/footer';
import { JsonLd } from '@/shared/ui/json-ld';
import { Navbar } from '@/shared/ui/navbar';
import { ThemeProvider } from '@/shared/ui/theme-provider';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

type MetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
      },
    },
    openGraph: {
      type: 'profile',
      locale,
      url: `${siteConfig.url}/${locale}`,
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      firstName: 'Juan',
      lastName: 'Silva',
      username: siteConfig.author.handle,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
    },
    authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
    creator: siteConfig.author.name,
    other: { 'x-i18n-ns': String(t('siteTagline')) },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.url,
    jobTitle: siteConfig.author.jobTitle,
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.linkedin,
      siteConfig.social.youtube,
      siteConfig.social.tiktok,
      siteConfig.social.instagram,
    ],
  };

  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: siteConfig.name,
    url: `${siteConfig.url}/${locale}`,
    inLanguage: locale,
    about: personSchema,
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <CursorProvider>
              <Navbar locale={locale} />
              <div className="flex-1">{children}</div>
              <Footer />
              <FloatingWhatsApp />
            </CursorProvider>
          </NextIntlClientProvider>
          <JsonLd data={personSchema} />
          <JsonLd data={profilePageSchema} />
        </ThemeProvider>
      </body>
    </html>
  );
}
