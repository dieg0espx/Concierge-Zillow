'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Property = {
  id: string
  address: string | null
  monthly_rent: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: any
  scraped_at: string | null
  created_at: string | null
  updated_at: string | null
  property_manager_id: string | null
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
