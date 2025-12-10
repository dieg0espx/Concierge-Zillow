"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, ArrowLeft, Save, Loader2, X, Plus, DollarSign, Settings } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { PropertyManagerSelect, PropertyManager } from "@/components/property-manager-select"
import { assignPropertyToManagers, type PropertyCustomization } from "@/lib/actions/properties"
import { createClient } from "@/lib/supabase/client"
import { PropertyCustomizationDialog } from "@/components/property-customization-dialog"
import Link from "next/link"

interface PropertyFormData {
  address: string
  bedrooms: string
  bathrooms: string
  area: string
  zillow_url: string
  description: string | null
  images: string[]
}

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [formData, setFormData] = useState<PropertyFormData>({
    address: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    zillow_url: "",
    description: "",
    images: []
  })
  const [newImageUrl, setNewImageUrl] = useState("")
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([])
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Pricing options state
  const [pricingOptions, setPricingOptions] = useState({
    show_monthly_rent: false,
    custom_monthly_rent: "",
    show_nightly_rate: false,
    custom_nightly_rate: "",
    show_purchase_price: false,
    custom_purchase_price: ""
  })

  // Show all images toggle
  const [showAllImages, setShowAllImages] = useState(false)

  // Property customization dialog
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false)
  const [customizationSettings, setCustomizationSettings] = useState<PropertyCustomization>({})

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const supabase = createClient()

      // Load property data
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (propError || !property) {
        setError("Failed to load property")
        setIsLoading(false)
        return
      }

      setFormData({
        address: property.address || "",
        bedrooms: property.bedrooms || "",
        bathrooms: property.bathrooms || "",
        area: property.area || "",
        zillow_url: property.zillow_url || "",
        description: property.description || "",
        images: Array.isArray(property.images) ? property.images : []
      })

      // Load pricing options
      setPricingOptions({
        show_monthly_rent: property.show_monthly_rent || false,
        custom_monthly_rent: property.custom_monthly_rent?.toString() || "",
        show_nightly_rate: property.show_nightly_rate || false,
        custom_nightly_rate: property.custom_nightly_rate?.toString() || "",
        show_purchase_price: property.show_purchase_price || false,
        custom_purchase_price: property.custom_purchase_price?.toString() || ""
      })

      // Load customization settings
      setCustomizationSettings({
        show_bedrooms: property.show_bedrooms ?? true,
        show_bathrooms: property.show_bathrooms ?? true,
        show_area: property.show_area ?? true,
        show_address: property.show_address ?? true,
        show_images: property.show_images ?? true,
        label_bedrooms: property.label_bedrooms || 'Bedrooms',
        label_bathrooms: property.label_bathrooms || 'Bathrooms',
        label_area: property.label_area || 'Square Feet',
        label_monthly_rent: property.label_monthly_rent || 'Monthly Rent',
        label_nightly_rate: property.label_nightly_rate || 'Nightly Rate',
        label_purchase_price: property.label_purchase_price || 'Purchase Price',
        custom_notes: property.custom_notes || null,
      })

      // Load all property managers
      const { data: managers } = await supabase
        .from('property_managers')
        .select('id, name, email')
        .order('name')

      if (managers) {
        setPropertyManagers(managers)
      }

      // Load current manager assignments
      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('manager_id')
        .eq('property_id', propertyId)

      if (assignments) {
        setSelectedManagerIds(assignments.map(a => a.manager_id))
      }

      setIsLoading(false)
    }

    loadData()
  }, [propertyId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }))
      setNewImageUrl("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const supabase = createClient()

      // Update property
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          address: formData.address,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          area: formData.area,
          zillow_url: formData.zillow_url,
          description: formData.description || null,
          images: formData.images,
          // Pricing options
          show_monthly_rent: pricingOptions.show_monthly_rent,
          custom_monthly_rent: pricingOptions.custom_monthly_rent ? Number(pricingOptions.custom_monthly_rent) : null,
          show_nightly_rate: pricingOptions.show_nightly_rate,
          custom_nightly_rate: pricingOptions.custom_nightly_rate ? Number(pricingOptions.custom_nightly_rate) : null,
          show_purchase_price: pricingOptions.show_purchase_price,
          custom_purchase_price: pricingOptions.custom_purchase_price ? Number(pricingOptions.custom_purchase_price) : null,
        })
        .eq('id', propertyId)

      if (updateError) {
        throw updateError
      }

      // Update manager assignments
      await assignPropertyToManagers(propertyId, selectedManagerIds)

      // Redirect back to properties list
      router.push('/admin/properties')
    } catch (err) {
      console.error('Error updating property:', err)
      setError(err instanceof Error ? err.message : 'Failed to update property')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
        <span className="tracking-wide text-xl text-white/70">Loading property...</span>
      </div>
    )
  }

  if (error && !formData.address) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/properties">
            <Button variant="ghost" className="text-white hover:text-white/80">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Properties
            </Button>
          </Link>
        </div>
        <Card className="glass-card-accent p-16 text-center elevated-card">
          <h3 className="luxury-heading text-3xl font-semibold mb-4 tracking-[0.15em] text-white">
            Error Loading Property
          </h3>
          <p className="text-white/70 tracking-wide text-lg">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/properties">
            <Button variant="ghost" className="text-white hover:text-white/80">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="luxury-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.15em] mb-3 text-white">
              Edit Property
            </h1>
            <p className="text-white/70 mt-2 tracking-wide text-lg">
              Update property details and assignments
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setIsCustomizationOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
        >
          <Settings className="h-5 w-5 mr-2" />
          Customize Display
        </Button>
      </div>

      <div className="h-px divider-accent my-8" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card className="glass-card-accent elevated-card">
          <CardHeader>
            <CardTitle className="luxury-heading text-3xl tracking-[0.15em] text-white">
              <Home className="inline-block h-7 w-7 mr-3" />
              Property Information
            </CardTitle>
            <CardDescription className="text-white/70 text-base tracking-wide">
              Edit the basic details of this property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                Property Address *
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main St, City, State 12345"
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
              />
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bedrooms" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Bedrooms
                </Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  placeholder="3"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Bathrooms
                </Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  placeholder="2"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Area (sq ft)
                </Label>
                <Input
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="1500"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>
            </div>

            {/* Zillow URL */}
            <div className="space-y-2">
              <Label htmlFor="zillow_url" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                Zillow URL
              </Label>
              <Input
                id="zillow_url"
                name="zillow_url"
                value={formData.zillow_url}
                onChange={handleInputChange}
                placeholder="https://www.zillow.com/..."
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Enter property description..."
                rows={6}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Display Options */}
        <Card className="glass-card-accent elevated-card">
          <CardHeader>
            <CardTitle className="luxury-heading text-3xl tracking-[0.15em] text-white">
              <DollarSign className="inline-block h-7 w-7 mr-3" />
              Pricing Display Options
            </CardTitle>
            <CardDescription className="text-white/70 text-base tracking-wide">
              Choose which pricing to display on property pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Monthly Rent */}
            <div className="flex items-center gap-4">
              <Checkbox
                id="edit_show_monthly_rent"
                checked={pricingOptions.show_monthly_rent}
                onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_monthly_rent: !!checked }))}
                className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="edit_show_monthly_rent" className="text-white font-medium cursor-pointer">Monthly Rent</Label>
                  <span className="text-white/50 text-sm">(for long-term rentals)</span>
                </div>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={pricingOptions.custom_monthly_rent}
                  onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_monthly_rent: e.target.value }))}
                  className={`h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 ${!pricingOptions.show_monthly_rent ? 'opacity-50' : ''}`}
                  disabled={!pricingOptions.show_monthly_rent}
                />
              </div>
            </div>

            {/* Nightly Rate */}
            <div className="flex items-center gap-4">
              <Checkbox
                id="edit_show_nightly_rate"
                checked={pricingOptions.show_nightly_rate}
                onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_nightly_rate: !!checked }))}
                className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="edit_show_nightly_rate" className="text-white font-medium cursor-pointer">Nightly Rate</Label>
                  <span className="text-white/50 text-sm">(for short-term rentals)</span>
                </div>
                <Input
                  type="number"
                  placeholder="e.g., 1750"
                  value={pricingOptions.custom_nightly_rate}
                  onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_nightly_rate: e.target.value }))}
                  className={`h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 ${!pricingOptions.show_nightly_rate ? 'opacity-50' : ''}`}
                  disabled={!pricingOptions.show_nightly_rate}
                />
                <p className="text-xs text-white/50 mt-1">Will display "not including taxes"</p>
              </div>
            </div>

            {/* Purchase Price */}
            <div className="flex items-center gap-4">
              <Checkbox
                id="edit_show_purchase_price"
                checked={pricingOptions.show_purchase_price}
                onCheckedChange={(checked) => setPricingOptions(prev => ({ ...prev, show_purchase_price: !!checked }))}
                className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="edit_show_purchase_price" className="text-white font-medium cursor-pointer">Purchase Price</Label>
                  <span className="text-white/50 text-sm">(for property sales)</span>
                </div>
                <Input
                  type="number"
                  placeholder="e.g., 10000000"
                  value={pricingOptions.custom_purchase_price}
                  onChange={(e) => setPricingOptions(prev => ({ ...prev, custom_purchase_price: e.target.value }))}
                  className={`h-12 bg-white/5 border-white/20 text-white placeholder:text-white/50 ${!pricingOptions.show_purchase_price ? 'opacity-50' : ''}`}
                  disabled={!pricingOptions.show_purchase_price}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="glass-card-accent elevated-card">
          <CardHeader>
            <CardTitle className="luxury-heading text-3xl tracking-[0.15em] text-white">
              Property Images
            </CardTitle>
            <CardDescription className="text-white/70 text-base tracking-wide">
              Manage property image URLs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Image */}
            <div className="space-y-2">
              <Label className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                Add Image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddImage()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddImage}
                  className="bg-white text-black hover:bg-white/90"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Current Images */}
            {formData.images.length > 0 && (
              <div className="space-y-3">
                <Label className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Current Images ({formData.images.length})
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {(showAllImages ? formData.images : formData.images.slice(0, 3)).map((imageUrl, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 glass-card-accent rounded-lg"
                    >
                      <div className="w-20 h-20 flex-shrink-0 bg-white/5 rounded overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm truncate">{imageUrl}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                {formData.images.length > 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAllImages(!showAllImages)}
                    className="w-full text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
                  >
                    {showAllImages ? `Show Less` : `Show More (${formData.images.length - 3} more)`}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Managers */}
        <Card className="glass-card-accent elevated-card">
          <CardHeader>
            <CardTitle className="luxury-heading text-3xl tracking-[0.15em] text-white">
              Property Managers
            </CardTitle>
            <CardDescription className="text-white/70 text-base tracking-wide">
              Assign managers to this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropertyManagerSelect
              managers={propertyManagers}
              selectedManagerIds={selectedManagerIds}
              onSelectionChange={setSelectedManagerIds}
            />
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="glass-card-accent border-red-500/30 bg-red-500/10">
            <CardContent className="p-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end pt-6 border-t border-white/10">
          <Link href="/admin/properties">
            <Button
              type="button"
              variant="outline"
              className="border-white/40 hover:bg-white/10 text-white px-8 py-6 text-base"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
            className="btn-luxury px-8 py-6 text-base"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Property Customization Dialog */}
      <PropertyCustomizationDialog
        propertyId={propertyId}
        currentSettings={customizationSettings}
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
      />
    </div>
  )
}
