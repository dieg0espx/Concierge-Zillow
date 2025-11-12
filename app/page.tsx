import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PublicPropertyCard } from '@/components/public-property-card'
import { ContactForm } from '@/components/contact-form'
import { Logo } from '@/components/logo'
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
      {/* Enhanced Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-center">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shimmer">
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
            </div>
          </div>
        </div>
      </header>

      {/* Epic Hero Section with Parallax */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 sm:py-0">
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
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
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
          {/* Badge */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Badge className="badge-accent text-sm px-8 py-3 inline-flex items-center gap-2 shadow-2xl">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold tracking-wider">PREMIUM PROPERTY COLLECTION</span>
            </Badge>
          </div>

          {/* Main Heading */}
          <h1 className="luxury-heading text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-8 animate-reveal leading-tight" style={{
            animationDelay: '400ms',
            textShadow: '0 0 80px rgba(255,255,255,0.1)'
          }}>
            LUXURY<br />
            <span className="text-white/95">LIVING</span>
          </h1>

          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-10 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/50"></div>
            <div className="w-2 h-2 rounded-full bg-white/80"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/50"></div>
          </div>

          {/* Subtitle */}
          <p className="text-white/80 text-base sm:text-xl md:text-2xl lg:text-3xl tracking-wide max-w-4xl mx-auto mb-12 sm:mb-16 leading-relaxed font-light animate-fade-in px-4" style={{ animationDelay: '700ms' }}>
            Discover Extraordinary Properties That Redefine Excellence
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 mb-12 sm:mb-20 animate-slide-up px-4 w-full max-w-2xl mx-auto" style={{ animationDelay: '900ms' }}>
            <Link href="/properties" className="w-full sm:w-auto">
              <Button className="btn-luxury h-14 sm:h-16 px-8 sm:px-14 text-base sm:text-lg group shadow-2xl w-full">
                <Home className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                Explore Collection
              </Button>
            </Link>
            <Button variant="outline" className="h-14 sm:h-16 px-8 sm:px-14 text-base sm:text-lg border-white/20 hover:bg-white/10 hover:border-white/40 text-white backdrop-blur-sm w-full sm:w-auto">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              Schedule Viewing
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-8 animate-fade-in px-4" style={{ animationDelay: '1.1s' }}>
            {[
              { value: `${propertyList.length}+`, label: 'Premium Properties', icon: Home },
              { value: '500+', label: 'Happy Clients', icon: Users },
              { value: '10+', label: 'Years Experience', icon: Award }
            ].map((stat, i) => (
              <div key={i} className="relative group flex-1 min-w-[150px] sm:min-w-[200px]">
                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl group-hover:bg-white/10 transition-all duration-500"></div>
                <div className="relative glass-card-accent px-4 sm:px-6 md:px-10 py-4 sm:py-6 rounded-2xl border border-white/20 group-hover:border-white/40 transition-all duration-300">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-2xl sm:text-3xl font-bold text-white luxury-heading truncate">{stat.value}</div>
                      <div className="text-white/60 text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">{stat.label}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-in-left">
            <Badge className="badge-accent text-sm px-6 py-2">Experience Luxury</Badge>
            <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest">
              YOUR DREAM HOME AWAITS
            </h2>
            <p className="text-white/80 text-xl leading-relaxed tracking-wide">
              Step into a world of refined elegance where every detail has been meticulously crafted to exceed your expectations. Our properties represent the pinnacle of luxury living.
            </p>
            <ul className="space-y-4">
              {[
                'Hand-picked premium locations',
                'State-of-the-art amenities',
                'Concierge services available',
                '24/7 property management'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-white/90 text-lg">
                  <CheckCircle2 className="h-6 w-6 text-white flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button className="btn-luxury h-16 px-12 text-xl">
              Schedule Viewing
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
          <div className="relative animate-slide-in-right">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden elevated-card group">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"
                alt="Luxury interior"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>
            {/* Floating stats */}
            <div className="absolute -bottom-8 -right-8 glass-card-accent p-8 rounded-2xl animate-float">
              <div className="flex items-center gap-4">
                <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                <div>
                  <div className="text-3xl font-bold text-white">4.9/5</div>
                  <div className="text-white/70 text-sm">Client Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-20">
          <Badge className="badge-accent text-sm px-6 py-2 mb-6">Featured Properties</Badge>
          <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
            EXCEPTIONAL PROPERTIES
          </h2>
          <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
          <p className="text-white/70 text-xl tracking-wide max-w-3xl mx-auto">
            Explore our handpicked selection of premium properties, each offering unparalleled luxury and sophistication
          </p>
        </div>

        {propertyList.length === 0 ? (
          <Card className="glass-card-accent elevated-card p-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto mb-10 rounded-full bg-white/10 flex items-center justify-center">
                <Home className="h-16 w-16 text-white/60" />
              </div>
              <h3 className="luxury-heading text-4xl font-semibold text-white mb-6 tracking-[0.15em]">
                Coming Soon
              </h3>
              <p className="text-white/70 text-xl tracking-wide">
                Our exclusive collection is being curated. Check back soon for extraordinary properties.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {propertyList.slice(0, 6).map((property, index) => (
              <div key={property.id} className="animate-fade-in-scale" style={{ animationDelay: `${index * 100}ms` }}>
                <PublicPropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

        {propertyList.length > 6 && (
          <div className="text-center mt-16">
            <Link href="/properties">
              <Button className="btn-luxury h-16 px-12 text-xl">
                View All Properties
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Expanded Gallery - More Photos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-20">
          <Badge className="badge-accent text-sm px-6 py-2 mb-6">Visual Showcase</Badge>
          <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
            LUXURY IN EVERY DETAIL
          </h2>
          <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
          <p className="text-white/70 text-xl tracking-wide max-w-3xl mx-auto">
            Immerse yourself in the elegance and sophistication that defines our properties
          </p>
        </div>

        {/* Large Featured Image */}
        <div className="relative overflow-hidden rounded-3xl mb-8 group cursor-pointer h-[600px] elevated-card">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80')] bg-cover bg-center transform group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="absolute bottom-12 left-12 right-12">
            <Badge className="badge-accent mb-4">Signature Collection</Badge>
            <h3 className="text-white font-bold text-5xl mb-4 tracking-wide">Modern Masterpiece</h3>
            <p className="text-white/90 text-xl max-w-2xl">Experience architectural excellence in this stunning contemporary residence</p>
          </div>
        </div>

        {/* Gallery Grid - Many More Photos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            { url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80', title: 'Infinity Pool', desc: 'Resort-style luxury' },
            { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', title: 'Outdoor Terrace', desc: 'Breathtaking views' },
            { url: 'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&q=80', title: 'Gourmet Kitchen', desc: 'Chef-grade appliances' },
            { url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80', title: 'Spa Bathroom', desc: 'Marble & stone' },
            { url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80', title: 'Master Suite', desc: 'Private sanctuary' },
            { url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80', title: 'Wine Cellar', desc: 'Climate controlled' },
            { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', title: 'Walk-in Closet', desc: 'Designer wardrobe' },
            { url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80', title: 'Home Theater', desc: 'Cinema experience' },
            { url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80', title: 'Fitness Center', desc: 'Private gym' },
            { url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80', title: 'Home Office', desc: 'Executive workspace' },
            { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', title: 'Grand Entrance', desc: 'Impressive foyer' },
            { url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', title: 'Elegant Living', desc: 'Designer interiors' },
          ].map((item, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl group cursor-pointer h-72 elevated-card animate-fade-in-scale"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transform group-hover:scale-125 transition-transform duration-700"
                style={{ backgroundImage: `url('${item.url}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
              <div className="absolute bottom-6 left-6 right-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-bold text-xl mb-2 tracking-wide">{item.title}</h3>
                <p className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Amenities Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-20">
          <Badge className="badge-accent text-sm px-6 py-2 mb-6">Premium Features</Badge>
          <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
            WORLD-CLASS AMENITIES
          </h2>
          <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
          <p className="text-white/70 text-xl tracking-wide max-w-3xl mx-auto">
            Every property features exceptional amenities designed to elevate your lifestyle
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Secure & Private', desc: '24/7 security systems with gated access and surveillance for complete peace of mind' },
            { icon: Sparkles, title: 'Premium Finishes', desc: 'High-end materials, designer fixtures, and meticulous attention to every detail' },
            { icon: Key, title: 'Smart Home', desc: 'Integrated technology and home automation for seamless control and convenience' },
            { icon: Heart, title: 'Wellness Focus', desc: 'Private spa facilities, state-of-the-art gyms, and dedicated meditation spaces' },
            { icon: Users, title: 'Concierge Service', desc: 'Dedicated staff available to assist with all your needs and requests' },
            { icon: Award, title: 'Award Winning', desc: 'Architecturally distinguished properties recognized for design excellence' }
          ].map((item, i) => (
            <div
              key={i}
              className="glass-card-accent elevated-card p-8 group animate-fade-in-scale hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{item.title}</h3>
                  <p className="text-white/70 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Redesigned Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background with gradient and pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>

          <div className="relative glass-card-accent elevated-card p-12 sm:p-16">
            {/* Section Header */}
            <div className="text-center mb-16">
              <Badge className="badge-accent text-sm px-6 py-2 mb-6">Our Track Record</Badge>
              <h2 className="luxury-heading text-4xl sm:text-5xl font-bold text-white tracking-widest">
                PROVEN EXCELLENCE
              </h2>
              <div className="h-1 w-24 mx-auto divider-accent mt-6"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  value: '10+',
                  label: 'Years Experience',
                  icon: Award,
                  description: 'Trusted expertise in luxury properties',
                  gradient: 'from-amber-500/20 to-yellow-500/20'
                },
                {
                  value: `${propertyList.length}+`,
                  label: 'Premium Properties',
                  icon: Home,
                  description: 'Exclusive collection of finest homes',
                  gradient: 'from-blue-500/20 to-cyan-500/20'
                },
                {
                  value: '500+',
                  label: 'Satisfied Clients',
                  icon: Users,
                  description: 'Happy families in their dream homes',
                  gradient: 'from-purple-500/20 to-pink-500/20'
                },
                {
                  value: '24/7',
                  label: 'Support Available',
                  icon: Clock,
                  description: 'Always here when you need us',
                  gradient: 'from-emerald-500/20 to-teal-500/20'
                }
              ].map((stat, i) => (
                <div
                  key={i}
                  className="relative group animate-fade-in-scale hover:scale-105 transition-all duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Card Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  {/* Card Content */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full flex flex-col items-center text-center group-hover:border-white/30 transition-all duration-300">
                    {/* Icon */}
                    <div className="mb-6 relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                        <stat.icon className="h-10 w-10 text-white" />
                      </div>
                      {/* Decorative dot */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                    </div>

                    {/* Value */}
                    <div className="text-5xl sm:text-6xl font-bold text-white mb-2 luxury-heading tracking-wider">
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-white font-semibold text-lg uppercase tracking-widest mb-3">
                      {stat.label}
                    </div>

                    {/* Divider */}
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/50 to-transparent mb-4"></div>

                    {/* Description */}
                    <p className="text-white/60 text-sm leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative animate-slide-in-left">
            <div className="aspect-square rounded-3xl overflow-hidden elevated-card">
              <img
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80"
                alt="Luxury property"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-3xl overflow-hidden elevated-card border-4 border-background">
              <img
                src="https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&q=80"
                alt="Interior detail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-8 animate-slide-in-right">
            <Badge className="badge-accent text-sm px-6 py-2">About Luxury Concierge</Badge>
            <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest">
              YOUR TRUSTED PARTNER
            </h2>
            <div className="h-1 w-24 divider-accent"></div>
            <p className="text-white/90 text-xl leading-relaxed tracking-wide">
              At Luxury Concierge, we specialize in connecting discerning clients with exceptional rental properties. Our commitment to excellence and personalized service ensures that every property in our portfolio meets the highest standards of quality and luxury.
            </p>
            <p className="text-white/80 text-lg leading-relaxed tracking-wide">
              Founded by Cadiz & Lluis, our mission is to redefine the rental experience by offering curated properties and unparalleled customer service. We believe that finding the perfect home should be an enjoyable and seamless experience.
            </p>
            <ul className="space-y-4">
              {[
                'Personalized property matching',
                'Transparent pricing and terms',
                'Professional photography and staging',
                'Dedicated support team'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-white/90 text-lg">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-20">
          <Badge className="badge-accent text-sm px-6 py-2 mb-6">Why Choose Us</Badge>
          <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
            UNMATCHED EXCELLENCE
          </h2>
          <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
          <p className="text-white/70 text-xl tracking-wide max-w-3xl mx-auto">
            Experience the difference with our premium property management services and dedicated team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'Verified Properties',
              desc: 'Every property is thoroughly vetted and verified to ensure authenticity and quality standards. We personally inspect each listing.',
              stats: '100% Verified'
            },
            {
              icon: Clock,
              title: '24/7 Support',
              desc: 'Our dedicated team is available around the clock to assist with any questions or concerns. Never worry about being alone.',
              stats: 'Always Available'
            },
            {
              icon: Award,
              title: 'Premium Service',
              desc: 'White-glove service tailored to meet the unique needs of each client and property. Your satisfaction is our priority.',
              stats: '4.9/5 Rating'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card-accent elevated-card p-10 text-center group animate-fade-in-scale"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-pulse-glow">
                <feature.icon className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 tracking-wide">{feature.title}</h3>
              <p className="text-white/80 text-lg leading-relaxed tracking-wide mb-6">{feature.desc}</p>
              <Badge className="badge-accent">{feature.stats}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="luxury-heading text-4xl sm:text-5xl font-bold text-white tracking-widest mb-6">
            HOW IT WORKS
          </h2>
          <div className="h-1 w-24 mx-auto divider-accent"></div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: 1, title: 'Browse Properties', icon: Home },
            { step: 2, title: 'Contact Manager', icon: Phone },
            { step: 3, title: 'Schedule Visit', icon: Key },
            { step: 4, title: 'Move In', icon: CheckCircle2 }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <item.icon className="h-10 w-10 text-white" />
              </div>
              <div className="text-white/60 text-sm mb-2 tracking-wide">STEP {item.step}</div>
              <h3 className="text-xl font-semibold text-white tracking-wide">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <Badge className="badge-accent text-sm px-6 py-2 mb-6">Client Testimonials</Badge>
            <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
              WHAT OUR CLIENTS SAY
            </h2>
            <div className="h-1 w-32 mx-auto divider-accent mb-8"></div>
            <p className="text-white/70 text-xl tracking-wide max-w-3xl mx-auto">
              Discover why our clients trust us with their luxury property needs
            </p>
          </div>
        </div>

        {/* Gradient overlays for fade effect on sides - Full width */}
        <div
          className="absolute left-0 top-0 bottom-0 w-64 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 20%, transparent 100%)'
          }}
        ></div>
        <div
          className="absolute right-0 top-0 bottom-0 w-64 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 20%, transparent 100%)'
          }}
        ></div>

        {/* Auto-scrolling testimonials container */}
        <div className="relative space-y-8 max-w-7xl mx-auto overflow-hidden">

          {/* First Row - Scrolling Left to Right */}
          <div className="flex gap-8 animate-scroll-testimonials hover:pause-animation">
            {/* First set of testimonials */}
            {[
              {
                name: 'Sarah Martinez',
                role: 'Miami Beach Resident',
                text: 'Working with Luxury Concierge was an absolute pleasure. They found us the perfect property that exceeded all our expectations.',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
              },
              {
                name: 'James Wilson',
                role: 'Property Investor',
                text: 'The professionalism and expertise of Cadiz and Lluis made our property search effortless. They understood exactly what we were looking for.',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
              },
              {
                name: 'Emily Chen',
                role: 'Business Executive',
                text: 'From the first contact to move-in day, everything was seamless. The team\'s dedication to finding us the perfect luxury home was evident.',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
              },
              {
                name: 'Michael Rodriguez',
                role: 'Tech Entrepreneur',
                text: 'Exceptional service from start to finish. The attention to detail and personalized approach made all the difference in finding our dream home.',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
              },
              {
                name: 'Lisa Thompson',
                role: 'Fashion Designer',
                text: 'I cannot recommend Luxury Concierge highly enough. Their team went above and beyond to ensure we found the perfect property for our family.',
                image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80'
              },
              {
                name: 'David Park',
                role: 'Financial Advisor',
                text: 'Outstanding experience working with this team. Their market knowledge and dedication to client satisfaction is truly world-class.',
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
              },
              {
                name: 'Amanda Foster',
                role: 'Interior Designer',
                text: 'The most professional and caring property team I\'ve ever worked with. They made the entire process smooth and enjoyable.',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
              },
              {
                name: 'Robert Chen',
                role: 'Surgeon',
                text: 'Finding luxury properties can be challenging, but Luxury Concierge made it effortless. Truly a five-star experience from beginning to end.',
                image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
              }
            ].concat([
              {
                name: 'Sarah Martinez',
                role: 'Miami Beach Resident',
                text: 'Working with Luxury Concierge was an absolute pleasure. They found us the perfect property that exceeded all our expectations.',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
              },
              {
                name: 'James Wilson',
                role: 'Property Investor',
                text: 'The professionalism and expertise of Cadiz and Lluis made our property search effortless. They understood exactly what we were looking for.',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
              },
              {
                name: 'Emily Chen',
                role: 'Business Executive',
                text: 'From the first contact to move-in day, everything was seamless. The team\'s dedication to finding us the perfect luxury home was evident.',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80'
              },
              {
                name: 'Michael Rodriguez',
                role: 'Tech Entrepreneur',
                text: 'Exceptional service from start to finish. The attention to detail and personalized approach made all the difference in finding our dream home.',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
              },
              {
                name: 'Lisa Thompson',
                role: 'Fashion Designer',
                text: 'I cannot recommend Luxury Concierge highly enough. Their team went above and beyond to ensure we found the perfect property for our family.',
                image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80'
              },
              {
                name: 'David Park',
                role: 'Financial Advisor',
                text: 'Outstanding experience working with this team. Their market knowledge and dedication to client satisfaction is truly world-class.',
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
              },
              {
                name: 'Amanda Foster',
                role: 'Interior Designer',
                text: 'The most professional and caring property team I\'ve ever worked with. They made the entire process smooth and enjoyable.',
                image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
              },
              {
                name: 'Robert Chen',
                role: 'Surgeon',
                text: 'Finding luxury properties can be challenging, but Luxury Concierge made it effortless. Truly a five-star experience from beginning to end.',
                image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
              }
            ]).map((testimonial, i) => (
              <div
                key={i}
                className="glass-card-accent elevated-card p-8 flex-shrink-0 w-[350px] h-[300px] flex flex-col"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90 text-base leading-relaxed mb-4 italic flex-1 line-clamp-4">
                    "{testimonial.text}"
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/10 mt-auto">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-base tracking-wide truncate">{testimonial.name}</div>
                    <div className="text-white/60 text-sm truncate">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row - Scrolling Right to Left (opposite direction) */}
          <div className="flex gap-8 animate-scroll-testimonials-reverse hover:pause-animation">
            {[
              {
                name: 'Victoria Adams',
                role: 'Art Curator',
                text: 'An extraordinary experience from beginning to end. Their curated selection of properties is truly unmatched in the luxury market.',
                image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80'
              },
              {
                name: 'Thomas Bennett',
                role: 'Architect',
                text: 'Working with true professionals who understand luxury real estate. They helped us find a property that perfectly matched our vision.',
                image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
              },
              {
                name: 'Sophia Martinez',
                role: 'Restaurateur',
                text: 'The level of service and attention to detail exceeded all expectations. A seamless journey to finding our dream property.',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
              },
              {
                name: 'Alexander Kim',
                role: 'Investment Banker',
                text: 'Impeccable service and market expertise. They made what could have been a stressful process incredibly smooth and enjoyable.',
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
              },
              {
                name: 'Isabella Rossi',
                role: 'Fashion Executive',
                text: 'Outstanding professionalism and a genuine commitment to finding the perfect property. Highly recommend their services.',
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80'
              },
              {
                name: 'Daniel Cooper',
                role: 'Private Equity',
                text: 'Their knowledge of the luxury market is exceptional. Found us exactly what we were looking for in record time.',
                image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80'
              }
            ].concat([
              {
                name: 'Victoria Adams',
                role: 'Art Curator',
                text: 'An extraordinary experience from beginning to end. Their curated selection of properties is truly unmatched in the luxury market.',
                image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80'
              },
              {
                name: 'Thomas Bennett',
                role: 'Architect',
                text: 'Working with true professionals who understand luxury real estate. They helped us find a property that perfectly matched our vision.',
                image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'
              },
              {
                name: 'Sophia Martinez',
                role: 'Restaurateur',
                text: 'The level of service and attention to detail exceeded all expectations. A seamless journey to finding our dream property.',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
              },
              {
                name: 'Alexander Kim',
                role: 'Investment Banker',
                text: 'Impeccable service and market expertise. They made what could have been a stressful process incredibly smooth and enjoyable.',
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
              },
              {
                name: 'Isabella Rossi',
                role: 'Fashion Executive',
                text: 'Outstanding professionalism and a genuine commitment to finding the perfect property. Highly recommend their services.',
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80'
              },
              {
                name: 'Daniel Cooper',
                role: 'Private Equity',
                text: 'Their knowledge of the luxury market is exceptional. Found us exactly what we were looking for in record time.',
                image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80'
              }
            ]).map((testimonial, i) => (
              <div
                key={i}
                className="glass-card-accent elevated-card p-8 flex-shrink-0 w-[350px] h-[300px] flex flex-col"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-white/90 text-base leading-relaxed mb-4 italic flex-1 line-clamp-4">
                    "{testimonial.text}"
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/10 mt-auto">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-base tracking-wide truncate">{testimonial.name}</div>
                    <div className="text-white/60 text-sm truncate">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Contact Info */}
          <div className="space-y-8 animate-slide-in-left">
            <div>
              <h2 className="luxury-heading text-5xl sm:text-6xl font-bold text-white tracking-widest mb-6">
                CONTACT US
              </h2>
              <div className="h-1 w-24 divider-accent mb-8"></div>
              <p className="text-white/90 text-xl leading-relaxed tracking-wide mb-8">
                Have questions about our properties or services? We're here to help. Fill out the form and our team will get back to you within 24 hours.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              {[
                {
                  icon: Mail,
                  title: 'Email Us',
                  content: process.env.CONTACT_EMAIL || 'diego@comcreate.org',
                  href: `mailto:${process.env.CONTACT_EMAIL || 'diego@comcreate.org'}`
                },
                {
                  icon: Clock,
                  title: 'Response Time',
                  content: 'Within 24 hours on business days'
                },
                {
                  icon: Users,
                  title: 'Dedicated Team',
                  content: 'Cadiz & Lluis - Property Management Experts'
                }
              ].map((item, i) => (
                <div key={i} className="glass-card-accent p-8 rounded-2xl group hover:scale-105 transition-transform duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors duration-300">
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2 tracking-wide text-lg">{item.title}</h3>
                      {item.href ? (
                        <a href={item.href} className="text-white/80 hover:text-white transition-colors text-base">
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-white/80 text-base">{item.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="animate-slide-in-right">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="glass-card-accent elevated-card p-16 sm:p-24 text-center relative overflow-hidden rounded-3xl">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)] animate-gradient-shift"></div>
          </div>

          <div className="relative z-10">
            <Badge className="badge-accent text-base px-8 py-3 mb-10 animate-bounce-in">
              <Sparkles className="h-4 w-4 mr-2" />
              Get Started
            </Badge>
            <h2 className="luxury-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-widest mb-8 sm:mb-10 animate-reveal px-4">
              READY TO FIND YOUR PERFECT HOME?
            </h2>
            <p className="text-white/90 text-lg sm:text-2xl md:text-3xl tracking-wide max-w-4xl mx-auto mb-10 sm:mb-14 leading-relaxed animate-fade-in px-4">
              Let us help you discover the luxury property that matches your lifestyle and exceeds your expectations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-slide-up px-4 w-full max-w-2xl mx-auto">
              <Button className="btn-luxury h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-xl group w-full sm:w-auto">
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                Contact Us Today
              </Button>
              <Button variant="outline" className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-xl border-white/30 hover:bg-white/10 hover:border-white/50 text-white backdrop-blur-sm w-full sm:w-auto">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                Schedule a Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative mt-32 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black to-black"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.05),transparent_50%)]"></div>

        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
            {/* Main Footer Content */}
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              {/* Brand Section - Takes more space */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="shimmer animate-pulse-glow">
                    <Logo />
                  </div>
                  <div>
                    <h3 className="luxury-heading text-2xl tracking-[0.2em] text-white font-bold">
                      LUXURY CONCIERGE
                    </h3>
                    <p className="text-white/60 text-xs tracking-[0.15em] uppercase mt-1">
                      Cadiz & Lluis
                    </p>
                  </div>
                </div>
                <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
                  Your trusted partner in premium property management, delivering exceptional service and exclusive access to the finest properties.
                </p>

                {/* Contact Info Cards */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <a href="mailto:diego@comcreate.org" className="text-sm">
                      diego@comcreate.org
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-sm">24/7 Available</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="lg:col-span-2">
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Properties</h4>
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
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Company</h4>
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
              <div className="lg:col-span-3">
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Get In Touch</h4>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Ready to find your perfect luxury property? Contact us today.
                </p>
                <Button className="btn-luxury h-12 px-8 text-sm w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-10"></div>

            {/* Bottom Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-8 text-white/50 text-sm">
                <span>© {new Date().getFullYear()} Luxury Concierge</span>
                <span className="hidden md:inline">•</span>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <span className="hidden md:inline">•</span>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-white/40 text-xs uppercase tracking-wider">Powered by Excellence</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
