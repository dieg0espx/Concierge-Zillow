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
import { deleteUser, type UserProfile } from '@/lib/actions/users'
import { Trash2, Mail, User, Calendar } from 'lucide-react'

export function UsersList({ users }: { users: UserProfile[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const result = await deleteUser(id)

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      router.refresh()
    }

    setDeletingId(null)
  }

  if (users.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <User className="h-10 w-10 text-white/40" />
          </div>
          <p className="text-white/70 text-lg">No users yet</p>
          <p className="text-sm text-white/60 mt-2">
            Create your first user to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card key={user.id} className="glass-card premium-card">
          <CardHeader className="pb-3">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/30 flex items-center justify-center">
                <User className="h-10 w-10 text-white/40" />
              </div>
            </div>
            <CardTitle className="flex items-center justify-between text-white tracking-wide">
              <span className="text-center w-full">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.email}
              </span>
            </CardTitle>
            {user.first_name && user.last_name && (
              <CardDescription className="text-white/60 text-center">
                {user.email}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/80 bg-white/5 p-3 rounded-lg">
              <Mail className="h-4 w-4 text-white/60 flex-shrink-0" />
              <span className="break-all">{user.email}</span>
            </div>

            {(user.first_name || user.last_name) && (
              <div className="flex items-center gap-2 text-sm text-white/80 bg-white/5 p-3 rounded-lg">
                <User className="h-4 w-4 text-white/60 flex-shrink-0" />
                <span>
                  {user.first_name} {user.last_name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-white/80 bg-white/5 p-3 rounded-lg">
              <Calendar className="h-4 w-4 text-white/60 flex-shrink-0" />
              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
            </div>

            <div className="pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 hover:bg-red-500/20 hover:border-red-500 text-red-400 hover:text-red-300 transition-all"
                    disabled={deletingId === user.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the user account for {user.email}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(user.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
