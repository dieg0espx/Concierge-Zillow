'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  Upload,
  X,
  ImagePlus,
  Car,
  Plane,
  Ship,
  Calendar,
} from 'lucide-react'
import { createQuote, updateQuote, QuoteWithItems } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface ServiceItem {
  id?: string
  service_name: string
  description: string
  price: number
  images: string[]
}

interface TripDetail {
  label: string
  value: string
}

interface ServicePDFOverride {
  details: TripDetail[]
  display_images: string[]
}

interface QuoteFormProps {
  quote?: QuoteWithItems
  mode: 'create' | 'edit'
}

export function QuoteForm({ quote, mode }: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  // Form state
  const [clientName, setClientName] = useState(quote?.client_name || '')
  const [clientEmail, setClientEmail] = useState(quote?.client_email || '')
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    quote?.expiration_date ? new Date(quote.expiration_date) : null
  )
  const [notes, setNotes] = useState(quote?.notes || '')
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(
    quote?.service_items?.map(item => ({
      id: item.id,
      service_name: item.service_name,
      description: item.description || '',
      price: item.price,
      images: item.images || [],
    })) || [{ service_name: '', description: '', price: 0, images: [] }]
  )

  // PDF Customization state
  const [pdfTitle, setPdfTitle] = useState(quote?.pdf_customization?.header_title || '')
  const [pdfSubtitle, setPdfSubtitle] = useState(quote?.pdf_customization?.header_subtitle || '')
  const [pdfIcon, setPdfIcon] = useState<'plane' | 'car' | 'yacht' | 'none'>(quote?.pdf_customization?.header_icon || 'plane')
  const [servicePDFOverrides, setServicePDFOverrides] = useState<{ [index: number]: ServicePDFOverride }>(() => {
    // Initialize from existing quote if available
    const overrides: { [index: number]: ServicePDFOverride } = {}
    if (quote?.pdf_customization?.service_overrides && quote?.service_items) {
      quote.service_items.forEach((item, index) => {
        const override = quote.pdf_customization?.service_overrides?.[item.id]
        if (override) {
          overrides[index] = {
            details: override.details || [],
            display_images: override.display_images || [],
          }
        }
      })
    }
    return overrides
  })

  // Calculate total
  const total = serviceItems.reduce((sum, item) => sum + (item.price || 0), 0)

  const addServiceItem = () => {
    setServiceItems([{ service_name: '', description: '', price: 0, images: [] }, ...serviceItems])
  }

  const removeServiceItem = (index: number) => {
    if (serviceItems.length === 1) {
      toast({
        title: 'Error',
        description: 'At least one service item is required',
        variant: 'destructive',
      })
      return
    }
    setServiceItems(serviceItems.filter((_, i) => i !== index))
  }

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: any) => {
    const updated = [...serviceItems]
    updated[index] = { ...updated[index], [field]: value }
    setServiceItems(updated)
  }

  const handleImageUpload = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingIndex(index)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please use PNG, JPEG, or WEBP.`)
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Max size is 10MB.`)
        }

        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', 'concierge') // We'll create this preset
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

      // Add uploaded images to the service item
      const updated = [...serviceItems]
      updated[index] = {
        ...updated[index],
        images: [...updated[index].images, ...uploadedUrls],
      }
      setServiceItems(updated)

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
      setUploadingIndex(null)
      // Reset file input
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = ''
      }
    }
  }

  // PDF Override helpers
  const addTripDetail = (serviceIndex: number, label: string) => {
    setServicePDFOverrides(prev => {
      const current = prev[serviceIndex] || { details: [], display_images: [] }
      return {
        ...prev,
        [serviceIndex]: {
          ...current,
          details: [...current.details, { label, value: '' }],
        }
      }
    })
  }

  const updateTripDetail = (serviceIndex: number, detailIndex: number, field: 'label' | 'value', value: string) => {
    setServicePDFOverrides(prev => {
      const current = prev[serviceIndex] || { details: [], display_images: [] }
      const details = [...current.details]
      details[detailIndex] = { ...details[detailIndex], [field]: value }
      return {
        ...prev,
        [serviceIndex]: {
          ...current,
          details,
        }
      }
    })
  }

  const removeTripDetail = (serviceIndex: number, detailIndex: number) => {
    setServicePDFOverrides(prev => {
      const current = prev[serviceIndex] || { details: [], display_images: [] }
      return {
        ...prev,
        [serviceIndex]: {
          ...current,
          details: current.details.filter((_, i) => i !== detailIndex),
        }
      }
    })
  }

  const togglePDFImage = (serviceIndex: number, imageUrl: string) => {
    setServicePDFOverrides(prev => {
      const current = prev[serviceIndex] || { details: [], display_images: [] }
      const currentImages = current.display_images || []
      let newImages: string[]

      if (currentImages.includes(imageUrl)) {
        newImages = currentImages.filter(img => img !== imageUrl)
      } else if (currentImages.length < 2) {
        newImages = [...currentImages, imageUrl]
      } else {
        // Replace second image
        newImages = [currentImages[0], imageUrl]
      }

      return {
        ...prev,
        [serviceIndex]: {
          ...current,
          display_images: newImages,
        }
      }
    })
  }

  const removeImage = (itemIndex: number, imageIndex: number) => {
    // Note: For Cloudinary, we're just removing from the UI
    // Images will still exist in Cloudinary unless manually deleted from the dashboard
    // You can implement Cloudinary deletion API if needed

    // Remove from state
    const updated = [...serviceItems]
    updated[itemIndex] = {
      ...updated[itemIndex],
      images: updated[itemIndex].images.filter((_, i) => i !== imageIndex),
    }
    setServiceItems(updated)
  }

  const handleSubmit = async (sendAfterSave: boolean = false) => {
    // Validation
    if (!clientName.trim()) {
      toast({ title: 'Error', description: 'Client name is required', variant: 'destructive' })
      return
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast({ title: 'Error', description: 'Valid client email is required', variant: 'destructive' })
      return
    }
    if (!expirationDate) {
      toast({ title: 'Error', description: 'Expiration date is required', variant: 'destructive' })
      return
    }

    // Validate service items
    const validItems = serviceItems.filter(item => item.service_name.trim() && item.price > 0)
    if (validItems.length === 0) {
      toast({ title: 'Error', description: 'At least one service item with name and price is required', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)

    try {
      // Build PDF customization object
      const serviceOverrides: { [index: string]: { details: TripDetail[]; display_images: string[] } } = {}

      // Only include overrides for valid items that have data
      validItems.forEach((item, newIndex) => {
        // Find the original index of this item in serviceItems
        const originalIndex = serviceItems.findIndex(si => si === item)
        const override = servicePDFOverrides[originalIndex]

        if (override && (override.details.length > 0 || override.display_images.length > 0)) {
          // Filter out details with empty values
          const validDetails = override.details.filter(d => d.label.trim() && d.value.trim())
          if (validDetails.length > 0 || override.display_images.length > 0) {
            serviceOverrides[newIndex.toString()] = {
              details: validDetails,
              display_images: override.display_images,
            }
          }
        }
      })

      const pdfCustomization = (pdfTitle || pdfSubtitle || pdfIcon !== 'plane' || Object.keys(serviceOverrides).length > 0)
        ? {
            header_title: pdfTitle || undefined,
            header_subtitle: pdfSubtitle || undefined,
            header_icon: pdfIcon,
            service_overrides: Object.keys(serviceOverrides).length > 0 ? serviceOverrides : undefined,
          }
        : null

      const quoteData = {
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : '',
        notes: notes.trim() || null,
        service_items: validItems.map(item => ({
          service_name: item.service_name.trim(),
          description: item.description.trim() || null,
          price: item.price,
          images: item.images,
        })),
        status: sendAfterSave ? 'sent' as const : 'draft' as const,
        pdf_customization: pdfCustomization,
      }

      let result
      if (mode === 'edit' && quote) {
        result = await updateQuote(quote.id, quoteData)
      } else {
        result = await createQuote(quoteData)
      }

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: mode === 'edit' ? 'Quote updated' : 'Quote created',
        description: sendAfterSave
          ? 'Quote has been sent to the client'
          : 'Quote has been saved as draft',
      })

      router.push('/admin/quotes')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const serviceSuggestions = [
    { icon: Car, name: 'Exotic Car Rental', desc: 'Luxury vehicle rental' },
    { icon: Plane, name: 'Private Jet Charter', desc: 'Private aviation service' },
    { icon: Ship, name: 'Yacht Charter', desc: 'Luxury yacht rental' },
  ]

  return (
    <div className="space-y-8">
      {/* Client Information */}
      <Card className="glass-card-accent border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-white/90">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Smith"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-white/90">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@email.com"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="text-white/90 uppercase tracking-wide text-sm font-semibold">Expiration Date *</Label>
            <div className="relative w-full sm:w-64">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 pointer-events-none z-10" />
              <DatePicker
                selected={expirationDate}
                onChange={(date: Date | null) => setExpirationDate(date)}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select expiration date"
                className="w-full pl-10 bg-white/5 border border-white/20 text-white placeholder:text-white/40 h-12 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-white/30"
                calendarClassName="luxury-calendar"
                wrapperClassName="w-full"
                popperClassName="date-picker-popper"
                withPortal
                portalId="root-portal"
                popperModifiers={[
                  {
                    name: 'zIndex',
                    enabled: true,
                    phase: 'write',
                    fn: ({ state }) => {
                      state.styles.popper.zIndex = 99999;
                    },
                  },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Items */}
      <Card className="glass-card-accent border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Service Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addServiceItem}
            className="border-white/30 hover:bg-white/10 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Add Suggestions */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10">
            <span className="text-white/60 text-sm mr-2">Quick add:</span>
            {serviceSuggestions.map((suggestion) => (
              <Button
                key={suggestion.name}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Find the first empty card (no service name)
                  const emptyIndex = serviceItems.findIndex(item => !item.service_name.trim())

                  if (emptyIndex !== -1) {
                    // Fill the first empty card
                    const updated = [...serviceItems]
                    updated[emptyIndex] = {
                      service_name: suggestion.name,
                      description: suggestion.desc,
                      price: 0,
                      images: updated[emptyIndex].images || []
                    }
                    setServiceItems(updated)
                  } else {
                    // If no empty card, add at the top
                    setServiceItems([
                      { service_name: suggestion.name, description: suggestion.desc, price: 0, images: [] },
                      ...serviceItems
                    ])
                  }
                }}
                className="text-white/70 hover:text-white hover:bg-white/10 text-xs"
              >
                <suggestion.icon className="h-3 w-3 mr-1" />
                {suggestion.name}
              </Button>
            ))}
          </div>

          {serviceItems.map((item, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-white/90">Service Name *</Label>
                      <Input
                        value={item.service_name}
                        onChange={(e) => updateServiceItem(index, 'service_name', e.target.value)}
                        placeholder="e.g., Ferrari 488 GTB Rental"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">Price *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price || ''}
                          onChange={(e) => updateServiceItem(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="pl-7 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/90">Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateServiceItem(index, 'description', e.target.value)}
                      placeholder="Describe the service, features, duration, etc."
                      rows={2}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
                    />
                  </div>

                  {/* Images Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white/90">Photos</Label>
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el }}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        multiple
                        onChange={(e) => handleImageUpload(index, e.target.files)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={uploadingIndex === index}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        {uploadingIndex === index ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4 mr-2" />
                        )}
                        Add Photos
                      </Button>
                    </div>

                    {item.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {item.images.map((imageUrl, imgIndex) => (
                          <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={`${item.service_name} photo ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, imgIndex)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.images.length === 0 && (
                      <div
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center cursor-pointer hover:border-white/40 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-white/30 mx-auto mb-2" />
                        <p className="text-white/50 text-sm">Click to upload photos</p>
                        <p className="text-white/30 text-xs mt-1">PNG, JPEG, WEBP (max 10MB each)</p>
                      </div>
                    )}
                  </div>
                </div>

                {serviceItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeServiceItem(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-end pt-4 border-t border-white/10">
            <div className="text-right">
              <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Total</p>
              <p className="text-white text-3xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Customization */}
      <Card className="glass-card-accent border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            PDF Customization
            <span className="text-xs font-normal text-white/50">(for client-facing PDF)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Settings */}
          <div className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-white/90 font-medium">PDF Header</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Title</Label>
                <Input
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="e.g., Private Jet Charter Proposal"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Subtitle</Label>
                <Input
                  value={pdfSubtitle}
                  onChange={(e) => setPdfSubtitle(e.target.value)}
                  placeholder="e.g., Exclusive Rates"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Icon</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'plane' as const, label: 'Airplane', icon: Plane },
                  { value: 'car' as const, label: 'Car', icon: Car },
                  { value: 'yacht' as const, label: 'Yacht', icon: Ship },
                  { value: 'none' as const, label: 'None', icon: null },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPdfIcon(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                      pdfIcon === option.value
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-white/70 border-white/20 hover:border-white/40'
                    }`}
                  >
                    {option.icon && <option.icon className="h-4 w-4" />}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trip Details per Service */}
          <div className="space-y-4">
            <h4 className="text-white/90 font-medium">Trip Details (shown on PDF)</h4>
            {serviceItems.map((item, index) => {
              if (!item.service_name.trim()) return null
              const override = servicePDFOverrides[index] || { details: [], display_images: [] }
              const presetLabels = ['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers']

              return (
                <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{item.service_name}</span>
                    <span className="text-white/50 text-sm">{formatCurrency(item.price)}</span>
                  </div>

                  {/* Quick add detail buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-white/50 text-xs mr-2">Add field:</span>
                    {presetLabels.map((label) => {
                      const exists = override.details?.some(d => d.label === label)
                      if (exists) return null
                      return (
                        <Button
                          key={label}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addTripDetail(index, label)}
                          className="text-xs h-7 px-2 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {label}
                        </Button>
                      )
                    })}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addTripDetail(index, '')}
                      className="text-xs h-7 px-2 text-white/60 hover:text-white hover:bg-white/10 border border-dashed border-white/30"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Custom
                    </Button>
                  </div>

                  {/* Detail inputs */}
                  {override.details && override.details.length > 0 && (
                    <div className="space-y-2">
                      {override.details.map((detail, detailIndex) => {
                        const isPreset = presetLabels.includes(detail.label)
                        return (
                          <div key={detailIndex} className="flex items-center gap-2">
                            {isPreset ? (
                              <div className="w-28 text-sm text-white/70 flex-shrink-0">{detail.label}</div>
                            ) : (
                              <Input
                                value={detail.label}
                                onChange={(e) => updateTripDetail(index, detailIndex, 'label', e.target.value)}
                                placeholder="Field name"
                                className="w-28 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm flex-shrink-0"
                              />
                            )}
                            <Input
                              value={detail.value}
                              onChange={(e) => updateTripDetail(index, detailIndex, 'value', e.target.value)}
                              placeholder={
                                detail.label === 'Date' ? 'Friday, December 26th, 2025' :
                                detail.label === 'Departure Code' ? 'FXE' :
                                detail.label === 'Departure' ? 'Fort Lauderdale, FL' :
                                detail.label === 'Arrival Code' ? 'KASE' :
                                detail.label === 'Arrival' ? 'Aspen, CO' :
                                detail.label === 'Duration' ? '3h 34m' :
                                detail.label === 'Passengers' ? '8' :
                                'Enter value...'
                              }
                              className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTripDetail(index, detailIndex)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* PDF Image Selection */}
                  {item.images.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">Select images for PDF (max 2)</Label>
                      <div className="flex flex-wrap gap-2">
                        {item.images.map((imageUrl, imgIndex) => {
                          const isSelected = override.display_images?.includes(imageUrl)
                          const selectionOrder = isSelected ? override.display_images.indexOf(imageUrl) + 1 : null
                          return (
                            <button
                              key={imgIndex}
                              type="button"
                              onClick={() => togglePDFImage(index, imageUrl)}
                              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                isSelected ? 'border-white' : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={`Image ${imgIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1 left-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-xs font-bold">
                                  {selectionOrder}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="glass-card-accent border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes, terms, or conditions..."
            rows={4}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="border-white/30 hover:bg-white/10 text-white"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save as Draft
        </Button>
        {mode === 'create' && (
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="btn-luxury"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Save & Send
          </Button>
        )}
      </div>
    </div>
  )
}
