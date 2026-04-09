import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { I18nProvider } from '@/components/i18n-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { Locale } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Search Checker — Is Your Website AI-Ready?',
  description:
    'Analyze 13 key factors that determine how AI search engines discover, understand, and cite your website. Free instant analysis.',
  keywords: ['AI Search', 'SEO', 'GEO', 'Schema.org', 'AI Readiness', 'LLMO', 'AI Visibility'],
  authors: [{ name: 'OhmAI' }],
  creator: 'OhmAI',
  publisher: 'OhmAI',
  robots: 'index, follow',
  metadataBase: new URL('https://aicheck.ohmai.me'),
  openGraph: {
    type: 'website',
    title: 'AI Search Checker — Is Your Website AI-Ready?',
    description:
      'Analyze 13 key factors that determine how AI search engines discover, understand, and cite your website.',
    siteName: 'AI Search Checker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Search Checker',
    description:
      'Analyze 13 key factors for AI search readiness. Free instant analysis.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f8fc',
};

const websiteSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AI Search Checker',
  url: 'https://aicheck.ohmai.me',
  description:
    'Analyze 13 key factors that determine how AI search engines discover, understand, and cite your website.',
  publisher: {
    '@type': 'Organization',
    name: 'OhmAI',
    url: 'https://ohmai.me',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://aicheck.ohmai.me/?url={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OhmAI',
  url: 'https://ohmai.me',
  description: 'AI solutions for business — chatbots, AI search optimization, and more.',
};

const faqSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is AI Search Checker?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AI Search Checker analyzes 13 key factors that determine how AI search engines like ChatGPT, Perplexity, and Google AI Overview discover and cite your website.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AI Visibility Check work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The AI Visibility Check uses GPT-4.1 nano to determine whether AI systems recognize your website or organization, providing a real-world test of your AI search presence.',
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): Promise<React.ReactElement> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;
  const initialLocale: Locale = cookieLocale === 'th' ? 'th' : 'en';

  return (
    <html lang={initialLocale}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Anuphan:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-frost-50 font-sans bg-grid">
        <I18nProvider initialLocale={initialLocale}>
          <LanguageSwitcher />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
