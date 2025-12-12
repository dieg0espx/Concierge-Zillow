import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { amount, invoiceNumber, clientEmail, clientName } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // TESTING: Override amount to $1 for production testing
    // TODO: Remove this override after testing is complete
    const testAmount = 1 // $1 USD for testing

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(testAmount * 100), // Convert to cents - using testAmount instead of amount
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        invoiceNumber,
        clientEmail,
        clientName,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
