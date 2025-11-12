'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Loader2, Mail, User, Phone, MessageSquare } from 'lucide-react'

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setIsSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })

      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (isSuccess) {
    return (
      <Card className="glass-card-accent elevated-card p-12 text-center animate-fade-in-scale">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4 tracking-wide">Message Sent!</h3>
        <p className="text-white/80 text-lg mb-2">
          Thank you for contacting us. We'll get back to you within 24 hours.
        </p>
        <p className="text-white/60">
          Check your email for a confirmation message.
        </p>
      </Card>
    )
  }

  return (
    <Card className="glass-card-accent elevated-card p-8 sm:p-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name <span className="text-white/60">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className="h-12 bg-white/5 border-white/20 focus:border-white/40 text-white placeholder:text-white/40"
            disabled={isSubmitting}
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address <span className="text-white/60">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="h-12 bg-white/5 border-white/20 focus:border-white/40 text-white placeholder:text-white/40"
            disabled={isSubmitting}
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number <span className="text-white/40 text-xs">(Optional)</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className="h-12 bg-white/5 border-white/20 focus:border-white/40 text-white placeholder:text-white/40"
            disabled={isSubmitting}
          />
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Your Message <span className="text-white/60">*</span>
          </label>
          <Textarea
            id="message"
            name="message"
            required
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about the property you're interested in or any questions you have..."
            className="min-h-[150px] bg-white/5 border-white/20 focus:border-white/40 text-white placeholder:text-white/40 resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-luxury text-lg py-6 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Send Message
              </>
            )}
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-white/50 text-center tracking-wide">
          By submitting this form, you agree to be contacted by our team regarding your inquiry.
        </p>
      </form>
    </Card>
  )
}
