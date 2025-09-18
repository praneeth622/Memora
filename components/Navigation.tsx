'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Home, 
  Info, 
  Sparkles, 
  LayoutDashboard,
  Menu,
  X,
  Brain
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

const Navigation = () => {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/features', label: 'Features', icon: Sparkles },
    { href: '/about', label: 'About', icon: Info }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link
              href="/"
              className="flex items-center space-x-2 transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md p-1"
              aria-label="Memora - Go to homepage"
            >
              <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold tracking-tight">Memora</span>
            </Link>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`flex items-center space-x-2 transition-all ${
                      isActive(item.href) 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    {/* <IconComponent className="h-4 w-4" /> */}
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4 space-y-2 animate-in slide-in-from-top-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.href) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start space-x-2 ${
                      isActive(item.href) 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation