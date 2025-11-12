'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createUser } from '@/lib/actions/users'
import { Mail, Lock, User, UserPlus } from 'lucide-react'

export function AddUserForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createUser(formData)

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'User created successfully',
        })
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-white/90 uppercase tracking-wide text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            First Name *
          </Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            required
            disabled={isSubmitting}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-white/90 uppercase tracking-wide text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Last Name *
          </Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            required
            disabled={isSubmitting}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/90 uppercase tracking-wide text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            disabled={isSubmitting}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/90 uppercase tracking-wide text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password *
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isSubmitting}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
          />
          <p className="text-xs text-white/60">Minimum 6 characters</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-white text-black hover:bg-white/90 h-12 px-8 text-base font-semibold"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2" />
              Create User
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
