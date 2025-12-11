import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Get service items
    const { data: serviceItems, error: itemsError } = await supabase
      .from('quote_service_items')
      .select('*')
      .eq('quote_id', quote.id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch service items' },
        { status: 500 }
      )
    }

    const quoteWithItems = {
      ...quote,
      service_items: serviceItems || [],
    }

    return NextResponse.json(quoteWithItems)
  } catch (error) {
    console.error('Quote data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote data' },
      { status: 500 }
    )
  }
}
