import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Luxury Concierge - Cadiz & Lluis',
  description: 'Luxury concierge services tailored to your every need. Unparalleled experiences and personalized care.',
  generator: 'Cadiz & Lluis',
  icons: {
    icon: [
      // Default favicon using provided black logo
      { url: '/logo/CL%20Balck%20LOGO%20.png', type: 'image/png' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/logo/CL%20Balck%20LOGO%20.png', type: 'image/png' },
    ],
    shortcut: ['/logo/CL%20Balck%20LOGO%20.png'],
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#000000' },
  ],
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
