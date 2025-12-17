'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plane,
  Ship,
  Car,
  MapPin,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { getQuoteByNumber, acceptQuote, declineQuote, QuoteWithItems, QuoteStatus } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: FileText },
  sent: { label: 'Pending Response', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
  viewed: { label: 'Pending Response', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertCircle },
}

export default function QuoteViewPage() {
  const params = useParams()
  const quoteNumber = params?.number as string
  const { toast } = useToast()
  const [quote, setQuote] = useState<QuoteWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ itemIndex: number; imageIndex: number } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const pdfPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadQuote() {
      if (!quoteNumber) return

      const { data, error } = await getQuoteByNumber(quoteNumber)
      if (error) {
        setError(error)
      } else {
        setQuote(data)
      }
      setIsLoading(false)
    }

    loadQuote()
  }, [quoteNumber])

  const handleAccept = async () => {
    if (!quote) return
    setIsSubmitting(true)

    const result = await acceptQuote(quote.quote_number)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote Accepted',
        description: 'We will be in touch shortly to finalize your booking.',
      })
      setQuote({ ...quote, status: 'accepted' })
    }

    setIsSubmitting(false)
    setAcceptDialogOpen(false)
  }

  const handleDecline = async () => {
    if (!quote) return
    setIsSubmitting(true)

    const result = await declineQuote(quote.quote_number)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Quote Declined',
        description: 'Thank you for letting us know.',
      })
      setQuote({ ...quote, status: 'declined' })
    }

    setIsSubmitting(false)
    setDeclineDialogOpen(false)
  }

  // Helper function to convert oklch/oklab colors to hex
  const convertToHex = (color: string): string => {
    if (!color) return '#000000'
    if (color.startsWith('#')) return color
    if (color.includes('oklch') || color.includes('oklab')) {
      // Map common oklch/oklab values to hex equivalents
      // Whites and near-whites
      if (color.includes('0.985') || color.includes('0.99') || color.includes('0.98')) return '#ffffff'
      if (color.includes('0.967') || color.includes('0.97') || color.includes('0.96')) return '#f3f4f6'
      if (color.includes('0.928') || color.includes('0.93') || color.includes('0.92')) return '#e5e7eb'
      // Grays
      if (color.includes('0.872') || color.includes('0.87') || color.includes('0.86')) return '#d1d5db'
      if (color.includes('0.704') || color.includes('0.70') || color.includes('0.71')) return '#9ca3af'
      if (color.includes('0.556') || color.includes('0.55') || color.includes('0.56') || color.includes('0.54')) return '#6b7280'
      if (color.includes('0.446') || color.includes('0.45') || color.includes('0.44')) return '#4b5563'
      if (color.includes('0.37') || color.includes('0.38') || color.includes('0.36')) return '#374151'
      if (color.includes('0.21') || color.includes('0.22') || color.includes('0.20')) return '#1f2937'
      if (color.includes('0.129') || color.includes('0.13') || color.includes('0.14') || color.includes('0.15')) return '#111827'
      // Blues
      if (color.includes('0.588') && color.includes('250')) return '#3b82f6'
      if (color.includes('0.59') || color.includes('0.58')) return '#3b82f6'
      // Greens (for car mode indicators)
      if (color.includes('142') || color.includes('145') || color.includes('140')) return '#22c55e' // green-500
      if (color.includes('0.64') && color.includes('14')) return '#22c55e' // green-500
      if (color.includes('0.72') && color.includes('14')) return '#4ade80' // green-400
      // Reds
      if (color.includes('0.63') && color.includes('25')) return '#ef4444' // red-500
      if (color.includes('0.50') && color.includes('25')) return '#dc2626' // red-600
      // Default fallbacks based on lightness
      const match = color.match(/oklch\s*\(\s*([\d.]+)/)
      if (match) {
        const lightness = parseFloat(match[1])
        if (lightness > 0.9) return '#ffffff'
        if (lightness > 0.8) return '#e5e7eb'
        if (lightness > 0.7) return '#d1d5db'
        if (lightness > 0.6) return '#9ca3af'
        if (lightness > 0.5) return '#6b7280'
        if (lightness > 0.4) return '#4b5563'
        if (lightness > 0.3) return '#374151'
        if (lightness > 0.2) return '#1f2937'
        return '#111827'
      }
      return '#000000'
    }
    if (color.startsWith('rgba') || color.startsWith('rgb')) return color
    if (color === 'transparent') return 'transparent'
    return color
  }

  const handleDownloadPDF = async () => {
    if (!quote || !pdfPreviewRef.current) return

    setIsDownloading(true)

    try {
      const ticketElement = pdfPreviewRef.current.querySelector('.pdf-ticket') as HTMLElement

      if (!ticketElement) {
        throw new Error('Could not find ticket preview element')
      }

      // Wait for images to load
      const images = ticketElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      // Store original styles to restore later
      const originalStyles: Map<HTMLElement, string> = new Map()

      // Apply inline hex colors to ALL elements
      const allElements = ticketElement.querySelectorAll('*')
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          const computed = window.getComputedStyle(el)
          const bgColor = computed.backgroundColor
          if (bgColor) el.style.backgroundColor = convertToHex(bgColor)
          const textColor = computed.color
          if (textColor) el.style.color = convertToHex(textColor)
          const borderColor = computed.borderColor
          if (borderColor) el.style.borderColor = convertToHex(borderColor)
        }
      })

      originalStyles.set(ticketElement, ticketElement.style.cssText)
      const rootComputed = window.getComputedStyle(ticketElement)
      ticketElement.style.backgroundColor = convertToHex(rootComputed.backgroundColor)
      ticketElement.style.color = convertToHex(rootComputed.color)

      // Fix image containers
      const imageContainers = ticketElement.querySelectorAll('.h-48')
      imageContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          const rect = container.getBoundingClientRect()
          originalStyles.set(container, container.style.cssText)
          container.style.width = rect.width + 'px'
          container.style.height = rect.height + 'px'
          container.style.overflow = 'hidden'
        }
      })

      // Fix all images
      const allImgs = ticketElement.querySelectorAll('img')
      allImgs.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const rect = img.getBoundingClientRect()
          const computed = window.getComputedStyle(img)
          originalStyles.set(img, img.style.cssText)

          const isLogo = computed.objectFit === 'contain' || img.alt === 'Cadiz & Lluis'

          if (isLogo) {
            img.style.maxWidth = rect.width + 'px'
            img.style.maxHeight = rect.height + 'px'
            img.style.width = 'auto'
            img.style.height = 'auto'
            img.style.objectFit = 'contain'
          } else {
            const parent = img.parentElement
            if (parent) {
              const parentRect = parent.getBoundingClientRect()
              const imgNaturalWidth = img.naturalWidth || rect.width
              const imgNaturalHeight = img.naturalHeight || rect.height
              const containerRatio = parentRect.width / parentRect.height
              const imageRatio = imgNaturalWidth / imgNaturalHeight

              if (imageRatio > containerRatio) {
                const scaledWidth = parentRect.height * imageRatio
                img.style.width = scaledWidth + 'px'
                img.style.height = parentRect.height + 'px'
                img.style.marginLeft = -((scaledWidth - parentRect.width) / 2) + 'px'
                img.style.marginTop = '0'
              } else {
                const scaledHeight = parentRect.width / imageRatio
                img.style.width = parentRect.width + 'px'
                img.style.height = scaledHeight + 'px'
                img.style.marginTop = -((scaledHeight - parentRect.height) / 2) + 'px'
                img.style.marginLeft = '0'
              }
              img.style.objectFit = 'none'
              img.style.maxWidth = 'none'
              img.style.maxHeight = 'none'
            }
          }
        }
      })

      // Fix badge alignment
      const badges = ticketElement.querySelectorAll('.rounded-full')
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          originalStyles.set(badge, badge.style.cssText)

          const spans = badge.querySelectorAll('span')
          spans.forEach((span) => {
            if (span instanceof HTMLElement) {
              originalStyles.set(span, span.style.cssText)
              span.style.position = 'relative'
              span.style.top = '-5px'
            }
          })

          const svgs = badge.querySelectorAll('svg')
          svgs.forEach((svg) => {
            if (svg instanceof SVGElement) {
              const svgEl = svg as unknown as HTMLElement
              originalStyles.set(svgEl, svgEl.style.cssText)
              svg.style.position = 'relative'
              svg.style.top = '0px'
            }
          })
        }
      })

      // Fix text alignment in boarding pass and card sections for html2canvas
      // Move ALL text elements up by 4px for proper PDF rendering
      const allTextElements = ticketElement.querySelectorAll('p, span')
      allTextElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          el.style.position = 'relative'
          el.style.top = '-4px'
        }
      })

      // Fix passenger count badge text
      const passengerCountElements = ticketElement.querySelectorAll('.passenger-count')
      passengerCountElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-6px'
        }
      })

      // Fix display name badge text
      const displayNameElements = ticketElement.querySelectorAll('.display-name')
      displayNameElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix display name arrow icon
      const displayNameArrowElements = ticketElement.querySelectorAll('.display-name-arrow')
      displayNameArrowElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Capture with html2canvas
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Convert any remaining oklch colors in the cloned document
          const allClonedElements = clonedDoc.querySelectorAll('*')
          allClonedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computed = window.getComputedStyle(el)
              if (computed.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = convertToHex(computed.backgroundColor)
              }
              if (computed.color?.includes('oklch')) {
                el.style.color = convertToHex(computed.color)
              }
              if (computed.borderColor?.includes('oklch')) {
                el.style.borderColor = convertToHex(computed.borderColor)
              }
            }
          })
        },
      })

      // Restore original styles
      originalStyles.forEach((originalStyle, el) => {
        el.style.cssText = originalStyle
      })

      // Create PDF
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = 106
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${quote.quote_number}.pdf`)

      toast({
        title: 'PDF Downloaded',
        description: `Quote ${quote.quote_number} has been downloaded.`,
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading quote...</span>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center max-w-md">
          <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Quote Not Found</h2>
          <p className="text-white/70 mb-4">{error || 'The quote you\'re looking for doesn\'t exist'}</p>
        </Card>
      </div>
    )
  }

  const config = statusConfig[quote.status]
  const StatusIcon = config.icon
  const isExpired = quote.status === 'expired' ||
    ((quote.status === 'sent' || quote.status === 'viewed') && new Date(quote.expiration_date) < new Date())
  const canRespond = (quote.status === 'sent' || quote.status === 'viewed') && !isExpired

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shimmer">
                <Logo />
              </div>
              <div className="flex flex-col">
                <div className="luxury-heading text-lg tracking-widest text-white">
                  LUXURY LIVING
                </div>
                <div className="text-[10px] tracking-[0.2em] text-white/70 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </div>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              size="sm"
              disabled={isDownloading}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Quote Header */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="luxury-heading text-3xl sm:text-4xl text-white tracking-wide mb-2">
                  Service Quote
                </h1>
                <p className="text-white/60 font-mono text-lg">{quote.quote_number}</p>
              </div>
              <Badge className={`${config.color} border text-base px-4 py-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {isExpired ? 'Expired' : config.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Prepared For</p>
                    <p className="text-white font-medium">{quote.client_name}</p>
                    <p className="text-white/70">{quote.client_email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Valid Until</p>
                    <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(quote.expiration_date)}
                      {isExpired && ' (Expired)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Items */}
        <div className="space-y-6 mb-8">
          {quote.service_items.map((item, itemIndex) => {
            const override = quote.pdf_customization?.service_overrides?.[item.id]
            const details = override?.details || []
            const headerIcon = quote.pdf_customization?.header_icon || 'plane'
            const displayName = override?.display_name || item.service_name
            const displayDescription = override?.display_description || item.description || ''

            // Extract common details
            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || ''
            const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || ''
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
            const duration = details.find(d => d.label === 'Duration')?.value || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || ''
            const departureMarina = details.find(d => d.label === 'Departure Marina')?.value || ''
            const destination = details.find(d => d.label === 'Destination')?.value || ''
            const guests = details.find(d => d.label === 'Guests')?.value || ''
            const pickup = details.find(d => d.label === 'Pickup')?.value || ''
            const dropoff = details.find(d => d.label === 'Dropoff')?.value || ''

            return (
              <Card key={item.id} className="glass-card-accent elevated-card border border-white/20 overflow-hidden">
                <CardContent className="p-0">
                  {/* Item Images */}
                  {item.images && item.images.length > 0 && (
                    <div className="relative">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                        {item.images.slice(0, 4).map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="aspect-[4/3] cursor-pointer relative overflow-hidden"
                            onClick={() => setSelectedImageIndex({ itemIndex, imageIndex: imgIndex })}
                          >
                            <img
                              src={imageUrl}
                              alt={`${item.service_name} photo ${imgIndex + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            {imgIndex === 3 && item.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-lg font-semibold">+{item.images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{displayName}</h3>
                        {displayDescription && (
                          <p className="text-white/70 whitespace-pre-wrap">{displayDescription}</p>
                        )}
                      </div>
                      <p className="text-white text-2xl font-bold">{formatCurrency(item.price)}</p>
                    </div>

                    {/* Date */}
                    {dateDetail && (
                      <div className="flex items-center gap-2 mb-4 text-white/60">
                        <Calendar className="h-4 w-4" />
                        <span>{dateDetail}</span>
                      </div>
                    )}

                    {/* Plane Mode - Flight Route */}
                    {headerIcon === 'plane' && (departureCode || arrivalCode) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">{departureCode || '---'}</p>
                            <p className="text-sm text-white/60">{departureDetail || 'Departure'}</p>
                          </div>
                          <div className="flex-1 px-4">
                            <div className="flex flex-col items-center">
                              {duration && <p className="text-xs text-white/50 mb-2">{duration}</p>}
                              <div className="flex items-center w-full">
                                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                <div className="flex-1 border-t-2 border-dashed border-white/20 mx-2 relative">
                                  <Plane className="h-4 w-4 text-white/60 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent" />
                                </div>
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-white">{arrivalCode || '---'}</p>
                            <p className="text-sm text-white/60">{arrivalDetail || 'Arrival'}</p>
                          </div>
                        </div>
                        {passengers && (
                          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                            <Users className="h-4 w-4 text-white/60" />
                            <span className="text-white/80">{passengers} Passengers</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Yacht Mode - Route */}
                    {headerIcon === 'yacht' && (departureMarina || destination) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white/20"></div>
                            <div className="w-0.5 h-12 bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-white/20"></div>
                          </div>
                          <div className="flex-1 space-y-6">
                            {departureMarina && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Departure Marina</p>
                                <p className="text-white font-medium">{departureMarina}</p>
                              </div>
                            )}
                            {destination && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Destination</p>
                                <p className="text-white font-medium">{destination}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {guests && (
                          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                            <Users className="h-4 w-4 text-white/60" />
                            <span className="text-white/80">{guests} Guests</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Car Mode - Route */}
                    {headerIcon === 'car' && (pickup || dropoff) && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white/20"></div>
                            <div className="w-0.5 h-12 bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-white border-2 border-white/20"></div>
                          </div>
                          <div className="flex-1 space-y-6">
                            {pickup && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Pickup</p>
                                <p className="text-white font-medium uppercase">{pickup}</p>
                              </div>
                            )}
                            {dropoff && (
                              <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider">Dropoff</p>
                                <p className="text-white font-medium uppercase">{dropoff}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Details Grid */}
                    {details.filter(d => {
                      if (!d.value || d.label === 'Date') return false
                      if (headerIcon === 'plane' && ['Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)) return false
                      if (headerIcon === 'yacht' && ['Departure Marina', 'Destination', 'Guests'].includes(d.label)) return false
                      if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                      return true
                    }).length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {details
                          .filter(d => {
                            if (!d.value || d.label === 'Date') return false
                            if (headerIcon === 'plane' && ['Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)) return false
                            if (headerIcon === 'yacht' && ['Departure Marina', 'Destination', 'Guests'].includes(d.label)) return false
                            if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                            return true
                          })
                          .map((detail, idx) => (
                            <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{detail.label}</p>
                              <p className="text-white font-medium">{detail.value}</p>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Total */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <span className="text-white text-xl font-semibold">Total</span>
              <span className="text-white text-3xl font-bold">{formatCurrency(quote.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {quote.notes && (
          <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
            <CardContent className="p-6">
              <h3 className="text-white/60 text-sm uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-white/80 whitespace-pre-wrap">{quote.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Response Buttons */}
        {canRespond && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setDeclineDialogOpen(true)}
              variant="outline"
              size="lg"
              className="border-white/30 hover:bg-red-500/10 hover:border-red-500/50 text-white px-8"
            >
              <ThumbsDown className="h-5 w-5 mr-2" />
              Decline Quote
            </Button>
            <Button
              onClick={() => setAcceptDialogOpen(true)}
              size="lg"
              className="btn-luxury px-8"
            >
              <ThumbsUp className="h-5 w-5 mr-2" />
              Accept Quote
            </Button>
          </div>
        )}

        {/* Already Responded */}
        {quote.status === 'accepted' && (
          <Card className="glass-card-accent border-green-500/30 bg-green-500/10">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Accepted</h3>
              <p className="text-white/70">
                {quote.converted_to_invoice_id
                  ? 'This quote has been converted to an invoice. You should receive the invoice shortly.'
                  : 'Thank you! We will be in touch shortly to finalize the details.'}
              </p>
            </CardContent>
          </Card>
        )}

        {quote.status === 'declined' && (
          <Card className="glass-card-accent border-red-500/30 bg-red-500/10">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Declined</h3>
              <p className="text-white/70">
                Thank you for letting us know. Feel free to contact us if you change your mind.
              </p>
            </CardContent>
          </Card>
        )}

        {isExpired && quote.status !== 'accepted' && quote.status !== 'declined' && (
          <Card className="glass-card-accent border-orange-500/30 bg-orange-500/10">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Quote Expired</h3>
              <p className="text-white/70">
                This quote has expired. Please contact us for an updated quote.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Accept Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Accept Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to accept this quote for {formatCurrency(quote.total)}?
              Our team will contact you to finalize the booking details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Accept Quote'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Dialog */}
      <AlertDialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <AlertDialogContent className="glass-card-accent border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Decline Quote</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to decline this quote? You can always request a new quote later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Decline Quote'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox */}
      {selectedImageIndex && quote.service_items[selectedImageIndex.itemIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              const item = quote.service_items[selectedImageIndex.itemIndex]
              const prevIndex = selectedImageIndex.imageIndex === 0
                ? item.images.length - 1
                : selectedImageIndex.imageIndex - 1
              setSelectedImageIndex({ ...selectedImageIndex, imageIndex: prevIndex })
            }}
            className="absolute left-4 p-2 text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <img
            src={quote.service_items[selectedImageIndex.itemIndex].images[selectedImageIndex.imageIndex]}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              const item = quote.service_items[selectedImageIndex.itemIndex]
              const nextIndex = selectedImageIndex.imageIndex === item.images.length - 1
                ? 0
                : selectedImageIndex.imageIndex + 1
              setSelectedImageIndex({ ...selectedImageIndex, imageIndex: nextIndex })
            }}
            className="absolute right-4 p-2 text-white/70 hover:text-white"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
          >
            <XCircle className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* Hidden PDF Preview for Download */}
      <div ref={pdfPreviewRef} className="fixed left-[-9999px] top-0" style={{ width: '400px' }}>
        <div className="pdf-ticket bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {/* Top Header with Logo - Navy Blue */}
          <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
            <img
              src="/logo/CL White LOGO.png"
              alt="Cadiz & Lluis"
              className="h-10 w-auto object-contain"
            />
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">{quote.quote_number}</p>
              <p className="text-[9px] text-white/50">
                {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Title Header - White Background */}
          <div className="bg-white p-4 text-center border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {quote.pdf_customization?.header_title || 'Private Quotes'}
            </h1>
            {quote.pdf_customization?.header_subtitle && (
              <p className="text-xs text-gray-500 mt-1">{quote.pdf_customization.header_subtitle}</p>
            )}
          </div>

          {/* Client Info */}
          <div className="bg-white px-5 pt-3 pb-6 border-b border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Prepared For</p>
            <p className="text-sm font-semibold text-gray-900">{quote.client_name}</p>
            <p className="text-xs text-gray-500">{quote.client_email}</p>
          </div>

          {/* Service Options */}
          {quote.service_items.map((item) => {
            const override = quote.pdf_customization?.service_overrides?.[item.id]
            const displayImages = override?.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
            const displayName = override?.display_name || item.service_name
            const displayDescription = override?.display_description || item.description || ''
            const details = override?.details || []
            const headerIcon = quote.pdf_customization?.header_icon || 'plane'

            // Extract details - Plane mode
            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || ''
            const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || ''
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
            const duration = details.find(d => d.label === 'Duration')?.value || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || ''

            // Extract details - Yacht mode
            const departureMarina = details.find(d => d.label === 'Departure Marina')?.value || ''
            const destination = details.find(d => d.label === 'Destination')?.value || ''
            const guests = details.find(d => d.label === 'Guests')?.value || ''

            // Extract details - Car mode
            const pickup = details.find(d => d.label === 'Pickup')?.value || ''
            const dropoff = details.find(d => d.label === 'Dropoff')?.value || ''

            // Extract details - Generic mode
            const location = details.find(d => d.label === 'Location')?.value || ''

            // Get guest/passenger count for badge
            const guestCount = passengers || guests || ''

            return (
              <div key={item.id} className="bg-white border-b-8 border-gray-100">
                {displayImages.length > 0 && (
                  <div className="relative">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={displayImages[0]}
                        alt="Main"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-lg leading-none">
                        <span className="leading-none display-name-arrow">→</span> <span className="leading-none display-name">{displayName}</span>
                      </div>
                    </div>

                    {displayImages[1] && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={displayImages[1]}
                          alt="Interior"
                          className="w-full h-full object-cover"
                        />
                        {guestCount && (
                          <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 shadow leading-none">
                            <User className="h-3 w-3 flex-shrink-0" /> <span className="leading-none passenger-count">{guestCount}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 bg-white">
                  {/* Description - shown for non-plane modes only (plane mode shows it inside boarding pass) */}
                  {displayDescription && headerIcon !== 'plane' && (
                    <p className="text-xs text-gray-600 mb-4 whitespace-pre-wrap">{displayDescription}</p>
                  )}

                  {/* Plane Mode - Boarding Pass Style */}
                  {headerIcon === 'plane' && (
                    <div className="mb-5 rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      {/* Boarding Pass Header */}
                      <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#111827' }}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="#ffffff" viewBox="0 0 24 24">
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                          </svg>
                          <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Boarding Pass</span>
                        </div>
                        {dateDetail && (
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{dateDetail}</span>
                        )}
                      </div>

                      {/* Main Flight Route Section */}
                      <div className="p-4" style={{ backgroundColor: '#ffffff' }}>
                        <div className="flex items-center justify-between">
                          {/* Departure */}
                          <div className="text-left flex-1">
                            <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>From</p>
                            <p className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>{departureCode || '---'}</p>
                            <p className="text-xs mt-1" style={{ color: '#6b7280', paddingBottom: '12px' }}>{departureDetail || 'Departure'}</p>
                          </div>

                          {/* Flight Path */}
                          <div className="flex-1 px-2">
                            <div className="flex flex-col items-center">
                              <p className="text-[10px] mb-2 font-medium" style={{ color: '#9ca3af' }}>{duration || '---'}</p>
                              <div className="flex items-center w-full">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#111827', border: '2px solid #e5e7eb' }}></div>
                                <div className="flex-1 mx-1 relative" style={{ borderTop: '2px dashed #d1d5db' }}>
                                  <svg className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: '#ffffff' }} fill="#374151" viewBox="0 0 24 24">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                                  </svg>
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9ca3af', border: '2px solid #e5e7eb' }}></div>
                              </div>
                            </div>
                          </div>

                          {/* Arrival */}
                          <div className="text-right flex-1">
                            <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>To</p>
                            <p className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>{arrivalCode || '---'}</p>
                            <p className="text-xs mt-1" style={{ color: '#6b7280', paddingBottom: '12px' }}>{arrivalDetail || 'Arrival'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Tear Line */}
                      <div className="relative h-4">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 rounded-r-full" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 rounded-l-full" style={{ backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb' }}></div>
                        <div className="absolute inset-x-5 top-1/2" style={{ borderTop: '2px dashed #d1d5db' }}></div>
                      </div>

                      {/* Additional Details Grid */}
                      <div className="p-4" style={{ backgroundColor: '#f9fafb' }}>
                        <div className="grid grid-cols-3 gap-3">
                          {passengers && (
                            <div className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                              <p className="text-[8px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Passengers</p>
                              <p className="text-lg font-bold" style={{ color: '#111827' }}>{passengers}</p>
                            </div>
                          )}
                          {details
                            .filter(d =>
                              d.value &&
                              !['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)
                            )
                            .map((detail, idx) => (
                              <div key={idx} className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                                <p className="text-[8px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>{detail.label}</p>
                                <p className="text-sm font-semibold" style={{ color: '#111827' }}>{detail.value}</p>
                              </div>
                            ))
                          }
                        </div>
                        {/* Description inside boarding pass */}
                        {displayDescription && (
                          <p className="text-xs mt-3 pt-3" style={{ color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>{displayDescription}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Date for non-plane modes */}
                  {headerIcon !== 'plane' && dateDetail && (
                    <p className="text-sm mb-3" style={{ color: '#6b7280' }}>{dateDetail}</p>
                  )}

                  {/* Yacht Mode - Route Style */}
                  {headerIcon === 'yacht' && (departureMarina || destination) && (
                    <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#3b82f6', border: '2px solid #ffffff' }}></div>
                          <div className="w-0.5 h-8" style={{ backgroundColor: '#e5e7eb' }}></div>
                          <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#111827', border: '2px solid #ffffff' }}></div>
                        </div>
                        <div className="flex-1 space-y-4">
                          {departureMarina && (
                            <div>
                              <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Departure Marina</p>
                              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{departureMarina}</p>
                            </div>
                          )}
                          {destination && (
                            <div>
                              <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Destination</p>
                              <p className="text-sm font-semibold" style={{ color: '#111827' }}>{destination}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Car Mode - Route Style */}
                  {headerIcon === 'car' && (pickup || dropoff) && (
                    <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#22c55e', border: '2px solid #ffffff' }}></div>
                          <div className="w-0.5 h-8" style={{ backgroundColor: '#e5e7eb' }}></div>
                          <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#111827', border: '2px solid #ffffff' }}></div>
                        </div>
                        <div className="flex-1 space-y-4">
                          {pickup && (
                            <div>
                              <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Pickup</p>
                              <p className="text-sm font-semibold uppercase" style={{ color: '#111827' }}>{pickup}</p>
                            </div>
                          )}
                          {dropoff && (
                            <div>
                              <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Dropoff</p>
                              <p className="text-sm font-semibold uppercase" style={{ color: '#111827' }}>{dropoff}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid for remaining details - non-plane modes */}
                  {headerIcon !== 'plane' && details.filter(d => {
                    if (!d.value || d.label === 'Date') return false
                    if (headerIcon === 'yacht' && ['Departure Marina', 'Destination'].includes(d.label)) return false
                    if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                    return true
                  }).length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2">
                      {details
                        .filter(d => {
                          if (!d.value || d.label === 'Date') return false
                          if (headerIcon === 'yacht' && ['Departure Marina', 'Destination'].includes(d.label)) return false
                          if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                          return true
                        })
                        .map((detail, idx) => (
                          <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                            <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>{detail.label}</p>
                            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{detail.value}</p>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  <div className="text-right pt-4 border-t border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.price)}
                    </p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Notes Section */}
          {quote.notes && (
            <div className="p-5" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
              <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: '#9ca3af' }}>Notes</p>
              <p className="text-xs whitespace-pre-wrap" style={{ color: '#374151' }}>{quote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-5 text-center" style={{ backgroundColor: '#111827' }}>
            <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#ffffff' }}>CADIZ & LLUIS</p>
            <p className="text-[10px] tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Luxury Living</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Quote valid until {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
              brody@cadizlluis.com • www.cadizlluis.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
