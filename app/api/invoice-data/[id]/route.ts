import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('created_at', { ascending: true })

    if (lineItemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch line items' },
        { status: 500 }
      )
    }

    const invoiceWithLineItems = {
      ...invoice,
      line_items: lineItems || [],
    }

    return NextResponse.json(invoiceWithLineItems)
  } catch (error) {
    console.error('Invoice data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice data' },
      { status: 500 }
    )
  }
}
