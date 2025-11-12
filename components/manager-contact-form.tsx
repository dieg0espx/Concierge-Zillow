'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Phone, Send, User } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils'

interface ManagerContactFormProps {
  manager: {
    id: string
    name: string
    email: string
    phone?: string
    profile_picture_url?: string
  }
}

export function ManagerContactForm({ manager }: ManagerContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hello ${manager.name}, I'd like to inquire about your property management services.`
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/manager-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          managerId: manager.id,
          managerName: manager.name,
          managerEmail: manager.email,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send inquiry')
      }

      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `Hello ${manager.name}, I'd like to inquire about your property management services.`
      })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Manager Info Card */}
      <div className="lg:col-span-1">
        <Card className="bg-card/50 border border-border/30 backdrop-blur-sm h-full">
          <CardHeader className="pb-4">
            <CardTitle className="luxury-heading text-xl text-white tracking-[0.15em]">
              Contact {manager.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/10 border-2 border-white/30 flex items-center justify-center">
                {manager.profile_picture_url ? (
                  <img
                    src={manager.profile_picture_url}
                    alt={manager.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-white/40" />
                )}
              </div>
            </div>

            {/* Manager Details */}
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white tracking-wide">
                {manager.name}
              </h3>

              {/* Email */}
              {manager.email && (
                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Email</span>
                  </div>
                  <a
                    href={`mailto:${manager.email}`}
                    className="text-white hover:text-white/80 transition-colors text-sm break-all"
                  >
                    {manager.email}
                  </a>
                </div>
              )}

              {/* Phone */}
              {manager.phone && (
                <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 text-white/70">
                    <Phone className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Phone</span>
                  </div>
                  <a
                    href={`tel:${manager.phone}`}
                    className="text-white hover:text-white/80 transition-colors text-sm"
                  >
                    {formatPhoneNumber(manager.phone)}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Form Card */}
      <Card className="lg:col-span-2 bg-card/50 border border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="luxury-heading text-2xl sm:text-3xl text-white tracking-[0.15em]">
            Send an Inquiry
          </CardTitle>
          <CardDescription className="text-white/70 text-base">
            Get in touch with {manager.name} about property management services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Contact CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/10">
            {manager.email && (
              <Button
                asChild
                className="w-full bg-white text-black hover:bg-white/90 transition-all h-14 text-base"
              >
                <a href={`mailto:${manager.email}?subject=Property Management Inquiry`}>
                  <Mail className="h-5 w-5 mr-2" />
                  Send Email
                </a>
              </Button>
            )}
            {manager.phone && (
              <Button
                asChild
                variant="outline"
                className="w-full border-white/30 hover:bg-white hover:text-black hover:border-white text-white transition-all h-14 text-base"
              >
                <a href={`tel:${manager.phone}`}>
                  <Phone className="h-5 w-5 mr-2" />
                  Call {formatPhoneNumber(manager.phone)}
                </a>
              </Button>
            )}
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/90 uppercase tracking-wide text-sm">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 uppercase tracking-wide text-sm">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90 uppercase tracking-wide text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-white/90 uppercase tracking-wide text-sm">
                Message *
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="I'd like to inquire about..."
                required
                disabled={isSubmitting}
                rows={5}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black hover:bg-white/90 h-14 text-base font-semibold"
            >
              {isSubmitting ? (
                'Sending...'
              ) : submitted ? (
                'Message Sent!'
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Inquiry
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
