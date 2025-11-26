'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { Menu, X, Home, Building2, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function PublicHeader() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Properties', href: '/properties', icon: Building2 },
  ]

  return (
    <>
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Spacer for mobile to center logo */}
            <div className="w-9 md:hidden" />

            {/* Logo and Brand - Centered */}
            <Link href="/" className="flex items-center gap-3 sm:gap-4 md:gap-5 hover:opacity-90 transition-opacity">
              <div className="shimmer">
                <Logo />
              </div>
              <div className="flex flex-col">
                <div className="luxury-heading text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-widest text-white">
                  LUXURY LIVING
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm tracking-[0.25em] text-white/80 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm uppercase tracking-wider transition-colors hover:text-white",
                    pathname === item.href ? "text-white font-semibold" : "text-white/70"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Burger Menu Button - Mobile Only (Right Side) */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost"
              size="sm"
              className="md:hidden border-white/30 hover:bg-white/10 text-white p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-72 bg-black/95 backdrop-blur-md border-r border-white/10 z-50 shadow-2xl animate-slide-in-left">
            <div className="flex flex-col h-full">
              {/* Logo/Brand Section */}
              <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/30 shadow-md">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="luxury-heading text-xl font-bold tracking-[0.15em] text-white">Menu</h2>
                    <p className="text-xs text-white/60 tracking-wide">Navigation</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                        "hover:bg-white/10 hover:border-white/20 hover:shadow-md",
                        "group relative overflow-hidden",
                        isActive
                          ? "bg-white/15 border border-white/40 shadow-lg"
                          : "border border-transparent"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-white to-white/70" />
                      )}
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "text-white" : "text-white/70 group-hover:text-white"
                      )} />
                      <span className={cn(
                        "text-sm font-medium tracking-wide uppercase transition-all duration-300",
                        isActive ? "text-white" : "text-white/70 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>

              {/* Contact Section */}
              <div className="p-4 border-t border-white/10 space-y-3 flex-shrink-0">
                <h3 className="text-xs text-white/50 uppercase tracking-wider px-4 mb-2">Contact</h3>
                <a
                  href="tel:+18186424050"
                  className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">+1 (818) 642-4050</span>
                </a>
                <a
                  href="mailto:diego@comcreate.org"
                  className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">diego@comcreate.org</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
