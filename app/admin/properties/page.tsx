"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Home, MapPin, BedDouble, Bath, Maximize, ExternalLink, Pencil, Plus, Search } from "lucide-react"
import { getProperties, Property as SupabaseProperty } from "@/lib/supabase"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { PropertyManager } from "@/components/property-manager-select"
import { formatCurrency, formatNumber } from "@/lib/utils"

interface Property {
  id: string
  address: string
  monthly_rent: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  images: string[]
  scraped_at: string | null
  created_at: string | null
  managers?: PropertyManager[]
}

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const supabase = createClient()

      // Load properties
      const data = await getProperties()

      // Load all property managers
      const { data: managers } = await supabase
        .from('property_managers')
        .select('id, name, email')
        .order('name')

      // Load manager assignments for each property
      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id, manager_id')

      // Map assignments to properties
      const formattedData = data.map((prop: SupabaseProperty) => {
        const propAssignments = assignments?.filter(a => a.property_id === prop.id) || []
        const propManagers = propAssignments
          .map(a => managers?.find(m => m.id === a.manager_id))
          .filter(Boolean) as PropertyManager[]

        return {
          id: prop.id,
          address: prop.address || "Address not available",
          monthly_rent: prop.monthly_rent || "N/A",
          bedrooms: prop.bedrooms || "0",
          bathrooms: prop.bathrooms || "0",
          area: prop.area || "0",
          zillow_url: prop.zillow_url,
          images: Array.isArray(prop.images) ? prop.images : [],
          scraped_at: prop.scraped_at,
          created_at: prop.created_at,
          managers: propManagers
        }
      })
      setProperties(formattedData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) {
      return properties
    }

    const query = searchQuery.toLowerCase()
    return properties.filter(property => {
      // Search in address
      if (property.address.toLowerCase().includes(query)) return true

      // Search in monthly rent
      if (property.monthly_rent.toLowerCase().includes(query)) return true

      // Search in bedrooms
      if (property.bedrooms.toLowerCase().includes(query)) return true

      // Search in bathrooms
      if (property.bathrooms.toLowerCase().includes(query)) return true

      // Search in area
      if (property.area.toLowerCase().includes(query)) return true

      // Search in manager names
      if (property.managers?.some(m => m.name.toLowerCase().includes(query))) return true

      return false
    })
  }, [properties, searchQuery])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <h1 className="luxury-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] sm:tracking-[0.15em] mb-2 sm:mb-3 text-white">
            All Properties
          </h1>
          <p className="text-white/70 mt-1 sm:mt-2 tracking-wide text-sm sm:text-base md:text-lg">
            Manage your complete property portfolio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Badge variant="outline" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 py-2 sm:py-3 bg-white/10 border-white/30 backdrop-blur-sm shadow-xl justify-center">
            <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}
            {searchQuery && ` of ${properties.length}`}
          </Badge>
          <Link href="/admin/properties/new" className="w-full sm:w-auto">
            <Button className="btn-luxury px-4 sm:px-6 py-4 sm:py-6 text-sm sm:text-base w-full">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Add New Property
            </Button>
          </Link>
        </div>
      </div>

      <div className="h-px divider-accent my-8" />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-white/50" />
        <Input
          type="text"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 sm:pl-12 pr-10 h-12 sm:h-14 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/50 text-sm sm:text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
          >
            <span className="text-xl">×</span>
          </button>
        )}
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="skeleton h-12 w-12 rounded-full mb-4"></div>
          <span className="tracking-wide text-xl text-white/70">Loading properties...</span>
        </div>
      ) : properties.length === 0 ? (
        <Card className="glass-card-accent p-16 text-center elevated-card">
          <Home className="h-24 w-24 text-white/40 mx-auto mb-8" />
          <h3 className="luxury-heading text-3xl font-semibold mb-4 tracking-[0.15em]">No Properties Yet</h3>
          <p className="text-white/70 tracking-wide text-lg mb-8">Start building your portfolio by adding your first property</p>
          <Link href="/admin/properties/new">
            <Button className="btn-luxury px-8 py-6 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Property
            </Button>
          </Link>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card className="glass-card-accent p-16 text-center elevated-card">
          <Search className="h-24 w-24 text-white/40 mx-auto mb-8" />
          <h3 className="luxury-heading text-3xl font-semibold mb-4 tracking-[0.15em]">No Results Found</h3>
          <p className="text-white/70 tracking-wide text-lg mb-8">No properties match "{searchQuery}"</p>
          <Button
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="border-white/40 hover:bg-white/10 hover:border-white text-white"
          >
            Clear Search
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8">
          {filteredProperties.map((property, index) => {
            const firstImage = property.images.length > 0 ? property.images[0] : null
            return (
              <Card
                key={property.id}
                className="overflow-hidden elevated-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Property Image */}
                  <div className="w-full md:w-64 lg:w-80 h-48 sm:h-56 md:h-auto bg-background/30 relative luxury-overlay premium-image flex-shrink-0">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={property.address}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background to-card">
                        <Home className="h-12 w-12 sm:h-16 sm:w-16 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex-1 p-4 sm:p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-6 mb-4 sm:mb-6">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 tracking-wide text-white break-words">
                          {property.address}
                        </h3>
                        <div className="flex items-start gap-2 text-white/70 text-xs sm:text-sm">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 text-white" />
                          <span className="tracking-wide break-words">{property.address}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-white">
                          {formatCurrency(property.monthly_rent)}
                        </div>
                        <div className="text-xs sm:text-sm text-white-light uppercase tracking-wider mt-1 font-semibold">
                          Monthly Rent
                        </div>
                      </div>
                    </div>

                    {/* Property Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-5 mb-4 sm:mb-6">
                      <div className="text-center p-3 sm:p-4 md:p-5 glass-card-accent rounded-xl transition-all hover:scale-105">
                        <BedDouble className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-2 sm:mb-3 text-white" />
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{property.bedrooms || '0'}</div>
                        <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1 sm:mt-2">Bedrooms</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 md:p-5 glass-card-accent rounded-xl transition-all hover:scale-105">
                        <Bath className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-2 sm:mb-3 text-white" />
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{property.bathrooms || '0'}</div>
                        <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1 sm:mt-2">Bathrooms</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 md:p-5 glass-card-accent rounded-xl transition-all hover:scale-105">
                        <Maximize className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mx-auto mb-2 sm:mb-3 text-white" />
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                          {formatNumber(property.area)}
                        </div>
                        <div className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1 sm:mt-2">Sq Ft</div>
                      </div>
                    </div>

                    {/* Managers */}
                    {property.managers && property.managers.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs text-white-light uppercase tracking-wider mb-3 font-semibold">Assigned Managers</p>
                        <div className="flex flex-wrap gap-2">
                          {property.managers.map((manager) => (
                            <Badge key={manager.id} className="badge-accent text-sm px-4 py-2">
                              {manager.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 pt-4 sm:pt-6 border-t border-white/10">
                      <Link href={`/admin/properties/${property.id}/edit`} className="flex-1">
                        <Button className="w-full bg-white text-black hover:bg-white/90 transition-all h-10 sm:h-11 text-sm sm:text-base">
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Edit Property
                        </Button>
                      </Link>
                      <Link href={`/property/${property.id}`} className="flex-1 sm:flex-initial">
                        <Button variant="outline" className="w-full border-white/40 hover:bg-white hover:text-black hover:border-white text-white transition-all h-10 sm:h-11 text-sm sm:text-base">
                          View Details
                        </Button>
                      </Link>
                      {property.zillow_url && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full sm:w-auto border-white/40 hover:bg-white hover:text-black hover:border-white text-white transition-all h-10 sm:h-11 text-sm sm:text-base"
                        >
                          <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Zillow
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
