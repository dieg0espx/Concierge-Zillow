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
  converted_to_invoice_id: string | null
  pdf_customization: PDFCustomization | null
}

export type QuoteWithItems = Quote & {
  service_items: QuoteServiceItem[]
}

// PDF Customization types for visual quote builder
export type ServiceOverride = {
  display_name?: string
  display_description?: string
  display_images?: string[]  // Selected images (max 2) from available images
  details?: { label: string; value: string }[]  // e.g., Date, Departure, Arrival
}

export type PDFCustomization = {
  header_title?: string
  header_subtitle?: string
  header_icon?: 'plane' | 'car' | 'yacht' | 'none'
  service_overrides?: {
    [serviceItemId: string]: ServiceOverride
  }
  custom_notes?: string
  custom_terms?: string
  accent_color?: string
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
  pdf_customization?: PDFCustomization | null
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
      pdf_customization: data.pdf_customization || null,
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

  const { data: insertedItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .insert(itemsToInsert)
    .select()

  if (itemsError) {
    // Rollback quote creation
    await supabase.from('quotes').delete().eq('id', quote.id)
    return { error: itemsError.message }
  }

  // Update pdf_customization with actual service item IDs if provided
  if (data.pdf_customization?.service_overrides && insertedItems) {
    const indexBasedOverrides = data.pdf_customization.service_overrides
    const updatedOverrides: { [serviceItemId: string]: ServiceOverride } = {}

    // Map index-based overrides to actual service item IDs
    Object.entries(indexBasedOverrides).forEach(([indexStr, override]) => {
      const index = parseInt(indexStr, 10)
      if (insertedItems[index]) {
        updatedOverrides[insertedItems[index].id] = override
      }
    })

    // Update quote with corrected pdf_customization
    if (Object.keys(updatedOverrides).length > 0) {
      await supabase
        .from('quotes')
        .update({
          pdf_customization: {
            ...data.pdf_customization,
            service_overrides: updatedOverrides,
          },
        })
        .eq('id', quote.id)
    }
  }

  // Send email if status is 'sent'
  if (data.status === 'sent') {
    sendQuoteEmail({
      clientName: data.client_name,
      clientEmail: data.client_email,
      quoteNumber: quoteNumber,
      expirationDate: data.expiration_date,
      total,
      managerName: managerProfile.name,
    }).catch(err => console.error('Failed to send quote email:', err))
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
  pdf_customization?: PDFCustomization | null
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

  // Update quote (without pdf_customization for now, will update after service items are created)
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

  const { data: insertedItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .insert(itemsToInsert)
    .select()

  if (itemsError) {
    return { error: itemsError.message }
  }

  // Update pdf_customization with actual service item IDs if provided
  if (data.pdf_customization && insertedItems) {
    let finalPdfCustomization = { ...data.pdf_customization }

    if (data.pdf_customization.service_overrides) {
      const indexBasedOverrides = data.pdf_customization.service_overrides
      const updatedOverrides: { [serviceItemId: string]: ServiceOverride } = {}

      // Map index-based overrides to actual service item IDs
      Object.entries(indexBasedOverrides).forEach(([indexStr, override]) => {
        const index = parseInt(indexStr, 10)
        if (insertedItems[index]) {
          updatedOverrides[insertedItems[index].id] = override
        }
      })

      finalPdfCustomization.service_overrides = updatedOverrides
    }

    await supabase
      .from('quotes')
      .update({
        pdf_customization: finalPdfCustomization,
      })
      .eq('id', quoteId)
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

// Update quote PDF customization
export async function updateQuotePDFCustomization(quoteId: string, customization: PDFCustomization) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('quotes')
    .update({
      pdf_customization: customization,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/quotes')
  revalidatePath(`/admin/quotes/${quoteId}/edit`)
  return { success: true }
}

// Get quote PDF customization
export async function getQuotePDFCustomization(quoteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quotes')
    .select('pdf_customization')
    .eq('id', quoteId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: data?.pdf_customization as PDFCustomization | null }
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

// Email quote PDF to client
export async function emailQuotePDF(quoteId: string) {
  try {
    const supabase = await createClient()

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { error: 'Email service is not configured. Please contact support.' }
    }

    // Get quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return { error: 'Quote not found' }
    }

    const { data: serviceItems, error: itemsError } = await supabase
      .from('quote_service_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })

    if (itemsError) {
      return { error: itemsError.message }
    }

    // Send email with quote details
    const nodemailer = await import('nodemailer')

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/quote/${quote.quote_number}`

  const serviceItemsHtml = (serviceItems || []).map((item: QuoteServiceItem) => `
    <tr>
      <td>
        <div class="service-name">${item.service_name}</div>
        ${item.description ? `<div class="service-desc">${item.description}</div>` : ''}
      </td>
      <td class="service-price">
        ${formatCurrency(item.price)}
      </td>
    </tr>
  `).join('')

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: quote.client_email,
    subject: `Service Quote ${quote.quote_number} - Cadiz & Lluis`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 0; background-color: #000000; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; }
            .header { background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); color: white; padding: 50px 40px; text-align: center; border-bottom: 1px solid #1f1f1f; }
            .logo { font-size: 32px; font-weight: 800; letter-spacing: 6px; margin-bottom: 8px; color: #ffffff; text-transform: uppercase; }
            .tagline { font-size: 13px; letter-spacing: 5px; color: #d9d9d9; text-transform: uppercase; font-weight: 600; }
            .badge { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 2px; margin-top: 20px; text-transform: uppercase; }
            .content { background: #0a0a0a; padding: 45px 40px; }
            .greeting { font-size: 16px; color: #ffffff; margin-bottom: 24px; }
            .greeting strong { color: #ffffff; }
            .quote-info { background: linear-gradient(135deg, #0F1D33 0%, #081421 100%); padding: 24px; border-radius: 12px; margin: 30px 0; border: 1px solid #1f1f1f; }
            .info-grid { display: table; width: 100%; }
            .info-item { display: table-cell; vertical-align: top; padding: 8px 0; }
            .info-item.right { text-align: right; }
            .info-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #b3b3b3; margin-bottom: 4px; }
            .info-value { font-size: 16px; font-weight: 600; color: #ffffff; }
            .info-value.accent { color: #ffffff; }
            .section-title { font-size: 18px; font-weight: 700; color: #ffffff; margin: 35px 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #ffffff; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            tr { border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
            td { padding: 20px 0; vertical-align: top; }
            .service-name { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 4px; }
            .service-desc { font-size: 14px; color: #b3b3b3; line-height: 1.5; }
            .service-price { font-size: 18px; font-weight: 700; color: #ffffff; text-align: right; white-space: nowrap; }
            .total-box { background: linear-gradient(135deg, #0F1D33 0%, #081421 100%); color: white; padding: 35px; border-radius: 12px; margin: 35px 0; text-align: center; border: 1px solid #1f1f1f; }
            .total-label { font-size: 13px; letter-spacing: 3px; color: #b3b3b3; text-transform: uppercase; font-weight: 700; margin-bottom: 16px; }
            .total-value { font-size: 42px; font-weight: 800; color: #ffffff; letter-spacing: 1px; }
            .notes-box { background: rgba(15, 29, 51, 0.5); padding: 20px 24px; border-left: 4px solid #ffffff; border-radius: 6px; margin: 25px 0; }
            .notes-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #d9d9d9; margin-bottom: 8px; }
            .notes-text { font-size: 14px; color: #b3b3b3; line-height: 1.6; margin: 0; }
            .cta-container { text-align: center; margin: 40px 0; padding: 0 20px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000 !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; letter-spacing: 1.5px; margin: 8px 6px; font-size: 14px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); transition: all 0.3s; }
            .info-text { font-size: 14px; color: #b3b3b3; line-height: 1.7; margin: 25px 0; }
            .info-text strong { color: #ffffff; }
            .closing { margin-top: 40px; font-size: 15px; color: #ffffff; }
            .footer { background: #000000; padding: 30px 40px; text-align: center; border-top: 1px solid #1f1f1f; }
            .footer-text { font-size: 13px; color: #b3b3b3; line-height: 1.8; }
            .footer-brand { font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 4px; letter-spacing: 2px; }
            @media only screen and (max-width: 600px) {
              .content, .footer { padding: 30px 20px !important; }
              .header { padding: 40px 20px !important; }
              .logo { font-size: 24px !important; }
              .total-value { font-size: 32px !important; }
              .cta-button { display: block; margin: 10px 0 !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CADIZ & LLUIS</div>
              <div class="tagline">Luxury Living</div>
              <div class="badge">Service Quote</div>
            </div>
            <div class="content">
              <p class="greeting">Dear <strong>${quote.client_name}</strong>,</p>
              <p class="greeting">Thank you for your interest in our luxury services. We're delighted to present your personalized quote below:</p>

              <div class="quote-info">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Quote Number</div>
                    <div class="info-value accent">${quote.quote_number}</div>
                  </div>
                  <div class="info-item right">
                    <div class="info-label">Valid Until</div>
                    <div class="info-value">${formatDate(quote.expiration_date)}</div>
                  </div>
                </div>
              </div>

              <h3 class="section-title">Services Included</h3>
              <table>
                ${serviceItemsHtml}
              </table>

              <div class="total-box">
                <div class="total-label">Total Quote</div>
                <div class="total-value">${formatCurrency(quote.total)}</div>
              </div>

              ${quote.notes ? `
                <div class="notes-box">
                  <div class="notes-label">Additional Notes</div>
                  <p class="notes-text">${quote.notes}</p>
                </div>
              ` : ''}

              <div class="cta-container">
                <a href="${quoteUrl}" class="cta-button">View Quote Online</a>
              </div>

              <p class="info-text">
                This quote is valid until <strong>${formatDate(quote.expiration_date)}</strong>.
                Please view the quote online to accept or decline, or contact us if you have any questions.
              </p>

              <p class="closing">
                Best regards,<br>
                <strong>The Cadiz & Lluis Team</strong>
              </p>
            </div>
            <div class="footer">
              <p class="footer-brand">Cadiz & Lluis · Luxury Living</p>
              <p class="footer-text">
                ${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}<br>
                For any inquiries, please contact us at the email above.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Service Quote ${quote.quote_number} - Cadiz & Lluis

Dear ${quote.client_name},

Thank you for your interest in our luxury services. Please find your personalized quote below:

Quote Number: ${quote.quote_number}
Valid Until: ${formatDate(quote.expiration_date)}

Services:
${(serviceItems || []).map((item: QuoteServiceItem) => `- ${item.service_name}: ${formatCurrency(item.price)}`).join('\n')}

Total: ${formatCurrency(quote.total)}

${quote.notes ? `Notes: ${quote.notes}` : ''}

View your quote online: ${quoteUrl}

This quote is valid until ${formatDate(quote.expiration_date)}.

Best regards,
The Cadiz & Lluis Team

${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}
    `,
  }

    await transporter.sendMail(mailOptions)

    // Update quote status to sent if it was draft
    if (quote.status === 'draft') {
      await supabase
        .from('quotes')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send quote email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to send email' }
  }
}

// Convert an accepted quote to an invoice
export async function convertQuoteToInvoice(quoteId: string) {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Get quote with service items
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (quoteError || !quote) {
    return { error: 'Quote not found' }
  }

  // Verify quote is accepted and not already converted
  if (quote.status !== 'accepted') {
    return { error: 'Only accepted quotes can be converted to invoices' }
  }

  if (quote.converted_to_invoice_id) {
    return { error: 'This quote has already been converted to an invoice' }
  }

  // Get service items
  const { data: serviceItems, error: itemsError } = await supabase
    .from('quote_service_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: true })

  if (itemsError) {
    return { error: itemsError.message }
  }

  // Generate invoice number
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (invoices && invoices.length > 0) {
    const lastNumber = invoices[0].invoice_number
    const match = lastNumber.match(/INV-\d{4}-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  const invoiceNumber = `${prefix}${nextNumber.toString().padStart(3, '0')}`

  // Set due date to 30 days from now
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  // Create invoice (no tax for quotes conversion - can be adjusted in edit)
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      manager_id: managerProfile.id,
      client_name: quote.client_name,
      client_email: quote.client_email,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal: quote.subtotal,
      tax_rate: 0,
      tax_amount: 0,
      total: quote.total,
      notes: quote.notes ? `Converted from Quote ${quote.quote_number}\n\n${quote.notes}` : `Converted from Quote ${quote.quote_number}`,
      source_quote_id: quoteId,
    })
    .select()
    .single()

  if (invoiceError) {
    return { error: invoiceError.message }
  }

  // Convert service items to line items (without photos)
  if (serviceItems && serviceItems.length > 0) {
    const lineItems = serviceItems.map((item: QuoteServiceItem) => ({
      invoice_id: invoice.id,
      description: item.description ? `${item.service_name} - ${item.description}` : item.service_name,
      quantity: 1,
      unit_price: item.price,
      total: item.price,
    }))

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItems)

    if (lineItemsError) {
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return { error: lineItemsError.message }
    }
  }

  // Update quote with link to invoice
  const { error: updateError } = await supabase
    .from('quotes')
    .update({
      converted_to_invoice_id: invoice.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)

  if (updateError) {
    // Rollback invoice creation
    await supabase.from('invoice_line_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { error: updateError.message }
  }

  revalidatePath('/admin/quotes')
  revalidatePath('/admin/invoices')
  return { data: invoice }
}

// Send quote email to client
async function sendQuoteEmail(data: {
  clientName: string
  clientEmail: string
  quoteNumber: string
  expirationDate: string
  total: number
  managerName: string
}) {
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/quote/${data.quoteNumber}`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: data.clientEmail,
    subject: `New Quote ${data.quoteNumber} from ${data.managerName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 0; background-color: #000000; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; }
            .header { background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%); color: white; padding: 50px 40px; text-align: center; border-bottom: 1px solid #1f1f1f; }
            .logo { font-size: 32px; font-weight: 800; letter-spacing: 6px; margin-bottom: 8px; color: #ffffff; text-transform: uppercase; }
            .tagline { font-size: 13px; letter-spacing: 5px; color: #d9d9d9; text-transform: uppercase; font-weight: 600; }
            .badge { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 2px; margin-top: 20px; text-transform: uppercase; }
            .content { background: #0a0a0a; padding: 45px 40px; }
            .greeting { font-size: 16px; color: #ffffff; margin-bottom: 24px; }
            .greeting strong { color: #ffffff; }
            .detail-box { background: linear-gradient(135deg, #0F1D33 0%, #081421 100%); padding: 28px; border-radius: 12px; margin: 30px 0; border: 1px solid #1f1f1f; }
            .detail-row { padding: 16px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
            .detail-row:last-child { border-bottom: none; }
            .detail-row .label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #b3b3b3; margin-bottom: 6px; }
            .detail-row .value { font-size: 16px; font-weight: 600; color: #ffffff; }
            .detail-row.total { padding-top: 18px; margin-top: 12px; border-top: 2px solid #ffffff; border-bottom: none; }
            .detail-row.total .label { color: #b3b3b3; }
            .detail-row.total .value { font-weight: 800; font-size: 22px; color: #ffffff; }
            .cta-container { text-align: center; margin: 35px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000 !important; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; letter-spacing: 1.5px; font-size: 14px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); }
            .info-text { font-size: 14px; color: #b3b3b3; line-height: 1.7; margin: 25px 0; }
            .closing { margin-top: 40px; font-size: 15px; color: #ffffff; }
            .footer { background: #000000; padding: 30px 40px; text-align: center; border-top: 1px solid #1f1f1f; }
            .footer-text { font-size: 13px; color: #b3b3b3; line-height: 1.8; }
            .footer-brand { font-weight: 700; color: #ffffff; font-size: 14px; margin-bottom: 4px; letter-spacing: 2px; }
            @media only screen and (max-width: 600px) {
              .content, .footer { padding: 30px 20px !important; }
              .header { padding: 40px 20px !important; }
              .logo { font-size: 24px !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CADIZ & LLUIS</div>
              <div class="tagline">Luxury Living</div>
              <div class="badge">New Quote</div>
            </div>
            <div class="content">
              <p class="greeting">Dear <strong>${data.clientName}</strong>,</p>
              <p class="greeting">You have received a new quote from <strong>${data.managerName}</strong>. Please review the details below:</p>

              <div class="detail-box">
                <div class="detail-row">
                  <div class="label">Quote Number</div>
                  <div class="value">${data.quoteNumber}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Valid Until</div>
                  <div class="value">${formatDate(data.expirationDate)}</div>
                </div>
                <div class="detail-row total">
                  <div class="label">Total Amount</div>
                  <div class="value">${formatCurrency(data.total)}</div>
                </div>
              </div>

              <div class="cta-container">
                <a href="${quoteUrl}" class="cta-button">View Quote</a>
              </div>

              <p class="info-text">
                Click the button above to review your quote and accept or decline.
                If you have any questions, please feel free to contact us.
              </p>

              <p class="closing">
                Best regards,<br>
                <strong>${data.managerName}</strong>
              </p>
            </div>
            <div class="footer">
              <p class="footer-brand">Cadiz & Lluis · Luxury Living</p>
              <p class="footer-text">
                ${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}<br>
                For any inquiries, please contact us at the email above.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
New Quote ${data.quoteNumber}

Dear ${data.clientName},

You have received a new quote from ${data.managerName}.

Quote Number: ${data.quoteNumber}
Valid Until: ${formatDate(data.expirationDate)}
Total Amount: ${formatCurrency(data.total)}

To review and respond to your quote, please visit:
${quoteUrl}

Best regards,
${data.managerName}

Cadiz & Lluis - Luxury Living
${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}
    `,
  }

  await transporter.sendMail(mailOptions)
}
