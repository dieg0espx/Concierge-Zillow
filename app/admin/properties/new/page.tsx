"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Home, Users, Sparkles, ArrowLeft, CheckCircle2, Edit3, Link2 } from "lucide-react"
import { saveProperty } from "@/lib/supabase"
import { PropertyManagerSelect, PropertyManager } from "@/components/property-manager-select"
import { assignPropertyToManagers } from "@/lib/actions/properties"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function AddPropertyPage() {
  const router = useRouter()
  const [inputMode, setInputMode] = useState<"scrape" | "manual">("scrape")
  const [url, setUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [propertyManagers, setPropertyManagers] = useState<PropertyManager[]>([])
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  // Manual input fields
  const [manualData, setManualData] = useState({
    address: "",
    monthly_rent: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    zillow_url: "",
    images: "",
    description: ""
  })

  useEffect(() => {
    async function loadManagers() {
      const supabase = createClient()
      const { data: managers } = await supabase
        .from('property_managers')
        .select('id, name, email')
        .order('name')

      if (managers) {
        setPropertyManagers(managers)
      }
    }
    loadManagers()
  }, [])

  const handleManualSave = async () => {
    if (!manualData.address.trim()) {
      alert('Please enter at least the property address')
      return
    }

    setIsScraping(true)
    setSuccess(false)

    try {
      // Parse images from comma-separated URLs
      const imageUrls = manualData.images
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      const newProperty = {
        address: manualData.address,
        monthly_rent: manualData.monthly_rent || "Contact for price",
        bedrooms: manualData.bedrooms || "Contact for details",
        bathrooms: manualData.bathrooms || "Contact for details",
        area: manualData.area || "Contact for details",
        zillow_url: manualData.zillow_url || "",
        images: imageUrls,
        description: manualData.description || undefined
      }

      console.log('Property to save:', newProperty)

      const savedProperty = await saveProperty(newProperty)
      console.log('Saved property:', savedProperty)

      // Assign to managers if any selected
      if (selectedManagerIds.length > 0 && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, selectedManagerIds)
      }

      setSuccess(true)
      setManualData({
        address: "",
        monthly_rent: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        zillow_url: "",
        images: "",
        description: ""
      })
      setSelectedManagerIds([])

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/properties')
      }, 2000)
    } catch (error) {
      console.error('Error saving property:', error)
      alert(`Failed to save property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsScraping(false)
    }
  }

  const handleScrape = async () => {
    if (!url.trim()) {
      return
    }

    setIsScraping(true)
    setSuccess(false)

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
          url: url.trim(),
          scrape_description: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to scrape property: ${response.statusText}`)
      }

      const data = await response.json()

      // Log the response to help debug
      console.log('Zillow API Response:', data)

      // Check if we have any usable data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from Zillow API')
      }

      // The API returns nested structure with 'property' object
      const propertyData = data.property || data

      // Extract address from the nested structure
      const address = propertyData.addressRaw ||
                     propertyData.address?.street ||
                     propertyData.address ||
                     propertyData.streetAddress ||
                     propertyData.fullAddress ||
                     "Address not available"

      if (address === "Address not available") {
        console.warn('No address found in response. Available fields:', Object.keys(propertyData))
      }

      // Extract rent/price - could be in different fields
      const rent = propertyData.price ||
                  propertyData.rent ||
                  propertyData.monthlyRent ||
                  propertyData.rentPrice ||
                  propertyData.rentZestimate ||
                  "Contact for price"

      // Extract property details - some listings might not have these
      const bedrooms = propertyData.bedrooms ||
                      propertyData.beds ||
                      (propertyData.resoFacts && propertyData.resoFacts.bedrooms) ||
                      "Contact for details"

      const bathrooms = propertyData.bathrooms ||
                       propertyData.baths ||
                       (propertyData.resoFacts && propertyData.resoFacts.bathrooms) ||
                       "Contact for details"

      const area = propertyData.livingArea ||
                  propertyData.area ||
                  propertyData.lotSize ||
                  (propertyData.resoFacts && propertyData.resoFacts.livingArea) ||
                  "Contact for details"

      // Get image URLs from Zillow
      const zillowImageUrls = propertyData.photos || propertyData.images || []

      let cloudinaryImageUrls: string[] = []

      // Upload images to Cloudinary if any exist
      if (zillowImageUrls.length > 0) {
        try {
          console.log(`Uploading ${zillowImageUrls.length} images to Cloudinary...`)
          const uploadResponse = await fetch('/api/upload-images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrls: zillowImageUrls,
              propertyAddress: address,
            }),
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload images to Cloudinary')
          }

          const uploadData = await uploadResponse.json()
          cloudinaryImageUrls = uploadData.urls || []
          console.log(`Successfully uploaded ${cloudinaryImageUrls.length} images to Cloudinary`)
        } catch (uploadError) {
          console.error('Error uploading images to Cloudinary:', uploadError)
          // Continue with Zillow URLs if Cloudinary upload fails
          cloudinaryImageUrls = zillowImageUrls
        }
      }

      const newProperty = {
        address: address,
        monthly_rent: typeof rent === 'number' ? rent.toString() : rent,
        bedrooms: typeof bedrooms === 'number' ? bedrooms.toString() : bedrooms,
        bathrooms: typeof bathrooms === 'number' ? bathrooms.toString() : bathrooms,
        area: typeof area === 'number' ? area.toString() : area,
        zillow_url: url.trim(),
        images: cloudinaryImageUrls,
        description: propertyData.description || null
      }

      console.log('Property to save:', newProperty)

      const savedProperty = await saveProperty(newProperty)
      console.log('Saved property:', savedProperty)

      // Assign to managers if any selected
      if (selectedManagerIds.length > 0 && savedProperty.id) {
        await assignPropertyToManagers(savedProperty.id, selectedManagerIds)
      }

      setSuccess(true)
      setUrl("")
      setSelectedManagerIds([])

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/properties')
      }, 2000)
    } catch (error) {
      console.error('Error scraping property:', error)
      alert(`Failed to scrape property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/admin/properties">
          <Button variant="ghost" className="mb-6 text-white hover:text-white-light hover:bg-white/10 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Properties
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="luxury-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.15em] text-white">
              Add New Property
            </h1>
            <p className="text-white/70 mt-2 tracking-wide text-lg">
              Scrape property details from Zillow and assign to managers
            </p>
          </div>
        </div>
      </div>

      <div className="h-px divider-accent my-8" />

      {/* Success Message */}
      {success && (
        <Card className="glass-card-accent border-white/50 animate-fade-in-scale">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-white">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold mb-1">Property Added Successfully!</h3>
                <p className="text-white/70">Redirecting to properties list...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Property Form */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="luxury-heading text-3xl tracking-[0.15em]">Property Details</CardTitle>
              <CardDescription className="mt-3 text-white/70 tracking-wide text-base">
                {inputMode === "scrape"
                  ? "Enter the Zillow URL to automatically fetch all property information"
                  : "Manually enter all property details"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={inputMode === "scrape" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("scrape")}
                className={inputMode === "scrape" ? "btn-luxury" : "border-white/40 hover:bg-white/10 text-white"}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Scrape
              </Button>
              <Button
                variant={inputMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("manual")}
                className={inputMode === "manual" ? "btn-luxury" : "border-white/40 hover:bg-white/10 text-white"}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {inputMode === "scrape" ? (
            /* Zillow URL Input */
            <div className="space-y-4">
              <label className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider text-white-light">
                <Home className="h-5 w-5" />
                Zillow Property URL
              </label>
              <Input
                placeholder="https://www.zillow.com/homedetails/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                disabled={isScraping}
              />
              <div className="glass-card-accent p-4 rounded-lg">
                <p className="text-sm text-white/80 flex items-start gap-3 tracking-wide">
                  <span className="text-white text-lg">•</span>
                  <span>Paste a complete Zillow property URL to automatically fetch property details including address, price, bedrooms, bathrooms, square footage, and images</span>
                </p>
              </div>
            </div>
          ) : (
            /* Manual Input Fields */
            <>
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider text-white-light">
                  <Home className="h-5 w-5" />
                  Property Address <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="123 Main St, Miami, FL 33101"
                  value={manualData.address}
                  onChange={(e) => setManualData({...manualData, address: e.target.value})}
                  className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                  disabled={isScraping}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                    Monthly Rent
                  </label>
                  <Input
                    placeholder="$2,500"
                    value={manualData.monthly_rent}
                    onChange={(e) => setManualData({...manualData, monthly_rent: e.target.value})}
                    className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                    disabled={isScraping}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                    Bedrooms
                  </label>
                  <Input
                    placeholder="3"
                    value={manualData.bedrooms}
                    onChange={(e) => setManualData({...manualData, bedrooms: e.target.value})}
                    className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                    disabled={isScraping}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                    Bathrooms
                  </label>
                  <Input
                    placeholder="2"
                    value={manualData.bathrooms}
                    onChange={(e) => setManualData({...manualData, bathrooms: e.target.value})}
                    className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                    disabled={isScraping}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                    Square Feet
                  </label>
                  <Input
                    placeholder="1,500"
                    value={manualData.area}
                    onChange={(e) => setManualData({...manualData, area: e.target.value})}
                    className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                    disabled={isScraping}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                  Zillow URL (Optional)
                </label>
                <Input
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={manualData.zillow_url}
                  onChange={(e) => setManualData({...manualData, zillow_url: e.target.value})}
                  className="h-14 bg-white/5 border-white/30 focus:border-white text-base tracking-wide"
                  disabled={isScraping}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                  Image URLs (Optional)
                </label>
                <Textarea
                  placeholder="Comma-separated image URLs (e.g., https://example.com/image1.jpg, https://example.com/image2.jpg)"
                  value={manualData.images}
                  onChange={(e) => setManualData({...manualData, images: e.target.value})}
                  className="min-h-[100px] bg-white/5 border-white/30 focus:border-white text-base tracking-wide resize-none"
                  disabled={isScraping}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-wider text-white-light">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Property description..."
                  value={manualData.description}
                  onChange={(e) => setManualData({...manualData, description: e.target.value})}
                  className="min-h-[120px] bg-white/5 border-white/30 focus:border-white text-base tracking-wide resize-none"
                  disabled={isScraping}
                />
              </div>
            </>
          )}

          {/* Property Managers Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider text-white-light">
              <Users className="h-5 w-5" />
              Assign to Property Managers
              <Badge variant="secondary" className="ml-2 bg-white/10 text-white/80 border-white/40">
                Optional
              </Badge>
            </label>
            <PropertyManagerSelect
              managers={propertyManagers}
              selectedManagerIds={selectedManagerIds}
              onSelectionChange={setSelectedManagerIds}
            />
            <div className="glass-card-accent p-4 rounded-lg">
              <p className="text-sm text-white/80 flex items-start gap-3 tracking-wide">
                <span className="text-white text-lg">•</span>
                <span>Select one or more property managers who will have access to this property. You can always modify assignments later.</span>
              </p>
            </div>
          </div>

          {/* Submit Section */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {isScraping ? (
                <div className="flex items-center gap-4 text-white">
                  <div className="skeleton h-6 w-6 rounded-full"></div>
                  <span className="text-base tracking-wide font-semibold">
                    {inputMode === "scrape"
                      ? "Processing property data from Zillow..."
                      : "Saving property..."}
                  </span>
                </div>
              ) : (
                <div className="text-white/60 text-sm tracking-wide">
                  {selectedManagerIds.length > 0 ? (
                    <span className="text-white">
                      {selectedManagerIds.length} manager{selectedManagerIds.length > 1 ? 's' : ''} will be assigned
                    </span>
                  ) : (
                    <span>No managers assigned - you can add them later</span>
                  )}
                </div>
              )}
              <Button
                onClick={inputMode === "scrape" ? handleScrape : handleManualSave}
                disabled={
                  inputMode === "scrape"
                    ? !url.trim() || isScraping || success
                    : !manualData.address.trim() || isScraping || success
                }
                size="lg"
                className="btn-luxury min-w-[220px] text-base py-6"
              >
                {isScraping ? (
                  <>
                    <div className="skeleton h-5 w-5 rounded-full mr-2"></div>
                    {inputMode === "scrape" ? "Processing..." : "Saving..."}
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Added Successfully
                  </>
                ) : (
                  <>
                    <Home className="h-5 w-5 mr-2" />
                    Add Property
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="glass-card-accent">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4 text-white-light uppercase tracking-wider">
            {inputMode === "scrape" ? "How Scraping Works" : "Manual Entry Guide"}
          </h3>
          {inputMode === "scrape" ? (
            <div className="space-y-3 text-white/70 text-sm tracking-wide">
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">1.</span>
                Find a property on Zillow.com and copy its full URL from your browser
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">2.</span>
                Paste the URL in the field above - our system will automatically extract all property details
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">3.</span>
                Optionally assign property managers who will have access to this listing
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">4.</span>
                Click "Add Property" and the listing will be added to your portfolio
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-white/70 text-sm tracking-wide">
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">1.</span>
                Enter the property address (required) - this is the only mandatory field
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">2.</span>
                Fill in additional details like rent, bedrooms, bathrooms, and square footage
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">3.</span>
                Add image URLs separated by commas for property photos (optional)
              </p>
              <p className="flex items-start gap-3">
                <span className="text-white font-bold">4.</span>
                Assign property managers and click "Add Property" to save
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
