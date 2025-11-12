'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
}

export async function createUser(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  try {
    // Create admin client for user creation
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Create user in auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user' }
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
      })

    if (profileError) {
      // If profile creation fails, delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      console.error('Profile error:', profileError)
      return { error: profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true, user: authData.user }
  } catch (error) {
    console.error('Error creating user:', error)
    return { error: 'Failed to create user. Please try again.' }
  }
}

export async function getUsers() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return { error: error.message, users: [] }
    }

    return { users: data as UserProfile[], error: null }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { error: 'Failed to fetch users', users: [] }
  }
}

export async function deleteUser(userId: string) {
  try {
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey)

    // Delete user from auth (this will cascade delete the profile due to FK constraint)
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user:', authError)
      return { error: authError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: 'Failed to delete user. Please try again.' }
  }
}

export async function updateUser(userId: string, formData: {
  firstName: string
  lastName: string
}) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error updating user:', error)
    return { error: 'Failed to update user. Please try again.' }
  }
}
