import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicPropertyCard } from '@/components/public-property-card'
import { Logo } from '@/components/logo'
import { Home, Search, MapPin, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

export default async function PropertiesPage() {
  const supabase = await createClient()

  // Fetch all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  const propertyList = properties || []

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center gap-4 sm:gap-5 hover:opacity-80 transition-opacity">
              <div className="shimmer animate-pulse-glow">
                <Logo />
              </div>
              <div className="flex flex-col">
                <div className="luxury-heading text-xl sm:text-2xl md:text-3xl tracking-widest text-white">
                  LUXURY CONCIERGE
                </div>
                <div className="text-xs sm:text-sm tracking-[0.25em] text-white/80 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </Link>

            {/* Back to Home */}
            <Link href="/">
              <Button variant="outline" className="border-white/30 hover:bg-white/10 hover:border-white text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Hero */}
      <section className="relative py-20 sm:py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_70%)]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="badge-accent text-sm px-6 py-2 mb-6 animate-fade-in">
              <Home className="h-4 w-4 mr-2" />
              Property Collection
            </Badge>
            <h1 className="luxury-heading text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-widest mb-6 animate-reveal">
              ALL PROPERTIES
            </h1>
            <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
            <p className="text-white/70 text-xl sm:text-2xl tracking-wide max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Browse our exclusive collection of luxury properties
            </p>
          </div>

          {/* Property Count & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/30 backdrop-blur-sm">
                <Home className="h-5 w-5 mr-2" />
                {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                type="text"
                placeholder="Search by location, price..."
                className="pl-12 h-14 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {propertyList.length === 0 ? (
          <div className="glass-card-accent elevated-card p-20 text-center rounded-3xl">
            <div className="w-32 h-32 mx-auto mb-10 rounded-full bg-white/10 flex items-center justify-center">
              <Home className="h-16 w-16 text-white/60" />
            </div>
            <h3 className="luxury-heading text-4xl font-semibold text-white mb-6 tracking-[0.15em]">
              No Properties Available
            </h3>
            <p className="text-white/70 text-xl tracking-wide mb-8">
              Check back soon for new listings
            </p>
            <Link href="/">
              <Button className="btn-luxury h-14 px-10 text-base">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.map((property, index) => (
              <div
                key={property.id}
                className="animate-fade-in-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PublicPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="glass-card-accent elevated-card p-16 sm:p-20 text-center rounded-3xl">
          <h2 className="luxury-heading text-4xl sm:text-5xl font-bold text-white tracking-widest mb-6">
            DIDN'T FIND WHAT YOU'RE LOOKING FOR?
          </h2>
          <p className="text-white/80 text-xl tracking-wide max-w-2xl mx-auto mb-10">
            Contact us directly and let us help you find your perfect luxury property
          </p>
          <Link href="/#contact">
            <Button className="btn-luxury h-16 px-12 text-xl">
              <MapPin className="h-5 w-5 mr-3" />
              Contact Us
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black to-black"></div>
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Logo />
                <div>
                  <div className="luxury-heading text-xl tracking-widest text-white font-bold">
                    LUXURY CONCIERGE
                  </div>
                  <div className="text-white/60 text-xs tracking-wider uppercase mt-1">
                    Cadiz & Lluis
                  </div>
                </div>
              </div>
              <div className="text-white/50 text-sm">
                © {new Date().getFullYear()} Luxury Concierge. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
