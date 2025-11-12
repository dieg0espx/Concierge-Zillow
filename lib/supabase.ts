import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Property {
  id: string
  address: string | null
  monthly_rent: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: string[]
  description: string | null
  scraped_at: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return data as Property[]
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
  monthly_rent?: string
  bedrooms?: string
  bathrooms?: string
  area?: string
  images?: string[]
  description?: string
}) {
  console.log('saveProperty called with:', propertyData)

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
    throw error
  }

  console.log('Property saved successfully:', data)
  return data as Property
}
