'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  Plus,
  Trash2,
  Calculator,
  User,
  Mail,
  Calendar,
  FileText,
  Percent,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { createInvoice, updateInvoice, InvoiceWithLineItems } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type LineItem = {
  id?: string
  description: string
  quantity: number
  unit_price: number
}

interface InvoiceFormProps {
  invoice?: InvoiceWithLineItems
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!invoice

  const [clientName, setClientName] = useState(invoice?.client_name || '')
  const [clientEmail, setClientEmail] = useState(invoice?.client_email || '')
  const [dueDate, setDueDate] = useState<Date | null>(
    invoice?.due_date ? new Date(invoice.due_date) : null
  )
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate?.toString() || '0')
  const [notes, setNotes] = useState(invoice?.notes || '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.line_items?.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [{ description: '', quantity: 1, unit_price: 0 }]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100
  const total = subtotal + taxAmount

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    if (field === 'quantity' || field === 'unit_price') {
      updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
    } else {
      updated[index][field] = value as string
    }
    setLineItems(updated)
  }

  const validateForm = () => {
    if (!clientName.trim()) {
      toast({ title: 'Error', description: 'Client name is required', variant: 'destructive' })
      return false
    }
    if (!clientEmail.trim()) {
      toast({ title: 'Error', description: 'Client email is required', variant: 'destructive' })
      return false
    }
    if (!dueDate) {
      toast({ title: 'Error', description: 'Due date is required', variant: 'destructive' })
      return false
    }
    if (lineItems.length === 0 || lineItems.every(item => !item.description.trim())) {
      toast({ title: 'Error', description: 'At least one line item is required', variant: 'destructive' })
      return false
    }
    return true
  }

  const handleSave = async (send: boolean = false) => {
    if (!validateForm()) return

    if (send) {
      setIsSending(true)
    } else {
      setIsSaving(true)
    }

    const data = {
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
      tax_rate: parseFloat(taxRate) || 0,
      notes: notes.trim() || null,
      line_items: lineItems.filter(item => item.description.trim()).map(item => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      status: send ? 'sent' as const : 'draft' as const,
    }

    try {
      if (isEditing) {
        const result = await updateInvoice(invoice!.id, data)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({
            title: 'Invoice updated',
            description: 'Your invoice has been saved.',
          })
          router.push('/admin/invoices')
        }
      } else {
        const result = await createInvoice(data)
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
          toast({
            title: send ? 'Invoice sent' : 'Invoice saved',
            description: send
              ? `Invoice has been sent to ${clientEmail}`
              : 'Your invoice has been saved as a draft.',
          })
          router.push('/admin/invoices')
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }

    setIsSaving(false)
    setIsSending(false)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/invoices">
            <Button variant="ghost" className="text-white hover:text-white/80">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="luxury-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.15em] mb-3 text-white">
              {isEditing ? 'Edit Invoice' : 'New Invoice'}
            </h1>
            <p className="text-white/70 mt-2 tracking-wide text-lg">
              {isEditing ? `Editing ${invoice?.invoice_number}` : 'Create a new invoice for your client'}
            </p>
          </div>
        </div>
      </div>

      {/* Source Quote Link */}
      {invoice?.source_quote_id && (
        <Card className="glass-card-accent border-purple-500/30 bg-purple-500/10 mt-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-white">This invoice was created from an accepted quote</span>
            </div>
            <Link href={`/admin/quotes`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Quotes
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="h-px divider-accent my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Information */}
          <Card className="glass-card-accent elevated-card">
            <CardHeader>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                <User className="inline-block h-6 w-6 mr-3" />
                Client Information
              </CardTitle>
              <CardDescription className="text-white/70 tracking-wide">
                Enter the client details for this invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                    Client Name *
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                    Client Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Due Date *
                </Label>
                <div className="relative w-full md:w-1/2">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 pointer-events-none z-10" />
                  <DatePicker
                    selected={dueDate}
                    onChange={(date: Date | null) => setDueDate(date)}
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select due date"
                    className="w-full pl-10 bg-white/5 border border-white/20 text-white placeholder:text-white/40 h-12 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-white/30"
                    calendarClassName="luxury-calendar"
                    wrapperClassName="w-full"
                    popperClassName="date-picker-popper"
                    withPortal
                    portalId="root-portal"
                    popperModifiers={[
                      {
                        name: 'zIndex',
                        enabled: true,
                        phase: 'write',
                        fn: ({ state }) => {
                          state.styles.popper.zIndex = 99999;
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="glass-card-accent elevated-card">
            <CardHeader>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                <FileText className="inline-block h-6 w-6 mr-3" />
                Line Items
              </CardTitle>
              <CardDescription className="text-white/70 tracking-wide">
                Add services or products to the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-white/60 text-sm uppercase tracking-wider">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Line Items */}
              {lineItems.map((item, index) => (
                <div key={index} className="glass-card-accent rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                      <Label className="md:hidden text-white/60 text-xs uppercase mb-1">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Service or product description"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="md:hidden text-white/60 text-xs uppercase mb-1">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="bg-white/5 border-white/20 text-white text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="md:hidden text-white/60 text-xs uppercase mb-1">Unit Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                          className="pl-7 bg-white/5 border-white/20 text-white text-right"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <Label className="md:hidden text-white/60 text-xs uppercase mb-1">Total</Label>
                      <p className="text-white font-semibold text-lg">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </p>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addLineItem}
                className="w-full border-dashed border-white/30 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="glass-card-accent elevated-card">
            <CardHeader>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                Notes
              </CardTitle>
              <CardDescription className="text-white/70 tracking-wide">
                Optional notes or payment instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, special instructions, or thank you message..."
                rows={4}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Totals Card */}
          <Card className="glass-card-accent elevated-card sticky top-8">
            <CardHeader>
              <CardTitle className="luxury-heading text-2xl tracking-[0.15em] text-white">
                <Calculator className="inline-block h-6 w-6 mr-3" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tax Rate Input */}
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-white/90 uppercase tracking-wide text-sm font-semibold">
                  Tax Rate (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="h-px divider-accent" />

              {/* Totals */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {parseFloat(taxRate) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Tax ({taxRate}%)</span>
                    <span className="text-white font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="h-px divider-accent" />
                <div className="flex justify-between items-center">
                  <span className="text-white text-lg font-semibold">Total</span>
                  <span className="text-white text-2xl font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="h-px divider-accent" />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={isSaving || isSending}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </>
                  )}
                </Button>
                {!isEditing && (
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || isSending}
                    className="w-full btn-luxury"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save & Send
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
