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
    if (color.startsWith('#')) return color
    if (color.includes('oklch') || color.includes('oklab')) {
      if (color.includes('0.985') || color.includes('0.99') || color.includes('0.98')) return '#ffffff'
      if (color.includes('0.129') || color.includes('0.13') || color.includes('0.14')) return '#111827'
      if (color.includes('0.967') || color.includes('0.97') || color.includes('0.96')) return '#f3f4f6'
      if (color.includes('0.21') || color.includes('0.22') || color.includes('0.20')) return '#1f2937'
      if (color.includes('0.37') || color.includes('0.38') || color.includes('0.36')) return '#374151'
      if (color.includes('0.446') || color.includes('0.45') || color.includes('0.44')) return '#4b5563'
      if (color.includes('0.556') || color.includes('0.55') || color.includes('0.56') || color.includes('0.54')) return '#6b7280'
      if (color.includes('0.704') || color.includes('0.70') || color.includes('0.71')) return '#9ca3af'
      if (color.includes('0.872') || color.includes('0.87') || color.includes('0.86')) return '#d1d5db'
      if (color.includes('0.928') || color.includes('0.93') || color.includes('0.92')) return '#e5e7eb'
      if (color.includes('0.588') && color.includes('250')) return '#3b82f6'
      const match = color.match(/[\d.]+/)
      if (match) {
        const lightness = parseFloat(match[0])
        if (lightness > 0.9) return '#ffffff'
        if (lightness > 0.7) return '#d1d5db'
        if (lightness > 0.5) return '#6b7280'
        if (lightness > 0.3) return '#374151'
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

      // Capture with html2canvas
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
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
          {quote.service_items.map((item, itemIndex) => (
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
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{item.service_name}</h3>
                      {item.description && (
                        <p className="text-white/70 whitespace-pre-wrap">{item.description}</p>
                      )}
                    </div>
                    <p className="text-white text-2xl font-bold">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

          {/* Service Options - Ticket Style */}
          {quote.service_items.map((item) => {
            const override = quote.pdf_customization?.service_overrides?.[item.id]
            const displayImages = override?.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
            const displayName = override?.display_name || item.service_name
            const details = override?.details || []

            const dateDetail = details.find(d => d.label === 'Date')?.value || ''
            const departureCode = details.find(d => d.label === 'Departure Code')?.value || 'TBD'
            const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
            const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || 'TBD'
            const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
            const duration = details.find(d => d.label === 'Duration')?.value || ''
            const passengers = details.find(d => d.label === 'Passengers')?.value || ''

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
                      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-lg leading-none">
                        <span className="leading-none">→</span> <span className="leading-none">{displayName}</span>
                      </div>
                    </div>

                    {displayImages[1] && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={displayImages[1]}
                          alt="Interior"
                          className="w-full h-full object-cover"
                        />
                        {passengers && (
                          <div className="absolute top-3 right-3 bg-white/50 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 shadow leading-none">
                            <User className="h-3 w-3 flex-shrink-0" /> <span className="leading-none">{passengers}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 bg-white">
                  {dateDetail && (
                    <p className="text-sm text-gray-500 mb-4">{dateDetail}</p>
                  )}

                  <div className="flex items-center justify-between mb-5">
                    <div className="text-left">
                      <p className="text-2xl font-bold text-gray-900">{departureCode}</p>
                      <p className="text-xs text-blue-500">{departureDetail}</p>
                    </div>

                    <div className="flex-1 px-3">
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-400 mb-1">{duration || '---'}</p>
                        <div className="flex items-center w-full">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className="mx-2 text-gray-300">→</div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{arrivalCode}</p>
                      <p className="text-xs text-blue-500">{arrivalDetail}</p>
                    </div>
                  </div>

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

          {/* Footer */}
          <div className="p-5 bg-gray-900 text-center">
            <p className="text-sm font-bold text-white tracking-widest mb-1">CADIZ & LLUIS</p>
            <p className="text-[10px] text-white/60 tracking-wider uppercase mb-3">Luxury Living</p>
            <p className="text-[10px] text-white/50">
              Quote valid until {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-[10px] text-white/70 mt-1">
              brody@cadizlluis.com • www.cadizlluis.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
