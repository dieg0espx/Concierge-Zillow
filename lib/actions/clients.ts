'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ClientStatus = 'active' | 'pending' | 'closed'

export type Client = {
  id: string
  manager_id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  created_at: string
  updated_at: string
}

export type ClientWithDetails = Client & {
  property_managers?: {
    id: string
    name: string
    email: string
  }
  property_count?: number
}

export type ManagerProfile = {
  id: string
  name: string
  email: string
  phone: string | null
  auth_user_id: string | null
}

// Get the property manager profile for the currently logged-in user
export async function getCurrentManagerProfile(): Promise<{ data: ManagerProfile | null; error?: string }> {
  const supabase = await createClient()

  // Get the current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // First try to find manager by auth_user_id
  let { data: manager, error } = await supabase
    .from('property_managers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  // If not found by auth_user_id, try matching by email
  if (!manager) {
    const { data: managerByEmail } = await supabase
      .from('property_managers')
      .select('*')
      .eq('email', user.email)
      .single()

    manager = managerByEmail
  }

  if (!manager) {
    return { data: null, error: 'No manager profile found for this user' }
  }

  return { data: manager as ManagerProfile }
}

export async function getClientsByManager(managerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getAllClients() {
  const supabase = await createClient()

  // Get current manager profile to filter clients
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Get only the logged-in manager's clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select(`
      *,
      property_managers (
        id,
        name,
        email
      )
    `)
    .eq('manager_id', managerProfile.id)
    .order('updated_at', { ascending: false })

  if (clientsError) {
    return { error: clientsError.message }
  }

  // Get property counts for each client
  const { data: assignments, error: assignmentsError } = await supabase
    .from('client_property_assignments')
    .select('client_id')

  if (assignmentsError) {
    return { error: assignmentsError.message }
  }

  // Count properties per client
  const propertyCounts: Record<string, number> = {}
  assignments?.forEach((a: any) => {
    propertyCounts[a.client_id] = (propertyCounts[a.client_id] || 0) + 1
  })

  // Merge property counts with client data
  const clientsWithCounts = clients?.map((client: any) => ({
    ...client,
    property_count: propertyCounts[client.id] || 0,
  })) || []

  return { data: clientsWithCounts as ClientWithDetails[] }
}

export async function updateClientStatus(clientId: string, status: ClientStatus) {
  const supabase = await createClient()

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/manager/${client.manager_id}`)
  revalidatePath(`/admin/client/${clientId}`)
  return { success: true }
}

export async function addClient(formData: FormData) {
  const supabase = await createClient()

  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        manager_id: managerProfile.id,
        name,
        email: email || null,
        phone: phone || null,
      },
    ])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${managerProfile.id}`)
  revalidatePath('/admin/clients')
  return { data }
}

export async function updateClient(
  clientId: string,
  data: { name?: string; email?: string | null; phone?: string | null }
) {
  const supabase = await createClient()

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${client.manager_id}`)
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient()

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${client.manager_id}`)
  return { success: true }
}

export type ClientPricingOptions = {
  show_monthly_rent_to_client: boolean
  show_nightly_rate_to_client: boolean
  show_purchase_price_to_client: boolean
}

export async function assignPropertyToClient(
  clientId: string,
  propertyId: string,
  pricingOptions?: ClientPricingOptions
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_property_assignments')
    .insert([{
      client_id: clientId,
      property_id: propertyId,
      // Default to true for all pricing options if not specified
      show_monthly_rent_to_client: pricingOptions?.show_monthly_rent_to_client ?? true,
      show_nightly_rate_to_client: pricingOptions?.show_nightly_rate_to_client ?? true,
      show_purchase_price_to_client: pricingOptions?.show_purchase_price_to_client ?? true,
    }])

  if (error) {
    if (error.code === '23505') {
      return { error: 'Property is already assigned to this client' }
    }
    return { error: error.message }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (client) {
    revalidatePath(`/admin/manager/${client.manager_id}`)
  }
  revalidatePath(`/client/${clientId}`)
  revalidatePath(`/admin/client/${clientId}`)

  return { success: true }
}

export async function removePropertyFromClient(clientId: string, propertyId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_property_assignments')
    .delete()
    .eq('client_id', clientId)
    .eq('property_id', propertyId)

  if (error) {
    return { error: error.message }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (client) {
    revalidatePath(`/admin/manager/${client.manager_id}`)
  }
  revalidatePath(`/client/${clientId}`)

  return { success: true }
}

export async function getClientProperties(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_property_assignments')
    .select('property_id, properties(*)')
    .eq('client_id', clientId)

  if (error) {
    return { error: error.message }
  }

  const properties = data?.map((a: any) => a.properties).filter(Boolean) || []
  return { data: properties }
}

export async function updateClientPropertyPricing(
  clientId: string,
  propertyId: string,
  pricingOptions: ClientPricingOptions
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_property_assignments')
    .update({
      show_monthly_rent_to_client: pricingOptions.show_monthly_rent_to_client,
      show_nightly_rate_to_client: pricingOptions.show_nightly_rate_to_client,
      show_purchase_price_to_client: pricingOptions.show_purchase_price_to_client,
    })
    .eq('client_id', clientId)
    .eq('property_id', propertyId)

  if (error) {
    return { error: error.message }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (client) {
    revalidatePath(`/admin/manager/${client.manager_id}`)
  }
  revalidatePath(`/client/${clientId}`)
  revalidatePath(`/admin/client/${clientId}`)

  return { success: true }
}

export async function getClientPropertiesWithPricing(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_property_assignments')
    .select(`
      property_id,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', clientId)

  if (error) {
    return { error: error.message }
  }

  // Merge assignment pricing options with property data
  const properties = data?.map((a: any) => ({
    ...a.properties,
    // Client-specific pricing visibility
    client_show_monthly_rent: a.show_monthly_rent_to_client ?? true,
    client_show_nightly_rate: a.show_nightly_rate_to_client ?? true,
    client_show_purchase_price: a.show_purchase_price_to_client ?? true,
  })).filter(Boolean) || []

  return { data: properties }
}
