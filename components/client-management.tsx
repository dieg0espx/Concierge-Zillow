'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, ExternalLink, Copy, Check, Loader2, Users, Edit } from 'lucide-react'
import { addClient, deleteClient } from '@/lib/actions/clients'
import type { Client } from '@/lib/actions/clients'
import Link from 'next/link'

interface ClientManagementProps {
  managerId: string
  clients: Client[]
}

export function ClientManagement({ managerId, clients }: ClientManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const result = await addClient(formData)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Client added successfully',
      })
      setIsOpen(false)
      router.refresh()
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete "${clientName}"? This will remove all their property assignments.`)) {
      return
    }

    setDeletingId(clientId)
    const result = await deleteClient(clientId)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      })
      router.refresh()
    }

    setDeletingId(null)
  }

  const handleCopyUrl = async (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(clientId)
      toast({
        title: 'Copied!',
        description: 'Client portfolio URL copied to clipboard',
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="elevated-card">
      <CardHeader className="pb-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="luxury-heading text-2xl tracking-[0.15em] flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            Clients
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Client</DialogTitle>
                <DialogDescription className="text-white/70">
                  Create a personalized portfolio page for your client
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
                    placeholder="(555) 123-4567"
                    className="bg-white/5 border-white/30 text-white placeholder:text-white/40"
                  />
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
                      'Add Client'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No clients yet</p>
            <p className="text-sm mt-1">Add a client to create their personalized portfolio page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{client.name}</h3>
                  {client.email && (
                    <p className="text-sm text-white/60 truncate">{client.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyUrl(client.id)}
                    title="Copy portfolio URL"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {copiedId === client.id ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/client/${client.id}`} target="_blank">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View portfolio"
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/client/${client.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(client.id, client.name)}
                    disabled={deletingId === client.id}
                    title="Delete client"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {deletingId === client.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
