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
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (existingInvoice.status !== 'draft') {
    return { error: 'Only draft invoices can be edited' }
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

  // Update invoice
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      client_name: data.client_name,
      client_email: data.client_email,
      due_date: data.due_date,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
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

// Process simulated payment
export async function processPayment(invoiceNumber: string, paymentDetails: {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}) {
  const supabase = await createClient()

  // Get invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
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

  // Simulate payment processing (always succeeds for demo)
  // In production, this would integrate with Stripe
  await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay

  // Mark as paid
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}
