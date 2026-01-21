import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Playa - Live Gaming Predictions',
  description: 'Real-time predictions for live 1v1 gaming streams powered by Solana',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon-dark.png',
    shortcut: '/favicon-dark.png',
    apple: '/favicon-dark.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Playa',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Providers>
          {children}
          <Toaster theme="dark" position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
