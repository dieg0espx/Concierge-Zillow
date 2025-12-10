'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Edit, Loader2 } from 'lucide-react'
import { updateClient } from '@/lib/actions/clients'

interface ClientEditDialogProps {
  clientId: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  clientSlug: string | null
}

export function ClientEditDialog({ clientId, clientName, clientEmail, clientPhone, clientSlug }: ClientEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append('clientId', clientId)

    const result = await updateClient(formData)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Client information updated successfully',
      })
      setIsOpen(false)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/30 text-white hover:bg-white/10"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Contact Info
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Client Information</DialogTitle>
          <DialogDescription className="text-white/70">
            Update the client's contact information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/90">
              Client Name *
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={clientName}
              placeholder="e.g., John Doe"
              className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90">
              Email (optional)
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={clientEmail || ''}
              placeholder="john@example.com"
              className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white/90">
              Phone (optional)
            </Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={clientPhone || ''}
              placeholder="(555) 123-4567"
              className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white/90">
              Custom URL Slug (optional)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">/client/</span>
              <Input
                id="slug"
                name="slug"
                defaultValue={clientSlug || ''}
                placeholder="smith-family"
                className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
              />
            </div>
            <p className="text-xs text-white/50">
              Use only lowercase letters, numbers, and hyphens. Leave blank to auto-generate from name.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
