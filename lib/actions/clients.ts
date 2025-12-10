'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug, generateUniqueSlug, sanitizeSlug, isValidSlug } from '@/lib/utils/slug'

export type ClientStatus = 'active' | 'pending' | 'closed'

export type Client = {
  id: string
  manager_id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  slug: string | null
  last_accessed: string | null
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
  is_shared?: boolean
  shared_by?: {
    id: string
    name: string
    email: string
  }
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

  // Get clients owned by the logged-in manager
  const { data: ownedClients, error: ownedError } = await supabase
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

  if (ownedError) {
    return { error: ownedError.message }
  }

  // Get clients shared with the logged-in manager
  const { data: sharedClientIds, error: sharedError } = await supabase
    .from('client_shares')
    .select(`
      client_id,
      shared_by_manager_id,
      shared_by:property_managers!shared_by_manager_id(id, name, email)
    `)
    .eq('shared_with_manager_id', managerProfile.id)

  if (sharedError) {
    return { error: sharedError.message }
  }

  // Fetch full client details for shared clients
  let sharedClients: any[] = []
  if (sharedClientIds && sharedClientIds.length > 0) {
    const clientIds = sharedClientIds.map((s: any) => s.client_id)
    const { data: sharedClientsData, error: sharedClientsError } = await supabase
      .from('clients')
      .select(`
        *,
        property_managers (
          id,
          name,
          email
        )
      `)
      .in('id', clientIds)

    if (sharedClientsError) {
      return { error: sharedClientsError.message }
    }

    // Add sharing metadata to shared clients
    sharedClients = sharedClientsData?.map((client: any) => {
      const shareInfo = sharedClientIds.find((s: any) => s.client_id === client.id)
      return {
        ...client,
        is_shared: true,
        shared_by: shareInfo?.shared_by,
      }
    }) || []
  }

  // Mark owned clients as owned
  const ownedClientsMarked = ownedClients?.map((client: any) => ({
    ...client,
    is_shared: false,
  })) || []

  // Combine owned and shared clients
  const allClients = [...ownedClientsMarked, ...sharedClients]

  // Sort by updated_at
  allClients.sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime()
    const dateB = new Date(b.updated_at).getTime()
    return dateB - dateA
  })

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
  const clientsWithCounts = allClients.map((client: any) => ({
    ...client,
    property_count: propertyCounts[client.id] || 0,
  }))

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
  const customSlug = formData.get('slug') as string | null

  // Generate slug from name or use custom slug
  let slug = customSlug ? sanitizeSlug(customSlug) : generateSlug(name)

  // Validate custom slug if provided
  if (customSlug && !isValidSlug(slug)) {
    return { error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' }
  }

  // Check if slug already exists
  let finalSlug = slug
  let attempt = 0
  let isUnique = false

  while (!isUnique && attempt < 10) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', finalSlug)
      .single()

    if (!existing) {
      isUnique = true
    } else {
      attempt++
      finalSlug = generateUniqueSlug(slug)
    }
  }

  if (!isUnique) {
    return { error: 'Unable to generate unique slug. Please try a different name.' }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        manager_id: managerProfile.id,
        name,
        email: email || null,
        phone: phone || null,
        slug: finalSlug,
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

export async function updateClient(formData: FormData) {
  const supabase = await createClient()

  const clientId = formData.get('clientId') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const customSlug = formData.get('slug') as string | null

  if (!clientId) {
    return { error: 'Client ID is required' }
  }

  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('manager_id, slug')
    .eq('id', clientId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (name) updateData.name = name
  if (email !== undefined) updateData.email = email || null
  if (phone !== undefined) updateData.phone = phone || null

  // Handle slug update
  if (customSlug !== undefined && customSlug !== null && customSlug !== client.slug) {
    const sanitized = sanitizeSlug(customSlug)

    if (!isValidSlug(sanitized)) {
      return { error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' }
    }

    // Check if new slug already exists
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', sanitized)
      .neq('id', clientId)
      .single()

    if (existing) {
      return { error: 'This slug is already in use. Please choose a different one.' }
    }

    updateData.slug = sanitized
  }

  const { error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${client.manager_id}`)
  revalidatePath(`/admin/client/${clientId}`)
  revalidatePath('/admin/clients')
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

  // Get current max position for this client
  const { data: currentAssignments } = await supabase
    .from('client_property_assignments')
    .select('position')
    .eq('client_id', clientId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = currentAssignments && currentAssignments[0]?.position !== null
    ? currentAssignments[0].position + 1
    : 0

  const { error } = await supabase
    .from('client_property_assignments')
    .insert([{
      client_id: clientId,
      property_id: propertyId,
      position: nextPosition,
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
      position,
      show_monthly_rent_to_client,
      show_nightly_rate_to_client,
      show_purchase_price_to_client,
      properties(*)
    `)
    .eq('client_id', clientId)
    .order('position', { ascending: true })

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
    position: a.position,
  })).filter(Boolean) || []

  return { data: properties }
}

// ============ CLIENT SHARING FUNCTIONS ============

