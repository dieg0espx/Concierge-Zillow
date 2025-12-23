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
import { createPropertyAndAssignToClient, NewPropertyData } from '@/lib/actions/properties'
import { Textarea } from '@/components/ui/textarea'
import { Search, Home, Plus, X, Loader2, Settings, Check, GripVertical, ChevronUp, ChevronDown, CheckSquare, Square, Upload, DollarSign, Link2, Edit3 } from 'lucide-react'
import { saveProperty } from '@/lib/supabase'
import { assignPropertyToManagers } from '@/lib/actions/properties'
import { getCurrentManagerProfile } from '@/lib/actions/clients'
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

  // New property modal state
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false)
  const [isCreatingProperty, setIsCreatingProperty] = useState(false)
  const [inputMode, setInputMode] = useState<'scrape' | 'manual'>('scrape')
  const [zillowUrl, setZillowUrl] = useState('')
  const [newPropertyData, setNewPropertyData] = useState<NewPropertyData>({
    address: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    images: [],
    custom_monthly_rent: undefined,
    custom_nightly_rate: undefined,
    custom_purchase_price: undefined,
    show_monthly_rent: false,
    show_nightly_rate: false,
    show_purchase_price: false,
  })
  const [manualDescription, setManualDescription] = useState('')
  const [manualImageUrls, setManualImageUrls] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // New property handlers
  const handleOpenNewPropertyModal = () => {
    setNewPropertyData({
      address: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      images: [],
      custom_monthly_rent: undefined,
      custom_nightly_rate: undefined,
      custom_purchase_price: undefined,
      show_monthly_rent: false,
      show_nightly_rate: false,
      show_purchase_price: false,
    })
    setZillowUrl('')
    setManualDescription('')
    setManualImageUrls('')
    setInputMode('scrape')
    setShowNewPropertyModal(true)
  }

  // Scrape from Zillow
  const handleScrapeProperty = async () => {
    if (!zillowUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a Zillow URL',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingProperty(true)

    try {
      const apiKey = process.env.NEXT_PUBLIC_HASDATA_API_KEY
      if (!apiKey) {
        throw new Error('HasData API key is not configured')
      }

      const response = await fetch('https://api.hasdata.com/scrape/zillow/property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          url: zillowUrl.trim(),
          scrape_description: true
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        let errorMessage = 'Unknown error occurred'

        if (response.status === 400) {
          errorMessage = 'Invalid Zillow URL or property not found'
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = 'API authentication failed'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait and try again.'
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      const propertyData = data.property || data

      // Extract address
      let address = ""
      if (propertyData.addressRaw) {
        address = propertyData.addressRaw
      } else if (typeof propertyData.address === 'object' && propertyData.address) {
        const addr = propertyData.address
        const parts = [addr.street, addr.city, `${addr.state} ${addr.zipcode}`].filter(Boolean)
        address = parts.join(', ')
      } else if (typeof propertyData.address === 'string') {
        address = propertyData.address
      } else if (propertyData.fullAddress) {
        address = propertyData.fullAddress
      }

      if (!address) {
        address = "Address not available"
      }

      // Check for multi-unit building
      const hasListings = Array.isArray(propertyData.listings) && propertyData.listings.length > 0
      const hasFloorPlans = Array.isArray(propertyData.floorPlans) && propertyData.floorPlans.length > 0
      const isMultiUnit = hasListings || hasFloorPlans
      const unitData = hasListings ? propertyData.listings : (hasFloorPlans ? propertyData.floorPlans : [])

      let bedrooms = ""
      let bathrooms = ""
      let area = ""

      if (isMultiUnit && unitData.length > 0) {
        const beds = unitData.map((l: any) => l.bedrooms || l.beds).filter((b: any) => b !== null && b !== undefined).map((b: any) => parseInt(b)).filter((b: number) => !isNaN(b))
        if (beds.length > 0) {
          const minBeds = Math.min(...beds)
          const maxBeds = Math.max(...beds)
          bedrooms = minBeds === maxBeds ? minBeds.toString() : `${minBeds}-${maxBeds}`
        }

        const baths = unitData.map((l: any) => l.bathrooms || l.baths).filter((b: any) => b !== null && b !== undefined).map((b: any) => parseFloat(b)).filter((b: number) => !isNaN(b))
        if (baths.length > 0) {
          const minBaths = Math.min(...baths)
          const maxBaths = Math.max(...baths)
          bathrooms = minBaths === maxBaths ? minBaths.toString() : `${minBaths}-${maxBaths}`
        }

        const areas = unitData.map((l: any) => l.livingArea || l.area || l.sqft).filter((a: any) => a !== null && a !== undefined && a !== 0).map((a: any) => parseInt(a)).filter((a: number) => !isNaN(a) && a > 0)
        if (areas.length > 0) {
          const minArea = Math.min(...areas)
          const maxArea = Math.max(...areas)
          area = minArea === maxArea ? minArea.toString() : `${minArea}-${maxArea}`
        }
      } else {
        bedrooms = (propertyData.bedrooms || propertyData.beds || "").toString()
        bathrooms = (propertyData.bathrooms || propertyData.baths || "").toString()
        area = (propertyData.livingArea || propertyData.area || "").toString()
      }

      // Get images
      let zillowImageUrls: string[] = []
      const rawPhotos = propertyData.photos || propertyData.images || []
      if (rawPhotos.length > 0) {
        if (typeof rawPhotos[0] === 'string') {
          zillowImageUrls = rawPhotos
        } else if (typeof rawPhotos[0] === 'object') {
          zillowImageUrls = rawPhotos.map((p: any) => p.url || p.href || p.src).filter(Boolean)
        }
      }
      if (propertyData.image && !zillowImageUrls.includes(propertyData.image)) {
        zillowImageUrls.unshift(propertyData.image)
      }

      // Upload images to Cloudinary
      let cloudinaryImageUrls: string[] = []
      if (zillowImageUrls.length > 0) {
        try {
          const uploadResponse = await fetch('/api/upload-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrls: zillowImageUrls,
              propertyAddress: address,
            }),
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            cloudinaryImageUrls = uploadData.urls || []
          }

          if (cloudinaryImageUrls.length === 0) {
            cloudinaryImageUrls = zillowImageUrls
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError)
          cloudinaryImageUrls = zillowImageUrls
        }
      }

      // Save the property
      const newProperty = {
        address,
        bedrooms,
        bathrooms,
        area,
        zillow_url: zillowUrl.trim(),
        images: cloudinaryImageUrls,
        description: propertyData.description || null,
        show_monthly_rent: newPropertyData.show_monthly_rent,
        custom_monthly_rent: newPropertyData.custom_monthly_rent || null,
        show_nightly_rate: newPropertyData.show_nightly_rate,
        custom_nightly_rate: newPropertyData.custom_nightly_rate || null,
        show_purchase_price: newPropertyData.show_purchase_price,
        custom_purchase_price: newPropertyData.custom_purchase_price || null,
      }

      const savedProperty = await saveProperty(newProperty)

      // Get current manager and assign property
      const { data: managerProfile } = await getCurrentManagerProfile()
      if (managerProfile && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, [managerProfile.id])
      }

      // Assign to client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Get next position
      const { data: existingAssignments } = await supabase
        .from('client_property_assignments')
        .select('position')
        .eq('client_id', clientId)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = existingAssignments && existingAssignments.length > 0
        ? (existingAssignments[0].position || 0) + 1
        : 0

      await supabase.from('client_property_assignments').insert({
        client_id: clientId,
        property_id: savedProperty.id,
        position: nextPosition,
        show_monthly_rent_to_client: newPropertyData.show_monthly_rent ?? true,
        show_nightly_rate_to_client: newPropertyData.show_nightly_rate ?? true,
        show_purchase_price_to_client: newPropertyData.show_purchase_price ?? true,
      })

      // Generate AI description
      try {
        await fetch('/api/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: savedProperty.id,
            address,
            bedrooms,
            bathrooms,
            area,
          }),
        })
      } catch (descError) {
        console.warn('AI description generation failed:', descError)
      }

      toast({
        title: 'Success',
        description: 'Property scraped and assigned to client',
      })
      setShowNewPropertyModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error scraping property:', error)
      toast({
        title: 'Failed to Scrape Property',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingProperty(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'concierge')
        formData.append('folder', 'concierge')

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dku1gnuat/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        return data.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      setNewPropertyData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }))

      toast({
        title: 'Images uploaded',
        description: `Successfully uploaded ${uploadedUrls.length} image(s)`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (imageUrl: string) => {
    setNewPropertyData(prev => ({
      ...prev,
      images: prev.images?.filter(img => img !== imageUrl) || [],
    }))
  }

  const handleCreateProperty = async () => {
    if (!newPropertyData.address.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an address for the property',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingProperty(true)

    try {
      // Parse images from comma-separated URLs if provided in manual mode
      let allImages = [...(newPropertyData.images || [])]
      if (manualImageUrls.trim()) {
        const urlImages = manualImageUrls
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0)
        allImages = [...allImages, ...urlImages]
      }

      // Save the property with all data
      const newProperty = {
        address: newPropertyData.address,
        bedrooms: newPropertyData.bedrooms || "",
        bathrooms: newPropertyData.bathrooms || "",
        area: newPropertyData.area || "",
        zillow_url: "",
        images: allImages,
        description: manualDescription || undefined,
        show_monthly_rent: newPropertyData.show_monthly_rent,
        custom_monthly_rent: newPropertyData.custom_monthly_rent || null,
        show_nightly_rate: newPropertyData.show_nightly_rate,
        custom_nightly_rate: newPropertyData.custom_nightly_rate || null,
        show_purchase_price: newPropertyData.show_purchase_price,
        custom_purchase_price: newPropertyData.custom_purchase_price || null,
      }

      const savedProperty = await saveProperty(newProperty)

      // Get current manager and assign property
      const { data: managerProfile } = await getCurrentManagerProfile()
      if (managerProfile && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, [managerProfile.id])
      }

      // Assign to client
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Get next position
      const { data: existingAssignments } = await supabase
        .from('client_property_assignments')
        .select('position')
        .eq('client_id', clientId)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = existingAssignments && existingAssignments.length > 0
        ? (existingAssignments[0].position || 0) + 1
        : 0

      await supabase.from('client_property_assignments').insert({
        client_id: clientId,
        property_id: savedProperty.id,
        position: nextPosition,
        show_monthly_rent_to_client: newPropertyData.show_monthly_rent ?? true,
        show_nightly_rate_to_client: newPropertyData.show_nightly_rate ?? true,
        show_purchase_price_to_client: newPropertyData.show_purchase_price ?? true,
      })

      // Generate AI description if no description was provided
      if (!manualDescription && savedProperty.id) {
        try {
          await fetch('/api/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              propertyId: savedProperty.id,
              address: newPropertyData.address,
              bedrooms: newPropertyData.bedrooms,
              bathrooms: newPropertyData.bathrooms,
              area: newPropertyData.area,
            }),
          })
        } catch (descError) {
          console.warn('AI description generation failed:', descError)
        }
      }

      toast({
        title: 'Success',
        description: 'Property created and assigned to client',
      })
      setShowNewPropertyModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating property:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingProperty(false)
    }
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

  // New property modal component
  const renderNewPropertyModal = () => {
    if (!isMounted || !showNewPropertyModal) return null

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-zinc-900 border border-white/20 rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Add New Property</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNewPropertyModal(false)}
              className="hover:bg-white/10 text-white"
              disabled={isCreatingProperty}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={inputMode === 'scrape' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('scrape')}
              className={inputMode === 'scrape' ? 'bg-white text-black' : 'border-white/30 text-white hover:bg-white/10'}
              disabled={isCreatingProperty}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Scrape from Zillow
            </Button>
            <Button
              variant={inputMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('manual')}
              className={inputMode === 'manual' ? 'bg-white text-black' : 'border-white/30 text-white hover:bg-white/10'}
              disabled={isCreatingProperty}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>

          <div className="space-y-4">
            {inputMode === 'scrape' ? (
              /* Scrape Mode */
              <>
                <div>
                  <Label htmlFor="zillow_url" className="text-white mb-2 block">
                    Zillow Property URL <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="zillow_url"
                    value={zillowUrl}
                    onChange={(e) => setZillowUrl(e.target.value)}
                    placeholder="https://www.zillow.com/homedetails/..."
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                    disabled={isCreatingProperty}
                  />
                  <p className="text-xs text-white/50 mt-2">
                    Paste a Zillow property URL to automatically fetch details, images, and description
                  </p>
                </div>
              </>
            ) : (
              /* Manual Mode */
              <>
                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-white mb-2 block">
                    Address <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={newPropertyData.address}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, Miami, FL 33101"
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                    disabled={isCreatingProperty}
                  />
                </div>

                {/* Bedrooms, Bathrooms, Area */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="bedrooms" className="text-white mb-2 block">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      value={newPropertyData.bedrooms}
                      onChange={(e) => setNewPropertyData(prev => ({ ...prev, bedrooms: e.target.value }))}
                      placeholder="e.g., 3"
                      className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                      disabled={isCreatingProperty}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms" className="text-white mb-2 block">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      value={newPropertyData.bathrooms}
                      onChange={(e) => setNewPropertyData(prev => ({ ...prev, bathrooms: e.target.value }))}
                      placeholder="e.g., 2"
                      className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                      disabled={isCreatingProperty}
                    />
                  </div>
                  <div>
                    <Label htmlFor="area" className="text-white mb-2 block">Sq Ft</Label>
                    <Input
                      id="area"
                      value={newPropertyData.area}
                      onChange={(e) => setNewPropertyData(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="e.g., 2000"
                      className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                      disabled={isCreatingProperty}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-white mb-2 block">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Property description..."
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/40 min-h-[80px]"
                    disabled={isCreatingProperty}
                  />
                  <p className="text-xs text-white/50 mt-1">Leave blank to auto-generate with AI</p>
                </div>

                {/* Images - Upload */}
                <div>
                  <Label className="text-white mb-2 block">Images</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || isCreatingProperty}
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Images
                      </>
                    )}
                  </Button>
                  {newPropertyData.images && newPropertyData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {newPropertyData.images.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded overflow-hidden group">
                          <img src={img} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            disabled={isCreatingProperty}
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image URLs */}
                <div>
                  <Label htmlFor="image_urls" className="text-white mb-2 block">Or paste Image URLs</Label>
                  <Textarea
                    id="image_urls"
                    value={manualImageUrls}
                    onChange={(e) => setManualImageUrls(e.target.value)}
                    placeholder="Comma-separated image URLs..."
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/40 min-h-[60px]"
                    disabled={isCreatingProperty}
                  />
                </div>
              </>
            )}

            {/* Pricing Section - shown for both modes */}
            <div className="border-t border-white/20 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-white/60" />
                <Label className="text-white">Pricing Options</Label>
              </div>

              {/* Monthly Rent */}
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="show_monthly_rent_new"
                  checked={newPropertyData.show_monthly_rent}
                  onCheckedChange={(checked) =>
                    setNewPropertyData(prev => ({ ...prev, show_monthly_rent: !!checked }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  disabled={isCreatingProperty}
                />
                <Label htmlFor="show_monthly_rent_new" className="text-white cursor-pointer flex-1">
                  Monthly Rent
                </Label>
                {newPropertyData.show_monthly_rent && (
                  <Input
                    type="number"
                    value={newPropertyData.custom_monthly_rent || ''}
                    onChange={(e) => setNewPropertyData(prev => ({
                      ...prev,
                      custom_monthly_rent: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    placeholder="$0"
                    className="w-28 bg-white/5 border-white/30 text-white placeholder:text-white/40"
                    disabled={isCreatingProperty}
                  />
                )}
              </div>

              {/* Nightly Rate */}
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="show_nightly_rate_new"
                  checked={newPropertyData.show_nightly_rate}
                  onCheckedChange={(checked) =>
                    setNewPropertyData(prev => ({ ...prev, show_nightly_rate: !!checked }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  disabled={isCreatingProperty}
                />
                <Label htmlFor="show_nightly_rate_new" className="text-white cursor-pointer flex-1">
                  Nightly Rate
                </Label>
                {newPropertyData.show_nightly_rate && (
                  <Input
                    type="number"
                    value={newPropertyData.custom_nightly_rate || ''}
                    onChange={(e) => setNewPropertyData(prev => ({
                      ...prev,
                      custom_nightly_rate: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    placeholder="$0"
                    className="w-28 bg-white/5 border-white/30 text-white placeholder:text-white/40"
                    disabled={isCreatingProperty}
                  />
                )}
              </div>

              {/* Purchase Price */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="show_purchase_price_new"
                  checked={newPropertyData.show_purchase_price}
                  onCheckedChange={(checked) =>
                    setNewPropertyData(prev => ({ ...prev, show_purchase_price: !!checked }))
                  }
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                  disabled={isCreatingProperty}
                />
                <Label htmlFor="show_purchase_price_new" className="text-white cursor-pointer flex-1">
                  Purchase Price
                </Label>
                {newPropertyData.show_purchase_price && (
                  <Input
                    type="number"
                    value={newPropertyData.custom_purchase_price || ''}
                    onChange={(e) => setNewPropertyData(prev => ({
                      ...prev,
                      custom_purchase_price: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    placeholder="$0"
                    className="w-28 bg-white/5 border-white/30 text-white placeholder:text-white/40"
                    disabled={isCreatingProperty}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowNewPropertyModal(false)}
              className="text-white hover:bg-white/10"
              disabled={isCreatingProperty}
            >
              Cancel
            </Button>
            <Button
              onClick={inputMode === 'scrape' ? handleScrapeProperty : handleCreateProperty}
              disabled={isCreatingProperty || (inputMode === 'scrape' ? !zillowUrl.trim() : !newPropertyData.address.trim())}
              className="bg-white text-black hover:bg-white/90"
            >
              {isCreatingProperty ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {inputMode === 'scrape' ? 'Scraping...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {inputMode === 'scrape' ? 'Scrape & Add' : 'Create Property'}
                </>
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
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleOpenNewPropertyModal}
                className="bg-white text-black hover:bg-white/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Property
              </Button>
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
      {renderNewPropertyModal()}
    </div>
  )
}
