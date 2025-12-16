import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicPropertyCard } from '@/components/public-property-card'
import { ContactForm } from '@/components/contact-form'
import { Logo } from '@/components/logo'
import { PublicHeader } from '@/components/public-header'
import { Home, Shield, Clock, Award, CheckCircle2, Users, Mail, Phone, MapPin as MapPinIcon, Sparkles, TrendingUp, Heart, Key, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
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

      {/* Epic Hero Section with Parallax */}
      <section className="relative min-h-[50vh] sm:min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden py-12 sm:py-16 md:py-0">
        {/* Multiple Layer Backgrounds for Depth */}
        <div className="absolute inset-0">
          {/* Layer 1: Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-background to-secondary"></div>

          {/* Layer 2: Large hero image with parallax */}
          <div className="absolute inset-0 opacity-30" style={{ transform: 'translateZ(0)' }}>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80')] bg-cover bg-center animate-gradient-shift bg-[length:120%]"></div>
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
            <div className="absolute top-1/2 left-1/2 w-32 h-32 sm:w-64 sm:h-64 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Layer 5: Animated particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${6 + Math.random() * 4}s`,
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Main Heading */}
          <h1 className="luxury-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 md:mb-8 animate-reveal leading-tight px-4" style={{
            animationDelay: '400ms',
            textShadow: '0 0 80px rgba(255,255,255,0.1)'
          }}>
            LUXURY<br />
            <span className="text-white/95">LIVING</span>
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="h-px w-10 sm:w-12 md:w-16 bg-gradient-to-r from-transparent to-white/50"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/80"></div>
            <div className="h-px w-10 sm:w-12 md:w-16 bg-gradient-to-l from-transparent to-white/50"></div>
          </div>

          {/* Subtitle */}
          <p className="text-white/80 text-base sm:text-lg md:text-2xl lg:text-3xl tracking-wide max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 leading-relaxed font-light animate-fade-in px-6 sm:px-4" style={{ animationDelay: '700ms' }}>
            Explore our handpicked selection of properties in your criteria
          </p>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <Badge className="badge-accent text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2 mb-4 sm:mb-6">Featured Properties</Badge>
          <h2 className="luxury-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-widest mb-4 sm:mb-6 px-4">
            EXCEPTIONAL PROPERTIES
          </h2>
          <div className="h-0.5 sm:h-1 w-24 sm:w-32 mx-auto divider-accent mb-6 sm:mb-8"></div>
          <p className="text-white/70 text-base sm:text-lg md:text-xl tracking-wide max-w-3xl mx-auto px-4">
            Explore our handpicked selection of premium properties, each offering unparalleled luxury and sophistication
          </p>
        </div>

        {propertyList.length === 0 ? (
          <Card className="glass-card-accent elevated-card p-8 sm:p-12 md:p-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-10 rounded-full bg-white/10 flex items-center justify-center">
                <Home className="h-12 w-12 sm:h-16 sm:w-16 text-white/60" />
              </div>
              <h3 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 sm:mb-6 tracking-[0.15em]">
                Coming Soon
              </h3>
              <p className="text-white/70 text-base sm:text-lg md:text-xl tracking-wide">
                Our exclusive collection is being curated. Check back soon for extraordinary properties.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 sm:gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.slice(0, 6).map((property, index) => (
              <div key={property.id} className="animate-fade-in-scale" style={{ animationDelay: `${index * 100}ms` }}>
                <PublicPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

        {propertyList.length > 6 && (
          <div className="text-center mt-12 sm:mt-16">
            <Link href="/properties">
              <Button className="btn-luxury h-12 sm:h-14 md:h-16 px-8 sm:px-10 md:px-12 text-base sm:text-lg md:text-xl">
                View All Properties
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Enhanced Footer */}
      <footer className="relative mt-20 sm:mt-24 md:mt-32 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent_50%)]"></div>

        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
            {/* Main Footer Content */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-14 md:mb-16">
              {/* Brand Section - Takes more space */}
              <div className="sm:col-span-2 lg:col-span-5">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="shimmer animate-pulse-glow">
                    <Logo />
                  </div>
                  <div>
                    <h3 className="luxury-heading text-lg sm:text-xl md:text-2xl tracking-[0.2em] text-white font-bold">
                      LUXURY LIVING
                    </h3>
                    <p className="text-white/60 text-[10px] sm:text-xs tracking-[0.15em] uppercase mt-1">
                      Cadiz & Lluis
                    </p>
                  </div>
                </div>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-md">
                  Your trusted partner in premium property management, delivering exceptional service and exclusive access to the finest properties.
                </p>

                {/* Contact Info Cards */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <a href="tel:+18186424050" className="text-xs sm:text-sm break-all">
                      +1 (818) 642-4050
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <a href="mailto:brody@cadizlluis.com" className="text-xs sm:text-sm break-all">
                      brody@cadizlluis.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-bold mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">Properties</h4>
                <ul className="space-y-3">
                  {['Featured', 'New Listings', 'Luxury Homes', 'Contact Manager'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors"></span>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-bold mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">Company</h4>
                <ul className="space-y-3">
                  {['About Us', 'Our Services', 'Testimonials', 'How It Works'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors"></span>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Section */}
              <div className="sm:col-span-2 lg:col-span-3">
                <h4 className="text-white font-bold mb-4 sm:mb-6 uppercase tracking-wider text-xs sm:text-sm">Get In Touch</h4>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Ready to find your perfect luxury property? Contact us today.
                </p>
                <Button className="btn-luxury h-11 sm:h-12 px-6 sm:px-8 text-xs sm:text-sm w-full">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8 sm:mb-10"></div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 md:gap-8 text-white/50 text-xs sm:text-sm text-center">
                <span>© {new Date().getFullYear()} Luxury Living</span>
                <span className="hidden md:inline">•</span>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <span className="hidden md:inline">•</span>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Powered by Excellence</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
