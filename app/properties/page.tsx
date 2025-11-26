import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublicPropertyCard } from '@/components/public-property-card'
import { PublicHeader } from '@/components/public-header'
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
      {/* Header with Navigation */}
      <PublicHeader />

      {/* Page Hero - Matching Home Page Style */}
      <section className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden py-12 sm:py-16 md:py-0">
        {/* Multiple Layer Backgrounds for Depth */}
        <div className="absolute inset-0">
          {/* Layer 1: Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-background to-secondary"></div>

          {/* Layer 2: Large hero image with parallax */}
          <div className="absolute inset-0 opacity-30" style={{ transform: 'translateZ(0)' }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80')] bg-cover bg-center animate-gradient-shift bg-[length:120%]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>

          {/* Layer 3: Animated light rays */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-white/20 to-transparent animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-white/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-0 left-3/4 w-1 h-full bg-gradient-to-b from-white/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Layer 4: Radial gradients */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <Badge className="badge-accent text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 mb-4 sm:mb-6 animate-fade-in">
            <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Property Collection
          </Badge>
          <h1 className="luxury-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 animate-reveal leading-tight" style={{
            animationDelay: '400ms',
            textShadow: '0 0 80px rgba(255,255,255,0.1)'
          }}>
            ALL PROPERTIES
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="h-px w-10 sm:w-12 md:w-16 bg-gradient-to-r from-transparent to-white/50"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/80"></div>
            <div className="h-px w-10 sm:w-12 md:w-16 bg-gradient-to-l from-transparent to-white/50"></div>
          </div>

          <p className="text-white/80 text-sm sm:text-base md:text-xl lg:text-2xl tracking-wide max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-light animate-fade-in px-4" style={{ animationDelay: '700ms' }}>
            Browse our exclusive collection of luxury properties
          </p>

          {/* Property Count & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <Badge variant="outline" className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 bg-white/10 border-white/30 backdrop-blur-sm">
              <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
            </Badge>

            {/* Search Bar */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/50" />
              <Input
                type="text"
                placeholder="Search by location, price..."
                className="pl-10 sm:pl-12 h-10 sm:h-12 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/50 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
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
