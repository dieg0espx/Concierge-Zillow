import { getManagerProperties } from '@/lib/actions/properties'
import { PropertiesListClient } from '@/components/properties-list-client'
import { createClient } from '@/lib/supabase/server'

export default async function PropertiesPage() {
  const supabase = await createClient()

  // Get properties assigned to the logged-in manager
  const { data: properties, error } = await getManagerProperties()

  if (error) {
    console.error('Error fetching properties:', error)
  }

  // Get all managers for display purposes
  const { data: managers } = await supabase
    .from('property_managers')
    .select('id, name, email')
    .order('name')

  // Get assignments
  const { data: assignments } = await supabase
    .from('property_manager_assignments')
    .select('property_id, manager_id')

  return (
    <PropertiesListClient
      initialProperties={properties || []}
      managers={managers || []}
      assignments={assignments || []}
    />
  )
}
