import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { QuoteWithItems, PDFCustomization, ServiceOverride } from '@/lib/actions/quotes'

// Register fonts for clean typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
})

// Clean white color palette - ticket style
const colors = {
  white: '#ffffff',
  background: '#f8f8f8',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  accent: '#3b82f6', // Blue accent for locations
  badgeBg: 'rgba(0, 0, 0, 0.6)', // Semi-transparent dark for badge
}

// Logo URL - using the black logo for white PDF background
const LOGO_URL = 'https://res.cloudinary.com/dku1gnuat/image/upload/v1765826144/concierge/CL_Black_LOGO.png'

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.text,
  },
  // Main ticket container
  ticketContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  // Top Header with Logo
  topHeader: {
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
    letterSpacing: 2,
    marginLeft: 10,
  },
  quoteInfo: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quoteDate: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Header
  header: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrapper: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Client info
  clientSection: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  clientLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.text,
  },
  clientEmail: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Service option card
  optionCard: {
    backgroundColor: colors.white,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderLight,
  },
  // Image section
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  // Badge overlay on image
  nameBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.badgeBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameBadgeArrow: {
    color: colors.white,
    fontSize: 8,
    marginRight: 4,
  },
  nameBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 600,
  },
  // Passenger badge
  passengerBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerText: {
    color: colors.text,
    fontSize: 8,
    fontWeight: 500,
  },
  // Trip details section
  tripDetails: {
    padding: 20,
    backgroundColor: colors.white,
  },
  dateText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  // Route section with codes
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routeEndpoint: {
    flex: 1,
  },
  routeEndpointLeft: {
    alignItems: 'flex-start',
  },
  routeEndpointRight: {
    alignItems: 'flex-end',
  },
  routeCode: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
  },
  routeLocation: {
    fontSize: 8,
    color: colors.accent,
    marginTop: 2,
  },
  // Route middle section (duration and arrow)
  routeMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  durationText: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 4,
  },
  routeArrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  routeArrow: {
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  // Price section
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 14,
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
  },
  priceLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Footer
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
    letterSpacing: 3,
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  footerContact: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 6,
  },
  // Notes section
  notesSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notesLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  // Terms section
  termsSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  termsTitle: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  termsText: {
    fontSize: 7,
    color: colors.textMuted,
    lineHeight: 1.5,
  },
  // Description (fallback when no route details)
  description: {
    fontSize: 9,
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: 14,
  },
  // Generic details grid (fallback)
  detailsGrid: {
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 8,
    color: colors.textMuted,
    width: 80,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 9,
    color: colors.text,
    fontWeight: 500,
    flex: 1,
  },
})

