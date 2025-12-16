'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentManagerProfile } from '@/lib/actions/clients'

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue'

export type InvoiceLineItem = {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export type Invoice = {
  id: string
  invoice_number: string
  manager_id: string
  client_name: string
  client_email: string
  due_date: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number | null
  tax_amount: number
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  viewed_at: string | null
  paid_at: string | null
  source_quote_id: string | null
}

export type InvoiceWithLineItems = Invoice & {
  line_items: InvoiceLineItem[]
}

// Generate unique invoice number (e.g., INV-2024-001)
async function generateInvoiceNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Get the highest invoice number for this year
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

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}

// Get all invoices for current manager
export async function getInvoices() {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found', data: [] }
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('manager_id', managerProfile.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  // Check for overdue invoices and update status
  const now = new Date()
  const updatedInvoices = invoices?.map((invoice: Invoice) => {
    if (invoice.status === 'sent' || invoice.status === 'viewed') {
      const dueDate = new Date(invoice.due_date)
      if (dueDate < now) {
        return { ...invoice, status: 'overdue' as InvoiceStatus }
      }
    }
    return invoice
  }) || []

  return { data: updatedInvoices as Invoice[] }
}

// Get single invoice with line items
export async function getInvoiceById(invoiceId: string) {
  const supabase = await createClient()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceError) {
    return { error: invoiceError.message, data: null }
  }

  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true })

  if (lineItemsError) {
    return { error: lineItemsError.message, data: null }
  }

  return {
    data: {
      ...invoice,
      line_items: lineItems || []
    } as InvoiceWithLineItems
  }
}

// Get invoice by number (for public payment page)
export async function getInvoiceByNumber(invoiceNumber: string) {
  const supabase = await createClient()

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .single()

  if (invoiceError) {
    return { error: invoiceError.message, data: null }
  }

  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('created_at', { ascending: true })

  if (lineItemsError) {
    return { error: lineItemsError.message, data: null }
  }

  // Mark as viewed if sent
  if (invoice.status === 'sent') {
    await supabase
      .from('invoices')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
  }

  return {
    data: {
      ...invoice,
      line_items: lineItems || []
    } as InvoiceWithLineItems
  }
}

// Create new invoice
export async function createInvoice(data: {
  client_name: string
  client_email: string
  due_date: string
  tax_rate?: number | null
  notes?: string | null
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
  }>
  status?: InvoiceStatus
}) {
  const supabase = await createClient()

  const { data: managerProfile, error: managerError } = await getCurrentManagerProfile()

  if (managerError || !managerProfile) {
    return { error: managerError || 'Manager profile not found' }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(supabase)

  // Calculate totals
  let subtotal = 0
  const processedLineItems = data.line_items.map(item => {
    const total = item.quantity * item.unit_price
    subtotal += total
    return { ...item, total }
  })

  const taxRate = data.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      manager_id: managerProfile.id,
      client_name: data.client_name,
      client_email: data.client_email,
      due_date: data.due_date,
      status: data.status || 'draft',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (invoiceError) {
    return { error: invoiceError.message }
  }

  // Create line items
  const lineItemsToInsert = processedLineItems.map(item => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }))

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert)

  if (lineItemsError) {
    // Rollback invoice creation
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { error: lineItemsError.message }
  }

  // Send email if status is 'sent'
  if (data.status === 'sent') {
    sendInvoiceEmail({
      clientName: data.client_name,
      clientEmail: data.client_email,
      invoiceNumber: invoiceNumber,
      dueDate: data.due_date,
      subtotal,
      taxRate,
      taxAmount,
      total,
      managerName: managerProfile.name,
    }).catch(err => console.error('Failed to send invoice email:', err))
  }

  revalidatePath('/admin/invoices')
  return { data: invoice }
}

