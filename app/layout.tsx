import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Memora',
    template: '%s | Memora'
  },
  description: 'Your personal memory companion - capture, organize, and rediscover your most precious moments',
  keywords: ['memories', 'personal', 'journal', 'photos', 'moments', 'diary'],
  authors: [{ name: 'Memora Team' }],
  creator: 'Memora',
  metadataBase: new URL('https://memora.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://memora.app',
    title: 'Memora',
    description: 'Your personal memory companion - capture, organize, and rediscover your most precious moments',
    siteName: 'Memora',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memora',
    description: 'Your personal memory companion - capture, organize, and rediscover your most precious moments',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-background font-sans antialiased">
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1" role="main">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </main>
              <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="contentinfo">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                      © 2025 Memora. All rights reserved.
                    </p>
                    <nav className="flex items-center space-x-4" aria-label="Footer navigation">
                      <Link
                        href="/privacy"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                      >
                        Privacy
                      </Link>
                      <Link
                        href="/terms"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                      >
                        Terms
                      </Link>
                      <Link
                        href="/support"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
                      >
                        Support
                      </Link>
                    </nav>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}