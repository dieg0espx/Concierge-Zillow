'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { updatePropertyCustomization, resetPropertyCustomization, type PropertyCustomization } from '@/lib/actions/properties'
import { Eye, EyeOff, RotateCcw, Save, X, Bed, Bath, Square, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PropertyCustomizationDialogProps {
  propertyId: string
  currentSettings: PropertyCustomization
  propertyData?: {
    address?: string
    bedrooms?: string
    bathrooms?: string
    area?: string
  }
  isOpen: boolean
  onClose: () => void
}

export function PropertyCustomizationDialog({
  propertyId,
  currentSettings,
  propertyData,
  isOpen,
  onClose,
}: PropertyCustomizationDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Visibility toggles
  const [showBedrooms, setShowBedrooms] = useState(currentSettings.show_bedrooms ?? true)
  const [showBathrooms, setShowBathrooms] = useState(currentSettings.show_bathrooms ?? true)
  const [showArea, setShowArea] = useState(currentSettings.show_area ?? true)
  const [showAddress, setShowAddress] = useState(currentSettings.show_address ?? true)
  const [showImages, setShowImages] = useState(currentSettings.show_images ?? true)

  // Custom labels
  const [labelBedrooms, setLabelBedrooms] = useState(currentSettings.label_bedrooms || 'Bedrooms')
  const [labelBathrooms, setLabelBathrooms] = useState(currentSettings.label_bathrooms || 'Bathrooms')
  const [labelArea, setLabelArea] = useState(currentSettings.label_area || 'Square Feet')
  const [labelMonthlyRent, setLabelMonthlyRent] = useState(currentSettings.label_monthly_rent || 'Monthly Rent')
  const [labelNightlyRate, setLabelNightlyRate] = useState(currentSettings.label_nightly_rate || 'Nightly Rate')
  const [labelPurchasePrice, setLabelPurchasePrice] = useState(currentSettings.label_purchase_price || 'Purchase Price')

  // Custom notes
  const [customNotes, setCustomNotes] = useState(currentSettings.custom_notes || '')

  // Sync state when currentSettings change (dialog opens)
  useEffect(() => {
    setShowBedrooms(currentSettings.show_bedrooms ?? true)
    setShowBathrooms(currentSettings.show_bathrooms ?? true)
    setShowArea(currentSettings.show_area ?? true)
    setShowAddress(currentSettings.show_address ?? true)
    setShowImages(currentSettings.show_images ?? true)
    setLabelBedrooms(currentSettings.label_bedrooms || 'Bedrooms')
    setLabelBathrooms(currentSettings.label_bathrooms || 'Bathrooms')
    setLabelArea(currentSettings.label_area || 'Square Feet')
    setLabelMonthlyRent(currentSettings.label_monthly_rent || 'Monthly Rent')
    setLabelNightlyRate(currentSettings.label_nightly_rate || 'Nightly Rate')
    setLabelPurchasePrice(currentSettings.label_purchase_price || 'Purchase Price')
    setCustomNotes(currentSettings.custom_notes || '')
  }, [currentSettings, isOpen])

  const handleSave = async () => {
    setIsSaving(true)

    const customization: PropertyCustomization = {
      show_bedrooms: showBedrooms,
      show_bathrooms: showBathrooms,
      show_area: showArea,
      show_address: showAddress,
      show_images: showImages,
      label_bedrooms: labelBedrooms,
      label_bathrooms: labelBathrooms,
      label_area: labelArea,
      label_monthly_rent: labelMonthlyRent,
      label_nightly_rate: labelNightlyRate,
      label_purchase_price: labelPurchasePrice,
      custom_notes: customNotes || null,
    }

    const result = await updatePropertyCustomization(propertyId, customization)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property customization saved successfully',
      })
      router.refresh()
      onClose()
    }

    setIsSaving(false)
  }

  const handleReset = async () => {
    setIsResetting(true)

    const result = await resetPropertyCustomization(propertyId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      // Reset local state to defaults
      setShowBedrooms(true)
      setShowBathrooms(true)
      setShowArea(true)
      setShowAddress(true)
      setShowImages(true)
      setLabelBedrooms('Bedrooms')
      setLabelBathrooms('Bathrooms')
      setLabelArea('Square Feet')
      setLabelMonthlyRent('Monthly Rent')
      setLabelNightlyRate('Nightly Rate')
      setLabelPurchasePrice('Purchase Price')
      setCustomNotes('')

      toast({
        title: 'Success',
        description: 'Property customization reset to defaults',
      })
      router.refresh()
    }

    setIsResetting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card-accent border-white/20 text-white w-[95vw] !max-w-5xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="space-y-4 pb-4 border-b border-white/10 px-6 pt-6">
          <DialogTitle className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-white">
            Customize Display
          </DialogTitle>
          <DialogDescription className="text-white/70 text-base tracking-wide">
            Control field visibility and customize labels for client-facing views
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mx-6 mt-4" style={{ width: 'calc(100% - 3rem)' }}>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 text-white">
              Settings
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white/20 text-white">
              Live Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0 overflow-y-auto flex-1">
        <div className="space-y-8 py-6 px-6">
          {/* Field Visibility Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 divider-accent"></div>
              <h3 className="luxury-heading text-xl sm:text-2xl tracking-[0.1em] text-white flex items-center gap-3">
                <Eye className="h-6 w-6" />
                Field Visibility
              </h3>
            </div>
            <p className="text-sm text-white/60 tracking-wide">
              Toggle which fields are visible to clients viewing this property
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                <Checkbox
                  id="show-bedrooms"
                  checked={showBedrooms}
                  onCheckedChange={(checked) => setShowBedrooms(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show-bedrooms" className="text-white cursor-pointer flex-1 font-semibold uppercase tracking-wider text-sm">
                  Show Bedrooms
                </Label>
                {!showBedrooms && <EyeOff className="h-4 w-4 text-white/40" />}
              </div>

              <div className="flex items-center space-x-3 p-4 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                <Checkbox
                  id="show-bathrooms"
                  checked={showBathrooms}
                  onCheckedChange={(checked) => setShowBathrooms(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show-bathrooms" className="text-white cursor-pointer flex-1 font-semibold uppercase tracking-wider text-sm">
                  Show Bathrooms
                </Label>
                {!showBathrooms && <EyeOff className="h-4 w-4 text-white/40" />}
              </div>

              <div className="flex items-center space-x-3 p-4 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                <Checkbox
                  id="show-area"
                  checked={showArea}
                  onCheckedChange={(checked) => setShowArea(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show-area" className="text-white cursor-pointer flex-1 font-semibold uppercase tracking-wider text-sm">
                  Show Square Feet
                </Label>
                {!showArea && <EyeOff className="h-4 w-4 text-white/40" />}
              </div>

              <div className="flex items-center space-x-3 p-4 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300">
                <Checkbox
                  id="show-address"
                  checked={showAddress}
                  onCheckedChange={(checked) => setShowAddress(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show-address" className="text-white cursor-pointer flex-1 font-semibold uppercase tracking-wider text-sm">
                  Show Address
                </Label>
                {!showAddress && <EyeOff className="h-4 w-4 text-white/40" />}
              </div>

              <div className="flex items-center space-x-3 p-4 glass-card-accent rounded-xl border border-white/20 hover:scale-105 transition-transform duration-300 md:col-span-2">
                <Checkbox
                  id="show-images"
                  checked={showImages}
                  onCheckedChange={(checked) => setShowImages(checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <Label htmlFor="show-images" className="text-white cursor-pointer flex-1 font-semibold uppercase tracking-wider text-sm">
                  Show Property Images
                </Label>
                {!showImages && <EyeOff className="h-4 w-4 text-white/40" />}
              </div>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 divider-accent"></div>
            <div className="w-2 h-2 rounded-full bg-white/60"></div>
            <div className="h-px flex-1 divider-accent"></div>
          </div>

          {/* Custom Labels Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 divider-accent"></div>
              <h3 className="luxury-heading text-xl sm:text-2xl tracking-[0.1em] text-white">
                Custom Field Labels
              </h3>
            </div>
            <p className="text-sm text-white/60 tracking-wide">
              Rename field labels to match your branding or property type
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label-bedrooms" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Bedrooms Label
                </Label>
                <Input
                  id="label-bedrooms"
                  value={labelBedrooms}
                  onChange={(e) => setLabelBedrooms(e.target.value)}
                  placeholder="Bedrooms"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-bathrooms" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Bathrooms Label
                </Label>
                <Input
                  id="label-bathrooms"
                  value={labelBathrooms}
                  onChange={(e) => setLabelBathrooms(e.target.value)}
                  placeholder="Bathrooms"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-area" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Area Label
                </Label>
                <Input
                  id="label-area"
                  value={labelArea}
                  onChange={(e) => setLabelArea(e.target.value)}
                  placeholder="Square Feet"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-monthly-rent" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Monthly Rent Label
                </Label>
                <Input
                  id="label-monthly-rent"
                  value={labelMonthlyRent}
                  onChange={(e) => setLabelMonthlyRent(e.target.value)}
                  placeholder="Monthly Rent"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-nightly-rate" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Nightly Rate Label
                </Label>
                <Input
                  id="label-nightly-rate"
                  value={labelNightlyRate}
                  onChange={(e) => setLabelNightlyRate(e.target.value)}
                  placeholder="Nightly Rate"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label-purchase-price" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Purchase Price Label
                </Label>
                <Input
                  id="label-purchase-price"
                  value={labelPurchasePrice}
                  onChange={(e) => setLabelPurchasePrice(e.target.value)}
                  placeholder="Purchase Price"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                />
              </div>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 divider-accent"></div>
            <div className="w-2 h-2 rounded-full bg-white/60"></div>
            <div className="h-px flex-1 divider-accent"></div>
          </div>

          {/* Custom Notes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 divider-accent"></div>
              <h3 className="luxury-heading text-xl sm:text-2xl tracking-[0.1em] text-white">
                Custom Notes
              </h3>
            </div>
            <p className="text-sm text-white/60 tracking-wide">
              Add special notes or instructions visible to clients (separate from property description)
            </p>

            <Textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., '2-night minimum on weekends' or 'Owner motivated! Make an offer'"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px] resize-none"
            />
          </div>
        </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0 overflow-y-auto flex-1">
            <div className="py-6 px-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-12 divider-accent"></div>
                <h3 className="luxury-heading text-xl sm:text-2xl tracking-[0.1em] text-white">
                  Client View Preview
                </h3>
              </div>
              <p className="text-sm text-white/60 tracking-wide mb-6">
                This is how the property will appear to clients with your current settings
              </p>

              {/* Preview Card */}
              <div className="glass-card-accent rounded-2xl border border-white/20 overflow-hidden">
                {/* Preview Header - Address */}
                {showAddress ? (
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-white/80 flex-shrink-0 mt-1" />
                      <h3 className="text-xl font-bold text-white tracking-wide">
                        {propertyData?.address || '123 Example Street, City, State'}
                      </h3>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border-b border-white/10 bg-red-500/10">
                    <div className="flex items-center gap-2 text-red-400">
                      <EyeOff className="h-4 w-4" />
                      <span className="text-sm">Address hidden from clients</span>
                    </div>
                  </div>
                )}

                {/* Preview Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Bedrooms */}
                    {showBedrooms ? (
                      <div className="text-center p-4 glass-card-accent rounded-xl">
                        <Bed className="h-6 w-6 mx-auto mb-2 text-white" />
                        <p className="text-2xl font-bold text-white">{propertyData?.bedrooms || '3'}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                          {labelBedrooms}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-4 glass-card-accent rounded-xl bg-red-500/10 border border-red-500/20">
                        <Bed className="h-6 w-6 mx-auto mb-2 text-red-400/50" />
                        <EyeOff className="h-4 w-4 mx-auto text-red-400" />
                        <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1.5">Hidden</p>
                      </div>
                    )}

                    {/* Bathrooms */}
                    {showBathrooms ? (
                      <div className="text-center p-4 glass-card-accent rounded-xl">
                        <Bath className="h-6 w-6 mx-auto mb-2 text-white" />
                        <p className="text-2xl font-bold text-white">{propertyData?.bathrooms || '2'}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                          {labelBathrooms}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-4 glass-card-accent rounded-xl bg-red-500/10 border border-red-500/20">
                        <Bath className="h-6 w-6 mx-auto mb-2 text-red-400/50" />
                        <EyeOff className="h-4 w-4 mx-auto text-red-400" />
                        <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1.5">Hidden</p>
                      </div>
                    )}

                    {/* Area */}
                    {showArea ? (
                      <div className="text-center p-4 glass-card-accent rounded-xl">
                        <Square className="h-6 w-6 mx-auto mb-2 text-white" />
                        <p className="text-2xl font-bold text-white">{propertyData?.area || '1,500'}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1.5 font-semibold">
                          {labelArea}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-4 glass-card-accent rounded-xl bg-red-500/10 border border-red-500/20">
                        <Square className="h-6 w-6 mx-auto mb-2 text-red-400/50" />
                        <EyeOff className="h-4 w-4 mx-auto text-red-400" />
                        <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1.5">Hidden</p>
                      </div>
                    )}
                  </div>

                  {/* Images Preview */}
                  <div className="mt-6">
                    {showImages ? (
                      <div className="h-32 bg-white/5 rounded-xl border border-white/20 flex items-center justify-center">
                        <span className="text-white/50 text-sm">Property images will be displayed</span>
                      </div>
                    ) : (
                      <div className="h-32 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
                        <EyeOff className="h-5 w-5 text-red-400" />
                        <span className="text-red-400 text-sm">Images hidden from clients</span>
                      </div>
                    )}
                  </div>

                  {/* Custom Notes Preview */}
                  {customNotes && (
                    <div className="mt-6 p-4 glass-card-accent rounded-xl border border-blue-400/30 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Important Information</h4>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap">{customNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Summary */}
              <div className="p-4 glass-card-accent rounded-xl border border-white/10">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Settings Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {showAddress ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    <span className={showAddress ? 'text-white/70' : 'text-red-400'}>Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showBedrooms ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    <span className={showBedrooms ? 'text-white/70' : 'text-red-400'}>{labelBedrooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showBathrooms ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    <span className={showBathrooms ? 'text-white/70' : 'text-red-400'}>{labelBathrooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showArea ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    <span className={showArea ? 'text-white/70' : 'text-red-400'}>{labelArea}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showImages ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    <span className={showImages ? 'text-white/70' : 'text-red-400'}>Images</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {customNotes ? <Eye className="h-4 w-4 text-blue-400" /> : <EyeOff className="h-4 w-4 text-white/30" />}
                    <span className={customNotes ? 'text-white/70' : 'text-white/30'}>Custom Notes</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-6 px-6 border-t border-white/10 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || isResetting}
            className="border-white/40 hover:bg-white/10 text-white px-6 py-6 text-base"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || isResetting}
            className="border-white/40 hover:bg-white/10 text-white px-6 py-6 text-base"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isResetting}
            className="btn-luxury px-8 py-6 text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
