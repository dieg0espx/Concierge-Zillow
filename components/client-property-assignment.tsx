'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
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
  updateClientPropertyOrder,
  bulkAssignPropertiesToClient,
  bulkRemovePropertiesFromClient,
  ClientPricingOptions,
} from '@/lib/actions/clients'
import { Search, Home, Plus, X, Loader2, Settings, Check, GripVertical, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

type Property = {
  id: string
  address?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  images?: string[]
  position?: number | null
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
  assignedProperties: initialAssignedProperties,
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
  const [isMounted, setIsMounted] = useState(false)

  // Drag and drop state
  const [assignedProperties, setAssignedProperties] = useState<Property[]>(initialAssignedProperties)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Bulk selection state
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setAssignedProperties(initialAssignedProperties)
  }, [initialAssignedProperties])

  const assignedIds = new Set(assignedProperties.map((p) => p.id))
  const availableProperties = managerProperties.filter((p) => !assignedIds.has(p.id))

  const filteredAvailable = availableProperties.filter((p) =>
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index)
    setDragDirection(null)
  }

  const handleDragOver = (index: number) => {
    if (dragIndex === null || dragIndex === index) return

    const direction = index > dragIndex ? 'down' : 'up'
    setDragDirection(direction)
    setDragOverIndex(index)

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    dragTimeoutRef.current = setTimeout(() => {
      setAssignedProperties(prev => {
        const newProperties = [...prev]
        const draggedItem = newProperties[dragIndex]
        newProperties.splice(dragIndex, 1)
        newProperties.splice(index, 0, draggedItem)
        return newProperties
      })
      setDragIndex(index)
    }, 50)
  }

  const handleDragEnd = async () => {
    stopAutoScroll()
    setDragIndex(null)
    setDragOverIndex(null)
    setDragDirection(null)

    // Save the new order
    setIsSavingOrder(true)
    const propertyIds = assignedProperties.map(p => p.id)
    const result = await updateClientPropertyOrder(clientId, propertyIds)
    setIsSavingOrder(false)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      router.refresh() // Revert to server state
    } else {
      toast({ title: 'Success', description: 'Property order updated' })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientY === 0) return

    const scrollThreshold = 120
    const scrollSpeed = 20
    const viewportHeight = window.innerHeight
    const mouseY = e.clientY

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }

    if (mouseY > viewportHeight - scrollThreshold) {
      const intensity = Math.min((mouseY - (viewportHeight - scrollThreshold)) / scrollThreshold, 1)
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: scrollSpeed * intensity, behavior: 'auto' })
      }, 16)
    } else if (mouseY < scrollThreshold && mouseY > 0) {
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

    setAssignedProperties(prev => {
      const newProperties = [...prev]
      const item = newProperties[index]
      newProperties.splice(index, 1)
      newProperties.splice(index - 1, 0, item)
      return newProperties
    })

    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    setTimeout(async () => {
      setIsSavingOrder(true)
      const propertyIds = assignedProperties.map(p => p.id)
      await updateClientPropertyOrder(clientId, propertyIds)
      setIsSavingOrder(false)
    }, 500)
  }

  const handleMoveDown = async (index: number) => {
    if (index === assignedProperties.length - 1) return

    setAssignedProperties(prev => {
      const newProperties = [...prev]
      const item = newProperties[index]
      newProperties.splice(index, 1)
      newProperties.splice(index + 1, 0, item)
      return newProperties
    })

    if (navigator.vibrate) {
      navigator.vibrate(30)
    }

    setTimeout(async () => {
      setIsSavingOrder(true)
      const propertyIds = assignedProperties.map(p => p.id)
      await updateClientPropertyOrder(clientId, propertyIds)
      setIsSavingOrder(false)
    }, 500)
  }

  // Bulk selection handlers
  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode)
    setSelectedProperties(new Set())
  }

  const togglePropertySelection = (propertyId: string) => {
    const newSelected = new Set(selectedProperties)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const selectAll = () => {
    setSelectedProperties(new Set(filteredAvailable.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedProperties(new Set())
  }

  const handleBulkAdd = async () => {
    if (selectedProperties.size === 0) return

    // In bulk mode, automatically enable ALL pricing options
    const allPricingEnabled: ClientPricingOptions = {
      show_monthly_rent_to_client: true,
      show_nightly_rate_to_client: true,
      show_purchase_price_to_client: true,
    }

    setIsAssigning('bulk')
    const propertyIds = Array.from(selectedProperties)
    const result = await bulkAssignPropertiesToClient(clientId, propertyIds, allPricingEnabled)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({
        title: 'Success',
        description: `${result.count} properties assigned to client with all pricing options enabled`
      })
      setSelectedProperties(new Set())
      setIsBulkMode(false)
      router.refresh()
    }

    setIsAssigning(null)
  }

  const handleConfirmBulkAdd = async () => {
    if (selectedProperties.size === 0) return

    setIsAssigning('bulk')
    const propertyIds = Array.from(selectedProperties)
    const result = await bulkAssignPropertiesToClient(clientId, propertyIds, pendingPricing)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: `${result.count} properties assigned to client` })
      setSelectedProperties(new Set())
      setIsBulkMode(false)
      router.refresh()
    }

    setIsAssigning(null)
    setShowPricingModal(null)
  }

  const handleBulkRemove = async () => {
    if (selectedProperties.size === 0) return

    const confirmed = confirm(`Remove ${selectedProperties.size} properties from ${clientName}?`)
    if (!confirmed) return

    setIsAssigning('bulk-remove')
    const propertyIds = Array.from(selectedProperties)
    const result = await bulkRemovePropertiesFromClient(clientId, propertyIds)

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Success', description: `${result.count} properties removed from client` })
      setSelectedProperties(new Set())
      setIsBulkMode(false)
      router.refresh()
    }

    setIsAssigning(null)
  }

  // Single property handlers (existing functionality)
  const handleStartAssign = (property: Property) => {
    setPendingPricing({
      show_monthly_rent_to_client: !!(property.show_monthly_rent && property.custom_monthly_rent),
      show_nightly_rate_to_client: !!(property.show_nightly_rate && property.custom_nightly_rate),
      show_purchase_price_to_client: !!(property.show_purchase_price && property.custom_purchase_price),
    })
    setPropertyForModal(property)
    setShowPricingModal(property.id)
  }

  const handleConfirmAssign = async () => {
    if (!showPricingModal || showPricingModal === 'bulk') return

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
  }

  const handleRemove = async (propertyId: string) => {
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

  const handleSavePricing = async () => {
    if (!showPricingModal || showPricingModal === 'bulk') return

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
  }

  // Pricing modal component
  const renderPricingModal = () => {
    if (!isMounted || !showPricingModal) return null

    const isBulkModal = showPricingModal === 'bulk'
    const isEditMode = !isBulkModal && assignedIds.has(showPricingModal)

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-zinc-900 border border-white/20 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isBulkModal
              ? `Assign ${selectedProperties.size} Properties`
              : isEditMode
              ? 'Edit Pricing Visibility'
              : 'Set Pricing Visibility'}
          </h3>
          <p className="text-sm text-white/60 mb-6">
            {isBulkModal
              ? `Choose which pricing options to show ${clientName} for these properties:`
              : `Choose which pricing options to show ${clientName} for this property:`}
          </p>

          <div className="space-y-4">
            {propertyForModal?.show_monthly_rent && propertyForModal?.custom_monthly_rent && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_monthly_rent"
                  checked={pendingPricing.show_monthly_rent_to_client}
                  onCheckedChange={(checked) =>
                    setPendingPricing((prev) => ({
                      ...prev,
                      show_monthly_rent_to_client: !!checked,
                    }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show_monthly_rent" className="text-white cursor-pointer">
                  Monthly Rent ({formatCurrency(propertyForModal.custom_monthly_rent)})
                </Label>
              </div>
            )}

            {propertyForModal?.show_nightly_rate && propertyForModal?.custom_nightly_rate && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_nightly_rate"
                  checked={pendingPricing.show_nightly_rate_to_client}
                  onCheckedChange={(checked) =>
                    setPendingPricing((prev) => ({
                      ...prev,
                      show_nightly_rate_to_client: !!checked,
                    }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show_nightly_rate" className="text-white cursor-pointer">
                  Nightly Rate ({formatCurrency(propertyForModal.custom_nightly_rate)})
                </Label>
              </div>
            )}

            {propertyForModal?.show_purchase_price && propertyForModal?.custom_purchase_price && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_purchase_price"
                  checked={pendingPricing.show_purchase_price_to_client}
                  onCheckedChange={(checked) =>
                    setPendingPricing((prev) => ({
                      ...prev,
                      show_purchase_price_to_client: !!checked,
                    }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show_purchase_price" className="text-white cursor-pointer">
                  Purchase Price ({formatCurrency(propertyForModal.custom_purchase_price)})
                </Label>
              </div>
            )}

            {isBulkModal && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-400">
                These pricing settings will apply to all {selectedProperties.size} selected properties
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowPricingModal(null)}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={isBulkModal ? handleConfirmBulkAdd : isEditMode ? handleSavePricing : handleConfirmAssign}
              disabled={!!isAssigning}
              className="bg-white text-black hover:bg-white/90"
            >
              {isAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isBulkModal ? 'Assign Properties' : isEditMode ? 'Save Changes' : 'Assign Property'
              )}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Assigned Properties Section */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">{clientName}'s Properties</CardTitle>
              <CardDescription className="text-white/70">
                {assignedProperties.length} {assignedProperties.length === 1 ? 'property' : 'properties'} assigned
              </CardDescription>
            </div>
            {isSavingOrder && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignedProperties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto mb-3 text-white/30" />
              <p className="text-white/60">No properties assigned yet</p>
              <p className="text-sm text-white/40 mt-1">Add properties from the available list</p>
            </div>
          ) : (
            assignedProperties.map((property, index) => {
              const isDragging = dragIndex === index
              const isDragOver = dragOverIndex === index
              const firstImage = property.images && property.images.length > 0 ? property.images[0] : null

              return (
                <div
                  key={property.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    handleDragStart(index)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    handleDragOver(index)
                  }}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className={`glass-card-accent p-3 rounded-lg transition-all ${
                    isDragging ? 'opacity-40 scale-95' : ''
                  } ${
                    isDragOver
                      ? dragDirection === 'down'
                        ? 'border-b-4 border-white'
                        : 'border-t-4 border-white'
                      : ''
                  } cursor-move hover:bg-white/5`}
                >
                  <div className="flex items-center gap-3">
                    {/* Desktop Drag Handle */}
                    <div className="hidden md:flex items-center justify-center w-8">
                      <GripVertical className="h-5 w-5 text-white/50" />
                    </div>

                    {/* Mobile Move Buttons */}
                    <div className="flex md:hidden flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0 hover:bg-white/10"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === assignedProperties.length - 1}
                        className="h-6 w-6 p-0 hover:bg-white/10"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Property Image */}
                    {firstImage && (
                      <div className="w-16 h-16 rounded overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={firstImage}
                          alt={property.address || 'Property'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{property.address || 'Unknown Address'}</p>
                      <div className="flex gap-3 text-xs text-white/60 mt-1">
                        {property.bedrooms && <span>{property.bedrooms} bed</span>}
                        {property.bathrooms && <span>{property.bathrooms} bath</span>}
                        {property.area && <span>{formatNumber(property.area)} sqft</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditPricing(property)}
                        disabled={!!isAssigning}
                        className="hover:bg-white/10 text-white"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(property.id)}
                        disabled={isAssigning === property.id}
                        className="hover:bg-red-500/20 text-red-400"
                      >
                        {isAssigning === property.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Available Properties Section */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Available Properties</CardTitle>
              <CardDescription className="text-white/70">
                {availableProperties.length} {availableProperties.length === 1 ? 'property' : 'properties'} available
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant={isBulkMode ? 'default' : 'outline'}
              onClick={toggleBulkMode}
              className={isBulkMode ? 'bg-blue-500 hover:bg-blue-600' : 'border-white/30 text-white hover:bg-white/10'}
            >
              {isBulkMode ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Bulk Mode
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Bulk Select
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/30 text-white placeholder:text-white/40"
            />
          </div>

          {isBulkMode && selectedProperties.size > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={handleBulkAdd}
                disabled={!!isAssigning}
                className="bg-green-500 hover:bg-green-600"
              >
                {isAssigning === 'bulk' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add {selectedProperties.size} Selected
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={selectAll}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Select All ({filteredAvailable.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deselectAll}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Deselect All
              </Button>
            </div>
          )}

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredAvailable.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/60">
                  {searchQuery ? 'No properties match your search' : 'All properties have been assigned'}
                </p>
              </div>
            ) : (
              filteredAvailable.map((property) => {
                const firstImage = property.images && property.images.length > 0 ? property.images[0] : null
                const isSelected = selectedProperties.has(property.id)

                return (
                  <div
                    key={property.id}
                    onClick={() => isBulkMode && togglePropertySelection(property.id)}
                    className={`glass-card-accent p-3 rounded-lg transition-all ${
                      isBulkMode ? 'cursor-pointer hover:bg-white/10' : ''
                    } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Bulk Select Checkbox */}
                      {isBulkMode && (
                        <div className="flex-shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePropertySelection(property.id)}
                            className="border-white/30 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                        </div>
                      )}

                      {/* Property Image */}
                      {firstImage && (
                        <div className="w-16 h-16 rounded overflow-hidden bg-white/5 flex-shrink-0">
                          <img
                            src={firstImage}
                            alt={property.address || 'Property'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}

                      {/* Property Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{property.address || 'Unknown Address'}</p>
                        <div className="flex gap-3 text-xs text-white/60 mt-1">
                          {property.bedrooms && <span>{property.bedrooms} bed</span>}
                          {property.bathrooms && <span>{property.bathrooms} bath</span>}
                          {property.area && <span>{formatNumber(property.area)} sqft</span>}
                        </div>
                      </div>

                      {/* Add Button (only in single mode) */}
                      {!isBulkMode && (
                        <Button
                          size="sm"
                          onClick={() => handleStartAssign(property)}
                          disabled={!!isAssigning}
                          className="bg-white text-black hover:bg-white/90 flex-shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {renderPricingModal()}
    </div>
  )
}