export type ClientShare = {
  id: string
  client_id: string
  shared_with_manager_id: string
  shared_by_manager_id: string
  created_at: string
}

export type ManagerInfo = {
  id: string
  name: string
  email: string
}

// Get all property managers (for sharing dropdown)
export async function getAllManagers(): Promise<{ data: ManagerInfo[] | null; error?: string }> {
  const supabase = await createClient()

  const { data, error} = await supabase
    .from('property_managers')
    .select('id, name, email')
    .order('name', { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as ManagerInfo[] }
}

// Get shares for a specific client
export async function getClientShares(clientId: string): Promise<{ data: any[] | null; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_shares')
    .select(`
      id,
      shared_with_manager_id,
      shared_by_manager_id,
      created_at,
      shared_with:property_managers!shared_with_manager_id(id, name, email),
      shared_by:property_managers!shared_by_manager_id(id, name, email)
    `)
    .eq('client_id', clientId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data }
}

// Share a client with another manager
export async function shareClient(clientId: string, shareWithManagerId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Verify the client belongs to this manager
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return { error: 'Client not found' }
  }

  if (client.manager_id !== managerProfile.id) {
    return { error: 'You can only share clients you own' }
  }

  // Cannot share with yourself
  if (shareWithManagerId === managerProfile.id) {
    return { error: 'Cannot share with yourself' }
  }

  // Create the share
  const { error: shareError } = await supabase
    .from('client_shares')
    .insert({
      client_id: clientId,
      shared_with_manager_id: shareWithManagerId,
      shared_by_manager_id: managerProfile.id,
    })

  if (shareError) {
    if (shareError.code === '23505') {
      return { error: 'Client is already shared with this manager' }
    }
    return { error: shareError.message }
  }

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/client/${clientId}`)
  return { success: true }
}

// Unshare a client
export async function unshareClient(clientId: string, shareWithManagerId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Verify the client belongs to this manager
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('manager_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    return { error: 'Client not found' }
  }

  if (client.manager_id !== managerProfile.id) {
    return { error: 'You can only unshare clients you own' }
  }

  // Delete the share
  const { error: deleteError } = await supabase
    .from('client_shares')
    .delete()
    .eq('client_id', clientId)
    .eq('shared_with_manager_id', shareWithManagerId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/client/${clientId}`)
  return { success: true }
}

// Get client by slug (for public client pages)
export async function getClientBySlug(slug: string) {
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      property_managers (
        id,
        name,
        email,
        phone,
        profile_picture_url
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: client, error: null }
}

// Track when a client accesses their portfolio page
export async function trackClientAccess(clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ last_accessed: new Date().toISOString() })
    .eq('id', clientId)

  if (error) {
    console.error('Error tracking client access:', error)
    return { error: error.message }
  }

  return { success: true }
}

// Update the order of client property assignments
export async function updateClientPropertyOrder(clientId: string, propertyIds: string[]) {
  const supabase = await createClient()

  // Update position for each property
  const updates = propertyIds.map((propertyId, index) =>
    supabase
      .from('client_property_assignments')
      .update({ position: index })
      .eq('client_id', clientId)
      .eq('property_id', propertyId)
  )

  const results = await Promise.all(updates)

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error('Error updating property order:', errors)
    return { error: 'Failed to update property order' }
  }

  revalidatePath(`/admin/client/${clientId}`)
  revalidatePath(`/client/${clientId}`)
  return { success: true }
}

// Bulk assign properties to client
export async function bulkAssignPropertiesToClient(
  clientId: string,
  propertyIds: string[],
  pricingOptions?: ClientPricingOptions
) {
  const supabase = await createClient()

  // Get current max position
  const { data: currentAssignments } = await supabase
    .from('client_property_assignments')
    .select('position')
    .eq('client_id', clientId)
    .order('position', { ascending: false })
    .limit(1)

  const startPosition = currentAssignments && currentAssignments[0]?.position !== null
    ? currentAssignments[0].position + 1
    : 0

  // Prepare assignments
  const assignments = propertyIds.map((propertyId, index) => ({
    client_id: clientId,
    property_id: propertyId,
    position: startPosition + index,
    show_monthly_rent_to_client: pricingOptions?.show_monthly_rent_to_client ?? true,
    show_nightly_rate_to_client: pricingOptions?.show_nightly_rate_to_client ?? true,
    show_purchase_price_to_client: pricingOptions?.show_purchase_price_to_client ?? true,
  }))

  const { error } = await supabase
    .from('client_property_assignments')
    .insert(assignments)

  if (error) {
    console.error('Error bulk assigning properties:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/client/${clientId}`)
  revalidatePath(`/client/${clientId}`)
  return { success: true, count: propertyIds.length }
}

// Bulk remove properties from client
export async function bulkRemovePropertiesFromClient(clientId: string, propertyIds: string[]) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('client_property_assignments')
    .delete()
    .eq('client_id', clientId)
    .in('property_id', propertyIds)

  if (error) {
    console.error('Error bulk removing properties:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/client/${clientId}`)
  revalidatePath(`/client/${clientId}`)
  return { success: true, count: propertyIds.length }
}
