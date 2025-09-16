import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Memora Frontend',
  description: 'A modern Next.js application built with TypeScript and Tailwind CSS',
  keywords: ['Next.js', 'TypeScript', 'Tailwind CSS', 'React'],
  authors: [{ name: 'Memora Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  )
}