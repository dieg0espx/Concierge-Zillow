"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { getPropertyById, Property as SupabaseProperty } from "@/lib/supabase"
import { formatCurrency, formatNumber } from "@/lib/utils"
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
  monthly_rent: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  images: string[]
  description: string | null
  scraped_at: string | null
  created_at: string | null
  managers?: PropertyManager[]
}

export default function PropertyListingPage() {
  const params = useParams()
  const propertyId = params?.id as string
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
        setProperty({
          id: data.id,
          address: data.address || "Address not available",
          monthly_rent: data.monthly_rent || "N/A",
          bedrooms: data.bedrooms || "0",
          bathrooms: data.bathrooms || "0",
          area: data.area || "0",
          zillow_url: data.zillow_url,
          images: Array.isArray(data.images) ? data.images : [],
          description: data.description || null,
          scraped_at: data.scraped_at,
          created_at: data.created_at,
          managers: (data as any).managers || []
        })
      }
      setIsLoading(false)
    }

    loadProperty()
  }, [propertyId])

  const handleShare = async () => {
    if (!property) return

    const shareData = {
      title: `${property.address} - Luxury Property`,
      text: `Check out this luxury property: ${property.bedrooms} bed, ${property.bathrooms} bath, ${formatNumber(property.area)} sq ft - ${formatCurrency(property.monthly_rent)}/month`,
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
      <header className="border-b border-border/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity flex-1 min-w-0">
              <Logo />
              <div className="flex flex-col min-w-0">
                <div className="luxury-heading text-base sm:text-lg md:text-xl tracking-widest text-white truncate">
                  LUXURY CONCIERGE
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.2em] text-white/70 uppercase">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Property Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-border/30">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-8 mb-6 sm:mb-8">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-3 sm:mb-4 break-words font-normal">
                  {property.address}
                </h1>
                <div className="flex items-start gap-2 text-white/70 mb-2 text-sm sm:text-base">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="break-words">{property.address}</span>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-1 sm:mb-2">
                  {formatCurrency(property.monthly_rent)}
                </div>
                <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Monthly Rent</div>
              </div>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div className="text-center p-4 sm:p-5 md:p-6 bg-background/30 rounded-xl border border-border/30 backdrop-blur-sm hover:bg-background/40 transition-all">
                <div className="p-2 sm:p-3 bg-white/10 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <Bed className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-1">{property.bedrooms}</div>
                <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Bedrooms</div>
              </div>
              <div className="text-center p-4 sm:p-5 md:p-6 bg-background/30 rounded-xl border border-border/30 backdrop-blur-sm hover:bg-background/40 transition-all">
                <div className="p-2 sm:p-3 bg-white/10 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <Bath className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-1">{property.bathrooms}</div>
                <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Bathrooms</div>
              </div>
              <div className="text-center p-4 sm:p-5 md:p-6 bg-background/30 rounded-xl border border-border/30 backdrop-blur-sm hover:bg-background/40 transition-all">
                <div className="p-2 sm:p-3 bg-white/10 rounded-full w-fit mx-auto mb-2 sm:mb-3">
                  <Square className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-1">{formatNumber(property.area)} sq ft</div>
                <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Area</div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Images Slideshow */}
        {property.images.length > 0 && (
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm overflow-hidden mb-6 sm:mb-8">
            <CardContent className="p-0 relative group">
              <div className="aspect-video bg-background/40 marble-bg flex items-center justify-center relative overflow-hidden">
                <img
                  src={property.images[currentImageIndex]}
                  alt={`${property.address} - Image ${currentImageIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    fallback?.classList.remove('hidden')
                  }}
                />
                <div className="text-center relative z-10 px-4 hidden">
                  <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-sm rounded-full mb-3 sm:mb-4 w-fit mx-auto">
                    <Home className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm sm:text-base md:text-lg">Property Image {currentImageIndex + 1}</p>
                </div>

                {/* Navigation Arrows */}
                {property.images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 p-2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 p-2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </>
                )}

                {/* Image Counter */}
                {property.images.length > 1 && (
                  <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-white/30">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {property.images.length > 1 && (
                <div className="p-3 sm:p-4 md:p-6 bg-background/30 border-t border-border/30">
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 overflow-hidden ${
                          index === currentImageIndex
                            ? 'border-white shadow-lg ring-2 ring-white/30'
                            : 'border-white/30 hover:border-white/50 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Property Description */}
        {property.description && (
          <Card className="bg-card/50 border border-border/30 backdrop-blur-sm mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="luxury-heading text-xl sm:text-2xl text-white mb-4 sm:mb-6">About This Property</h2>
              <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                {property.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Property Details */}
        <Card className="bg-card/50 border border-border/30 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <h2 className="luxury-heading text-xl sm:text-2xl text-white mb-4 sm:mb-6">Property Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Address</span>
                <span className="font-semibold text-white text-right ml-4">{property.address}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Monthly Rent</span>
                <span className="font-semibold text-white">{formatCurrency(property.monthly_rent)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Bedrooms</span>
                <span className="font-semibold text-white">{property.bedrooms}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Bathrooms</span>
                <span className="font-semibold text-white">{property.bathrooms}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Area</span>
                <span className="font-semibold text-white">{formatNumber(property.area)} sq ft</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/30 rounded-lg border border-border/30">
                <span className="text-white/80 font-medium">Scraped Date</span>
                <span className="font-semibold text-white">
                  {property.scraped_at ? new Date(property.scraped_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <div className="mt-6 sm:mt-8">
          <PropertyContactForm
            propertyAddress={property.address}
            managers={property.managers || []}
          />
        </div>

        <div className="mt-6 sm:mt-8">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to All Properties
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
