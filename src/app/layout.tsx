import type { Metadata, Viewport } from 'next'
import './globals.css'
import { I18nProvider } from '@/contexts/I18nContext'
import AccountHUD from '@/components/AccountHUD'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'DoDoo Daily - A Tool for Children',
  description: 'DoDoo Daily. A tool to trace habits, emotions, and art for kids.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DoDoo Daily',
  },
  icons: {
    icon: '/dog.svg',
    shortcut: '/dog.svg',
    apple: '/dog.svg',
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
