'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Calendar,
  User,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { getInvoiceByNumber, InvoiceWithLineItems, InvoiceStatus } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: FileText },
  sent: { label: 'Awaiting Payment', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Clock },
  viewed: { label: 'Awaiting Payment', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: AlertCircle },
}

export default function InvoiceViewPage() {
  const params = useParams()
  const invoiceNumber = params?.number as string
  const [invoice, setInvoice] = useState<InvoiceWithLineItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceNumber) return

      const { data, error } = await getInvoiceByNumber(invoiceNumber)
      if (error) {
        setError(error)
      } else {
        setInvoice(data)
      }
      setIsLoading(false)
    }

    loadInvoice()
  }, [invoiceNumber])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading invoice...</span>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm p-8 text-center max-w-md">
          <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl text-white mb-2">Invoice Not Found</h2>
          <p className="text-white/70 mb-4">{error || 'The invoice you\'re looking for doesn\'t exist'}</p>
        </Card>
      </div>
    )
  }

  const config = statusConfig[invoice.status]
  const StatusIcon = config.icon
  const isOverdue = invoice.status === 'overdue' ||
    ((invoice.status === 'sent' || invoice.status === 'viewed') && new Date(invoice.due_date) < new Date())
  const canPay = invoice.status !== 'paid' && invoice.status !== 'draft'

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shimmer">
                <Logo />
              </div>
              <div className="flex flex-col">
                <div className="luxury-heading text-lg tracking-widest text-white">
                  LUXURY LIVING
                </div>
                <div className="text-[10px] tracking-[0.2em] text-white/70 uppercase font-semibold">
                  Cadiz & Lluis
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Invoice Header */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="luxury-heading text-3xl sm:text-4xl text-white tracking-wide mb-2">
                  Invoice
                </h1>
                <p className="text-white/60 font-mono text-lg">{invoice.invoice_number}</p>
              </div>
              <Badge className={`${config.color} border text-base px-4 py-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {config.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Bill To</p>
                    <p className="text-white font-medium">{invoice.client_name}</p>
                    <p className="text-white/70">{invoice.client_email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-white/60 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Due Date</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(invoice.due_date)}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-0">
            <div className="p-6 border-b border-white/10">
              <h2 className="luxury-heading text-xl text-white tracking-wide">Items</h2>
            </div>
            <div className="divide-y divide-white/10">
              {invoice.line_items.map((item, index) => (
                <div key={index} className="p-6 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.description}</p>
                    <p className="text-white/60 text-sm">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Subtotal</span>
                <span className="text-white font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate && invoice.tax_rate > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Tax ({invoice.tax_rate}%)</span>
                  <span className="text-white font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="h-px divider-accent" />
              <div className="flex justify-between items-center">
                <span className="text-white text-xl font-semibold">Total Due</span>
                <span className="text-white text-3xl font-bold">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card className="glass-card-accent elevated-card border border-white/20 mb-8">
            <CardContent className="p-6">
              <h3 className="text-white/60 text-sm uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-white/80 whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Pay Button */}
        {canPay && (
          <div className="text-center">
            <Link href={`/invoice/${invoice.invoice_number}/pay`}>
              <Button className="btn-luxury text-lg px-12 py-6">
                <CreditCard className="h-5 w-5 mr-3" />
                Pay Now
              </Button>
            </Link>
          </div>
        )}

        {/* Already Paid */}
        {invoice.status === 'paid' && (
          <Card className="glass-card-accent border-green-500/30 bg-green-500/10">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Payment Received</h3>
              <p className="text-white/70">
                Thank you! This invoice was paid on {invoice.paid_at ? formatDate(invoice.paid_at) : 'N/A'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
