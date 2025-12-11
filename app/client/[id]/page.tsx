import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublicPropertyCard } from '@/components/public-property-card'
import { Logo } from '@/components/logo'
import { Mail, Phone, Home } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'
import { ManagerContactForm } from '@/components/manager-contact-form'
import { trackClientAccess } from '@/lib/actions/clients'

export default async function ClientPublicPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check if id is a UUID or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // Fetch client with their manager (support both UUID and slug)
  const query = supabase
    .from('clients')
    .select('*, property_managers(*)')

  if (isUUID) {
    query.eq('id', id)
  } else {
    query.eq('slug', id)
  }

  const { data: client, error: clientError } = await query.single()

  if (clientError || !client) {
    notFound()
  }

  // Track that the client accessed their page (async, don't await)
  trackClientAccess(client.id)

  const manager = client.property_managers as any

  // Fetch properties assigned to this client (with client-specific pricing visibility)
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_property_assignments')
    .select(`
      property_id,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', client.id)

  // Merge assignment pricing options with property data
  // Override property's show_* fields based on client-specific settings
  const propertyList = (assignments?.map((a: any) => {
    const prop = a.properties
    if (!prop) return null

    // Only show pricing if both the property has it enabled AND the client assignment allows it
    return {
      ...prop,
      // Override show_* based on client-specific settings
      show_monthly_rent: prop.show_monthly_rent && (a.show_monthly_rent_to_client ?? true),
      show_nightly_rate: prop.show_nightly_rate && (a.show_nightly_rate_to_client ?? true),
      show_purchase_price: prop.show_purchase_price && (a.show_purchase_price_to_client ?? true),
    }
  }).filter(Boolean) || []) as any[]

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7 animate-fade-in">
          <div className="flex flex-col gap-8">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4 sm:gap-5">
              <Logo />
              <div className="flex flex-col">
                <div className="luxury-heading text-xl sm:text-2xl md:text-3xl tracking-[0.25em] text-white">
                  LUXURY CONCIERGE
                </div>
                <div className="text-xs sm:text-sm tracking-[0.3em] text-white/80 uppercase mt-1">
                  Cadiz & Lluis
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="luxury-heading text-3xl sm:text-4xl font-bold text-white tracking-[0.2em] mb-2">
                  {client.name}'s Properties
                </h1>
                <p className="text-white/80 tracking-[0.15em] uppercase text-sm sm:text-base font-medium">
                  Curated by {manager.name}
                </p>
              </div>
              <Badge variant="secondary" className="bg-white/15 text-white border-white/30 backdrop-blur-md text-base sm:text-xl px-5 sm:px-6 py-2 sm:py-3 shadow-lg">
                {propertyList.length} {propertyList.length === 1 ? 'Property' : 'Properties'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Manager Contact Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Card className="mb-10 glass-card premium-card diagonal-split animate-fade-in">
          <CardContent className="p-8 sm:p-10">
            <h2 className="luxury-heading text-2xl font-semibold mb-6 text-white tracking-[0.2em]">Contact Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center gap-4 group">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/15 transition-all">
                  <Mail className="h-6 w-6 text-white/90" />
                </div>
                <div>
                  <p className="text-xs text-white/70 uppercase tracking-[0.15em] mb-1">Email</p>
                  <a href={`mailto:${manager.email}`} className="text-white text-base hover:text-white/90 transition-colors font-medium">
                    {manager.email}
                  </a>
                </div>
              </div>
              {manager.phone && (
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/15 transition-all">
                    <Phone className="h-6 w-6 text-white/90" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-[0.15em] mb-1">Phone</p>
                    <a href={`tel:${manager.phone}`} className="text-white text-base hover:text-white/90 transition-colors font-medium">
                      {formatPhoneNumber(manager.phone)}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        {propertyList.length === 0 ? (
          <Card className="glass-card animate-fade-in">
            <CardContent className="p-16 text-center">
              <Home className="h-20 w-20 text-white/40 mx-auto mb-6" />
              <h3 className="luxury-heading text-2xl font-semibold text-white mb-3 tracking-[0.15em]">No Properties Yet</h3>
              <p className="text-white/70 text-lg tracking-wide">Properties are being curated for you. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="animate-fade-in">
            <h2 className="luxury-heading text-3xl font-bold mb-8 text-white tracking-[0.2em]">
              Properties for {client.name}
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {propertyList.map((property) => (
                <PublicPropertyCard key={property.id} property={property} clientId={id} />
              ))}
            </div>
          </div>
        )}

        {/* Contact Form Section */}
        <div className="mt-16 sm:mt-20">
          <h2 className="luxury-heading text-3xl font-bold mb-8 text-white tracking-[0.2em] text-center">
            Get in Touch
          </h2>
          <ManagerContactForm manager={manager} />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 backdrop-blur-md bg-black/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-center text-white/80">
          <p className="luxury-heading tracking-[0.2em] text-base mb-4">Curated by {manager.name}</p>
          <p className="text-base tracking-wide leading-relaxed">
            For inquiries, contact{' '}
            <a href={`mailto:${manager.email}`} className="text-white font-medium hover:text-white/90 transition-colors underline decoration-white/30 hover:decoration-white/60">
              {manager.email}
            </a>
            {manager.phone && (
              <>
                {' '}or call{' '}
                <a href={`tel:${manager.phone}`} className="text-white font-medium hover:text-white/90 transition-colors underline decoration-white/30 hover:decoration-white/60">
                  {formatPhoneNumber(manager.phone)}
                </a>
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('name, property_managers(name)')
    .eq('id', id)
    .single()

  if (!client) {
    return {
      title: 'Property Portfolio',
      description: 'Exclusive property portfolio',
    }
  }

  const manager = client.property_managers as any

  return {
    title: `${client.name}'s Properties - Curated by ${manager.name}`,
    description: `Exclusive property portfolio curated for ${client.name} by ${manager.name}`,
  }
}
