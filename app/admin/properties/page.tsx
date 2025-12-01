"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Home, MapPin, BedDouble, Bath, Maximize, ExternalLink, Pencil, Plus, Search, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { getProperties, Property as SupabaseProperty } from "@/lib/supabase"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { PropertyManager } from "@/components/property-manager-select"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { deleteProperty, updatePropertyOrder } from "@/lib/actions/properties"

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
  position?: number | null
}

function PropertyCard({
  property,
  index,
  totalCount,
  onDelete,
  deletingId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrag,
  onMoveUp,
  onMoveDown,
  isDragging,
  isDragOver,
  dragDirection,
}: {
  property: Property
  index: number
  totalCount: number
  onDelete: (id: string) => void
  deletingId: string | null
  onDragStart: (index: number, e: React.DragEvent) => void
  onDragOver: (index: number) => void
  onDragEnd: () => void
  onDrag: (e: React.DragEvent) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isDragging: boolean
  isDragOver: boolean
  dragDirection: 'up' | 'down' | null
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const firstImage = property.images.length > 0 ? property.images[0] : null

  // Create custom drag image
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'

    // Create a custom drag preview
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      e.dataTransfer.setDragImage(cardRef.current, rect.width / 2, 40)
    }

    onDragStart(index, e)
  }

  return (
    <Card
      ref={cardRef}
      draggable
      data-card-index={index}
      onDragStart={handleDragStart}
      onDrag={onDrag}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(index)
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault()
      }}
      style={{
        transform: isDragOver
          ? dragDirection === 'down'
            ? 'translateY(8px)'
            : 'translateY(-8px)'
          : 'translateY(0)',
      }}
      className={`overflow-hidden elevated-card sortable-card md:cursor-grab md:active:cursor-grabbing transition-all duration-300 ease-out ${
        isDragging ? 'opacity-40 scale-[0.98] shadow-2xl ring-2 ring-white/20 z-50' : ''
      } ${isDragOver ? 'ring-2 ring-white/50 shadow-lg shadow-white/10' : ''}`}
    >
      {/* Mobile Compact Layout */}
      <div className="flex md:hidden">
        {/* Move Buttons - Mobile */}
        <div className="flex flex-col justify-center bg-white/5 border-r border-white/10 flex-shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="flex items-center justify-center w-8 h-10 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
            className="flex items-center justify-center w-8 h-10 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Property Image - Mobile (small thumbnail) */}
        <div className="w-20 h-20 bg-background/30 relative flex-shrink-0">
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
              <Home className="h-6 w-6 text-white/20" />
            </div>
          )}
        </div>

        {/* Property Details - Mobile Compact */}
        <div className="flex-1 p-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-white line-clamp-2 leading-tight flex-1">
              {property.address}
            </h3>
            <div className="text-sm font-bold text-white flex-shrink-0">
              {formatCurrency(property.monthly_rent)}
            </div>
          </div>

          {/* Compact Stats Row */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/70">
            <span className="flex items-center gap-0.5">
              <BedDouble className="h-3 w-3" />
              {property.bedrooms}
            </span>
            <span className="flex items-center gap-0.5">
              <Bath className="h-3 w-3" />
              {property.bathrooms}
            </span>
            <span className="flex items-center gap-0.5">
              <Maximize className="h-3 w-3" />
              {formatNumber(property.area)}
            </span>
          </div>

          {/* Compact Actions */}
          <div className="flex items-center gap-1.5 mt-2">
            <Link href={`/admin/properties/${property.id}/edit`}>
              <Button size="sm" className="h-6 px-2 text-[10px] bg-white text-black hover:bg-white/90">
                <Pencil className="h-2.5 w-2.5 mr-0.5" />
                Edit
              </Button>
            </Link>
            <Link href={`/property/${property.id}`}>
              <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-white/40 text-white">
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(property.id)}
              disabled={deletingId === property.id}
              className="h-6 px-2 text-[10px] border-red-500/40 text-red-400 ml-auto"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row">
        {/* Drag Handle */}
        <div
          className="flex items-center justify-center w-12 bg-white/5 hover:bg-white/10 transition-colors border-r border-white/10"
        >
          <GripVertical className="h-5 w-5 text-white/50" />
        </div>

        {/* Property Image */}
        <div className="w-56 lg:w-72 bg-background/30 relative luxury-overlay premium-image flex-shrink-0">
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
              <Home className="h-16 w-16 text-white/20" />
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="flex-1 p-6">
          <div className="flex flex-row justify-between items-start gap-6 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold mb-2 tracking-wide text-white break-words">
                {property.address}
              </h3>
              <div className="flex items-start gap-2 text-white/70 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-white" />
                <span className="tracking-wide break-words">{property.address}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold tracking-wide text-white">
                {formatCurrency(property.monthly_rent)}
              </div>
              <div className="text-sm text-white-light uppercase tracking-wider mt-1 font-semibold">
                Monthly Rent
              </div>
            </div>
          </div>

          {/* Property Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 glass-card-accent rounded-xl">
              <BedDouble className="h-4 w-4 mx-auto mb-1 text-white" />
              <div className="text-xl font-bold text-white">{property.bedrooms || '0'}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-widest">Beds</div>
            </div>
            <div className="text-center p-3 glass-card-accent rounded-xl">
              <Bath className="h-4 w-4 mx-auto mb-1 text-white" />
              <div className="text-xl font-bold text-white">{property.bathrooms || '0'}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-widest">Baths</div>
            </div>
            <div className="text-center p-3 glass-card-accent rounded-xl">
              <Maximize className="h-4 w-4 mx-auto mb-1 text-white" />
              <div className="text-xl font-bold text-white">{formatNumber(property.area)}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-widest">Sq Ft</div>
            </div>
          </div>

          {/* Managers */}
          {property.managers && property.managers.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {property.managers.map((manager) => (
                  <Badge key={manager.id} className="badge-accent text-xs px-3 py-1">
                    {manager.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            <Link href={`/admin/properties/${property.id}/edit`}>
              <Button size="sm" className="bg-white text-black hover:bg-white/90 transition-all">
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </Link>
            <Link href={`/property/${property.id}`}>
              <Button size="sm" variant="outline" className="border-white/40 hover:bg-white hover:text-black text-white">
                View
              </Button>
            </Link>
            {property.zillow_url && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/40 hover:bg-white hover:text-black text-white"
              >
                <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Zillow
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(property.id)}
              disabled={deletingId === property.id}
              className="border-red-500/40 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-400 ml-auto"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {deletingId === property.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll when dragging near edges
  const handleDragScroll = (e: React.DragEvent) => {
    // Skip if clientY is 0 (can happen at drag end)
    if (e.clientY === 0) return

    const scrollThreshold = 120 // pixels from edge to start scrolling
    const scrollSpeed = 20 // pixels per frame
    const viewportHeight = window.innerHeight
    const mouseY = e.clientY

    // Clear existing scroll interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    // Scroll down when near bottom
    if (mouseY > viewportHeight - scrollThreshold) {
      const intensity = Math.min((mouseY - (viewportHeight - scrollThreshold)) / scrollThreshold, 1)
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: scrollSpeed * intensity, behavior: 'auto' })
      }, 16)
    }
    // Scroll up when near top
    else if (mouseY < scrollThreshold && mouseY > 0) {
      const intensity = Math.min((scrollThreshold - mouseY) / scrollThreshold, 1)
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: -(scrollSpeed * intensity), behavior: 'auto' })
      }, 16)
    }
  }

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }

  // Mobile move handlers
  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    setProperties(prev => {
      const newProperties = [...prev]
      const item = newProperties[index]
      newProperties.splice(index, 1)
      newProperties.splice(index - 1, 0, item)
      return newProperties
    })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Save after a short delay to allow multiple quick moves
    setTimeout(async () => {
      setIsSaving(true)
      const result = await updatePropertyOrder(properties.map(p => p.id))
      setIsSaving(false)
      if (result.error) {
        alert('Failed to save new order')
      }
    }, 500)
  }

  const handleMoveDown = async (index: number) => {
    if (index === properties.length - 1) return

    setProperties(prev => {
      const newProperties = [...prev]
      const item = newProperties[index]
      newProperties.splice(index, 1)
      newProperties.splice(index + 1, 0, item)
      return newProperties
    })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    // Save after a short delay to allow multiple quick moves
    setTimeout(async () => {
      setIsSaving(true)
      const result = await updatePropertyOrder(properties.map(p => p.id))
      setIsSaving(false)
      if (result.error) {
        alert('Failed to save new order')
      }
    }, 500)
  }

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const supabase = createClient()

      const data = await getProperties()

      const { data: managers } = await supabase
        .from('property_managers')
        .select('id, name, email')
        .order('name')

      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id, manager_id')

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
          managers: propManagers,
          position: prop.position
        }
      })
      setProperties(formattedData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) {
      return properties
    }

    const query = searchQuery.toLowerCase()
    return properties.filter(property => {
      if (property.address.toLowerCase().includes(query)) return true
      if (property.monthly_rent.toLowerCase().includes(query)) return true
      if (property.bedrooms.toLowerCase().includes(query)) return true
      if (property.bathrooms.toLowerCase().includes(query)) return true
      if (property.area.toLowerCase().includes(query)) return true
      if (property.managers?.some(m => m.name.toLowerCase().includes(query))) return true
      return false
    })
  }, [properties, searchQuery])

  const handleDragStart = (index: number) => {
    setDragIndex(index)
    setDragDirection(null)
  }

  const handleDragOver = (index: number) => {
    if (dragIndex === null || dragIndex === index) return

    // Determine drag direction
    const direction = index > dragIndex ? 'down' : 'up'
    setDragDirection(direction)
    setDragOverIndex(index)

    // Debounce the reorder to make it smoother
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    dragTimeoutRef.current = setTimeout(() => {
      // Reorder the array
      setProperties(prev => {
        const newProperties = [...prev]
        const draggedItem = newProperties[dragIndex]
        newProperties.splice(dragIndex, 1)
        newProperties.splice(index, 0, draggedItem)
        return newProperties
      })
      setDragIndex(index)
      setDragOverIndex(null)
    }, 100)
  }

  const handleDragEnd = async () => {
    // Clear any pending timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    // Stop auto-scrolling
    stopAutoScroll()

    setDragIndex(null)
    setDragOverIndex(null)
    setDragDirection(null)

    // Save the new order to database
    if (properties.length > 0) {
      setIsSaving(true)
      const result = await updatePropertyOrder(properties.map(p => p.id))
      setIsSaving(false)

      if (result.error) {
        alert('Failed to save new order')
      }
    }
  }

  const handleDelete = async (propertyId: string) => {
    setDeletingId(propertyId)
    const result = await deleteProperty(propertyId)

    if (result.error) {
      setDeletingId(null)
    } else {
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.1em] mb-1 text-white">
            Properties
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            <span className="hidden md:inline">Drag to reorder</span>
            <span className="md:hidden">Use arrows to reorder</span>
            {isSaving && <span className="text-white animate-pulse"> • Saving...</span>}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-white/10 border-white/30 justify-center">
            <Home className="h-3 w-3 mr-2" />
            {filteredProperties.length} {filteredProperties.length === 1 ? 'Property' : 'Properties'}
          </Badge>
          <Link href="/admin/properties/new" className="w-full sm:w-auto">
            <Button className="btn-luxury px-4 py-4 text-sm w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
        <Input
          type="text"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/50 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
          >
            <span className="text-xl">×</span>
          </button>
        )}
      </div>

      {/* Properties List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="skeleton h-10 w-10 rounded-full mb-4"></div>
          <span className="text-white/70">Loading properties...</span>
        </div>
      ) : properties.length === 0 ? (
        <Card className="glass-card-accent p-12 text-center">
          <Home className="h-16 w-16 text-white/40 mx-auto mb-6" />
          <h3 className="luxury-heading text-2xl font-semibold mb-3 tracking-[0.1em]">No Properties Yet</h3>
          <p className="text-white/70 mb-6">Add your first property to get started</p>
          <Link href="/admin/properties/new">
            <Button className="btn-luxury px-6 py-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card className="glass-card-accent p-12 text-center">
          <Search className="h-16 w-16 text-white/40 mx-auto mb-6" />
          <h3 className="luxury-heading text-2xl font-semibold mb-3 tracking-[0.1em]">No Results</h3>
          <p className="text-white/70 mb-6">No properties match "{searchQuery}"</p>
          <Button
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="border-white/40 hover:bg-white/10 text-white"
          >
            Clear Search
          </Button>
        </Card>
      ) : searchQuery ? (
        // When searching, don't enable drag
        <div className="grid gap-2 md:gap-4">
          {filteredProperties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={index}
              totalCount={filteredProperties.length}
              onDelete={handleDelete}
              deletingId={deletingId}
              onDragStart={() => {}}
              onDragOver={() => {}}
              onDragEnd={() => {}}
              onDrag={() => {}}
              onMoveUp={() => {}}
              onMoveDown={() => {}}
              isDragging={false}
              isDragOver={false}
              dragDirection={null}
            />
          ))}
        </div>
      ) : (
        // Enable drag only when not searching
        <div className="grid gap-2 md:gap-4">
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={index}
              totalCount={properties.length}
              onDelete={handleDelete}
              deletingId={deletingId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrag={handleDragScroll}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              dragDirection={dragDirection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
