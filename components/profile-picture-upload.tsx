'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfilePictureUploadProps {
  managerId: string
  currentPictureUrl?: string | null
  managerName: string
}

export function ProfilePictureUpload({
  managerId,
  currentPictureUrl,
  managerName,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPictureUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PNG, JPEG, WEBP, or GIF image',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${managerId}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Delete old profile picture if exists
      if (currentPictureUrl) {
        const oldFileName = currentPictureUrl.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('profile-pictures').remove([oldFileName])
        }
      }

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Update manager record in database
      const { error: updateError } = await supabase
        .from('property_managers')
        .update({ profile_picture_url: publicUrl })
        .eq('id', managerId)

      if (updateError) throw updateError

      setPreviewUrl(publicUrl)
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      })

      // Refresh the page to show new image
      router.refresh()
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!currentPictureUrl) return

    setUploading(true)

    try {
      // Delete from storage
      const fileName = currentPictureUrl.split('/').pop()
      if (fileName) {
        await supabase.storage.from('profile-pictures').remove([fileName])
      }

      // Update manager record
      const { error: updateError } = await supabase
        .from('property_managers')
        .update({ profile_picture_url: null })
        .eq('id', managerId)

      if (updateError) throw updateError

      setPreviewUrl(null)
      toast({
        title: 'Success',
        description: 'Profile picture removed',
      })

      router.refresh()
    } catch (error) {
      console.error('Error removing picture:', error)
      toast({
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Failed to remove image',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Profile Picture Preview */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-2 border-white/30 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={managerName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="h-12 w-12 text-white/40" />
          )}
        </div>

        {/* Remove button overlay */}
        {previewUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove picture"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Upload loading overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        className="border-white/30 hover:bg-white/10 hover:border-white text-white"
      >
        <Upload className="h-4 w-4 mr-2" />
        {previewUrl ? 'Change Picture' : 'Upload Picture'}
      </Button>

      <p className="text-xs text-white/60 text-center">
        PNG, JPEG, WEBP, or GIF (max 5MB)
      </p>
    </div>
  )
}
