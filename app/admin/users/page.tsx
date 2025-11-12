import { getUsers } from '@/lib/actions/users'
import { AddUserForm } from '@/components/add-user-form'
import { UsersList } from '@/components/users-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserPlus } from 'lucide-react'

export default async function UsersPage() {
  const { users, error } = await getUsers()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/10 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="luxury-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white">
            USER MANAGEMENT
          </h1>
        </div>
        <p className="text-white/70 text-lg tracking-wide">
          Manage system users and their access
        </p>
      </div>

      {/* Add User Section */}
      <Card className="elevated-card">
        <CardHeader className="pb-6 border-b border-white/10">
          <CardTitle className="luxury-heading text-2xl tracking-[0.15em] flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            Add New User
          </CardTitle>
          <CardDescription className="mt-3 text-white/70 tracking-wide">
            Create a new user account with email and password authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AddUserForm />
        </CardContent>
      </Card>

      {/* Users List Section */}
      <div>
        <h2 className="luxury-heading text-3xl font-bold tracking-[0.15em] text-white mb-6">
          All Users
        </h2>
        {error && (
          <Card className="glass-card premium-card p-6 mb-6">
            <p className="text-red-400">Error loading users: {error}</p>
          </Card>
        )}
        <UsersList users={users} />
      </div>
    </div>
  )
}
