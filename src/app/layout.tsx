import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/contexts/I18nContext'
import Script from 'next/script'
import { db } from '@/lib/db'
import { systemSettings } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function generateMetadata(): Promise<Metadata> {
  let systemName = 'DoDoo Daily'
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
    if (settings?.systemName) {
      systemName = settings.systemName
    }
  } catch (_error) {
    console.error('Failed to fetch system name for metadata:', error)
  }

  return {
    title: `${systemName} - Tools for Family Daily`,
    description: `${systemName}. Trace habits, emotions, and art for family.`,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: systemName,
    },
    icons: {
      icon: '/fav.png',
      shortcut: '/fav.png',
      apple: '/fav.png',
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#C8C9C4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let defaultLocale = 'en'
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'app_settings')).get()
    if (settings?.defaultLocale) {
      defaultLocale = settings.defaultLocale
    }
  } catch (_error) {
    console.error('Failed to fetch default locale:', error)
  }

  return (
    <html lang={defaultLocale === 'zh-CN' ? 'zh' : 'en'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <I18nProvider defaultLocale={defaultLocale as 'en' | 'zh-CN'}>
          {children}
        </I18nProvider>

        {/* Force SW registration and log info for debugging */}
        <Script id="pwa-init" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                // Prevent SW in development to avoid refresh loops
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                   console.log('PWA: Skipping ServiceWorker in dev mode');
                   return;
                }
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('PWA: ServiceWorker registration successful with scope: ', registration.scope);
                }, function(_err) {
                  console.log('PWA: ServiceWorker registration failed: ', err);
                });
              });
            }
            // Check manifest
            fetch('/manifest.json').then(r => r.json()).then(m => console.log('PWA: Manifest loaded', m)).catch(e => console.error('PWA: Manifest fetch error', e));
          `}
        </Script>
      </body>
    </html>
  )
}
