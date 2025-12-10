import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Property {
  id: string
  address: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: string[]
  description: string | null
  scraped_at: string | null
  created_at: string | null
  updated_at: string | null
  position: number | null
  // Pricing display options
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
  // Field visibility toggles
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

export async function getProperties() {
  // Fetch all properties with position ordering
  const { data, error } = await supabase
    .from('properties')
    .select('*')

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  // Deduplicate by zillow_url - keep only the first occurrence of each URL
  const seenUrls = new Set<string>()
  const uniqueProperties = (data as Property[]).filter(property => {
    if (seenUrls.has(property.zillow_url)) {
      return false // Skip duplicate
    }
    seenUrls.add(property.zillow_url)
    return true
  })

  // Sort: properties with position come first (by position asc),
  // then properties without position (by created_at desc)
  const sorted = uniqueProperties.sort((a, b) => {
    // Both have positions - sort by position ascending
    if (a.position !== null && b.position !== null) {
      return a.position - b.position
    }
    // Only a has position - a comes first
    if (a.position !== null && b.position === null) {
      return -1
    }
    // Only b has position - b comes first
    if (a.position === null && b.position !== null) {
      return 1
    }
    // Neither has position - sort by created_at descending (newest first)
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
    return bDate - aDate
  })

  return sorted
}

export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching property:', error)
    return null
  }

  // Fetch property managers
  const { data: assignments } = await supabase
    .from('property_manager_assignments')
    .select('manager_id, property_managers(id, name, email, phone, profile_picture_url)')
    .eq('property_id', id)

  const managers = assignments?.map((a: any) => a.property_managers).filter(Boolean) || []

  return { ...data, managers } as Property & { managers: any[] }
}

export async function saveProperty(propertyData: {
  zillow_url: string
  address?: string
  bedrooms?: string
  bathrooms?: string
  area?: string
  images?: string[]
  description?: string
  // Pricing display options
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
}) {
  console.log('saveProperty called with:', propertyData)

  // Allow duplicate zillow_urls - different managers can add the same property with different pricing
  const { data, error } = await supabase
    .from('properties')
    .insert([propertyData])
    .select()
    .single()

  if (error) {
    console.error('Error saving property:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })

    // Handle duplicate URL constraint error with a user-friendly message
    if (error.code === '23505' && error.message.includes('zillow_url')) {
      throw new Error('This property has already been added to the system. Each property can only be added once. If you need to update pricing or details, please edit the existing property instead.')
    }

    throw new Error(error.message || 'Failed to save property')
  }

  console.log('Property saved successfully:', data)
  return data as Property
}