interface QuotePDFBuilderProps {
  quote: QuoteWithItems
  customization?: PDFCustomization | null
  companyInfo?: {
    name?: string
    tagline?: string
    phone?: string
    email?: string
    website?: string
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function QuotePDFBuilder({ quote, customization, companyInfo }: QuotePDFBuilderProps) {
  const company = {
    name: companyInfo?.name || 'CADIZ & LLUIS',
    tagline: companyInfo?.tagline || 'LUXURY LIVING',
    phone: companyInfo?.phone || '+1 (555) 123-4567',
    email: companyInfo?.email || 'brody@cadizlluis.com',
    website: companyInfo?.website || 'www.cadizlluis.com',
  }

  // Helper to get service override
  const getServiceOverride = (serviceId: string): ServiceOverride | undefined => {
    return customization?.service_overrides?.[serviceId]
  }

  // Helper to get images to display (max 2)
  const getDisplayImages = (serviceId: string, originalImages: string[]): string[] => {
    const override = getServiceOverride(serviceId)
    if (override?.display_images && override.display_images.length > 0) {
      return override.display_images.slice(0, 2)
    }
    return originalImages.slice(0, 2)
  }

  // Default terms
  const defaultTerms = `• All services are subject to availability at time of booking
• A deposit may be required to confirm your reservation
• Cancellation policies vary by service type
• Additional fees may apply for special requests or modifications
• Insurance and liability requirements apply to certain services`

  // Check if service has ticket-style route details
  const hasRouteDetails = (details: { label: string; value: string }[] | undefined): boolean => {
    if (!details) return false
    return details.some(d => d.label === 'Departure Code' || d.label === 'Arrival Code')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Ticket Container */}
        <View style={styles.ticketContainer}>
          {/* Top Header with Logo */}
          <View style={styles.topHeader}>
            <View style={styles.logoContainer}>
              <Image src={LOGO_URL} style={styles.logo} />
              <Text style={styles.brandName}>CADIZ & LLUIS</Text>
            </View>
            <View style={styles.quoteInfo}>
              <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
              <Text style={styles.quoteDate}>{formatDate(quote.created_at)}</Text>
            </View>
          </View>

          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {customization?.header_title || 'Private Quotes'}
            </Text>
            {customization?.header_subtitle && (
              <Text style={styles.headerSubtitle}>{customization.header_subtitle}</Text>
            )}
          </View>

          {/* Client Info */}
          <View style={styles.clientSection}>
            <Text style={styles.clientLabel}>Prepared For</Text>
            <Text style={styles.clientName}>{quote.client_name}</Text>
            <Text style={styles.clientEmail}>{quote.client_email}</Text>
          </View>

          {/* Service Options - Ticket Style */}
          {quote.service_items.map((item) => {
            const override = getServiceOverride(item.id)
            const displayImages = getDisplayImages(item.id, item.images || [])
            const displayName = override?.display_name || item.service_name
            const displayDescription = override?.display_description || item.description
            const details = override?.details || []

            // Extract specific route details
            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || ''
            const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || ''
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
            const duration = details.find(d => d.label === 'Duration')?.value || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || ''

            // Get non-route details for generic display
            const nonRouteDetails = details.filter(d =>
              !['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)
            )

            const showRouteStyle = hasRouteDetails(details)

            return (
              <View key={item.id} style={styles.optionCard} wrap={false}>
                {/* First Image with Name Badge */}
                {displayImages.length > 0 && (
                  <View style={styles.imageContainer}>
                    <Image src={displayImages[0]} style={styles.serviceImage} />
                    {/* Name Badge */}
                    <View style={styles.nameBadge}>
                      <Text style={styles.nameBadgeArrow}>→</Text>
                      <Text style={styles.nameBadgeText}>{displayName}</Text>
                    </View>
                  </View>
                )}

                {/* Second Image with Passenger Badge */}
                {displayImages.length > 1 && (
                  <View style={styles.imageContainer}>
                    <Image src={displayImages[1]} style={styles.serviceImage} />
                    {/* Passenger Badge */}
                    {passengers && (
                      <View style={styles.passengerBadge}>
                        <Text style={styles.passengerText}>{passengers} Passengers</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Trip Details Section */}
                <View style={styles.tripDetails}>
                  {/* Date */}
                  {dateDetail && (
                    <Text style={styles.dateText}>{dateDetail}</Text>
                  )}

                  {/* Route Section - Ticket Style (if has departure/arrival codes) */}
                  {showRouteStyle ? (
                    <View style={styles.routeSection}>
                      {/* From */}
                      <View style={[styles.routeEndpoint, styles.routeEndpointLeft]}>
                        <Text style={styles.routeCode}>{departureCode || 'TBD'}</Text>
                        {departureDetail && (
                          <Text style={styles.routeLocation}>{departureDetail}</Text>
                        )}
                      </View>

                      {/* Duration & Arrow */}
                      <View style={styles.routeMiddle}>
                        <Text style={styles.durationText}>{duration || '---'}</Text>
                        <View style={styles.routeArrowContainer}>
                          <View style={styles.routeLine} />
                          <Text style={styles.routeArrow}>→</Text>
                          <View style={styles.routeLine} />
                        </View>
                      </View>

                      {/* To */}
                      <View style={[styles.routeEndpoint, styles.routeEndpointRight]}>
                        <Text style={styles.routeCode}>{arrivalCode || 'TBD'}</Text>
                        {arrivalDetail && (
                          <Text style={styles.routeLocation}>{arrivalDetail}</Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Fallback: Show name if no images */}
                      {displayImages.length === 0 && (
                        <Text style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 10 }}>
                          {displayName}
                        </Text>
                      )}

                      {/* Generic Details Grid */}
                      {details.length > 0 && (
                        <View style={styles.detailsGrid}>
                          {details.map((detail, idx) => (
                            <View key={idx} style={styles.detailRow}>
                              <Text style={styles.detailLabel}>{detail.label}</Text>
                              <Text style={styles.detailValue}>{detail.value}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Description */}
                      {displayDescription && (
                        <Text style={styles.description}>{displayDescription}</Text>
                      )}
                    </>
                  )}

                  {/* Non-route custom details (even if using route style) */}
                  {showRouteStyle && nonRouteDetails.length > 0 && (
                    <View style={[styles.detailsGrid, { marginBottom: 14 }]}>
                      {nonRouteDetails.map((detail, idx) => (
                        <View key={idx} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{detail.label}</Text>
                          <Text style={styles.detailValue}>{detail.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Description (even if using route style) */}
                  {showRouteStyle && displayDescription && (
                    <Text style={[styles.description, { marginBottom: 14 }]}>{displayDescription}</Text>
                  )}

                  {/* Price */}
                  <View style={styles.priceSection}>
                    <Text style={styles.priceAmount}>{formatCurrency(item.price)}</Text>
                    <Text style={styles.priceLabel}>Total</Text>
                  </View>
                </View>
              </View>
            )
          })}

          {/* Notes */}
          {(customization?.custom_notes || quote.notes) && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>
                {customization?.custom_notes || quote.notes}
              </Text>
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              {customization?.custom_terms || defaultTerms}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>CADIZ & LLUIS</Text>
            <Text style={styles.footerTagline}>Luxury Living</Text>
            <Text style={styles.footerText}>
              Quote valid until {formatDate(quote.expiration_date)}
            </Text>
            <Text style={styles.footerContact}>
              {company.email} • {company.website}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default QuotePDFBuilder
