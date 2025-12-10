'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentManagerProfile } from '@/lib/actions/clients'

export type Property = {
  id: string
  address: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: any
  scraped_at: string | null
  created_at: string | null
  updated_at: string | null
  property_manager_id: string | null
  // Pricing display options
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
}

export async function getManagerProperties() {
  const supabase = await createClient()

  // Get current manager profile
  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found', data: [] }
  }

  // Get properties assigned to this manager
  const { data: assignments, error: assignmentsError } = await supabase
    .from('property_manager_assignments')
    .select('property_id')
    .eq('manager_id', managerProfile.id)

  if (assignmentsError) {
    return { error: assignmentsError.message, data: [] }
  }

  const propertyIds = assignments?.map(a => a.property_id) || []

  if (propertyIds.length === 0) {
    return { data: [] }
  }

  // Get the actual properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds)
    .order('position', { ascending: true, nullsFirst: false })

  if (propertiesError) {
    return { error: propertiesError.message, data: [] }
  }

  return { data: properties as Property[] }
}

export async function assignPropertyToManager(propertyId: string, managerId: string) {
  const supabase = await createClient()

  // Insert into junction table (UNIQUE constraint prevents duplicates)
  const { error } = await supabase
    .from('property_manager_assignments')
    .insert({
      property_id: propertyId,
      manager_id: managerId,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${managerId}`)
  revalidatePath(`/manager/${managerId}`)
  return { success: true }
}

export async function unassignPropertyFromManager(propertyId: string, managerId: string) {
  const supabase = await createClient()

  // Delete from junction table
  const { error } = await supabase
    .from('property_manager_assignments')
    .delete()
    .eq('property_id', propertyId)
    .eq('manager_id', managerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/manager/${managerId}`)
  revalidatePath(`/manager/${managerId}`)
  return { success: true }
}

export async function assignPropertyToManagers(propertyId: string, managerIds: string[]) {
  const supabase = await createClient()

  // First, remove all existing assignments for this property
  await supabase
    .from('property_manager_assignments')
    .delete()
    .eq('property_id', propertyId)

  // Then insert new assignments
  if (managerIds.length > 0) {
    const assignments = managerIds.map(managerId => ({
      property_id: propertyId,
      manager_id: managerId,
    }))

    const { error } = await supabase
      .from('property_manager_assignments')
      .insert(assignments)

    if (error) {
      return { error: error.message }
    }
  }

  // Revalidate all affected manager pages
  managerIds.forEach(managerId => {
    revalidatePath(`/admin/manager/${managerId}`)
    revalidatePath(`/manager/${managerId}`)
  })

  return { success: true }
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient()

  // First, delete all assignments for this property
  await supabase
    .from('property_manager_assignments')
    .delete()
    .eq('property_id', propertyId)

  // Then delete the property itself
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/properties')
  return { success: true }
}

export async function updatePropertyOrder(propertyIds: string[]) {
  const supabase = await createClient()

  // Update each property's position based on array index
  const updates = propertyIds.map((id, index) =>
    supabase
      .from('properties')
      .update({ position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    return { error: 'Failed to update some property positions' }
  }

  revalidatePath('/admin/properties')
  revalidatePath('/properties')
  revalidatePath('/')
  return { success: true }
}

// ============ PROPERTY CUSTOMIZATION FUNCTIONS ============

export type PropertyCustomization = {
  // Field visibility
  show_bedrooms?: boolean
  show_bathrooms?: boolean
  show_area?: boolean
  show_address?: boolean
  show_images?: boolean
  // Custom labels
  label_bedrooms?: string
  label_bathrooms?: string
  label_area?: string
  label_monthly_rent?: string
  label_nightly_rate?: string
  label_purchase_price?: string
  // Custom notes
  custom_notes?: string | null
}

// Update property customization settings
export async function updatePropertyCustomization(
  propertyId: string,
  customization: PropertyCustomization
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .update({
      ...customization,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (error) {
    console.error('Error updating property customization:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}/edit`)
  revalidatePath(`/property/${propertyId}`)
  revalidatePath('/admin/properties')

  // Revalidate all client pages that might have this property
  revalidatePath('/client/[id]', 'page')

  return { success: true }
}

// Reset property customization to defaults
export async function resetPropertyCustomization(propertyId: string) {
  const supabase = await createClient()

  const defaults: PropertyCustomization = {
    show_bedrooms: true,
    show_bathrooms: true,
    show_area: true,
    show_address: true,
    show_images: true,
    label_bedrooms: 'Bedrooms',
    label_bathrooms: 'Bathrooms',
    label_area: 'Square Feet',
    label_monthly_rent: 'Monthly Rent',
    label_nightly_rate: 'Nightly Rate',
    label_purchase_price: 'Purchase Price',
    custom_notes: null,
  }

  const { error } = await supabase
    .from('properties')
    .update({
      ...defaults,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (error) {
    console.error('Error resetting property customization:', error)
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}/edit`)
  revalidatePath(`/property/${propertyId}`)
  revalidatePath('/admin/properties')
  revalidatePath('/client/[id]', 'page')

  return { success: true }
}
