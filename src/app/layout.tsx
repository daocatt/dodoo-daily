import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/contexts/I18nContext'
import AccountHUD from '@/components/AccountHUD'
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
  } catch (error) {
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
      icon: '/dog.svg',
      shortcut: '/dog.svg',
      apple: '/dog.svg',
    }
  }
}

export const viewport: Viewport = {
  themeColor: '#e0f2fe',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AccountHUD />
          {children}
        </I18nProvider>

        {/* Force SW registration and log info for debugging */}
        <Script id="pwa-init" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('PWA: ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
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
