'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { getQuoteByNumber, acceptQuote, declineQuote, QuoteWithItems, QuoteStatus } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'

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
                Thank you! We will be in touch shortly to finalize the details.
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
    </div>
  )
}
