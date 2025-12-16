import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { InvoiceWithLineItems } from '@/lib/actions/invoices'

// Register fonts for luxury typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

// Luxury color palette
const colors = {
  primary: '#1a1a2e',      // Deep navy
  accent: '#c9a227',       // Gold
  text: '#2d2d2d',         // Dark gray
  textLight: '#6b6b6b',    // Medium gray
  border: '#e5e5e5',       // Light gray
  background: '#ffffff',   // White
  backgroundAlt: '#f8f8f8', // Off-white
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  logoSection: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  companyInfo: {
    textAlign: 'right',
    color: colors.textLight,
    fontSize: 9,
    lineHeight: 1.6,
  },
  // Invoice Title
  invoiceTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  invoiceLabel: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.primary,
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 600,
    letterSpacing: 1,
  },
  // Details Section
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  detailsColumn: {
    width: '45%',
  },
  detailsLabel: {
    fontSize: 8,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: 600,
  },
  detailsText: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 1.6,
    fontWeight: 500,
  },
  detailsTextLight: {
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.6,
  },
  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Table
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: colors.background,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.backgroundAlt,
  },
  tableCell: {
    fontSize: 10,
    color: colors.text,
  },
  tableCellDescription: {
    flex: 5,
  },
  tableCellQty: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellPrice: {
    flex: 2,
    textAlign: 'right',
  },
  tableCellTotal: {
    flex: 2,
    textAlign: 'right',
    fontWeight: 600,
  },
  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  totalsBox: {
    width: 250,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalsLabel: {
    fontSize: 10,
    color: colors.textLight,
  },
  totalsValue: {
    fontSize: 10,
    color: colors.text,
    fontWeight: 500,
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 12,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grandTotalValue: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 700,
  },
  // Notes
  notesSection: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  notesLabel: {
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: 600,
  },
  notesText: {
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.6,
  },
  // Payment Section
  paymentSection: {
    backgroundColor: colors.primary,
    padding: 25,
    borderRadius: 8,
    marginBottom: 30,
  },
  paymentTitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  paymentText: {
    fontSize: 10,
    color: colors.background,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  paymentLink: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: 600,
    marginTop: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: colors.textLight,
  },
  footerAccent: {
    fontSize: 8,
    color: colors.accent,
    fontWeight: 600,
    letterSpacing: 1,
  },
})

interface InvoicePDFProps {
  invoice: InvoiceWithLineItems
  companyInfo?: {
    name?: string
    tagline?: string
    phone?: string
    email?: string
    address?: string
    website?: string
  }
}

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

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return { backgroundColor: '#dcfce7', color: '#166534' }
    case 'overdue':
      return { backgroundColor: '#fee2e2', color: '#991b1b' }
    case 'sent':
    case 'viewed':
      return { backgroundColor: '#dbeafe', color: '#1e40af' }
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' }
  }
}

export function InvoicePDF({ invoice, companyInfo }: InvoicePDFProps) {
  const company = {
    name: companyInfo?.name || 'CADIZ & LLUIS',
    tagline: companyInfo?.tagline || 'LUXURY LIVING',
    phone: companyInfo?.phone || '+1 (555) 123-4567',
    email: companyInfo?.email || 'brody@cadizlluis.com',
    address: companyInfo?.address || 'Beverly Hills, CA 90210',
    website: companyInfo?.website || 'www.cadizlluis.com',
  }

  const statusStyle = getStatusStyle(invoice.status)
  const paymentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.invoice_number}/pay`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>{company.name}</Text>
            <Text style={styles.logoSubtext}>{company.tagline}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text>{company.phone}</Text>
            <Text>{company.email}</Text>
            <Text>{company.address}</Text>
            <Text>{company.website}</Text>
          </View>
        </View>

        {/* Invoice Title */}
        <View style={styles.invoiceTitle}>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsLabel}>Bill To</Text>
            <Text style={styles.detailsText}>{invoice.client_name}</Text>
            <Text style={styles.detailsTextLight}>{invoice.client_email}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {invoice.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.detailsColumn, { alignItems: 'flex-end' }]}>
            <Text style={styles.detailsLabel}>Invoice Details</Text>
            <Text style={styles.detailsTextLight}>
              Issue Date: {formatDate(invoice.created_at)}
            </Text>
            <Text style={styles.detailsTextLight}>
              Due Date: {formatDate(invoice.due_date)}
            </Text>
            {invoice.paid_at && (
              <Text style={[styles.detailsTextLight, { color: '#166534' }]}>
                Paid: {formatDate(invoice.paid_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellDescription]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellTotal]}>Amount</Text>
          </View>
          {invoice.line_items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.tableCellDescription]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.tableCellTotal]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.tax_rate && invoice.tax_rate > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({invoice.tax_rate}%)</Text>
                <Text style={styles.totalsValue}>{formatCurrency(invoice.tax_amount)}</Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Section */}
        {invoice.status !== 'paid' && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Instructions</Text>
            <Text style={styles.paymentText}>
              Pay online securely using our payment portal:
            </Text>
            <Text style={styles.paymentLink}>{paymentUrl}</Text>
            <Text style={[styles.paymentText, { marginTop: 12 }]}>
              We accept all major credit cards. Payment is due by {formatDate(invoice.due_date)}.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {company.name}
          </Text>
          <Text style={styles.footerAccent}>
            {company.tagline}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
