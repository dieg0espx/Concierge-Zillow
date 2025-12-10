"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Home,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Share2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { getPropertyById, Property as SupabaseProperty } from "@/lib/supabase"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency, formatNumber, formatPropertyValue, isValidPropertyValue } from "@/lib/utils"
import { PropertyContactForm } from "@/components/property-contact-form"

interface PropertyManager {
  id: string
  name: string
  email: string
  phone?: string
  profile_picture_url?: string
}

interface Property {
  id: string
  address: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  images: string[]
  description: string | null
  scraped_at: string | null
  created_at: string | null
  managers?: PropertyManager[]
  // Pricing display options
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
  // Field visibility toggles
  show_bedrooms?: boolean
  show_bathrooms?: boolean
  show_area?: boolean
  show_address?: boolean
  show_images?: boolean
  // Custom labels
  label_bedrooms?: string
  label_bathrooms?: string
  label_area?: string
  label_monthly_rent?: string
  label_nightly_rate?: string
  label_purchase_price?: string
  // Custom notes
  custom_notes?: string | null
}

export default function PropertyListingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const propertyId = params?.id as string
  const clientId = searchParams?.get('client') || null
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    async function loadProperty() {
      if (!propertyId) return

      setIsLoading(true)
      const data = await getPropertyById(propertyId)

      if (data) {
        let showMonthlyRent = (data as any).show_monthly_rent || false
        let showNightlyRate = (data as any).show_nightly_rate || false
        let showPurchasePrice = (data as any).show_purchase_price || false

        // If client ID is provided, fetch client-specific pricing visibility
        if (clientId) {
          const supabase = createClient()
          const { data: assignment } = await supabase
            .from('client_property_assignments')
            .select('show_monthly_rent_to_client, show_nightly_rate_to_client, show_purchase_price_to_client')
            .eq('client_id', clientId)
            .eq('property_id', propertyId)
            .single()

          if (assignment) {
            // Only show pricing if both the property has it enabled AND the client assignment allows it
            showMonthlyRent = showMonthlyRent && (assignment.show_monthly_rent_to_client ?? true)
            showNightlyRate = showNightlyRate && (assignment.show_nightly_rate_to_client ?? true)
            showPurchasePrice = showPurchasePrice && (assignment.show_purchase_price_to_client ?? true)
          }
        }

        setProperty({
          id: data.id,
          address: data.address || "Address not available",
          bedrooms: data.bedrooms || "0",
          bathrooms: data.bathrooms || "0",
          area: data.area || "0",
          zillow_url: data.zillow_url,
          images: Array.isArray(data.images) ? data.images : [],
          description: data.description || null,
          scraped_at: data.scraped_at,
          created_at: data.created_at,
          managers: (data as any).managers || [],
          // Pricing display options (with client-specific overrides applied)
          show_monthly_rent: showMonthlyRent,
          custom_monthly_rent: (data as any).custom_monthly_rent || null,
          show_nightly_rate: showNightlyRate,
          custom_nightly_rate: (data as any).custom_nightly_rate || null,
          show_purchase_price: showPurchasePrice,
          custom_purchase_price: (data as any).custom_purchase_price || null,
          // Field visibility toggles
          show_bedrooms: (data as any).show_bedrooms ?? true,
          show_bathrooms: (data as any).show_bathrooms ?? true,
          show_area: (data as any).show_area ?? true,
          show_address: (data as any).show_address ?? true,
          show_images: (data as any).show_images ?? true,
          // Custom labels
          label_bedrooms: (data as any).label_bedrooms || 'Bedrooms',
          label_bathrooms: (data as any).label_bathrooms || 'Bathrooms',
          label_area: (data as any).label_area || 'Square Feet',
          label_monthly_rent: (data as any).label_monthly_rent || 'Monthly Rent',
          label_nightly_rate: (data as any).label_nightly_rate || 'Nightly Rate',
          label_purchase_price: (data as any).label_purchase_price || 'Purchase Price',
          // Custom notes
          custom_notes: (data as any).custom_notes || null,
        })
      }
      setIsLoading(false)
    }

    loadProperty()
  }, [propertyId, clientId])

  const handleShare = async () => {
    if (!property) return

    // Build pricing text for share
    let pricingText = ''
    if (property.show_monthly_rent && property.custom_monthly_rent) {
      pricingText = `${formatCurrency(property.custom_monthly_rent)}/month`
    } else if (property.show_nightly_rate && property.custom_nightly_rate) {
      pricingText = `${formatCurrency(property.custom_nightly_rate)}/night`
    } else if (property.show_purchase_price && property.custom_purchase_price) {
      pricingText = formatCurrency(property.custom_purchase_price)
    }

    const shareData = {
      title: `${property.address} - Luxury Property`,
      text: `Check out this luxury property: ${property.bedrooms} bed, ${property.bathrooms} bath, ${formatNumber(property.area)} sq ft${pricingText ? ` - ${pricingText}` : ''}`,
      url: window.location.href,
    }

    try {
      // Try using Web Share API (mobile/modern browsers)
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: 'Shared successfully',
          description: 'Property link has been shared',
        })
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: 'Link copied!',
          description: 'Property URL has been copied to clipboard',
        })
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        toast({
          title: 'Unable to share',
          description: 'Please try copying the URL manually',
          variant: 'destructive',
        })
      }
    }
  }

  const nextImage = () => {
    if (!property) return
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
  }

  const prevImage = () => {
    if (!property) return
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading property...</span>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center max-w-md">
          <Home className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Property Not Found</h2>
          <p className="text-white/70 mb-4">The property you're looking for doesn't exist</p>
          <Link href="/">
            <Button className="bg-white text-background hover:bg-white/90">
              Back to Properties
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity flex-1 min-w-0">
              <div className="shimmer">
                <Logo />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="luxury-heading text-base sm:text-lg md:text-xl tracking-widest text-white truncate">
                  LUXURY LIVING
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.2em] text-white/70 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm text-xs"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="luxury-heading tracking-wider text-xs hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm -ml-2">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Properties
            </Button>
          </Link>
        </div>

        {/* Property Header */}
        <div className="mb-8 sm:mb-10">
          <div className="glass-card-accent elevated-card rounded-2xl p-6 sm:p-8 md:p-10 border border-white/20">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8 mb-8">
              <div className="flex-1 min-w-0">
                <Badge className="badge-accent mb-4">Featured Property</Badge>
                {property.show_address !== false ? (
                  <>
                    <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 break-words tracking-wide">
                      {property.address}
                    </h1>
                    <div className="flex items-start gap-2 text-white/70 text-base sm:text-lg">
                      <MapPin className="h-5 w-5 flex-shrink-0 mt-1" />
                      <span className="break-words">{property.address}</span>
                    </div>
                  </>
                ) : (
                  <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 break-words tracking-wide">
                    Luxury Property
                  </h1>
                )}
              </div>
              {/* Pricing Display */}
              {(property.show_monthly_rent || property.show_nightly_rate || property.show_purchase_price) && (() => {
                // Count how many prices are shown
                const priceCount = [
                  property.show_monthly_rent && property.custom_monthly_rent,
                  property.show_nightly_rate && property.custom_nightly_rate,
                  property.show_purchase_price && property.custom_purchase_price
                ].filter(Boolean).length;

                // Adjust font size based on price count
                const priceSize = priceCount === 1
                  ? "text-4xl sm:text-5xl md:text-6xl"
                  : priceCount === 2
                    ? "text-2xl sm:text-3xl md:text-4xl"
                    : "text-xl sm:text-2xl md:text-3xl";
                const labelSize = priceCount === 1 ? "text-sm" : "text-xs";
                const spacing = priceCount === 1 ? "space-y-4" : "space-y-3";

                return (
                  <div className="text-left lg:text-right w-full lg:w-auto">
                    <div className="relative">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full"></div>
                      {/* Prices */}
                      <div className={`relative ${spacing}`}>
                        {property.show_monthly_rent && property.custom_monthly_rent && (
                          <div>
                            <div className={`${priceSize} luxury-heading text-white mb-1 tracking-wide`}>
                              {formatCurrency(property.custom_monthly_rent)}
                            </div>
                            <div className={`${labelSize} text-white/70 uppercase tracking-[0.3em] font-semibold`}>
                              {property.label_monthly_rent || 'Per Month'}
                            </div>
                          </div>
                        )}
                        {property.show_nightly_rate && property.custom_nightly_rate && (
                          <div>
                            <div className={`${priceSize} luxury-heading text-white mb-1 tracking-wide`}>
                              {formatCurrency(property.custom_nightly_rate)}
                            </div>
                            <div className={`${labelSize} text-white/70 uppercase tracking-[0.3em] font-semibold`}>
                              {property.label_nightly_rate || 'Per Night'}
                            </div>
                            <div className="text-[10px] text-white/50 italic">not including taxes</div>
                          </div>
                        )}
                        {property.show_purchase_price && property.custom_purchase_price && (
                          <div>
                            <div className={`${priceSize} luxury-heading text-white mb-1 tracking-wide`}>
                              {formatCurrency(property.custom_purchase_price)}
                            </div>
                            <div className={`${labelSize} text-white/70 uppercase tracking-[0.3em] font-semibold`}>
                              {property.label_purchase_price || 'Purchase Price'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px flex-1 divider-accent"></div>
              <div className="w-2 h-2 rounded-full bg-white/60"></div>
              <div className="h-px flex-1 divider-accent"></div>
            </div>

            {/* Property Stats - respect visibility settings */}
            {(() => {
              const visibleStats = [
                property.show_bedrooms !== false,
                property.show_bathrooms !== false,
                property.show_area !== false
              ].filter(Boolean).length

              if (visibleStats === 0) return null

              const gridCols = visibleStats === 3 ? 'sm:grid-cols-3' : visibleStats === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'

              return (
                <div className={`grid grid-cols-1 ${gridCols} gap-4 sm:gap-6`}>
                  {property.show_bedrooms !== false && (
                    <div className="glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="p-3 bg-white/10 rounded-full flex-shrink-0">
                          <Bed className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{formatPropertyValue(property.bedrooms)}</div>
                          <div className="text-xs text-white/70 uppercase tracking-[0.2em] font-semibold">{property.label_bedrooms || 'Bedrooms'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {property.show_bathrooms !== false && (
                    <div className="glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="p-3 bg-white/10 rounded-full flex-shrink-0">
                          <Bath className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{formatPropertyValue(property.bathrooms)}</div>
                          <div className="text-xs text-white/70 uppercase tracking-[0.2em] font-semibold">{property.label_bathrooms || 'Bathrooms'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {property.show_area !== false && (
                    <div className="glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="p-3 bg-white/10 rounded-full flex-shrink-0">
                          <Square className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{formatPropertyValue(property.area, formatNumber)}</div>
                          <div className="text-xs text-white/70 uppercase tracking-[0.2em] font-semibold">{property.label_area || 'Square Feet'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Property Images Gallery - respect show_images */}
        {property.show_images !== false && property.images.length > 0 && (
          <div className="mb-8 sm:mb-10">
            <Card className="glass-card-accent elevated-card border border-white/20 overflow-hidden p-0">
              <div className="relative group/gallery">
                <div className="aspect-[16/10] bg-background/40 marble-bg relative overflow-hidden">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.address} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />

                  {/* Navigation Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-3 transition-all z-10 sm:opacity-0 sm:group-hover/gallery:opacity-100"
                      >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 sm:p-3 transition-all z-10 sm:opacity-0 sm:group-hover/gallery:opacity-100"
                      >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {property.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-semibold border border-white/20">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {property.images.length > 1 && (
                  <div className="p-4 sm:p-6 bg-background/20 border-t border-white/10">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {property.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg border-2 transition-all duration-300 transform hover:scale-110 overflow-hidden ${
                            index === currentImageIndex
                              ? 'border-white shadow-lg scale-110'
                              : 'border-white/30 hover:border-white/60'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Property Description */}
        {property.description && (
          <div className="mb-8 sm:mb-10">
            <Card className="glass-card-accent elevated-card border border-white/20">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 divider-accent"></div>
                  <h2 className="luxury-heading text-2xl sm:text-3xl text-white tracking-wide">About This Property</h2>
                </div>
                <div className="prose-property text-base sm:text-lg">
                  <ReactMarkdown>
                    {property.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Custom Notes from Admin */}
        {property.custom_notes && (
          <div className="mb-8 sm:mb-10">
            <Card className="glass-card-accent elevated-card border border-blue-400/30 bg-blue-500/5">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                  <h2 className="luxury-heading text-2xl sm:text-3xl text-white tracking-wide">Important Information</h2>
                </div>
                <div className="prose-property text-base sm:text-lg text-white/90 whitespace-pre-wrap">
                  {property.custom_notes}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Property Details */}
        <div className="mb-8 sm:mb-10">
          <Card className="glass-card-accent elevated-card border border-white/20">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 divider-accent"></div>
                <h2 className="luxury-heading text-2xl sm:text-3xl text-white tracking-wide">Property Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.show_address !== false && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">Address</span>
                    <span className="font-bold text-white text-right ml-4">{property.address}</span>
                  </div>
                )}
                {property.show_bedrooms !== false && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_bedrooms || 'Bedrooms'}</span>
                    <span className="font-bold text-white text-lg">{formatPropertyValue(property.bedrooms)}</span>
                  </div>
                )}
                {property.show_bathrooms !== false && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_bathrooms || 'Bathrooms'}</span>
                    <span className="font-bold text-white text-lg">{formatPropertyValue(property.bathrooms)}</span>
                  </div>
                )}
                {property.show_area !== false && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_area || 'Area'}</span>
                    <span className="font-bold text-white text-lg">{isValidPropertyValue(property.area) ? `${formatNumber(property.area)} sq ft` : '—'}</span>
                  </div>
                )}
                {/* Pricing Details */}
                {property.show_monthly_rent && property.custom_monthly_rent && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_monthly_rent || 'Monthly Rent'}</span>
                    <span className="font-bold text-white text-lg">{formatCurrency(property.custom_monthly_rent)}</span>
                  </div>
                )}
                {property.show_nightly_rate && property.custom_nightly_rate && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_nightly_rate || 'Nightly Rate'}</span>
                    <div className="text-right">
                      <span className="font-bold text-white text-lg">{formatCurrency(property.custom_nightly_rate)}</span>
                      <div className="text-xs text-white/50 italic">not including taxes</div>
                    </div>
                  </div>
                )}
                {property.show_purchase_price && property.custom_purchase_price && (
                  <div className="flex justify-between items-center p-5 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                    <span className="text-white/70 font-semibold uppercase tracking-wider text-sm">{property.label_purchase_price || 'Purchase Price'}</span>
                    <span className="font-bold text-white text-lg">{formatCurrency(property.custom_purchase_price)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Map */}
        <div className="mb-8 sm:mb-10">
          <Card className="glass-card-accent elevated-card border border-white/20">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 divider-accent"></div>
                <h2 className="luxury-heading text-2xl sm:text-3xl text-white tracking-wide">Location</h2>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/20">
                <iframe
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`}
                  className="w-full"
                ></iframe>
              </div>
              <div className="mt-4 flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{property.address}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <PropertyContactForm
          propertyAddress={property.address}
          managers={property.managers || []}
        />
      </main>
    </div>
  )
}
