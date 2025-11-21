'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Home, MapPin, BedDouble, Bath, Maximize, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useState } from 'react'

type Property = {
  id: string
  address: string | null
  monthly_rent: string | null
  bedrooms: string | null
  bathrooms: string | null
  area: string | null
  zillow_url: string
  images: any
}

export function PublicPropertyCard({ property }: { property: Property }) {
  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : []
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  return (
    <Card className="overflow-hidden elevated-card group animate-fade-in p-0">
      {/* Property Image Gallery */}
      <div className="h-72 bg-background/30 relative luxury-overlay premium-image group/gallery">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={`${property.address || 'Property'} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover/gallery:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                {/* Right Arrow */}
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all opacity-0 group-hover/gallery:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
            <Home className="h-24 w-24 text-white/20" />
          </div>
        )}
        {/* Price Badge with Enhanced Luxury Styling */}
        {property.monthly_rent && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              {/* Glow effect background */}
              <div className="absolute inset-0 bg-white/20 blur-lg rounded-lg"></div>
              {/* Main price container */}
              <div className="relative backdrop-blur-md bg-gradient-to-br from-white/95 to-white/85 border border-white/30 rounded-lg shadow-xl px-3 py-2">
                <div className="flex flex-col items-end">
                  <span className="text-lg sm:text-xl font-bold text-black tracking-tight leading-none">
                    {formatCurrency(property.monthly_rent)}
                  </span>
                  <span className="text-[10px] text-black/60 font-semibold uppercase tracking-wider mt-0.5">
                    per month
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <CardContent className="p-7 space-y-6 flex flex-col">
        <div className="min-h-[80px] flex items-start">
          <div className="flex items-start gap-2 sm:gap-3">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white/80 flex-shrink-0 mt-1" />
            <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 tracking-wide leading-relaxed group-hover:text-white transition-colors duration-300">
              {property.address || 'Address not available'}
            </h3>
          </div>
        </div>

        {/* Property Stats with Enhanced Design */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <BedDouble className="h-6 w-6 mx-auto mb-2 text-white" />
            <p className="text-2xl font-bold text-white">{property.bedrooms || '0'}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">Beds</p>
          </div>
          <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <Bath className="h-6 w-6 mx-auto mb-2 text-white" />
            <p className="text-2xl font-bold text-white">{property.bathrooms || '0'}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">Baths</p>
          </div>
          <div className="text-center p-3 sm:p-4 glass-card-accent rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <Maximize className="h-6 w-6 mx-auto mb-2 text-white" />
            <p className="text-2xl font-bold text-white">
              {property.area ? formatNumber(property.area) : '0'}
            </p>
            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">Sq Ft</p>
          </div>
        </div>

        {/* Actions with Luxury Button */}
        <div className="pt-4 border-t border-white/20">
          <Button asChild className="w-full btn-luxury text-base py-6 group/btn" variant="default">
            <Link href={`/property/${property.id}`}>
              <span className="group-hover/btn:tracking-widest transition-all duration-300">View Details</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
