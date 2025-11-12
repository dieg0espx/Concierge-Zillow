'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Home, MapPin, BedDouble, Bath, Maximize } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatNumber } from '@/lib/utils'

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
  const firstImage = Array.isArray(property.images) && property.images.length > 0
    ? property.images[0]
    : null

  return (
    <Card className="overflow-hidden elevated-card group animate-fade-in">
      {/* Property Image */}
      <div className="h-72 bg-background/30 relative luxury-overlay premium-image">
        {firstImage ? (
          <img
            src={firstImage}
            alt={property.address || 'Property'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
            <Home className="h-24 w-24 text-white/20" />
          </div>
        )}
        {/* Price Badge with White Styling */}
        {property.monthly_rent && (
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
            <Badge className="badge-accent text-base sm:text-xl px-4 sm:px-6 py-2 sm:py-3 font-bold tracking-wide shadow-xl">
              {formatCurrency(property.monthly_rent)}/mo
            </Badge>
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
