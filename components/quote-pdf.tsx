import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { QuoteWithItems } from '@/lib/actions/quotes'

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

// Luxury color palette (same as invoice)
const colors = {
  primary: '#1a1a2e',      // Deep navy
  accent: '#c9a227',       // Gold
  text: '#2d2d2d',         // Dark gray
  textLight: '#6b6b6b',    // Medium gray
  border: '#e5e5e5',       // Light gray
  background: '#ffffff',   // White
  backgroundAlt: '#f8f8f8', // Off-white
  quote: '#7c3aed',        // Purple for quote distinction
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
  // Quote Title
  quoteTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  quoteLabel: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.quote,
    letterSpacing: 2,
  },
  quoteNumber: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: 600,
    letterSpacing: 1,
  },
  // Quote Badge
  quoteBadge: {
    backgroundColor: colors.quote,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 20,
  },
  quoteBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
  // Service Items
  serviceSection: {
    marginBottom: 30,
  },
  serviceSectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceItem: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary,
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
  },
  serviceDescription: {
    fontSize: 10,
    color: colors.textLight,
    lineHeight: 1.6,
    marginBottom: 12,
  },
  // Service Images
  serviceImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceImage: {
    width: 120,
    height: 80,
    objectFit: 'cover',
    borderRadius: 4,
  },
  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
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
    marginBottom: 25,
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
  // Expiration Notice
  expirationSection: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  expirationTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expirationText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 1.5,
  },
  // Terms Section
  termsSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
  },
  termsTitle: {
    fontSize: 9,
    color: colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: 600,
  },
  termsText: {
    fontSize: 8,
    color: colors.textLight,
    lineHeight: 1.6,
  },
  // Response Section
  responseSection: {
    backgroundColor: colors.primary,
    padding: 25,
    borderRadius: 8,
    marginBottom: 30,
  },
  responseTitle: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  responseText: {
    fontSize: 10,
    color: colors.background,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  responseLink: {
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

interface QuotePDFProps {
  quote: QuoteWithItems
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
    case 'accepted':
      return { backgroundColor: '#dcfce7', color: '#166534' }
    case 'declined':
      return { backgroundColor: '#fee2e2', color: '#991b1b' }
    case 'expired':
      return { backgroundColor: '#fed7aa', color: '#9a3412' }
    case 'sent':
    case 'viewed':
      return { backgroundColor: '#dbeafe', color: '#1e40af' }
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' }
  }
}

export function QuotePDF({ quote, companyInfo }: QuotePDFProps) {
  const company = {
    name: companyInfo?.name || 'CADIZ & LLUIS',
    tagline: companyInfo?.tagline || 'LUXURY LIVING',
    phone: companyInfo?.phone || '+1 (555) 123-4567',
    email: companyInfo?.email || 'concierge@cadizlluis.com',
    address: companyInfo?.address || 'Beverly Hills, CA 90210',
    website: companyInfo?.website || 'www.cadizlluis.com',
  }

  const statusStyle = getStatusStyle(quote.status)
  const quoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${quote.quote_number}`
  const isExpired = new Date(quote.expiration_date) < new Date()

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

        {/* Quote Badge */}
        <View style={styles.quoteBadge}>
          <Text style={styles.quoteBadgeText}>Service Quote</Text>
        </View>

        {/* Quote Title */}
        <View style={styles.quoteTitle}>
          <Text style={styles.quoteLabel}>QUOTE</Text>
          <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsLabel}>Prepared For</Text>
            <Text style={styles.detailsText}>{quote.client_name}</Text>
            <Text style={styles.detailsTextLight}>{quote.client_email}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {quote.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.detailsColumn, { alignItems: 'flex-end' }]}>
            <Text style={styles.detailsLabel}>Quote Details</Text>
            <Text style={styles.detailsTextLight}>
              Issue Date: {formatDate(quote.created_at)}
            </Text>
            <Text style={[styles.detailsTextLight, isExpired ? { color: '#991b1b' } : {}]}>
              Valid Until: {formatDate(quote.expiration_date)}
              {isExpired && ' (EXPIRED)'}
            </Text>
            {quote.responded_at && (
              <Text style={[styles.detailsTextLight, { color: '#166534' }]}>
                Responded: {formatDate(quote.responded_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Service Items */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceSectionTitle}>Services & Experiences</Text>
          {quote.service_items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.serviceItem,
                index === quote.service_items.length - 1 && styles.serviceItemLast
              ]}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{item.service_name}</Text>
                <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
              </View>
              {item.description && (
                <Text style={styles.serviceDescription}>{item.description}</Text>
              )}
              {item.images && item.images.length > 0 && (
                <View style={styles.serviceImages}>
                  {item.images.slice(0, 3).map((imageUrl, imgIndex) => (
                    <Image
                      key={imgIndex}
                      src={imageUrl}
                      style={styles.serviceImage}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(quote.subtotal)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(quote.total)}</Text>
            </View>
          </View>
        </View>

        {/* Expiration Notice */}
        {quote.status !== 'accepted' && quote.status !== 'declined' && (
          <View style={styles.expirationSection}>
            <Text style={styles.expirationTitle}>Quote Validity</Text>
            <Text style={styles.expirationText}>
              This quote is valid until {formatDate(quote.expiration_date)}.
              Prices and availability are subject to change after this date.
              Please respond before the expiration date to secure these rates.
            </Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            • All services are subject to availability at time of booking{'\n'}
            • A deposit may be required to confirm your reservation{'\n'}
            • Cancellation policies vary by service type{'\n'}
            • Additional fees may apply for special requests or modifications{'\n'}
            • Insurance and liability requirements apply to certain services
          </Text>
        </View>

        {/* Response Section */}
        {quote.status !== 'accepted' && quote.status !== 'declined' && !isExpired && (
          <View style={styles.responseSection}>
            <Text style={styles.responseTitle}>Ready to Book?</Text>
            <Text style={styles.responseText}>
              Accept or decline this quote online:
            </Text>
            <Text style={styles.responseLink}>{quoteUrl}</Text>
            <Text style={[styles.responseText, { marginTop: 12 }]}>
              Or contact us directly to discuss your requirements.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for considering {company.name}
          </Text>
          <Text style={styles.footerAccent}>
            {company.tagline}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
