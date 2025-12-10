import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PropertyAssignment } from '@/components/property-assignment'
import { ManagerUrlDisplay } from '@/components/manager-url-display'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'
import { ClientManagement } from '@/components/client-management'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, ExternalLink } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

export default async function ManagerPropertiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch property manager
  const { data: manager, error: managerError } = await supabase
    .from('property_managers')
    .select('*')
    .eq('id', id)
    .single()

  if (managerError || !manager) {
    notFound()
  }

  // Fetch all properties
  const { data: allProperties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch properties assigned to this manager via junction table
  const { data: assignments, error: assignmentsError } = await supabase
    .from('property_manager_assignments')
    .select('property_id, properties(*)')
    .eq('manager_id', id)

  const assignedProperties = (assignments?.map((a: any) => a.properties).filter(Boolean) || []) as any[]

  // Fetch clients for this manager
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('manager_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <Link href="/admin/managers">
          <Button variant="ghost" className="mb-6 text-white hover:text-white-light hover:bg-white/10 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Managers
          </Button>
        </Link>

        <Card className="elevated-card overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <ProfilePictureUpload
                  managerId={id}
                  currentPictureUrl={manager.profile_picture_url}
                  managerName={manager.name}
                />
              </div>

              {/* Manager Info */}
              <div className="flex-1">
                <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white mb-4">
                  {manager.name}
                </h1>
                <div className="flex flex-col gap-3 text-white/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="tracking-wide">{manager.email}</span>
                  </div>
                  {manager.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <span className="tracking-wide">{formatPhoneNumber(manager.phone)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Section */}
      <ClientManagement managerId={id} clients={clients || []} />

      {/* Public Portfolio URL Section */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <CardTitle className="luxury-heading text-2xl tracking-[0.15em] flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
            Public Portfolio
          </CardTitle>
          <CardDescription className="mt-3 text-white/70 tracking-wide">
            Share this unique URL to showcase this manager's property portfolio publicly
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <ManagerUrlDisplay managerId={id} />
          <Link href={`/manager/${id}`} target="_blank" className="block">
            <Button variant="outline" className="w-full sm:w-auto border-white/30 hover:bg-white/10 hover:border-white text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Public Portfolio Page
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Property Assignment Section */}
      <div>
        <h2 className="luxury-heading text-3xl font-bold tracking-[0.15em] text-white mb-6">
          Property Management
        </h2>
        <PropertyAssignment
          managerId={id}
          allProperties={allProperties || []}
          assignedProperties={assignedProperties || []}
        />
      </div>
    </div>
  )
}
