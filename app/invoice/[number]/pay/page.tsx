'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
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

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Checkout form component that uses Stripe hooks
function CheckoutForm({
  invoice,
  invoiceNumber,
  onSuccess
}: {
  invoice: InvoiceWithLineItems
  invoiceNumber: string
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || 'An error occurred')
      setIsProcessing(false)
      return
    }

    // Confirm the payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/invoice/${invoiceNumber}/pay/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message || 'An error occurred')
      setIsProcessing(false)
    } else {
      // Payment succeeded without redirect
      // Process the payment in our system
      const result = await processPayment(invoiceNumber, {
        cardNumber: '4242424242424242', // Placeholder - actual card handled by Stripe
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: invoice.client_name,
      })

      if (result.error) {
        setErrorMessage(result.error)
        setIsProcessing(false)
      } else {
        onSuccess()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/5 border border-white/20 rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'accordion',
            paymentMethodOrder: ['card'],
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
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
        <span>Secured by Stripe</span>
      </div>
    </form>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const invoiceNumber = params?.number as string

  const [invoice, setInvoice] = useState<InvoiceWithLineItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceNumber) return

      const { data, error } = await getInvoiceByNumber(invoiceNumber)
      if (error) {
        setError(error)
        setIsLoading(false)
      } else if (data?.status === 'paid') {
        setError('This invoice has already been paid')
        setIsLoading(false)
      } else if (data?.status === 'draft') {
        setError('This invoice has not been sent yet')
        setIsLoading(false)
      } else {
        setInvoice(data)

        // Create PaymentIntent
        try {
          const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: data?.total || 0,
              invoiceNumber: data?.invoice_number,
              clientEmail: data?.client_email,
              clientName: data?.client_name,
            }),
          })

          const { clientSecret: secret, error: intentError } = await response.json()

          if (intentError) {
            setError(intentError)
          } else {
            setClientSecret(secret)
          }
        } catch (err) {
          setError('Failed to initialize payment')
        }

        setIsLoading(false)
      }
    }

    loadInvoice()
  }, [invoiceNumber])

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
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

  const stripeOptions = {
    clientSecret: clientSecret!,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#ffffff',
        colorBackground: 'rgba(255, 255, 255, 0.05)',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      rules: {
        '.Input': {
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        '.Input:focus': {
          border: '1px solid #ffffff',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.3)',
        },
        '.Label': {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
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
              Enter your payment information to complete the transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret && invoice ? (
              <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm
                  invoice={invoice}
                  invoiceNumber={invoiceNumber}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
