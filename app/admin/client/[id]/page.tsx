import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientPropertyAssignment } from '@/components/client-property-assignment'
import { ClientEditDialog } from '@/components/client-edit-dialog'
import { ShareClientDialog } from '@/components/share-client-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, User, Mail, Phone, Share2 } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'
import { ClientUrlDisplay } from '@/components/client-url-display'

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch client with their manager
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*, property_managers(*)')
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const manager = client.property_managers as any

  // Check if this client is shared with the current user
  const { data: { user } } = await supabase.auth.getUser()
  let isSharedWithMe = false
  let sharedByManager = null

  if (user) {
    const { data: currentManager } = await supabase
      .from('property_managers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (currentManager && currentManager.id !== manager.id) {
      // This client doesn't belong to the current manager, check if it's shared
      const { data: shareData } = await supabase
        .from('client_shares')
        .select(`
          id,
          shared_by:property_managers!shared_by_manager_id(id, name, email)
        `)
        .eq('client_id', id)
        .eq('shared_with_manager_id', currentManager.id)
        .single()

      if (shareData) {
        isSharedWithMe = true
        sharedByManager = shareData.shared_by as any
      }
    }
  }

  // Fetch only properties assigned to this manager
  const { data: managerAssignments } = await supabase
    .from('property_manager_assignments')
    .select('property_id, properties(*)')
    .eq('manager_id', manager.id)

  const managerProperties = (managerAssignments?.map((a: any) => a.properties).filter(Boolean) || []) as any[]

  // Fetch properties already assigned to this client (with client-specific pricing visibility)
  const { data: clientAssignments } = await supabase
    .from('client_property_assignments')
    .select(`
      property_id,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', id)

  // Merge assignment pricing options with property data
  const clientProperties = (clientAssignments?.map((a: any) => ({
    ...a.properties,
    // Client-specific pricing visibility
    client_show_monthly_rent: a.show_monthly_rent_to_client ?? true,
    client_show_nightly_rate: a.show_nightly_rate_to_client ?? true,
    client_show_purchase_price: a.show_purchase_price_to_client ?? true,
  })).filter(Boolean) || []) as any[]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <Link href="/admin/clients">
          <Button variant="ghost" className="mb-6 text-white hover:text-white-light hover:bg-white/10 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>

        <Card className="elevated-card overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Client Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                  <User className="h-12 w-12 text-white/60" />
                </div>
              </div>

              {/* Client Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-3">
                    <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white">
                      {client.name}
                    </h1>
                    {isSharedWithMe && sharedByManager && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-fit">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared by {sharedByManager.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <ShareClientDialog
                      clientId={id}
                      clientName={client.name}
                      currentManagerId={manager.id}
                    />
                    <ClientEditDialog
                      clientId={id}
                      clientName={client.name}
                      clientEmail={client.email}
                      clientPhone={client.phone}
                      clientSlug={client.slug}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-white/80">
                  {client.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <span className="tracking-wide">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <span className="tracking-wide">{formatPhoneNumber(client.phone)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white/60 text-sm">Managed by:</span>
                    <span className="text-white font-medium">{manager.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Portfolio URL Section */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <CardTitle className="luxury-heading text-2xl tracking-[0.15em] flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
            Client Portfolio URL
          </CardTitle>
          <CardDescription className="mt-3 text-white/70 tracking-wide">
            Share this unique URL with {client.name} to view their personalized property portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ClientUrlDisplay clientId={id} clientSlug={client.slug} />
          <Link href={`/client/${client.slug || id}`} target="_blank" className="block">
            <Button variant="outline" className="w-full sm:w-auto border-white/30 hover:bg-white/10 hover:border-white text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Client Portfolio Page
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Property Assignment Section */}
      <div>
        <h2 className="luxury-heading text-3xl font-bold tracking-[0.15em] text-white mb-6">
          Property Assignment
        </h2>
        <ClientPropertyAssignment
          clientId={id}
          clientName={client.name}
          managerProperties={managerProperties}
          assignedProperties={clientProperties}
        />
      </div>
    </div>
  )
}
