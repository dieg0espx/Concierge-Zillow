'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentManagerProfile } from '@/lib/actions/clients'

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired'

export type QuoteServiceItem = {
  id: string
  quote_id: string
  service_name: string
  description: string | null
  price: number
  images: string[]
  created_at: string
}

export type Quote = {
  id: string
  quote_number: string
  manager_id: string
  client_name: string
  client_email: string
  expiration_date: string
  status: QuoteStatus
  subtotal: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  viewed_at: string | null
  responded_at: string | null
}

export type QuoteWithItems = Quote & {
  service_items: QuoteServiceItem[]
}

// Generate unique quote number (e.g., QT-2024-001)
async function generateQuoteNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `QT-${year}-`

  const { data: quotes } = await supabase
    .from('quotes')
    .select('quote_number')
    .like('quote_number', `${prefix}%`)
    .order('quote_number', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (quotes && quotes.length > 0) {
    const lastNumber = quotes[0].quote_number
    const match = lastNumber.match(/QT-\d{4}-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

// Get all quotes for current manager
export async function getQuotes() {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found', data: [] }
  }

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('manager_id', managerProfile.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  // Check for expired quotes and update status
  const now = new Date()
  const updatedQuotes = quotes?.map((quote: Quote) => {
    if (quote.status === 'sent' || quote.status === 'viewed') {
      const expirationDate = new Date(quote.expiration_date)
      if (expirationDate < now) {
        return { ...quote, status: 'expired' as QuoteStatus }
      }
    }
    return quote
  }) || []

  return { data: updatedQuotes as Quote[] }
}

// Get single quote with service items
export async function getQuoteById(quoteId: string) {
  const supabase = await createClient()

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (quoteError) {
    return { error: quoteError.message, data: null }
  }

  const { data: serviceItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: true })

  if (itemsError) {
    return { error: itemsError.message, data: null }
  }

  return {
    data: {
      ...quote,
      service_items: serviceItems || []
    } as QuoteWithItems
  }
}

// Get quote by number (for public viewing)
export async function getQuoteByNumber(quoteNumber: string) {
  const supabase = await createClient()

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('quote_number', quoteNumber)
    .single()

  if (quoteError) {
    return { error: quoteError.message, data: null }
  }

  const { data: serviceItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .select('*')
    .eq('quote_id', quote.id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    return { error: itemsError.message, data: null }
  }

  // Mark as viewed if sent
  if (quote.status === 'sent') {
    await supabase
      .from('quotes')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString()
      })
      .eq('id', quote.id)
  }

  return {
    data: {
      ...quote,
      service_items: serviceItems || []
    } as QuoteWithItems
  }
}

// Create new quote
export async function createQuote(data: {
  client_name: string
  client_email: string
  expiration_date: string
  notes?: string | null
  service_items: Array<{
    service_name: string
    description?: string | null
    price: number
    images?: string[]
  }>
  status?: QuoteStatus
}) {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Generate quote number
  const quoteNumber = await generateQuoteNumber(supabase)

  // Calculate total
  let total = 0
  data.service_items.forEach(item => {
    total += item.price
  })

  // Create quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      quote_number: quoteNumber,
      manager_id: managerProfile.id,
      client_name: data.client_name,
      client_email: data.client_email,
      expiration_date: data.expiration_date,
      status: data.status || 'draft',
      subtotal: total,
      total: total,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (quoteError) {
    return { error: quoteError.message }
  }

  // Create service items
  const itemsToInsert = data.service_items.map(item => ({
    quote_id: quote.id,
    service_name: item.service_name,
    description: item.description || null,
    price: item.price,
    images: item.images || [],
  }))

  const { error: itemsError } = await supabase
    .from('quote_service_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Rollback quote creation
    await supabase.from('quotes').delete().eq('id', quote.id)
    return { error: itemsError.message }
  }

  revalidatePath('/admin/quotes')
  return { data: quote }
}

// Update quote (only drafts can be edited)
export async function updateQuote(quoteId: string, data: {
  client_name: string
  client_email: string
  expiration_date: string
  notes?: string | null
  service_items: Array<{
    id?: string
    service_name: string
    description?: string | null
    price: number
    images?: string[]
  }>
}) {
  const supabase = await createClient()

  // Verify quote exists and is a draft
  const { data: existingQuote, error: fetchError } = await supabase
    .from('quotes')
    .select('status')
    .eq('id', quoteId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingQuote.status !== 'draft') {
    return { error: 'Only draft quotes can be edited' }
  }

  // Calculate total
  let total = 0
  data.service_items.forEach(item => {
    total += item.price
  })

  // Update quote
  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      client_name: data.client_name,
      client_email: data.client_email,
      expiration_date: data.expiration_date,
      subtotal: total,
      total: total,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Delete existing service items
  await supabase
    .from('quote_service_items')
    .delete()
    .eq('quote_id', quoteId)

  // Create new service items
  const itemsToInsert = data.service_items.map(item => ({
    quote_id: quoteId,
    service_name: item.service_name,
    description: item.description || null,
    price: item.price,
    images: item.images || [],
  }))

  const { error: itemsError } = await supabase
    .from('quote_service_items')
    .insert(itemsToInsert)

  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/admin/quotes')
  revalidatePath(`/admin/quotes/${quoteId}/edit`)
  return { success: true }
}

// Delete quote (only drafts can be deleted)
export async function deleteQuote(quoteId: string) {
  const supabase = await createClient()

  // Verify quote exists and is a draft
  const { data: existingQuote, error: fetchError } = await supabase
    .from('quotes')
    .select('status')
    .eq('id', quoteId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingQuote.status !== 'draft') {
    return { error: 'Only draft quotes can be deleted' }
  }

  // Delete service items first (cascade should handle this, but being explicit)
  await supabase
    .from('quote_service_items')
    .delete()
    .eq('quote_id', quoteId)

  // Delete quote
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quoteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/quotes')
  return { success: true }
}

// Send quote (change status from draft to sent)
export async function sendQuote(quoteId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('quotes')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
    .eq('status', 'draft')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/quotes')
  return { success: true }
}

// Duplicate quote
export async function duplicateQuote(quoteId: string) {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Get original quote with items
  const { data: originalQuote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (quoteError || !originalQuote) {
    return { error: quoteError?.message || 'Quote not found' }
  }

  const { data: originalItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .select('*')
    .eq('quote_id', quoteId)

  if (itemsError) {
    return { error: itemsError.message }
  }

  // Generate new quote number
  const quoteNumber = await generateQuoteNumber(supabase)

  // Create new quote as draft
  const { data: newQuote, error: createError } = await supabase
    .from('quotes')
    .insert({
      quote_number: quoteNumber,
      manager_id: managerProfile.id,
      client_name: originalQuote.client_name,
      client_email: originalQuote.client_email,
      expiration_date: originalQuote.expiration_date,
      status: 'draft',
      subtotal: originalQuote.subtotal,
      total: originalQuote.total,
      notes: originalQuote.notes,
    })
    .select()
    .single()

  if (createError) {
    return { error: createError.message }
  }

  // Duplicate service items
  if (originalItems && originalItems.length > 0) {
    const newItems = originalItems.map((item: QuoteServiceItem) => ({
      quote_id: newQuote.id,
      service_name: item.service_name,
      description: item.description,
      price: item.price,
      images: item.images,
    }))

    const { error: itemsCreateError } = await supabase
      .from('quote_service_items')
      .insert(newItems)

    if (itemsCreateError) {
      // Clean up the new quote if items failed
      await supabase.from('quotes').delete().eq('id', newQuote.id)
      return { error: itemsCreateError.message }
    }
  }

  revalidatePath('/admin/quotes')
  return { data: newQuote }
}

// Client accepts quote
export async function acceptQuote(quoteNumber: string) {
  const supabase = await createClient()

  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('quote_number', quoteNumber)
    .single()

  if (fetchError || !quote) {
    return { error: 'Quote not found' }
  }

  if (quote.status === 'accepted') {
    return { error: 'Quote has already been accepted' }
  }

  if (quote.status === 'declined') {
    return { error: 'Quote has been declined' }
  }

  if (quote.status === 'expired') {
    return { error: 'Quote has expired' }
  }

  if (quote.status === 'draft') {
    return { error: 'Quote has not been sent yet' }
  }

  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quote.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

// Client declines quote
export async function declineQuote(quoteNumber: string) {
  const supabase = await createClient()

  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('quote_number', quoteNumber)
    .single()

  if (fetchError || !quote) {
    return { error: 'Quote not found' }
  }

  if (quote.status === 'accepted') {
    return { error: 'Quote has already been accepted' }
  }

  if (quote.status === 'declined') {
    return { error: 'Quote has already been declined' }
  }

  if (quote.status === 'expired') {
    return { error: 'Quote has expired' }
  }

  if (quote.status === 'draft') {
    return { error: 'Quote has not been sent yet' }
  }

  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quote.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}
