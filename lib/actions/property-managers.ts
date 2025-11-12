'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PropertyManager = {
  id: string
  name: string
  email: string
  phone: string | null
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

export async function addPropertyManager(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase
    .from('property_managers')
    .insert([
      {
        name,
        email,
        phone: phone || null,
      },
    ])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { data }
}

export async function deletePropertyManager(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_managers')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function updatePropertyManager(
  id: string,
  data: { name?: string; email?: string; phone?: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('property_managers')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