// Update invoice (only drafts can be edited)
export async function updateInvoice(invoiceId: string, data: {
  client_name: string
  client_email: string
  due_date: string
  tax_rate?: number | null
  notes?: string | null
  status?: 'draft' | 'sent'
  line_items: Array<{
    id?: string
    description: string
    quantity: number
    unit_price: number
  }>
}) {
  const supabase = await createClient()

  // Verify invoice exists and is a draft
  const { data: existingInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('status, invoice_number')
    .eq('id', invoiceId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingInvoice.status !== 'draft') {
    return { error: 'Only draft invoices can be edited' }
  }

  // Get manager profile for email
  const { data: managerProfile } = await getCurrentManagerProfile()
  if (!managerProfile) {
    return { error: 'Manager profile not found' }
  }

  // Calculate totals
  let subtotal = 0
  const processedLineItems = data.line_items.map(item => {
    const total = item.quantity * item.unit_price
    subtotal += total
    return { ...item, total }
  })

  const taxRate = data.tax_rate || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  // Determine the new status
  const newStatus = data.status || 'draft'
  const updateData: any = {
    client_name: data.client_name,
    client_email: data.client_email,
    due_date: data.due_date,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total,
    notes: data.notes || null,
    updated_at: new Date().toISOString(),
  }

  // If status is changing to 'sent', add sent_at
  if (newStatus === 'sent') {
    updateData.status = 'sent'
    updateData.sent_at = new Date().toISOString()
  }

  // Update invoice
  const { error: updateError } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Delete existing line items
  await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId)

  // Create new line items
  const lineItemsToInsert = processedLineItems.map(item => ({
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }))

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert)

  if (lineItemsError) {
    return { error: lineItemsError.message }
  }

  // Send email if status is 'sent'
  if (newStatus === 'sent') {
    sendInvoiceEmail({
      clientName: data.client_name,
      clientEmail: data.client_email,
      invoiceNumber: existingInvoice.invoice_number,
      dueDate: data.due_date,
      subtotal,
      taxRate,
      taxAmount,
      total,
      managerName: managerProfile.name,
    }).catch(err => console.error('Failed to send invoice email:', err))
  }

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${invoiceId}/edit`)
  return { success: true }
}

// Delete invoice (only drafts can be deleted)
export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient()

  // Verify invoice exists and is a draft
  const { data: existingInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingInvoice.status !== 'draft') {
    return { error: 'Only draft invoices can be deleted' }
  }

  // Delete line items first
  await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId)

  // Delete invoice
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}

// Send invoice (change status from draft to sent)
export async function sendInvoice(invoiceId: string) {
  const supabase = await createClient()

  // Get invoice details and manager profile
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return { error: 'Invoice not found' }
  }

  const { data: managerProfile } = await getCurrentManagerProfile()
  if (!managerProfile) {
    return { error: 'Manager profile not found' }
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('status', 'draft')

  if (error) {
    return { error: error.message }
  }

  // Send email
  sendInvoiceEmail({
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    invoiceNumber: invoice.invoice_number,
    dueDate: invoice.due_date,
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate || 0,
    taxAmount: invoice.tax_amount || 0,
    total: invoice.total,
    managerName: managerProfile.name,
  }).catch(err => console.error('Failed to send invoice email:', err))

  revalidatePath('/admin/invoices')
  return { success: true }
}

// Mark invoice as paid (simulated payment)
export async function markInvoiceAsPaid(invoiceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}

// Simulated declined card numbers (matching Stripe test cards)
const DECLINED_CARDS: Record<string, string> = {
  '4000000000000002': 'Your card was declined. Please try a different card.',
  '4000000000009995': 'Your card has insufficient funds. Please try a different card.',
  '4000000000000069': 'Your card has expired. Please try a different card.',
  '4000000000000127': 'Incorrect CVV. Please check your card details and try again.',
  '4000000000000119': 'A processing error occurred. Please try again.',
}

// Process simulated payment
export async function processPayment(invoiceNumber: string, paymentDetails: {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}) {
  const supabase = await createClient()

  // Get full invoice details for email
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_number', invoiceNumber)
    .single()

  if (fetchError || !invoice) {
    return { error: 'Invoice not found' }
  }

  if (invoice.status === 'paid') {
    return { error: 'Invoice has already been paid' }
  }

  if (invoice.status === 'draft') {
    return { error: 'Invoice has not been sent yet' }
  }

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Check for simulated declined cards
  const cardNumber = paymentDetails.cardNumber.replace(/\s/g, '')
  const declineReason = DECLINED_CARDS[cardNumber]
  if (declineReason) {
    return { error: declineReason }
  }

  // Mark as paid
  const paidAt = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: paidAt,
      updated_at: paidAt,
    })
    .eq('id', invoice.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Send confirmation email (non-blocking)
  sendPaymentConfirmationEmail({
    clientName: invoice.client_name,
    clientEmail: invoice.client_email,
    invoiceNumber: invoice.invoice_number,
    subtotal: invoice.subtotal,
    taxRate: invoice.tax_rate || 0,
    taxAmount: invoice.tax_amount || 0,
    total: invoice.total,
    paidAt,
  }).catch(err => console.error('Failed to send confirmation email:', err))

  return { success: true }
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(data: {
  clientName: string
  clientEmail: string
  invoiceNumber: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  paidAt: string
}) {
  // Dynamic import to avoid issues with server actions
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
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invoice/${data.invoiceNumber}`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: data.clientEmail,
    subject: `Payment Confirmed - Invoice ${data.invoiceNumber}`,
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
            .badge { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000000; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 2px; margin-top: 20px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); }
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
              <div class="badge">✓ Payment Successful</div>
            </div>
            <div class="content">
              <p class="greeting">Dear <strong>${data.clientName}</strong>,</p>
              <p class="greeting">Thank you for your payment! This email confirms that we have successfully received your payment.</p>

              <div class="detail-box">
                <div class="detail-row">
                  <div class="label">Invoice Number</div>
                  <div class="value">${data.invoiceNumber}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Payment Date</div>
                  <div class="value">${formatDate(data.paidAt)}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Subtotal</div>
                  <div class="value">${formatCurrency(data.subtotal)}</div>
                </div>
                ${data.taxRate > 0 ? `
                <div class="detail-row">
                  <div class="label">Tax (${data.taxRate}%)</div>
                  <div class="value">${formatCurrency(data.taxAmount)}</div>
                </div>
                ` : ''}
                <div class="detail-row total">
                  <div class="label">Amount Paid</div>
                  <div class="value">${formatCurrency(data.total)}</div>
                </div>
              </div>

              <div class="cta-container">
                <a href="${invoiceUrl}" class="cta-button">View Paid Invoice</a>
              </div>

              <p class="info-text">
                Your payment has been processed successfully. If you have any questions about this transaction,
                please don't hesitate to reach out to us.
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
Payment Confirmation - Invoice ${data.invoiceNumber}

