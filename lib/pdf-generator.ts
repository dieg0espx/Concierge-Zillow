'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Luxury color palette
const colors = {
  primary: '#1a1a2e',
  accent: '#c9a227',
  text: '#2d2d2d',
  textLight: '#6b6b6b',
  background: '#ffffff',
  border: '#e5e5e5',
}

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Header - Company Name
  doc.setFillColor(colors.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CADIZ & LLUIS', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('LUXURY LIVING', pageWidth / 2, 30, { align: 'center' })

  // Invoice Title
  doc.setTextColor(colors.primary)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 20, 60)

  // Invoice Details
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)

  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 75)
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 82)
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 89)

  // Bill To Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(colors.primary)
  doc.text('BILL TO:', pageWidth - 20, 75, { align: 'right' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)
  doc.text(invoice.client_name || '', pageWidth - 20, 82, { align: 'right' })
  doc.text(invoice.client_email || '', pageWidth - 20, 89, { align: 'right' })

  // Line Items Table
  const tableData = (invoice.line_items || []).map((item: any) => [
    item.description || '',
    item.quantity?.toString() || '1',
    `$${(item.unit_price || 0).toFixed(2)}`,
    `$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: 105,
    head: [['Description', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: colors.primary,
      textColor: '#ffffff',
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      textColor: colors.text,
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: '#f9f9f9',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 20, right: 20 },
  })

  // Calculate final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals Section
  const totalsX = pageWidth - 75
  let currentY = finalY

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)

  if (invoice.subtotal) {
    doc.text('Subtotal:', totalsX, currentY)
    doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  if (invoice.tax) {
    doc.text(`Tax (${invoice.tax_rate || 0}%):`, totalsX, currentY)
    doc.text(`$${invoice.tax.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  if (invoice.discount) {
    doc.text('Discount:', totalsX, currentY)
    doc.text(`-$${invoice.discount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  // Total with accent color
  currentY += 5
  doc.setDrawColor(colors.accent)
  doc.setLineWidth(0.5)
  doc.line(totalsX, currentY - 3, pageWidth - 20, currentY - 3)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(colors.primary)
  doc.text('TOTAL:', totalsX, currentY + 5)
  doc.text(`$${(invoice.total || 0).toFixed(2)}`, pageWidth - 20, currentY + 5, { align: 'right' })

  // Notes Section
  if (invoice.notes) {
    currentY += 25
    if (currentY > pageHeight - 40) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary)
    doc.text('NOTES:', 20, currentY)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(colors.text)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40)
    doc.text(splitNotes, 20, currentY + 7)
  }

  // Footer
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.textLight)
  doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 20, { align: 'center' })
  doc.text('For questions, please contact us at info@cadizlluis.com', pageWidth / 2, pageHeight - 15, { align: 'center' })

  return doc
}

export function generateQuotePDF(quote: any) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Header - Company Name
  doc.setFillColor(colors.primary)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CADIZ & LLUIS', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('LUXURY LIVING', pageWidth / 2, 30, { align: 'center' })

  // Quote Title
  doc.setTextColor(colors.primary)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTE', 20, 60)

  // Quote Details
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)

  doc.text(`Quote Number: ${quote.quote_number}`, 20, 75)
  doc.text(`Issue Date: ${new Date(quote.issue_date).toLocaleDateString()}`, 20, 82)
  doc.text(`Valid Until: ${new Date(quote.expiration_date).toLocaleDateString()}`, 20, 89)

  // Quote For Section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(colors.primary)
  doc.text('PREPARED FOR:', pageWidth - 20, 75, { align: 'right' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)
  doc.text(quote.client_name || '', pageWidth - 20, 82, { align: 'right' })
  doc.text(quote.client_email || '', pageWidth - 20, 89, { align: 'right' })

  // Service Items Table
  const tableData = (quote.service_items || []).map((item: any) => [
    item.service_name || '',
    item.description || '',
    item.quantity?.toString() || '1',
    `$${(item.unit_price || 0).toFixed(2)}`,
    `$${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: 105,
    head: [['Service', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: colors.primary,
      textColor: '#ffffff',
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      textColor: colors.text,
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: '#f9f9f9',
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 20, right: 20 },
  })

  // Calculate final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals Section
  const totalsX = pageWidth - 70
  let currentY = finalY

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.text)

  if (quote.subtotal) {
    doc.text('Subtotal:', totalsX, currentY)
    doc.text(`$${quote.subtotal.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  if (quote.tax) {
    doc.text(`Tax (${quote.tax_rate || 0}%):`, totalsX, currentY)
    doc.text(`$${quote.tax.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  if (quote.discount) {
    doc.text('Discount:', totalsX, currentY)
    doc.text(`-$${quote.discount.toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' })
    currentY += 7
  }

  // Total with accent color
  currentY += 5
  doc.setDrawColor(colors.accent)
  doc.setLineWidth(0.5)
  doc.line(totalsX, currentY - 3, pageWidth - 20, currentY - 3)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(colors.primary)
  doc.text('TOTAL:', totalsX, currentY + 5)
  doc.text(`$${(quote.total || 0).toFixed(2)}`, pageWidth - 20, currentY + 5, { align: 'right' })

  // Notes Section
  if (quote.notes) {
    currentY += 25
    if (currentY > pageHeight - 40) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(colors.primary)
    doc.text('NOTES:', 20, currentY)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(colors.text)
    const splitNotes = doc.splitTextToSize(quote.notes, pageWidth - 40)
    doc.text(splitNotes, 20, currentY + 7)
  }

  // Footer
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(colors.textLight)
  doc.text('This quote is valid until the expiration date shown above.', pageWidth / 2, pageHeight - 20, { align: 'center' })
  doc.text('For questions, please contact us at info@cadizlluis.com', pageWidth / 2, pageHeight - 15, { align: 'center' })

  return doc
}
