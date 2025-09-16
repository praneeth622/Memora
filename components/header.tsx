'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Brain } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-2 transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-1"
              aria-label="Memora - Go to homepage"
            >
              <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold tracking-tight">Memora</span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Dashboard
            </Link>
            <Link
              href="/memories"
              className="text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Memories
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Settings
            </Link>
          </nav>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Mobile Menu Button - Hidden for now, can be expanded later */}
            <div className="md:hidden">
              {/* Mobile menu button would go here */}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}