Dear ${data.clientName},

Thank you for your payment. This email confirms that we have received your payment.

Invoice Number: ${data.invoiceNumber}
Payment Date: ${formatDate(data.paidAt)}
Subtotal: ${formatCurrency(data.subtotal)}${data.taxRate > 0 ? `
Tax (${data.taxRate}%): ${formatCurrency(data.taxAmount)}` : ''}
Amount Paid: ${formatCurrency(data.total)}

If you have any questions about this payment, please don't hesitate to contact us.

Best regards,
The Cadiz & Lluis Team

Cadiz & Lluis - Luxury Living
${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send invoice email to client
async function sendInvoiceEmail(data: {
  clientName: string
  clientEmail: string
  invoiceNumber: string
  dueDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
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

  const paymentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invoice/${data.invoiceNumber}/pay`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: data.clientEmail,
    subject: `New Invoice ${data.invoiceNumber} - Cadiz & Lluis`,
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
              <div class="badge">New Invoice</div>
            </div>
            <div class="content">
              <p class="greeting">Dear <strong>${data.clientName}</strong>,</p>
              <p class="greeting">You have received a new invoice from <strong>${data.managerName}</strong>. Please review the details below:</p>

              <div class="detail-box">
                <div class="detail-row">
                  <div class="label">Invoice Number</div>
                  <div class="value">${data.invoiceNumber}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Due Date</div>
                  <div class="value">${formatDate(data.dueDate)}</div>
                </div>
                <div class="detail-row">
                  <div class="label">Subtotal</div>
                  <div class="value">${formatCurrency(data.subtotal)}</div>
                </div>
                ${data.taxRate > 0 ? `
                <div class="detail-row">
                  <div class="label">Tax (${data.taxRate}%)</div>
                  <div class="value">${formatCurrency(data.taxAmount)}</div>
                </div>
                ` : ''}
                <div class="detail-row total">
                  <div class="label">Total Amount</div>
                  <div class="value">${formatCurrency(data.total)}</div>
                </div>
              </div>

              <div class="cta-container">
                <a href="${paymentUrl}" class="cta-button">View & Pay Invoice</a>
              </div>

              <p class="info-text">
                Click the button above to view your full invoice details and make a secure payment online.
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
New Invoice ${data.invoiceNumber}

Dear ${data.clientName},

You have received a new invoice from ${data.managerName}.

Invoice Number: ${data.invoiceNumber}
Due Date: ${formatDate(data.dueDate)}
Subtotal: ${formatCurrency(data.subtotal)}${data.taxRate > 0 ? `
Tax (${data.taxRate}%): ${formatCurrency(data.taxAmount)}` : ''}
Total Amount: ${formatCurrency(data.total)}

To view and pay your invoice, please visit:
${paymentUrl}

Best regards,
${data.managerName}

Cadiz & Lluis - Luxury Living
${process.env.CONTACT_EMAIL || 'brody@cadizlluis.com'}
    `,
  }

  await transporter.sendMail(mailOptions)
}
