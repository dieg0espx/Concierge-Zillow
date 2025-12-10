'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Share2, Loader2, X, User } from 'lucide-react'
import {
  getAllManagers,
  getClientShares,
  shareClient,
  unshareClient,
  type ManagerInfo
} from '@/lib/actions/clients'

interface ShareClientDialogProps {
  clientId: string
  clientName: string
  currentManagerId: string
}

export function ShareClientDialog({ clientId, clientName, currentManagerId }: ShareClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [managers, setManagers] = useState<ManagerInfo[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setIsLoading(true)

    // Load all managers
    const managersResult = await getAllManagers()
    if (managersResult.error) {
      toast.error('Failed to load managers')
    } else {
      // Filter out the current manager from the list
      const filteredManagers = managersResult.data?.filter(m => m.id !== currentManagerId) || []
      setManagers(filteredManagers)
    }

    // Load existing shares
    const sharesResult = await getClientShares(clientId)
    if (sharesResult.error) {
      toast.error('Failed to load shares')
    } else {
      setShares(sharesResult.data || [])
    }

    setIsLoading(false)
  }

  const handleShare = async () => {
    if (!selectedManagerId) {
      toast.error('Please select a manager')
      return
    }

    setIsSharing(true)

    const result = await shareClient(clientId, selectedManagerId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Client shared successfully')
      setSelectedManagerId('')
      await loadData()
      router.refresh()
    }

    setIsSharing(false)
  }

  const handleUnshare = async (shareWithManagerId: string, managerName: string) => {
    const result = await unshareClient(clientId, shareWithManagerId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Stopped sharing with ${managerName}`)
      await loadData()
      router.refresh()
    }
  }

  // Get managers that are already shared with
  const sharedManagerIds = shares.map(s => s.shared_with_manager_id)
  const availableManagers = managers.filter(m => !sharedManagerIds.includes(m.id))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
          <Share2 className="h-4 w-4 mr-2" />
          Share Client
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Share Client</DialogTitle>
          <DialogDescription className="text-white/70">
            Share {clientName} with other property managers
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Share new manager */}
            <div className="space-y-3">
              <Label htmlFor="manager" className="text-white/90">Share with manager</Label>
              <div className="flex gap-2">
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                  <SelectTrigger className="bg-white/5 border-white/30 text-white">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/20">
                    {availableManagers.length === 0 ? (
                      <div className="px-2 py-6 text-center text-white/60 text-sm">
                        No managers available to share with
                      </div>
                    ) : (
                      availableManagers.map((manager) => (
                        <SelectItem
                          key={manager.id}
                          value={manager.id}
                          className="text-white hover:bg-white/10"
                        >
                          {manager.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleShare}
                  disabled={isSharing || !selectedManagerId || availableManagers.length === 0}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Share'}
                </Button>
              </div>
            </div>

            {/* Currently shared with */}
            {shares.length > 0 && (
              <div className="space-y-3">
                <Label className="text-white/90">Currently shared with</Label>
                <div className="space-y-2">
                  {shares.map((share) => (
                    <Card key={share.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{share.shared_with?.name}</p>
                              <p className="text-white/60 text-sm">{share.shared_with?.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnshare(share.shared_with_manager_id, share.shared_with?.name)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
