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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  assignPropertyToClient,
  removePropertyFromClient,
  updateClientPropertyPricing,
  ClientPricingOptions,
} from '@/lib/actions/clients'
import { Search, Home, Plus, X, Loader2, Settings, Check } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

type Property = {
  id: string
  address?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  images?: string[]
  // Pricing options (from property)
  show_monthly_rent?: boolean
  custom_monthly_rent?: number | null
  show_nightly_rate?: boolean
  custom_nightly_rate?: number | null
  show_purchase_price?: boolean
  custom_purchase_price?: number | null
  // Client-specific pricing visibility (from assignment)
  client_show_monthly_rent?: boolean
  client_show_nightly_rate?: boolean
  client_show_purchase_price?: boolean
}

export function ClientPropertyAssignment({
  clientId,
  clientName,
  managerProperties,
  assignedProperties,
}: {
  clientId: string
  clientName: string
  managerProperties: Property[]
  assignedProperties: Property[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
  const [showPricingModal, setShowPricingModal] = useState<string | null>(null)
  const [propertyForModal, setPropertyForModal] = useState<Property | null>(null)
  const [pendingPricing, setPendingPricing] = useState<ClientPricingOptions>({
    show_monthly_rent_to_client: true,
    show_nightly_rate_to_client: true,
    show_purchase_price_to_client: true,
  })

  const assignedIds = new Set(assignedProperties.map((p) => p.id))
  const availableProperties = managerProperties.filter((p) => !assignedIds.has(p.id))

  const filteredAvailable = availableProperties.filter((p) =>
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartAssign = (property: Property) => {
    // Initialize pricing options based on what the property has enabled
    setPendingPricing({
      show_monthly_rent_to_client: !!(property.show_monthly_rent && property.custom_monthly_rent),
      show_nightly_rate_to_client: !!(property.show_nightly_rate && property.custom_nightly_rate),
      show_purchase_price_to_client: !!(property.show_purchase_price && property.custom_purchase_price),
    })
    setPropertyForModal(property)
    setShowPricingModal(property.id)
  }

  const handleConfirmAssign = async () => {
    if (!showPricingModal) return

    setIsAssigning(showPricingModal)
    const result = await assignPropertyToClient(clientId, showPricingModal, pendingPricing)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Property assigned to client' })
      router.refresh()
    }

    setIsAssigning(null)
    setShowPricingModal(null)
    setPropertyForModal(null)
  }

  const handleUnassign = async (propertyId: string) => {
    setIsAssigning(propertyId)
    const result = await removePropertyFromClient(clientId, propertyId)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Property removed from client' })
      router.refresh()
    }

    setIsAssigning(null)
  }

  const handleEditPricing = (property: Property) => {
    setPendingPricing({
      show_monthly_rent_to_client: property.client_show_monthly_rent ?? true,
      show_nightly_rate_to_client: property.client_show_nightly_rate ?? true,
      show_purchase_price_to_client: property.client_show_purchase_price ?? true,
    })
    setPropertyForModal(property)
    setShowPricingModal(property.id)
  }

  const handleUpdatePricing = async () => {
    if (!showPricingModal) return

    setIsAssigning(showPricingModal)
    const result = await updateClientPropertyPricing(clientId, showPricingModal, pendingPricing)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: 'Pricing options updated' })
      router.refresh()
    }

    setIsAssigning(null)
    setShowPricingModal(null)
    setPropertyForModal(null)
  }

  const isEditingAssigned = showPricingModal && assignedIds.has(showPricingModal)

  return (
    <>
      {/* Pricing Selection Modal */}
      {showPricingModal && propertyForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="elevated-card w-full max-w-md">
            <CardHeader className="pb-4 border-b border-white/10">
              <CardTitle className="luxury-heading text-xl tracking-[0.1em] text-white">
                {isEditingAssigned ? 'Edit Pricing Display' : 'Select Pricing to Show'}
              </CardTitle>
              <CardDescription className="text-white/70 text-sm">
                Choose which pricing options {clientName} will see for this property
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Property Preview */}
              <div className="flex gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-white/10">
                  {propertyForModal.images?.[0] ? (
                    <img src={propertyForModal.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="h-5 w-5 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{propertyForModal.address || 'No address'}</p>
                  <p className="text-white/50 text-xs">Select pricing to display</p>
                </div>
              </div>

              {/* Pricing Options */}
              <div className="space-y-4">
                {/* Monthly Rent - show if property has this pricing enabled with a value */}
                {propertyForModal.show_monthly_rent && propertyForModal.custom_monthly_rent ? (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="modal_monthly_rent"
                        checked={pendingPricing.show_monthly_rent_to_client}
                        onCheckedChange={(checked) =>
                          setPendingPricing(prev => ({ ...prev, show_monthly_rent_to_client: !!checked }))
                        }
                        className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white"
                      />
                      <Label htmlFor="modal_monthly_rent" className="text-white cursor-pointer">
                        Monthly Rent
                      </Label>
                    </div>
                    <Badge className="bg-white/10 text-white border-white/30">
                      {formatCurrency(propertyForModal.custom_monthly_rent)}/mo
                    </Badge>
                  </div>
                ) : null}

                {/* Nightly Rate - show if property has this pricing enabled with a value */}
                {propertyForModal.show_nightly_rate && propertyForModal.custom_nightly_rate ? (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="modal_nightly_rate"
                        checked={pendingPricing.show_nightly_rate_to_client}
                        onCheckedChange={(checked) =>
                          setPendingPricing(prev => ({ ...prev, show_nightly_rate_to_client: !!checked }))
                        }
                        className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white"
                      />
                      <Label htmlFor="modal_nightly_rate" className="text-white cursor-pointer">
                        Nightly Rate
                      </Label>
                    </div>
                    <Badge className="bg-white/10 text-white border-white/30">
                      {formatCurrency(propertyForModal.custom_nightly_rate)}/night
                    </Badge>
                  </div>
                ) : null}

                {/* Purchase Price - show if property has this pricing enabled with a value */}
                {propertyForModal.show_purchase_price && propertyForModal.custom_purchase_price ? (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="modal_purchase_price"
                        checked={pendingPricing.show_purchase_price_to_client}
                        onCheckedChange={(checked) =>
                          setPendingPricing(prev => ({ ...prev, show_purchase_price_to_client: !!checked }))
                        }
                        className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white"
                      />
                      <Label htmlFor="modal_purchase_price" className="text-white cursor-pointer">
                        Purchase Price
                      </Label>
                    </div>
                    <Badge className="bg-white/10 text-white border-white/30">
                      {formatCurrency(propertyForModal.custom_purchase_price)}
                    </Badge>
                  </div>
                ) : null}

                {/* No pricing available message - show when property has no pricing configured */}
                {!(propertyForModal.show_monthly_rent && propertyForModal.custom_monthly_rent) &&
                 !(propertyForModal.show_nightly_rate && propertyForModal.custom_nightly_rate) &&
                 !(propertyForModal.show_purchase_price && propertyForModal.custom_purchase_price) && (
                  <div className="text-center py-4 bg-white/5 rounded-lg">
                    <p className="text-white/70 text-sm">This property has no pricing configured yet</p>
                    <p className="text-white/50 text-xs mt-1">You can still add it to the portfolio. Edit the property later to add pricing options.</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPricingModal(null)
                    setPropertyForModal(null)
                  }}
                  className="flex-1 border border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEditingAssigned ? handleUpdatePricing : handleConfirmAssign}
                  disabled={isAssigning === showPricingModal}
                  className="flex-1 bg-white text-black hover:bg-white/90"
                >
                  {isAssigning === showPricingModal ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {isEditingAssigned ? 'Save Changes' : 'Add Property'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Assigned Properties */}
        <Card className="elevated-card">
          <CardHeader className="pb-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                  {clientName}'s Properties
                </CardTitle>
                <CardDescription className="mt-2 text-white/70 tracking-wide">
                  {assignedProperties.length} {assignedProperties.length === 1 ? 'property' : 'properties'} curated
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
                <p className="text-white/40 text-sm mt-2">Add properties from your portfolio</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto">
                {assignedProperties.map((property) => (
                  <AssignedPropertyCard
                    key={property.id}
                    property={property}
                    onRemove={() => handleUnassign(property.id)}
                    onEditPricing={() => handleEditPricing(property)}
                    isRemoving={isAssigning === property.id}
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
                  Add properties to client's portfolio
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
                  {searchQuery ? <Search className="h-16 w-16 text-white/30" /> : <Home className="h-16 w-16 text-white/30" />}
                </div>
                <p className="text-white/60 tracking-wide text-lg">
                  {searchQuery ? 'No properties found' : 'All properties assigned'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto">
                {filteredAvailable.map((property) => (
                  <AvailablePropertyCard
                    key={property.id}
                    property={property}
                    onAdd={() => handleStartAssign(property)}
                    isAdding={isAssigning === property.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AssignedPropertyCard({
  property,
  onRemove,
  onEditPricing,
  isRemoving,
}: {
  property: Property
  onRemove: () => void
  onEditPricing: () => void
  isRemoving: boolean
}) {
  const firstImage = property.images?.[0] || null

  // Check which prices are visible to this client
  const showMonthly = property.client_show_monthly_rent !== false && property.show_monthly_rent && property.custom_monthly_rent
  const showNightly = property.client_show_nightly_rate !== false && property.show_nightly_rate && property.custom_nightly_rate
  const showPurchase = property.client_show_purchase_price !== false && property.show_purchase_price && property.custom_purchase_price
  const hasVisiblePricing = showMonthly || showNightly || showPurchase

  return (
    <div className="group glass-card-accent rounded-xl border border-white/20 overflow-hidden hover:border-white/40 transition-all">
      <div className="flex gap-4 p-4">
        <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
          {firstImage ? (
            <img src={firstImage} alt={property.address || 'Property'} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="h-8 w-8 text-white/30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm mb-1 truncate">{property.address || 'No address'}</h3>

          {/* Pricing Display - Shows what's visible to client */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {showMonthly && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_monthly_rent!)}/mo
              </Badge>
            )}
            {showNightly && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_nightly_rate!)}/night
              </Badge>
            )}
            {showPurchase && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_purchase_price!)}
              </Badge>
            )}
            {!hasVisiblePricing && (
              <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
                No pricing shown
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditPricing}
              className="h-7 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings className="h-3 w-3 mr-1" />
              Pricing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isRemoving}
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AvailablePropertyCard({
  property,
  onAdd,
  isAdding,
}: {
  property: Property
  onAdd: () => void
  isAdding: boolean
}) {
  const firstImage = property.images?.[0] || null
  const hasPricing = property.show_monthly_rent || property.show_nightly_rate || property.show_purchase_price

  return (
    <div className="group glass-card-accent rounded-xl border border-white/20 overflow-hidden hover:border-white/40 transition-all">
      <div className="flex gap-4 p-4">
        <div className="relative w-28 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
          {firstImage ? (
            <img src={firstImage} alt={property.address || 'Property'} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Home className="h-8 w-8 text-white/30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm mb-1 truncate">{property.address || 'No address'}</h3>

          {/* Pricing Display (from property) */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {property.show_monthly_rent && property.custom_monthly_rent && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_monthly_rent)}/mo
              </Badge>
            )}
            {property.show_nightly_rate && property.custom_nightly_rate && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_nightly_rate)}/night
              </Badge>
            )}
            {property.show_purchase_price && property.custom_purchase_price && (
              <Badge className="bg-white/10 text-white border-white/30 text-xs">
                {formatCurrency(property.custom_purchase_price)}
              </Badge>
            )}
            {!hasPricing && (
              <div className="flex flex-wrap items-center gap-2 text-white/60 text-xs">
                {property.bedrooms && <span>{property.bedrooms} bed</span>}
                {property.bathrooms && <span>{property.bathrooms} bath</span>}
                {property.area && <span>{formatNumber(property.area)} sqft</span>}
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={onAdd}
            disabled={isAdding}
            className="h-7 px-3 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/30"
          >
            {isAdding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
