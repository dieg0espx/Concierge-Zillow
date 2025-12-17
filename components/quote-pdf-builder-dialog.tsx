'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { QuoteWithItems, PDFCustomization, ServiceOverride, updateQuotePDFCustomization } from '@/lib/actions/quotes'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  RotateCcw,
  Save,
  Download,
  Plus,
  Trash2,
  ImageIcon,
  FileText,
  Eye,
  Settings,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Plane,
  Car,
  Ship,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface QuotePDFBuilderDialogProps {
  quote: QuoteWithItems
  isOpen: boolean
  onClose: () => void
  onSave?: (customization: PDFCustomization) => void
}

interface ServiceOverrideState extends ServiceOverride {
  expanded?: boolean
}

export function QuotePDFBuilderDialog({
  quote,
  isOpen,
  onClose,
  onSave,
}: QuotePDFBuilderDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const previewRef = useRef<HTMLDivElement>(null)

  // Header customization
  const [headerTitle, setHeaderTitle] = useState('')
  const [headerSubtitle, setHeaderSubtitle] = useState('')
  const [headerIcon, setHeaderIcon] = useState<'plane' | 'car' | 'yacht' | 'none'>('plane')

  // Service overrides - keyed by service item ID
  const [serviceOverrides, setServiceOverrides] = useState<{ [key: string]: ServiceOverrideState }>({})

  // Footer customization
  const [customNotes, setCustomNotes] = useState('')
  const [customTerms, setCustomTerms] = useState('')

  // Initialize state from existing customization
  useEffect(() => {
    if (isOpen && quote) {
      const existing = quote.pdf_customization
      setHeaderTitle(existing?.header_title || '')
      setHeaderSubtitle(existing?.header_subtitle || '')
      setHeaderIcon(existing?.header_icon || 'plane')
      setCustomNotes(existing?.custom_notes || quote.notes || '')
      setCustomTerms(existing?.custom_terms || '')

      // Initialize service overrides
      const overrides: { [key: string]: ServiceOverrideState } = {}
      quote.service_items.forEach((item, index) => {
        const existingOverride = existing?.service_overrides?.[item.id]
        overrides[item.id] = {
          display_name: existingOverride?.display_name || item.service_name,
          display_description: existingOverride?.display_description || item.description || '',
          display_images: existingOverride?.display_images || item.images?.slice(0, 2) || [],
          details: existingOverride?.details || [],
          expanded: index === 0, // First item expanded by default
        }
      })
      setServiceOverrides(overrides)
    }
  }, [isOpen, quote])

  // Build current customization object
  const buildCustomization = (): PDFCustomization => {
    const serviceOverridesClean: { [key: string]: ServiceOverride } = {}

    Object.entries(serviceOverrides).forEach(([id, override]) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expanded, ...cleanOverride } = override
      serviceOverridesClean[id] = cleanOverride
    })

    return {
      header_title: headerTitle || undefined,
      header_subtitle: headerSubtitle || undefined,
      header_icon: headerIcon,
      service_overrides: Object.keys(serviceOverridesClean).length > 0 ? serviceOverridesClean : undefined,
      custom_notes: customNotes || undefined,
      custom_terms: customTerms || undefined,
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    const customization = buildCustomization()

    const result = await updateQuotePDFCustomization(quote.id, customization)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'PDF customization saved successfully',
      })
      onSave?.(customization)
      router.refresh()
      onClose()
    }

    setIsSaving(false)
  }

  const handleReset = () => {
    setHeaderTitle('')
    setHeaderSubtitle('')
    setHeaderIcon('plane')
    setCustomNotes(quote.notes || '')
    setCustomTerms('')

    const overrides: { [key: string]: ServiceOverrideState } = {}
    quote.service_items.forEach((item, index) => {
      overrides[item.id] = {
        display_name: item.service_name,
        display_description: item.description || '',
        display_images: item.images?.slice(0, 2) || [],
        details: [],
        expanded: index === 0,
      }
    })
    setServiceOverrides(overrides)

    toast({
      title: 'Reset',
      description: 'Customization reset to defaults',
    })
  }

  // Helper function to convert oklch/oklab colors to hex
  const convertToHex = (color: string): string => {
    if (!color) return '#000000'
    if (color.startsWith('#')) return color
    if (color.includes('oklch') || color.includes('oklab')) {
      // Map common oklch/oklab values to hex equivalents
      // Whites and near-whites
      if (color.includes('0.985') || color.includes('0.99') || color.includes('0.98')) return '#ffffff'
      if (color.includes('0.967') || color.includes('0.97') || color.includes('0.96')) return '#f3f4f6'
      if (color.includes('0.928') || color.includes('0.93') || color.includes('0.92')) return '#e5e7eb'
      // Grays
      if (color.includes('0.872') || color.includes('0.87') || color.includes('0.86')) return '#d1d5db'
      if (color.includes('0.704') || color.includes('0.70') || color.includes('0.71')) return '#9ca3af'
      if (color.includes('0.556') || color.includes('0.55') || color.includes('0.56') || color.includes('0.54')) return '#6b7280'
      if (color.includes('0.446') || color.includes('0.45') || color.includes('0.44')) return '#4b5563'
      if (color.includes('0.37') || color.includes('0.38') || color.includes('0.36')) return '#374151'
      if (color.includes('0.21') || color.includes('0.22') || color.includes('0.20')) return '#1f2937'
      if (color.includes('0.129') || color.includes('0.13') || color.includes('0.14') || color.includes('0.15')) return '#111827'
      // Blues
      if (color.includes('0.588') && color.includes('250')) return '#3b82f6'
      if (color.includes('0.59') || color.includes('0.58')) return '#3b82f6'
      // Greens (for car mode indicators)
      if (color.includes('142') || color.includes('145') || color.includes('140')) return '#22c55e' // green-500
      if (color.includes('0.64') && color.includes('14')) return '#22c55e' // green-500
      if (color.includes('0.72') && color.includes('14')) return '#4ade80' // green-400
      // Reds
      if (color.includes('0.63') && color.includes('25')) return '#ef4444' // red-500
      if (color.includes('0.50') && color.includes('25')) return '#dc2626' // red-600
      // Default fallbacks based on lightness
      const match = color.match(/oklch\s*\(\s*([\d.]+)/)
      if (match) {
        const lightness = parseFloat(match[1])
        if (lightness > 0.9) return '#ffffff'
        if (lightness > 0.8) return '#e5e7eb'
        if (lightness > 0.7) return '#d1d5db'
        if (lightness > 0.6) return '#9ca3af'
        if (lightness > 0.5) return '#6b7280'
        if (lightness > 0.4) return '#4b5563'
        if (lightness > 0.3) return '#374151'
        if (lightness > 0.2) return '#1f2937'
        return '#111827'
      }
      return '#000000'
    }
    if (color.startsWith('rgba') || color.startsWith('rgb')) return color
    if (color === 'transparent') return 'transparent'
    return color
  }

  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      toast({
        title: 'Error',
        description: 'Preview not available. Please switch to Preview tab first.',
        variant: 'destructive',
      })
      return
    }

    setIsDownloading(true)

    try {
      // Switch to preview tab if not already there
      if (activeTab !== 'preview') {
        setActiveTab('preview')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Find the ticket preview element
      const ticketElement = previewRef.current.querySelector('.max-w-\\[400px\\]') as HTMLElement

      if (!ticketElement) {
        throw new Error('Could not find ticket preview element')
      }

      // Wait for images to load
      const images = ticketElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      // Store original styles to restore later
      const originalStyles: Map<HTMLElement, string> = new Map()

      // Apply inline hex colors to ALL elements BEFORE html2canvas processes them
      const allElements = ticketElement.querySelectorAll('*')
      allElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          // Save original inline style
          originalStyles.set(el, el.style.cssText)

          const computed = window.getComputedStyle(el)

          // Fix background color
          const bgColor = computed.backgroundColor
          if (bgColor) {
            el.style.backgroundColor = convertToHex(bgColor)
          }

          // Fix text color
          const textColor = computed.color
          if (textColor) {
            el.style.color = convertToHex(textColor)
          }

          // Fix border colors
          const borderColor = computed.borderColor
          if (borderColor) {
            el.style.borderColor = convertToHex(borderColor)
          }
        }
      })

      // Also fix the root element
      originalStyles.set(ticketElement, ticketElement.style.cssText)
      const rootComputed = window.getComputedStyle(ticketElement)
      ticketElement.style.backgroundColor = convertToHex(rootComputed.backgroundColor)
      ticketElement.style.color = convertToHex(rootComputed.color)

      // Fix image containers first - set explicit dimensions
      const imageContainers = ticketElement.querySelectorAll('.h-48')
      imageContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          const rect = container.getBoundingClientRect()
          originalStyles.set(container, container.style.cssText)
          container.style.width = rect.width + 'px'
          container.style.height = rect.height + 'px'
          container.style.overflow = 'hidden'
        }
      })

      // Fix all images - handle logo and content images differently
      const allImgs = ticketElement.querySelectorAll('img')
      allImgs.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const rect = img.getBoundingClientRect()
          const computed = window.getComputedStyle(img)
          originalStyles.set(img, img.style.cssText)

          // Check if this is the logo (in the header with object-contain)
          const isLogo = computed.objectFit === 'contain' || img.alt === 'Cadiz & Lluis'

          if (isLogo) {
            // For logo: preserve aspect ratio by only setting max dimensions
            img.style.maxWidth = rect.width + 'px'
            img.style.maxHeight = rect.height + 'px'
            img.style.width = 'auto'
            img.style.height = 'auto'
            img.style.objectFit = 'contain'
          } else {
            // For content images: html2canvas doesn't support object-fit well
            // We need to use a different approach - set explicit dimensions
            const parent = img.parentElement
            if (parent) {
              const parentRect = parent.getBoundingClientRect()
              // Calculate the aspect ratio to simulate object-cover
              const imgNaturalWidth = img.naturalWidth || rect.width
              const imgNaturalHeight = img.naturalHeight || rect.height
              const containerRatio = parentRect.width / parentRect.height
              const imageRatio = imgNaturalWidth / imgNaturalHeight

              if (imageRatio > containerRatio) {
                // Image is wider - fit by height, center horizontally
                const scaledWidth = parentRect.height * imageRatio
                img.style.width = scaledWidth + 'px'
                img.style.height = parentRect.height + 'px'
                img.style.marginLeft = -((scaledWidth - parentRect.width) / 2) + 'px'
                img.style.marginTop = '0'
              } else {
                // Image is taller - fit by width, center vertically
                const scaledHeight = parentRect.width / imageRatio
                img.style.width = parentRect.width + 'px'
                img.style.height = scaledHeight + 'px'
                img.style.marginTop = -((scaledHeight - parentRect.height) / 2) + 'px'
                img.style.marginLeft = '0'
              }
              img.style.objectFit = 'none'
              img.style.maxWidth = 'none'
              img.style.maxHeight = 'none'
            }
          }
        }
      })

      // Fix badge alignment for html2canvas - move text up with simple offset
      const badges = ticketElement.querySelectorAll('.rounded-full')
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          // Save original style
          originalStyles.set(badge, badge.style.cssText)

          // Fix text spans inside badges - move UP with negative margin
          const spans = badge.querySelectorAll('span')
          spans.forEach((span) => {
            if (span instanceof HTMLElement) {
              originalStyles.set(span, span.style.cssText)
              span.style.position = 'relative'
              span.style.top = '-5px'
            }
          })

          // Fix SVG icons
          const svgs = badge.querySelectorAll('svg')
          svgs.forEach((svg) => {
            if (svg instanceof SVGElement) {
              const svgEl = svg as unknown as HTMLElement
              originalStyles.set(svgEl, svgEl.style.cssText)
              svg.style.position = 'relative'
              svg.style.top = '0px'
            }
          })
        }
      })

      // Fix text alignment in boarding pass and card sections for html2canvas
      // Move ALL text elements up by 4px for proper PDF rendering
      const allTextElements = ticketElement.querySelectorAll('p, span')
      allTextElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          originalStyles.set(el, el.style.cssText)
          el.style.position = 'relative'
          el.style.top = '-4px'
        }
      })

      // Fix passenger count badge text
      const passengerCountElements = ticketElement.querySelectorAll('.passenger-count')
      passengerCountElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-6px'
        }
      })

      // Fix display name badge text
      const displayNameElements = ticketElement.querySelectorAll('.display-name')
      displayNameElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Fix display name arrow icon
      const displayNameArrowElements = ticketElement.querySelectorAll('.display-name-arrow')
      displayNameArrowElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.top = '-8px'
        }
      })

      // Capture with html2canvas
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Convert any remaining oklch colors in the cloned document
          const allClonedElements = clonedDoc.querySelectorAll('*')
          allClonedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computed = window.getComputedStyle(el)
              if (computed.backgroundColor?.includes('oklch')) {
                el.style.backgroundColor = convertToHex(computed.backgroundColor)
              }
              if (computed.color?.includes('oklch')) {
                el.style.color = convertToHex(computed.color)
              }
              if (computed.borderColor?.includes('oklch')) {
                el.style.borderColor = convertToHex(computed.borderColor)
              }
            }
          })
        },
      })

      // Restore original styles
      originalStyles.forEach((originalStyle, el) => {
        el.style.cssText = originalStyle
      })

      // Create PDF with custom page size
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const pdfWidth = 106 // mm
      const pdfHeight = (imgHeight / imgWidth) * pdfWidth

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${quote.quote_number}.pdf`)

      toast({
        title: 'PDF Downloaded',
        description: 'Your quote PDF has been saved.',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const updateServiceOverride = (serviceId: string, field: keyof ServiceOverrideState, value: any) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      }
    }))
  }

  const addDetail = (serviceId: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        details: [...(prev[serviceId]?.details || []), { label: '', value: '' }],
      }
    }))
  }

  const updateDetail = (serviceId: string, detailIndex: number, field: 'label' | 'value', value: string) => {
    setServiceOverrides(prev => {
      const details = [...(prev[serviceId]?.details || [])]
      details[detailIndex] = { ...details[detailIndex], [field]: value }
      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          details,
        }
      }
    })
  }

  const removeDetail = (serviceId: string, detailIndex: number) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        details: prev[serviceId]?.details?.filter((_, i) => i !== detailIndex) || [],
      }
    }))
  }

  const toggleImageSelection = (serviceId: string, imageUrl: string) => {
    setServiceOverrides(prev => {
      const currentImages = prev[serviceId]?.display_images || []
      let newImages: string[]

      if (currentImages.includes(imageUrl)) {
        // Remove image
        newImages = currentImages.filter(img => img !== imageUrl)
      } else {
        // Add image (max 2)
        if (currentImages.length < 2) {
          newImages = [...currentImages, imageUrl]
        } else {
          // Replace the second image
          newImages = [currentImages[0], imageUrl]
        }
      }

      return {
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          display_images: newImages,
        }
      }
    })
  }

  const toggleServiceExpanded = (serviceId: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        expanded: !prev[serviceId]?.expanded,
      }
    }))
  }

  // Handle image upload to Cloudinary
  const handleImageUpload = async (serviceId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingServiceId(serviceId)

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

      // Add uploaded images to the service override
      setServiceOverrides(prev => {
        const currentImages = prev[serviceId]?.display_images || []
        return {
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            display_images: [...currentImages, ...uploadedUrls],
          }
        }
      })

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
      setUploadingServiceId(null)
      // Reset file input
      if (fileInputRefs.current[serviceId]) {
        fileInputRefs.current[serviceId]!.value = ''
      }
    }
  }

  // Remove an image from service override
  const removeImage = (serviceId: string, imageUrl: string) => {
    setServiceOverrides(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        display_images: prev[serviceId]?.display_images?.filter(img => img !== imageUrl) || [],
      }
    }))
  }

  // Build quote with customization for preview
  const quoteWithCustomization = {
    ...quote,
    pdf_customization: buildCustomization(),
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card-accent border-white/20 text-white w-[98vw] !max-w-[98vw] h-[98vh] !max-h-[98vh] p-0 flex flex-col">
        <DialogHeader className="space-y-2 pb-4 border-b border-white/10 px-6 pt-6">
          <DialogTitle className="luxury-heading text-2xl sm:text-3xl tracking-[0.1em] text-white flex items-center gap-3">
            <FileText className="h-6 w-6" />
            Customize Quote PDF
          </DialogTitle>
          <DialogDescription className="text-white/70 text-sm tracking-wide">
            Customize the visual layout and content of your quote PDF before sending
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 bg-white/5 border border-white/10 mx-6 mt-4 w-auto">
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 text-white">
              <Settings className="h-4 w-4 mr-2" />
              Edit Content
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white/20 text-white">
              <Eye className="h-4 w-4 mr-2" />
              Live Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0 overflow-y-auto flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4 p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Header Customization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Title (optional)</Label>
                    <Input
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      placeholder="e.g., Private Jet Charter Proposal"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Subtitle (optional)</Label>
                    <Input
                      value={headerSubtitle}
                      onChange={(e) => setHeaderSubtitle(e.target.value)}
                      placeholder="e.g., Exclusive Rates - Limited Time"
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                {/* Service Type Selector */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm">Service Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'plane', label: 'Private Jet', icon: Plane },
                      { value: 'yacht', label: 'Yacht', icon: Ship },
                      { value: 'car', label: 'Car Service', icon: Car },
                      { value: 'none', label: 'Other', icon: FileText },
                    ].map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setHeaderIcon(option.value as 'plane' | 'car' | 'yacht' | 'none')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            headerIcon === option.value
                              ? 'bg-white/20 border-white/40 text-white'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Service Items Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Service Options</h3>

                {quote.service_items.map((item, index) => {
                  const override = serviceOverrides[item.id] || {}
                  const isExpanded = override.expanded

                  return (
                    <div
                      key={item.id}
                      className="p-4 glass-card-accent rounded-xl border border-white/10"
                    >
                      {/* Collapsed Header */}
                      <button
                        type="button"
                        onClick={() => toggleServiceExpanded(item.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white/50 text-sm">Option {index + 1}</span>
                          <span className="text-white font-medium">{override.display_name || item.service_name}</span>
                          <span className="text-white/70">{formatCurrency(item.price)}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-white/50" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-white/50" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
                          {/* Display Name */}
                          <div className="space-y-2">
                            <Label className="text-white/90 text-sm">Display Name</Label>
                            <Input
                              value={override.display_name || ''}
                              onChange={(e) => updateServiceOverride(item.id, 'display_name', e.target.value)}
                              placeholder={item.service_name}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
                            />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label className="text-white/90 text-sm">Description</Label>
                            <Textarea
                              value={override.display_description || ''}
                              onChange={(e) => updateServiceOverride(item.id, 'display_description', e.target.value)}
                              placeholder="Service description..."
                              rows={3}
                              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                            />
                          </div>

                          {/* Image Management Section */}
                          <div className="space-y-3">
                            <Label className="text-white/90 text-sm flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              PDF Images
                            </Label>

                            {/* Currently Selected Images */}
                            {override.display_images && override.display_images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-white/50">Selected for PDF ({override.display_images.length}/2):</p>
                                <div className="flex flex-wrap gap-2">
                                  {override.display_images.map((imageUrl, imgIndex) => (
                                    <div
                                      key={imgIndex}
                                      className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white group"
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Selected ${imgIndex + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute top-1 left-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-xs font-bold">
                                        {imgIndex + 1}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(item.id, imageUrl)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Available Images from Original Item */}
                            {item.images && item.images.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-white/50">Available images (click to add):</p>
                                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                                  {item.images
                                    .filter(img => !override.display_images?.includes(img))
                                    .map((imageUrl, imgIndex) => (
                                      <button
                                        key={imgIndex}
                                        type="button"
                                        onClick={() => {
                                          const currentImages = override.display_images || []
                                          if (currentImages.length < 2) {
                                            setServiceOverrides(prev => ({
                                              ...prev,
                                              [item.id]: {
                                                ...prev[item.id],
                                                display_images: [...currentImages, imageUrl],
                                              }
                                            }))
                                          } else {
                                            toast({
                                              title: 'Maximum images reached',
                                              description: 'Remove an image first to add a new one',
                                              variant: 'destructive',
                                            })
                                          }
                                        }}
                                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/50 transition-all"
                                      >
                                        <img
                                          src={imageUrl}
                                          alt={`Available ${imgIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                          <Plus className="h-4 w-4 text-white" />
                                        </div>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Upload New Images */}
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                ref={(el) => { fileInputRefs.current[item.id] = el }}
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                multiple
                                className="hidden"
                                onChange={(e) => handleImageUpload(item.id, e.target.files)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[item.id]?.click()}
                                disabled={uploadingServiceId === item.id}
                                className="text-xs border-white/20 text-white/70 hover:bg-white/10"
                              >
                                {uploadingServiceId === item.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload New Images
                                  </>
                                )}
                              </Button>
                              {(!override.display_images || override.display_images.length === 0) && (
                                <p className="text-xs text-white/40">No images selected yet</p>
                              )}
                            </div>
                          </div>

                          {/* Custom Details */}
                          <div className="space-y-3">
                            <Label className="text-white/90 text-sm">Trip Details</Label>

                            {/* Quick Add Buttons - Different options based on mode */}
                            <div className="flex flex-wrap gap-2">
                              {(headerIcon === 'plane' ? [
                                { label: 'Date', placeholder: 'Friday, December 26th, 2025' },
                                { label: 'Departure Code', placeholder: 'FXE' },
                                { label: 'Departure', placeholder: 'Fort Lauderdale, FL' },
                                { label: 'Arrival Code', placeholder: 'KASE' },
                                { label: 'Arrival', placeholder: 'Aspen, CO' },
                                { label: 'Duration', placeholder: '3h 34m' },
                                { label: 'Passengers', placeholder: '8' },
                              ] : headerIcon === 'yacht' ? [
                                { label: 'Date', placeholder: 'Friday, December 26th, 2025' },
                                { label: 'Departure Marina', placeholder: 'Miami Beach Marina' },
                                { label: 'Destination', placeholder: 'Bahamas' },
                                { label: 'Duration', placeholder: '3 Days' },
                                { label: 'Guests', placeholder: '8' },
                              ] : headerIcon === 'car' ? [
                                { label: 'Date', placeholder: 'Friday, December 26th, 2025' },
                                { label: 'Pickup', placeholder: 'Miami International Airport' },
                                { label: 'Dropoff', placeholder: 'South Beach Hotel' },
                                { label: 'Duration', placeholder: '4 Hours' },
                                { label: 'Passengers', placeholder: '4' },
                              ] : [
                                { label: 'Date', placeholder: 'Friday, December 26th, 2025' },
                                { label: 'Location', placeholder: 'Miami, FL' },
                                { label: 'Duration', placeholder: '3 Hours' },
                                { label: 'Guests', placeholder: '8' },
                              ]).map((quickAdd) => {
                                const exists = override.details?.some(d => d.label === quickAdd.label)
                                if (exists) return null
                                return (
                                  <Button
                                    key={quickAdd.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setServiceOverrides(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          details: [...(prev[item.id]?.details || []), { label: quickAdd.label, value: '' }],
                                        }
                                      }))
                                    }}
                                    className="text-xs border-white/20 text-white/70 hover:bg-white/10"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {quickAdd.label}
                                  </Button>
                                )
                              })}
                              {/* Custom Field Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setServiceOverrides(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      details: [...(prev[item.id]?.details || []), { label: '', value: '' }],
                                    }
                                  }))
                                }}
                                className="text-xs border-dashed border-white/30 text-white/70 hover:bg-white/10"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Custom Field
                              </Button>
                            </div>

                            {override.details && override.details.length > 0 && (
                              <div className="space-y-2">
                                {override.details.map((detail, detailIndex) => {
                                  const allPresetFields = [
                                    'Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers',
                                    'Departure Marina', 'Destination', 'Guests', 'Pickup', 'Dropoff', 'Location'
                                  ]
                                  const isPresetField = allPresetFields.includes(detail.label)

                                  return (
                                    <div key={detailIndex} className="flex items-center gap-2">
                                      {isPresetField ? (
                                        <div className="w-32 text-sm text-white/70">{detail.label}</div>
                                      ) : (
                                        <Input
                                          value={detail.label}
                                          onChange={(e) => updateDetail(item.id, detailIndex, 'label', e.target.value)}
                                          placeholder="Field name..."
                                          className="w-32 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm"
                                        />
                                      )}
                                      <Input
                                        value={detail.value}
                                        onChange={(e) => updateDetail(item.id, detailIndex, 'value', e.target.value)}
                                        placeholder={
                                          detail.label === 'Date' ? 'Friday, December 26th, 2025' :
                                          detail.label === 'Departure Code' ? 'FXE' :
                                          detail.label === 'Departure' ? 'Fort Lauderdale, FL' :
                                          detail.label === 'Arrival Code' ? 'KASE' :
                                          detail.label === 'Arrival' ? 'Aspen, CO' :
                                          detail.label === 'Duration' ? '3h 34m' :
                                          detail.label === 'Passengers' ? '8' :
                                          detail.label === 'Departure Marina' ? 'Miami Beach Marina' :
                                          detail.label === 'Destination' ? 'Bahamas' :
                                          detail.label === 'Guests' ? '8' :
                                          detail.label === 'Pickup' ? 'Miami International Airport' :
                                          detail.label === 'Dropoff' ? 'South Beach Hotel' :
                                          detail.label === 'Location' ? 'Miami, FL' :
                                          'Enter value...'
                                        }
                                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeDetail(item.id, detailIndex)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {(!override.details || override.details.length === 0) && (
                              <p className="text-white/40 text-sm">Click the buttons above to add trip details for the ticket-style layout.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Notes Section */}
              <div className="space-y-4 p-4 glass-card-accent rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white">Notes & Terms</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Notes</Label>
                    <Textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Add any notes for the client..."
                      rows={3}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/90 text-sm">Custom Terms & Conditions (optional)</Label>
                    <Textarea
                      value={customTerms}
                      onChange={(e) => setCustomTerms(e.target.value)}
                      placeholder="Leave empty to use default terms..."
                      rows={3}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 flex-1 min-h-0 px-6 py-4">
            <div className="h-full rounded-xl overflow-hidden border border-white/20 bg-white">
              <div ref={previewRef} className="h-full overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f8' }}>
                {/* PDF Preview - Ticket Style */}
                <div className="max-w-[400px] mx-auto bg-white shadow-lg overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {/* Top Header with Logo - Navy Blue */}
                  <div className="bg-gray-900 px-5 py-4 flex items-center justify-between">
                    <img
                      src="/logo/CL White LOGO.png"
                      alt="Cadiz & Lluis"
                      className="h-10 w-auto object-contain"
                    />
                    <div className="text-right">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider">{quote.quote_number}</p>
                      <p className="text-[9px] text-white/50">
                        {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Title Header - White Background */}
                  <div className="bg-white p-4 text-center border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                      {headerTitle || 'Private Quotes'}
                    </h1>
                    {headerSubtitle && (
                      <p className="text-xs text-gray-500 mt-1">{headerSubtitle}</p>
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="bg-white px-5 pt-3 pb-6 border-b border-gray-100">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Prepared For</p>
                    <p className="text-sm font-semibold text-gray-900">{quote.client_name}</p>
                    <p className="text-xs text-gray-500">{quote.client_email}</p>
                  </div>

                  {/* Service Options - Ticket Style */}
                  {quote.service_items.map((item) => {
                    const override = serviceOverrides[item.id] || {}
                    const displayImages = override.display_images?.slice(0, 2) || item.images?.slice(0, 2) || []
                    const displayName = override.display_name || item.service_name
                    const displayDescription = override.display_description || item.description || ''
                    const details = override.details || []

                    // Extract specific details - Plane mode
                    const dateDetail = details.find(d => d.label === 'Date')?.value || ''
                    const departureCode = details.find(d => d.label === 'Departure Code')?.value || ''
                    const departureDetail = details.find(d => d.label === 'Departure')?.value || ''
                    const arrivalCode = details.find(d => d.label === 'Arrival Code')?.value || ''
                    const arrivalDetail = details.find(d => d.label === 'Arrival')?.value || ''
                    const duration = details.find(d => d.label === 'Duration')?.value || ''
                    const passengers = details.find(d => d.label === 'Passengers')?.value || ''

                    // Extract details - Yacht mode
                    const departureMarina = details.find(d => d.label === 'Departure Marina')?.value || ''
                    const destination = details.find(d => d.label === 'Destination')?.value || ''
                    const guests = details.find(d => d.label === 'Guests')?.value || ''

                    // Extract details - Car mode
                    const pickup = details.find(d => d.label === 'Pickup')?.value || ''
                    const dropoff = details.find(d => d.label === 'Dropoff')?.value || ''

                    // Extract details - Generic mode
                    const location = details.find(d => d.label === 'Location')?.value || ''

                    // Get guest/passenger count for badge
                    const guestCount = passengers || guests || ''

                    return (
                      <div key={item.id} className="bg-white border-b-8 border-gray-100">
                        {/* Images Section */}
                        {displayImages.length > 0 && (
                          <div className="relative">
                            {/* Main image */}
                            <div className="relative h-48 overflow-hidden">
                              <img
                                src={displayImages[0]}
                                alt="Main"
                                className="w-full h-full object-cover"
                              />
                              {/* Overlay badge with name */}
                              <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-lg leading-none">
                                <span className="leading-none display-name-arrow">→</span> <span className="leading-none display-name">{displayName}</span>
                              </div>
                            </div>

                            {/* Secondary image */}
                            {displayImages[1] && (
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={displayImages[1]}
                                  alt="Interior"
                                  className="w-full h-full object-cover"
                                />
                                {/* Guest/Passenger count badge */}
                                {guestCount && (
                                  <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1.5 rounded-full inline-flex items-center gap-1 shadow leading-none">
                                    <User className="h-3 w-3 flex-shrink-0" /> <span className="leading-none passenger-count">{guestCount}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trip Details */}
                        <div className="p-5 bg-white">
                          {/* Description - shown for all modes */}
                          {displayDescription && headerIcon !== 'plane' && (
                            <p className="text-xs text-gray-600 mb-4 whitespace-pre-wrap">{displayDescription}</p>
                          )}

                          {/* Plane Mode - Boarding Pass Style */}
                          {headerIcon === 'plane' && (
                            <div className="mb-5 rounded-xl overflow-hidden shadow-sm" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                              {/* Boarding Pass Header */}
                              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#111827' }}>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="#ffffff" viewBox="0 0 24 24">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                                  </svg>
                                  <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>Boarding Pass</span>
                                </div>
                                {dateDetail && (
                                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{dateDetail}</span>
                                )}
                              </div>

                              {/* Main Flight Route Section */}
                              <div className="p-4" style={{ backgroundColor: '#ffffff' }}>
                                <div className="flex items-center justify-between">
                                  {/* Departure */}
                                  <div className="text-left flex-1">
                                    <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>From</p>
                                    <p className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>{departureCode || '---'}</p>
                                    <p className="text-xs mt-1" style={{ color: '#6b7280', paddingBottom: '12px' }}>{departureDetail || 'Departure'}</p>
                                  </div>

                                  {/* Flight Path */}
                                  <div className="flex-1 px-2">
                                    <div className="flex flex-col items-center">
                                      <p className="text-[10px] mb-2 font-medium" style={{ color: '#9ca3af' }}>{duration || '---'}</p>
                                      <div className="flex items-center w-full">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#111827', border: '2px solid #e5e7eb' }}></div>
                                        <div className="flex-1 mx-1 relative" style={{ borderTop: '2px dashed #d1d5db' }}>
                                          <svg className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: '#ffffff' }} fill="#374151" viewBox="0 0 24 24">
                                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                                          </svg>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9ca3af', border: '2px solid #e5e7eb' }}></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Arrival */}
                                  <div className="text-right flex-1">
                                    <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>To</p>
                                    <p className="text-3xl font-bold tracking-tight" style={{ color: '#111827' }}>{arrivalCode || '---'}</p>
                                    <p className="text-xs mt-1" style={{ color: '#6b7280', paddingBottom: '12px' }}>{arrivalDetail || 'Arrival'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Ticket Tear Line */}
                              <div className="relative h-4">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 rounded-r-full" style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb' }}></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 rounded-l-full" style={{ backgroundColor: '#ffffff', borderLeft: '1px solid #e5e7eb' }}></div>
                                <div className="absolute inset-x-5 top-1/2" style={{ borderTop: '2px dashed #d1d5db' }}></div>
                              </div>

                              {/* Additional Details Grid */}
                              <div className="p-4" style={{ backgroundColor: '#f9fafb' }}>
                                <div className="grid grid-cols-3 gap-3">
                                  {passengers && (
                                    <div className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                                      <p className="text-[8px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Passengers</p>
                                      <p className="text-lg font-bold" style={{ color: '#111827' }}>{passengers}</p>
                                    </div>
                                  )}
                                  {details
                                    .filter(d =>
                                      d.value &&
                                      !['Date', 'Departure Code', 'Departure', 'Arrival Code', 'Arrival', 'Duration', 'Passengers'].includes(d.label)
                                    )
                                    .map((detail, idx) => (
                                      <div key={idx} className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                                        <p className="text-[8px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>{detail.label}</p>
                                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>{detail.value}</p>
                                      </div>
                                    ))
                                  }
                                </div>
                                {/* Description inside boarding pass */}
                                {displayDescription && (
                                  <p className="text-xs mt-3 pt-3" style={{ color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>{displayDescription}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Date for non-plane modes */}
                          {headerIcon !== 'plane' && dateDetail && (
                            <p className="text-sm mb-3" style={{ color: '#6b7280' }}>{dateDetail}</p>
                          )}

                          {/* Yacht Mode - Route Style */}
                          {headerIcon === 'yacht' && (departureMarina || destination) && (
                            <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#3b82f6', border: '2px solid #ffffff' }}></div>
                                  <div className="w-0.5 h-8" style={{ backgroundColor: '#e5e7eb' }}></div>
                                  <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#111827', border: '2px solid #ffffff' }}></div>
                                </div>
                                <div className="flex-1 space-y-4">
                                  {departureMarina && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Departure Marina</p>
                                      <p className="text-sm font-semibold" style={{ color: '#111827' }}>{departureMarina}</p>
                                    </div>
                                  )}
                                  {destination && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Destination</p>
                                      <p className="text-sm font-semibold" style={{ color: '#111827' }}>{destination}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Car Mode - Route Style */}
                          {headerIcon === 'car' && (pickup || dropoff) && (
                            <div className="mb-4 rounded-lg p-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#22c55e', border: '2px solid #ffffff' }}></div>
                                  <div className="w-0.5 h-8" style={{ backgroundColor: '#e5e7eb' }}></div>
                                  <div className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#111827', border: '2px solid #ffffff' }}></div>
                                </div>
                                <div className="flex-1 space-y-4">
                                  {pickup && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Pickup</p>
                                      <p className="text-sm font-semibold uppercase" style={{ color: '#111827' }}>{pickup}</p>
                                    </div>
                                  )}
                                  {dropoff && (
                                    <div>
                                      <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9ca3af' }}>Dropoff</p>
                                      <p className="text-sm font-semibold uppercase" style={{ color: '#111827' }}>{dropoff}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Grid for remaining details - non-plane modes */}
                          {headerIcon !== 'plane' && details.filter(d => {
                            if (!d.value || d.label === 'Date') return false
                            if (headerIcon === 'yacht' && ['Departure Marina', 'Destination'].includes(d.label)) return false
                            if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                            return true
                          }).length > 0 && (
                            <div className="mb-5 grid grid-cols-2 gap-2">
                              {details
                                .filter(d => {
                                  if (!d.value || d.label === 'Date') return false
                                  if (headerIcon === 'yacht' && ['Departure Marina', 'Destination'].includes(d.label)) return false
                                  if (headerIcon === 'car' && ['Pickup', 'Dropoff'].includes(d.label)) return false
                                  return true
                                })
                                .map((detail, idx) => (
                                  <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>{detail.label}</p>
                                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>{detail.value}</p>
                                  </div>
                                ))
                              }
                            </div>
                          )}

                          {/* Price */}
                          <div className="text-right pt-4 border-t border-gray-100">
                            <p className="text-2xl font-bold text-gray-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.price)}
                            </p>
                            <p className="text-xs text-gray-400">Total</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Notes & Terms Section */}
                  {(customNotes || customTerms) && (
                    <div className="p-5" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
                      {customNotes && (
                        <div className="mb-4">
                          <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: '#9ca3af' }}>Notes</p>
                          <p className="text-xs whitespace-pre-wrap" style={{ color: '#374151' }}>{customNotes}</p>
                        </div>
                      )}
                      {customTerms && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider mb-2 font-medium" style={{ color: '#9ca3af' }}>Terms & Conditions</p>
                          <p className="text-xs whitespace-pre-wrap" style={{ color: '#6b7280' }}>{customTerms}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-5 text-center" style={{ backgroundColor: '#111827' }}>
                    <p className="text-sm font-bold tracking-widest mb-1" style={{ color: '#ffffff' }}>CADIZ & LLUIS</p>
                    <p className="text-[10px] tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Luxury Living</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Quote valid until {new Date(quote.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      brody@cadizlluis.com • www.cadizlluis.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/30 hover:bg-white/10 text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="border-white/30 hover:bg-white/10 text-white"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-luxury"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Customization
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuotePDFBuilderDialog
