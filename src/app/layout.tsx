import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Our Forever Journey',
  description: 'A personal journey made just for you.',
  // Do not index — this is a private app
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Our Forever Journey',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7A2038',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
      </head>
      <body className="antialiased min-h-dvh bg-cream">
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}
