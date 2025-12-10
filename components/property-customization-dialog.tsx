'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { updatePropertyCustomization, resetPropertyCustomization, type PropertyCustomization } from '@/lib/actions/properties'
import { Eye, EyeOff, RotateCcw, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PropertyCustomizationDialogProps {
  propertyId: string
  currentSettings: PropertyCustomization
  isOpen: boolean
  onClose: () => void
}

export function PropertyCustomizationDialog({
  propertyId,
  currentSettings,
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
      <DialogContent className="glass-card-accent border-white/20 text-white w-[95vw] max-w-5xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="space-y-4 pb-4 border-b border-white/10 px-6 pt-6">
          <DialogTitle className="luxury-heading text-3xl sm:text-4xl tracking-[0.15em] text-white">
            Customize Display
          </DialogTitle>
          <DialogDescription className="text-white/70 text-base tracking-wide">
            Control field visibility and customize labels for client-facing views
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 pb-6 px-6 border-t border-white/10">
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
