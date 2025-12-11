import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF } from '@/components/quote-pdf'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const quoteNumber = params.number
    const supabase = await createClient()

    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_number', quoteNumber)
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

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <QuotePDF quote={quoteWithItems} />
    )

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quoteNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
