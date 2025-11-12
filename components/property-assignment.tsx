'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  assignPropertyToManager,
  unassignPropertyFromManager,
  type Property,
} from '@/lib/actions/properties'
import { Search, Home, Plus, X, BedDouble, Bath, Maximize } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function PropertyAssignment({
  managerId,
  allProperties,
  assignedProperties,
}: {
  managerId: string
  allProperties: Property[]
  assignedProperties: Property[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState<string | null>(null)

  const assignedIds = new Set(assignedProperties.map((p) => p.id))
  const availableProperties = allProperties.filter((p) => !assignedIds.has(p.id))

  const filteredAvailable = availableProperties.filter((p) =>
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssign = async (propertyId: string) => {
    setIsAssigning(propertyId)
    const result = await assignPropertyToManager(propertyId, managerId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property assigned successfully',
      })
      router.refresh()
    }

    setIsAssigning(null)
  }

  const handleUnassign = async (propertyId: string) => {
    setIsAssigning(propertyId)
    const result = await unassignPropertyFromManager(propertyId, managerId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property unassigned successfully',
      })
      router.refresh()
    }

    setIsAssigning(null)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Assigned Properties */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                Active Properties
              </CardTitle>
              <CardDescription className="mt-2 text-white/70 tracking-wide">
                {assignedProperties.length} {assignedProperties.length === 1 ? 'property' : 'properties'} currently managed
              </CardDescription>
            </div>
            <Badge className="bg-white/10 text-white border-white/30 px-4 py-2 text-lg">
              {assignedProperties.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {assignedProperties.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-white/5 rounded-2xl w-fit mx-auto mb-4">
                <Home className="h-16 w-16 text-white/30" />
              </div>
              <p className="text-white/60 tracking-wide text-lg">No properties assigned yet</p>
              <p className="text-white/40 text-sm mt-2">Add properties from the available list</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {assignedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassign(property.id)}
                      disabled={isAssigning === property.id}
                      className="border-white/20 hover:bg-red-500/20 hover:border-red-500/50 text-white hover:text-red-400 transition-all"
                      title="Remove property"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  }
                  isAssigned={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Properties */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                Available Properties
              </CardTitle>
              <CardDescription className="mt-2 text-white/70 tracking-wide">
                Add properties to this manager's portfolio
              </CardDescription>
            </div>
            <Badge className="bg-white/10 text-white border-white/30 px-4 py-2 text-lg">
              {availableProperties.length}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Search properties by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/30 focus:border-white text-white placeholder:text-white/40"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredAvailable.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-6 bg-white/5 rounded-2xl w-fit mx-auto mb-4">
                {searchQuery ? (
                  <Search className="h-16 w-16 text-white/30" />
                ) : (
                  <Home className="h-16 w-16 text-white/30" />
                )}
              </div>
              <p className="text-white/60 tracking-wide text-lg">
                {searchQuery ? 'No properties found' : 'All properties assigned'}
              </p>
              {searchQuery && (
                <p className="text-white/40 text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {filteredAvailable.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssign(property.id)}
                      disabled={isAssigning === property.id}
                      className="border-white/20 hover:bg-green-500/20 hover:border-green-500/50 text-white hover:text-green-400 transition-all"
                      title="Add property"
                    >
                      {isAssigning === property.id ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </Button>
                  }
                  isAssigned={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PropertyCard({
  property,
  action,
  isAssigned,
}: {
  property: Property
  action: React.ReactNode
  isAssigned: boolean
}) {
  const firstImage = property.images && Array.isArray(property.images) && property.images.length > 0
    ? property.images[0]
    : null

  return (
    <div className="group glass-card-accent rounded-xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-300 hover:shadow-xl">
      <div className="flex gap-4 p-4">
        {/* Property Image */}
        <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
          {firstImage ? (
            <img
              src={firstImage}
              alt={property.address || 'Property'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 ${firstImage ? 'hidden' : ''}`}>
            <Home className="h-10 w-10 text-white/30" />
          </div>
        </div>

        {/* Property Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base mb-2 truncate group-hover:text-white/90 transition-colors">
                {property.address || 'No address'}
              </h3>

              {/* Property Stats */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {property.bedrooms && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <div className="p-1 bg-white/10 rounded">
                      <BedDouble className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{property.bedrooms}</span>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <div className="p-1 bg-white/10 rounded">
                      <Bath className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{property.bathrooms}</span>
                  </div>
                )}
                {property.area && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <div className="p-1 bg-white/10 rounded">
                      <Maximize className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{formatNumber(property.area)} sq ft</span>
                  </div>
                )}
              </div>

              {/* Monthly Rent */}
              {property.monthly_rent && (
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/25 font-semibold">
                  {formatCurrency(property.monthly_rent)}/mo
                </Badge>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {action}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
