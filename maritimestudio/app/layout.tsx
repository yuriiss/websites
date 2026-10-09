import type { Metadata, Viewport } from 'next';
import { Fraunces, JetBrains_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { Effects } from '@/components/Effects';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { IconSprite } from '@/components/Icon';
import { LiquidTransition } from '@/components/LiquidTransition';
import { SmoothScroll } from '@/components/SmoothScroll';
import { CALM_BOOT_SCRIPT } from '@/lib/motion';
import { OG_IMAGE, SITE_URL } from '@/lib/site';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Maritime.Studio — Maritime EdTech & Digital Solutions',
  description:
    'Custom LMS platforms, VR/AR safety simulators, cybersecurity training, web development and consulting built for the global maritime industry.',
  openGraph: { type: 'website', siteName: 'Maritime.Studio', locale: 'en_GB', images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', site: '@MaritimeStudio' },
  manifest: '/manifest.json',
};

export const viewport: Viewport = { themeColor: '#061C2C', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: CALM_BOOT_SCRIPT }} />
      </head>
      <body>
        <IconSprite />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <LiquidTransition />
        <SmoothScroll />
        <Effects />
      </body>
    </html>
  );
}
