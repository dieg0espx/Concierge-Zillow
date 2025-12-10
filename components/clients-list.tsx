'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Search,
  Copy,
  ExternalLink,
  Trash2,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import { ClientWithDetails, ClientStatus, updateClientStatus, deleteClient, addClient } from '@/lib/actions/clients'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Props = {
  clients: ClientWithDetails[]
}

const statusConfig: Record<ClientStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  pending: {
    label: 'Pending',
    icon: Loader2,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }
}

export function ClientsList({ clients }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<ClientWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.property_managers?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const copyClientLink = (clientId: string) => {
    const url = `${window.location.origin}/client/${clientId}`
    navigator.clipboard.writeText(url)
    toast.success('Client link copied to clipboard')
  }

  const handleStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    const result = await updateClientStatus(clientId, newStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Client status updated to ${statusConfig[newStatus].label}`)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    setIsDeleting(true)
    const result = await deleteClient(clientToDelete.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Client deleted successfully')
      router.refresh()
    }

    setDeleteDialogOpen(false)
    setClientToDelete(null)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsAdding(true)
    const formData = new FormData(e.currentTarget)
    const result = await addClient(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Client added successfully')
      setAddDialogOpen(false)
      router.refresh()
    }

    setIsAdding(false)
  }

  return (
    <div className="space-y-6">
      {/* Filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search clients by name, email, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ClientStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Add Client Button */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
            <form onSubmit={handleAddClient} className="space-y-4 mt-4">
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
                  onClick={() => setAddDialogOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="bg-white text-black hover:bg-white/90"
                >
                  {isAdding ? (
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{clients.length}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider mt-1">Total Clients</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{clients.filter(c => c.status === 'active').length}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{clients.filter(c => c.status === 'pending').length}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-zinc-400">{clients.filter(c => c.status === 'closed').length}</p>
            <p className="text-xs text-white/70 uppercase tracking-wider mt-1">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Clients Found</h3>
            <p className="text-white/60">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Clients will appear here once created'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const status = statusConfig[client.status || 'active']
            const StatusIcon = status.icon

            return (
              <Card key={client.id} className="glass-card hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 rounded-full bg-white/10 border border-white/20 flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/admin/client/${client.id}`}
                            className="text-lg font-semibold text-white hover:text-white/80 transition-colors truncate"
                          >
                            {client.name}
                          </Link>
                          <Badge className={`${status.className} border text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {client.is_shared && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                              <Share2 className="h-3 w-3 mr-1" />
                              Shared
                            </Badge>
                          )}
                        </div>
                        {client.email && (
                          <p className="text-sm text-white/60 truncate mt-0.5">{client.email}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {client.is_shared ? (
                              <>
                                {client.property_managers?.name || 'Unknown Manager'}
                                <span className="text-blue-400 ml-1">(shared by {client.shared_by?.name})</span>
                              </>
                            ) : (
                              client.property_managers?.name || 'Unknown Manager'
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {client.property_count || 0} {(client.property_count || 0) === 1 ? 'property' : 'properties'}
                          </span>
                          <span className="flex items-center gap-1" title="Last updated">
                            <Clock className="h-3 w-3" />
                            Updated: {mounted ? formatDate(client.updated_at) : 'Loading...'}
                          </span>
                          {client.last_accessed && (
                            <span className="flex items-center gap-1 text-green-400/70" title="Last time client viewed their portfolio">
                              <Clock className="h-3 w-3" />
                              Viewed: {mounted ? formatDate(client.last_accessed) : 'Loading...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status Dropdown */}
                      <Select
                        value={client.status || 'active'}
                        onValueChange={(v) => handleStatusChange(client.id, v as ClientStatus)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Copy Link Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => copyClientLink(client.id)}
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        asChild
                        title="Edit"
                      >
                        <Link href={`/admin/client/${client.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Preview Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                        asChild
                        title="Preview"
                      >
                        <Link href={`/client/${client.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          setClientToDelete(client)
                          setDeleteDialogOpen(true)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{clientToDelete?.name}"? This action cannot be undone
              and will remove all property assignments for this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
