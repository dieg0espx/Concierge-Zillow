import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/server'

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

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

    // Get PDF customization if available
    const customization = quote.pdf_customization || {}

    // Create PDF with jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Colors
    const primaryColor = '#1a1a2e'
    const accentColor = '#c9a227'
    const textColor = '#2d2d2d'
    const lightTextColor = '#6b6b6b'

    // Header
    doc.setFillColor(primaryColor)
    doc.rect(0, 0, pageWidth, 45, 'F')

    // Company name
    doc.setTextColor('#ffffff')
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('CADIZ & LLUIS', margin, 22)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(accentColor)
    doc.text('LUXURY LIVING', margin, 30)

    // Quote number on right
    doc.setTextColor('#ffffff')
    doc.setFontSize(12)
    doc.text(quote.quote_number, pageWidth - margin, 22, { align: 'right' })
    doc.setFontSize(9)
    doc.text(formatDate(quote.created_at), pageWidth - margin, 30, { align: 'right' })

    yPos = 60

    // Title
    doc.setTextColor(primaryColor)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    const title = customization.header_title || 'Service Quote'
    doc.text(title, margin, yPos)
    yPos += 12

    if (customization.header_subtitle) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(lightTextColor)
      doc.text(customization.header_subtitle, margin, yPos)
      yPos += 10
    }

    yPos += 5

    // Client info box
    doc.setFillColor('#f8f8f8')
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, 'F')

    doc.setTextColor(lightTextColor)
    doc.setFontSize(9)
    doc.text('PREPARED FOR', margin + 5, yPos + 8)

    doc.setTextColor(textColor)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(quote.client_name, margin + 5, yPos + 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(lightTextColor)
    doc.text(quote.client_email, margin + 5, yPos + 25)

    // Valid until on right side
    doc.setTextColor(lightTextColor)
    doc.setFontSize(9)
    doc.text('VALID UNTIL', pageWidth - margin - 5, yPos + 8, { align: 'right' })
    doc.setTextColor(textColor)
    doc.setFontSize(11)
    doc.text(formatDate(quote.expiration_date), pageWidth - margin - 5, yPos + 18, { align: 'right' })

    yPos += 40

    // Services section
    doc.setTextColor(accentColor)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('SERVICES & EXPERIENCES', margin, yPos)
    yPos += 8

    // Draw line
    doc.setDrawColor(accentColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 10

    // Service items
    const items = serviceItems || []
    for (const item of items) {
      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }

      const override = customization.service_overrides?.[item.id]
      const displayName = override?.display_name || item.service_name
      const displayDescription = override?.display_description || item.description

      // Service name
      doc.setTextColor(textColor)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(displayName, margin, yPos)

      // Price on right
      doc.setTextColor(primaryColor)
      doc.text(formatCurrency(item.price), pageWidth - margin, yPos, { align: 'right' })
      yPos += 6

      // Description
      if (displayDescription) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(lightTextColor)

        // Word wrap description
        const splitDescription = doc.splitTextToSize(displayDescription, pageWidth - margin * 2 - 50)
        doc.text(splitDescription, margin, yPos)
        yPos += splitDescription.length * 5
      }

      // Custom details from override
      if (override?.details && override.details.length > 0) {
        yPos += 3
        doc.setFontSize(9)
        for (const detail of override.details) {
          doc.setTextColor(lightTextColor)
          doc.text(`${detail.label}: `, margin, yPos)
          doc.setTextColor(textColor)
          doc.text(detail.value, margin + 25, yPos)
          yPos += 5
        }
      }

      yPos += 10

      // Separator line
      doc.setDrawColor('#e5e5e5')
      doc.setLineWidth(0.2)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10
    }

    // Total section
    yPos += 5
    doc.setFillColor('#f8f8f8')
    doc.roundedRect(pageWidth - margin - 80, yPos, 80, 25, 3, 3, 'F')

    doc.setTextColor(lightTextColor)
    doc.setFontSize(10)
    doc.text('TOTAL', pageWidth - margin - 75, yPos + 10)

    doc.setTextColor(primaryColor)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(quote.total), pageWidth - margin - 5, yPos + 18, { align: 'right' })

    yPos += 35

    // Notes
    const notes = customization.custom_notes || quote.notes
    if (notes) {
      if (yPos > pageHeight - 50) {
        doc.addPage()
        yPos = margin
      }

      doc.setTextColor(accentColor)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('NOTES', margin, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(lightTextColor)
      const splitNotes = doc.splitTextToSize(notes, pageWidth - margin * 2)
      doc.text(splitNotes, margin, yPos)
      yPos += splitNotes.length * 5 + 10
    }

    // Footer
    const footerY = pageHeight - 15
    doc.setDrawColor('#e5e5e5')
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

    doc.setTextColor(lightTextColor)
    doc.setFontSize(8)
    doc.text('CADIZ & LLUIS  •  Luxury Living  •  brody@cadizlluis.com', margin, footerY)
    doc.text('www.cadizlluis.com', pageWidth - margin, footerY, { align: 'right' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quote_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: String(error) },
      { status: 500 }
    )
  }
}
