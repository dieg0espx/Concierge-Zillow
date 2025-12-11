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

// Email quote PDF to client
export async function emailQuotePDF(quoteId: string) {
  const supabase = await createClient()

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

  const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://luxury-concierge.vercel.app'}/quote/${quote.quote_number}`
  const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://luxury-concierge.vercel.app'}/api/quote/${quote.quote_number}/pdf`

  const serviceItemsHtml = (serviceItems || []).map((item: QuoteServiceItem) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e5e5;">
        <strong style="color: #1a1a2e;">${item.service_name}</strong>
        ${item.description ? `<br><span style="color: #6b6b6b; font-size: 13px;">${item.description}</span>` : ''}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600; color: #1a1a2e;">
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
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; letter-spacing: 3px; margin-bottom: 5px; }
            .tagline { font-size: 12px; letter-spacing: 4px; color: #c9a227; text-transform: uppercase; }
            .badge { display: inline-block; background: #7c3aed; color: white; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 2px; margin-top: 15px; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
            .quote-info { background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .total-box { background: #1a1a2e; color: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; }
            .total-label { font-size: 12px; letter-spacing: 2px; color: #c9a227; text-transform: uppercase; }
            .total-value { font-size: 32px; font-weight: bold; margin-top: 5px; }
            .cta-button { display: inline-block; background: #c9a227; color: #1a1a2e; padding: 15px 40px; border-radius: 4px; text-decoration: none; font-weight: bold; letter-spacing: 1px; margin: 10px 5px; }
            .cta-secondary { background: transparent; border: 2px solid #1a1a2e; color: #1a1a2e; }
            .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
            .footer-text { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CADIZ & LLUIS</div>
              <div class="tagline">Luxury Living</div>
              <div class="badge">SERVICE QUOTE</div>
            </div>
            <div class="content">
              <p>Dear ${quote.client_name},</p>
              <p>Thank you for your interest in our luxury services. Please find your personalized quote below:</p>

              <div class="quote-info">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <strong>Quote Number</strong><br>
                    <span style="color: #c9a227; font-weight: 600;">${quote.quote_number}</span>
                  </div>
                  <div style="text-align: right;">
                    <strong>Valid Until</strong><br>
                    <span>${formatDate(quote.expiration_date)}</span>
                  </div>
                </div>
              </div>

              <h3 style="color: #1a1a2e; border-bottom: 2px solid #c9a227; padding-bottom: 10px;">Services</h3>
              <table>
                ${serviceItemsHtml}
              </table>

              <div class="total-box">
                <div class="total-label">Total Quote</div>
                <div class="total-value">${formatCurrency(quote.total)}</div>
              </div>

              ${quote.notes ? `
                <div style="background: #f8f8f8; padding: 15px 20px; border-left: 4px solid #c9a227; border-radius: 4px; margin: 20px 0;">
                  <strong style="color: #c9a227; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Notes</strong>
                  <p style="margin: 8px 0 0 0; color: #6b6b6b;">${quote.notes}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${quoteUrl}" class="cta-button">View Quote Online</a>
                <a href="${pdfUrl}" class="cta-button cta-secondary">Download PDF</a>
              </div>

              <p style="color: #6b6b6b; font-size: 13px;">
                This quote is valid until ${formatDate(quote.expiration_date)}.
                Please accept or decline online, or contact us if you have any questions.
              </p>

              <p style="margin-top: 30px;">Best regards,<br><strong>The Cadiz & Lluis Team</strong></p>
            </div>
            <div class="footer">
              <p class="footer-text">
                <strong>Cadiz & Lluis - Luxury Living</strong><br>
                ${process.env.CONTACT_EMAIL || 'concierge@cadizlluis.com'}
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
Download PDF: ${pdfUrl}

This quote is valid until ${formatDate(quote.expiration_date)}.

Best regards,
The Cadiz & Lluis Team

${process.env.CONTACT_EMAIL || 'concierge@cadizlluis.com'}
    `,
  }

  try {
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
    return { error: 'Failed to send email' }
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
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; letter-spacing: 3px; margin-bottom: 5px; }
            .tagline { font-size: 12px; letter-spacing: 4px; color: #c9a227; text-transform: uppercase; }
            .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; }
            .detail-box { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #c9a227; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; gap: 20px; }
            .detail-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; padding-top: 15px; margin-top: 10px; border-top: 2px solid #1a1a2e; }
            .button { display: inline-block; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none; }
            .footer-text { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CADIZ & LLUIS</div>
              <div class="tagline">Luxury Living</div>
            </div>
            <div class="content">
              <p>Dear ${data.clientName},</p>
              <p>You have received a new quote from <strong>${data.managerName}</strong>.</p>

              <div class="detail-box">
                <div class="detail-row">
                  <span>Quote Number</span>
                  <span>${data.quoteNumber}</span>
                </div>
                <div class="detail-row">
                  <span>Valid Until</span>
                  <span>${formatDate(data.expirationDate)}</span>
                </div>
                <div class="detail-row">
                  <span>Total Amount</span>
                  <span>${formatCurrency(data.total)}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${quoteUrl}" class="button">View Quote</a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Click the button above to review your quote and accept or decline.
              </p>

              <p style="margin-top: 30px;">Best regards,<br><strong>${data.managerName}</strong></p>
            </div>
            <div class="footer">
              <p class="footer-text">
                <strong>Cadiz & Lluis - Luxury Living</strong><br>
                ${process.env.CONTACT_EMAIL || 'concierge@cadizlluis.com'}
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
${process.env.CONTACT_EMAIL || 'concierge@cadizlluis.com'}
    `,
  }

  await transporter.sendMail(mailOptions)
}
