"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Home, MapPin, Calendar, ExternalLink, Plus, Pencil } from "lucide-react"
import { Logo } from "@/components/logo"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getProperties, saveProperty, Property as SupabaseProperty } from "@/lib/supabase"

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
}

export default function RealEstateDashboard() {
  const [url, setUrl] = useState("")
  const [isScraping, setIsScraping] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editFormData, setEditFormData] = useState({
    address: "",
    monthly_rent: "",
    bedrooms: "",
    bathrooms: "",
    area: ""
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch properties from Supabase on component mount
  useEffect(() => {
    async function loadProperties() {
      setIsLoading(true)
      const data = await getProperties()
      const formattedData = data.map((prop: SupabaseProperty) => ({
        id: prop.id,
        address: prop.address || "Address not available",
        monthly_rent: prop.monthly_rent || "N/A",
        bedrooms: prop.bedrooms || "0",
        bathrooms: prop.bathrooms || "0",
        area: prop.area || "0",
        zillow_url: prop.zillow_url,
        images: Array.isArray(prop.images) ? prop.images : [],
        scraped_at: prop.scraped_at,
        created_at: prop.created_at
      }))
      setProperties(formattedData)
      setIsLoading(false)
    }
    loadProperties()
  }, [])

  const handleScrape = async () => {
    if (!url.trim()) {
      return
    }

    setIsScraping(true)

    try {
      // Call HasData API to scrape property
      const apiKey = process.env.NEXT_PUBLIC_HASDATA_API_KEY
      const encodedUrl = encodeURIComponent(url.trim())
      const apiUrl = `https://api.hasdata.com/scrape/zillow/property?url=${encodedUrl}`

      console.log('Calling HasData API with URL:', url.trim())

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || ''
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('HasData API response:', JSON.stringify(data, null, 2))

      // Extract property data from API response
      const property = data.property
      if (!property) {
        throw new Error('No property data found in API response')
      }

      // Build full address from address object
      const fullAddress = property.address
        ? `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`
        : property.addressRaw || 'Address not available'

      const propertyData = {
        zillow_url: property.url || url.trim(),
        address: fullAddress,
        monthly_rent: property.price?.toString() || null,
        bedrooms: property.beds?.toString() || null,
        bathrooms: property.baths?.toString() || null,
        area: property.area?.toString() || null,
        images: property.photos || []
      }

      console.log('Extracted property data:', propertyData)

      // Save to Supabase
      await saveProperty(propertyData)

      setUrl("")
      alert(`Property scraped and saved successfully!`)

      // Reload properties from database
      const refreshedData = await getProperties()
      const formattedData = refreshedData.map((prop: SupabaseProperty) => ({
        id: prop.id,
        address: prop.address || "Address not available",
        monthly_rent: prop.monthly_rent || "N/A",
        bedrooms: prop.bedrooms || "0",
        bathrooms: prop.bathrooms || "0",
        area: prop.area || "0",
        zillow_url: prop.zillow_url,
        images: Array.isArray(prop.images) ? prop.images : [],
        scraped_at: prop.scraped_at,
        created_at: prop.created_at
      }))
      setProperties(formattedData)
    } catch (error) {
      console.error('Error scraping property:', error)
      alert(`Failed to scrape property: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsScraping(false)
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setEditFormData({
      address: property.address,
      monthly_rent: property.monthly_rent,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area
    })
  }

  const handleSaveEdit = () => {
    if (!editingProperty) return

    const updatedProperty: Property = {
      ...editingProperty,
      address: editFormData.address,
      monthly_rent: editFormData.monthly_rent,
      bedrooms: editFormData.bedrooms,
      bathrooms: editFormData.bathrooms,
      area: editFormData.area
    }

    setProperties(prev => prev.map(p => p.id === editingProperty.id ? updatedProperty : p))
    setEditingProperty(null)
    setEditFormData({
      address: "",
      monthly_rent: "",
      bedrooms: "",
      bathrooms: "",
      area: ""
    })
  }

  const handleCancelEdit = () => {
    setEditingProperty(null)
    setEditFormData({
      address: "",
      monthly_rent: "",
      bedrooms: "",
      bathrooms: "",
      area: ""
    })
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo />
              <div className="flex flex-col">
                <div className="luxury-heading text-lg sm:text-xl md:text-2xl tracking-widest text-white">
                  LUXURY CONCIERGE
                </div>
                <div className="text-[10px] sm:text-xs tracking-[0.2em] text-white/70 uppercase">
                  Cadiz & Lluis
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs sm:text-sm">
                {properties.length} Properties
              </Badge>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-3 sm:mb-4 tracking-wider">
            PROPERTY MANAGEMENT
          </h1>
          <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            Manage your real estate portfolio with precision and elegance. Unparalleled attention to detail.
          </p>
        </div>

        <Tabs defaultValue="scrape" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-background/30 border-border/30 text-xs sm:text-sm">
            <TabsTrigger value="scrape" className="data-[state=active]:bg-white data-[state=active]:text-background luxury-heading tracking-wider text-xs sm:text-sm">
              Scrape New Property
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-white data-[state=active]:text-background luxury-heading tracking-wider text-xs sm:text-sm">
              All Properties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scrape" className="space-y-4 sm:space-y-6">
            <Card className="bg-card/50 border-border/30 backdrop-blur-sm diagonal-split">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-white luxury-heading text-base sm:text-lg md:text-xl">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add New Property URL
                </CardTitle>
                <CardDescription className="text-white/70 text-xs sm:text-sm">
                  Enter a real estate listing URL to scrape property information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm text-white/80 mb-2 block">Zillow Property URL</label>
                    <Input
                      placeholder="https://www.zillow.com/homedetails/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                    />
                    <p className="text-xs text-white/60 mt-2">
                      Paste a Zillow property URL to automatically fetch property details
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/30">
                  <Button
                    onClick={handleScrape}
                    disabled={!url.trim() || isScraping}
                    className="w-full sm:w-auto px-6 sm:px-8 bg-white text-background hover:bg-white/90 luxury-heading tracking-wider text-xs sm:text-sm"
                  >
                    {isScraping ? "Processing..." : "Scrape Property"}
                  </Button>
                </div>
                
                {isScraping && (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing property data...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4 sm:space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white">Loading properties...</span>
              </div>
            ) : properties.length === 0 ? (
              <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center">
                <Home className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">No Properties Yet</h3>
                <p className="text-white/70">Add your first property by entering a Zillow URL above</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:gap-8">
                {properties.map((property) => {
                  const firstImage = property.images.length > 0 ? property.images[0] : null
                  return (
                    <Card key={property.id} className="overflow-hidden bg-card/50 border-border/30 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-80 h-48 sm:h-64 bg-background/30 flex items-center justify-center relative overflow-hidden">
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={property.address}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                fallback?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 marble-bg opacity-50 ${firstImage ? 'hidden' : ''}`}>
                            <Home className="h-12 w-12 sm:h-16 sm:w-16 text-white/40 relative z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                        <div className="flex-1 p-4 sm:p-6 md:p-8">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl md:text-2xl text-white mb-2 sm:mb-3 tracking-wide break-words">
                                {property.address}
                              </h3>
                              <div className="flex items-start gap-2 text-white/70 mb-2 text-sm sm:text-base">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span className="break-words">{property.address}</span>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-2xl sm:text-3xl text-white mb-1">
                                ${property.monthly_rent}
                              </div>
                              <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">
                                Monthly Rent
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                            <div className="text-center p-3 sm:p-4 bg-background/30 rounded-lg backdrop-blur-sm">
                              <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-1">{property.bedrooms}</div>
                              <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Bedrooms</div>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-background/30 rounded-lg backdrop-blur-sm">
                              <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-1">{property.bathrooms}</div>
                              <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Bathrooms</div>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-background/30 rounded-lg backdrop-blur-sm">
                              <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-1">{property.area}</div>
                              <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider">Area</div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 pt-4 border-t border-border/20">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Scraped: {property.scraped_at ? new Date(property.scraped_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(property)}
                                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm flex-1 sm:flex-initial"
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm flex-1 sm:flex-initial">
                                <a href={`/property/${property.id}`}>
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  View Listing
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm text-xs sm:text-sm flex-1 sm:flex-initial">
                                <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                                  Zillow Source
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="bg-card border-border/30 backdrop-blur-sm max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="luxury-heading text-lg sm:text-xl md:text-2xl text-white">Edit Property</DialogTitle>
            <DialogDescription className="text-white/70 text-xs sm:text-sm">
              Update property information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm text-white/80 mb-2 block flex items-center gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  Address
                </label>
                <Input
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                  className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm text-white/80 mb-2 block">Monthly Rent</label>
                <Input
                  value={editFormData.monthly_rent}
                  onChange={(e) => setEditFormData({...editFormData, monthly_rent: e.target.value})}
                  placeholder="e.g., 2,500"
                  className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm text-white/80 mb-2 block">Bedrooms</label>
                  <Input
                    value={editFormData.bedrooms}
                    onChange={(e) => setEditFormData({...editFormData, bedrooms: e.target.value})}
                    className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-white/80 mb-2 block">Bathrooms</label>
                  <Input
                    value={editFormData.bathrooms}
                    onChange={(e) => setEditFormData({...editFormData, bathrooms: e.target.value})}
                    className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-white/80 mb-2 block">Area</label>
                  <Input
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({...editFormData, area: e.target.value})}
                    className="bg-background/50 border-border/30 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/30 pt-4 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-white text-background hover:bg-white/90 luxury-heading tracking-wider w-full sm:w-auto text-xs sm:text-sm"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
