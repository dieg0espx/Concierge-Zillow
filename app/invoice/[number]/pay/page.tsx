'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  CreditCard,
  Lock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { getInvoiceByNumber, processPayment, InvoiceWithLineItems } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceNumber = params?.number as string

  const [invoice, setInvoice] = useState<InvoiceWithLineItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceNumber) return

      const { data, error } = await getInvoiceByNumber(invoiceNumber)
      if (error) {
        setError(error)
      } else if (data?.status === 'paid') {
        setError('This invoice has already been paid')
      } else if (data?.status === 'draft') {
        setError('This invoice has not been sent yet')
      } else {
        setInvoice(data)
      }
      setIsLoading(false)
    }

    loadInvoice()
  }, [invoiceNumber])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      toast({ title: 'Error', description: 'Please enter a valid card number', variant: 'destructive' })
      return
    }
    if (!expiryDate || expiryDate.length < 5) {
      toast({ title: 'Error', description: 'Please enter a valid expiry date', variant: 'destructive' })
      return
    }
    if (!cvv || cvv.length < 3) {
      toast({ title: 'Error', description: 'Please enter a valid CVV', variant: 'destructive' })
      return
    }
    if (!cardholderName.trim()) {
      toast({ title: 'Error', description: 'Please enter the cardholder name', variant: 'destructive' })
      return
    }

    setIsProcessing(true)

    const result = await processPayment(invoiceNumber, {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName,
    })

    if (result.error) {
      toast({ title: 'Payment Failed', description: result.error, variant: 'destructive' })
      setIsProcessing(false)
    } else {
      setPaymentSuccess(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-4">
        <Card className="glass-card-accent border-white/20 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CreditCard className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h2 className="text-2xl text-white mb-2">Cannot Process Payment</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Link href={`/invoice/${invoiceNumber}`}>
              <Button className="btn-luxury">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-4">
        <Card className="glass-card-accent border-green-500/30 bg-green-500/5 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-white/70 mb-6">
              Thank you for your payment of {formatCurrency(invoice?.total || 0)}
            </p>
            <p className="text-white/60 text-sm mb-8">
              A confirmation has been sent to {invoice?.client_email}
            </p>
            <Link href={`/invoice/${invoiceNumber}`}>
              <Button className="btn-luxury">
                View Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-md sticky top-0 z-50 glass-card-accent">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/invoice/${invoiceNumber}`} className="flex items-center gap-2 text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Invoice</span>
            </Link>
            <div className="flex items-center gap-2 text-white/60">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Secure Payment</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="shimmer inline-block mb-4">
            <Logo />
          </div>
          <h1 className="luxury-heading text-3xl text-white tracking-wide mb-2">
            Complete Payment
          </h1>
          <p className="text-white/60">Invoice {invoiceNumber}</p>
        </div>

        {/* Invoice Summary Card */}
        <Card className="glass-card-accent border-white/20 mb-8">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Invoice Summary</p>
                <p className="text-white font-mono">{invoice?.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Due Date</p>
                <p className="text-white font-medium">
                  {invoice?.due_date && new Date(invoice.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t border-white/10 pt-4 mb-4">
              {invoice?.line_items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 text-sm">
                  <div className="text-white/80">
                    <span>{item.description}</span>
                    <span className="text-white/50 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-white">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Subtotal and Tax */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">{formatCurrency(invoice?.subtotal || 0)}</span>
              </div>
              {invoice?.tax_rate && invoice.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tax ({invoice.tax_rate}%)</span>
                  <span className="text-white">{formatCurrency(invoice?.tax_amount || 0)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-white/20 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm uppercase tracking-wider">Total Due</span>
                <span className="text-white text-3xl font-bold">{formatCurrency(invoice?.total || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="glass-card-accent border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription className="text-white/60">
              Enter your card information to complete the payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-white/90">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 font-mono"
                  />
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry" className="text-white/90">Expiry Date</Label>
                  <Input
                    id="expiry"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-white/90">CVV</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12 font-mono"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName" className="text-white/90">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Smith"
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50 h-12"
                />
              </div>

              {/* Test Card Notice */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-2">
                <p className="text-blue-300 text-sm font-medium">Demo Mode - Test Cards</p>
                <div className="text-blue-300/80 text-xs space-y-1">
                  <p><span className="font-mono bg-blue-500/20 px-1.5 py-0.5 rounded">4242 4242 4242 4242</span> - Successful payment</p>
                  <p><span className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-red-300">4000 0000 0000 0002</span> - Card declined</p>
                  <p><span className="font-mono bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-300">4000 0000 0000 9995</span> - Insufficient funds</p>
                </div>
                <p className="text-blue-300/60 text-xs mt-2">Use any future expiry date and any 3-digit CVV.</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing}
                className="w-full btn-luxury text-lg py-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Pay {formatCurrency(invoice?.total || 0)}
                  </>
                )}
              </Button>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                <Shield className="h-4 w-4" />
                <span>Your payment information is secure</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
