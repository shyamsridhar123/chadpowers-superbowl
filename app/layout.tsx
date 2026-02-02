import React from "react"
import type { Metadata, Viewport } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Chad Powers Football',
  description: 'Browser-based 3D football game - Super Bowl Edition',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a1628',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0a1628]">
      <body className={`font-sans antialiased overflow-hidden touch-none`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
