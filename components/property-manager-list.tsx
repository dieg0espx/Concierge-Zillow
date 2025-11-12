'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { deletePropertyManager, type PropertyManager } from '@/lib/actions/property-managers'
import { Trash2, Mail, Phone, Home, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'
import { formatPhoneNumber } from '@/lib/utils'

export function PropertyManagerList({
  propertyManagers,
}: {
  propertyManagers: PropertyManager[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deletePropertyManager(id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Property manager deleted successfully',
      })
      router.refresh()
    }

    setDeletingId(null)
  }

  if (propertyManagers.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-white/70">No property managers yet</p>
          <p className="text-sm text-white/60">
            Add your first property manager to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {propertyManagers.map((manager) => (
        <Card key={manager.id} className="glass-card premium-card">
          <CardHeader className="pb-3">
            {/* Profile Picture */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/30 flex items-center justify-center">
                {manager.profile_picture_url ? (
                  <img
                    src={manager.profile_picture_url}
                    alt={manager.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-white/40" />
                )}
              </div>
            </div>
            <CardTitle className="flex items-center justify-between text-white tracking-wide">
              <span>{manager.name}</span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === manager.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the property manager. Their properties will not be deleted
                      but will be unassigned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(manager.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardTitle>
            <CardDescription className="text-white/60">
              Added on {new Date(manager.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Mail className="h-4 w-4 text-white/60" />
              <span>{manager.email}</span>
            </div>
            {manager.phone && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Phone className="h-4 w-4 text-white/60" />
                <span>{formatPhoneNumber(manager.phone)}</span>
              </div>
            )}
            <div className="space-y-6 mt-4">
              <Link href={`/admin/manager/${manager.id}`}>
                <Button variant="outline" className="w-full border-white/30 hover:bg-white hover:text-black hover:border-white text-white transition-all mb-2">
                  <Home className="mr-2 h-4 w-4" />
                  Manage Properties
                </Button>
              </Link>
              <Link href={`/manager/${manager.id}`} target="_blank">
                <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/30 text-white border-white/20 hover:border-white/40 transition-all">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Public Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
