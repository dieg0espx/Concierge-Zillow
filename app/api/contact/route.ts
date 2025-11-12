import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email content for admin
    const adminMailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_EMAIL,
      subject: `New Contact Form Submission - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
              .field { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
              .label { font-weight: bold; color: #000; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 5px; }
              .value { color: #333; font-size: 16px; }
              .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">NEW CONTACT REQUEST</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Luxury Concierge - Property Inquiry</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Name</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value"><a href="mailto:${email}" style="color: #000; text-decoration: none;">${email}</a></div>
                </div>
                ${phone ? `
                <div class="field">
                  <div class="label">Phone</div>
                  <div class="value"><a href="tel:${phone}" style="color: #000; text-decoration: none;">${phone}</a></div>
                </div>
                ` : ''}
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value" style="white-space: pre-wrap;">${message}</div>
                </div>
              </div>
              <div class="footer">
                <p>This message was sent from the Luxury Concierge contact form.</p>
                <p>Received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}

Received on ${new Date().toLocaleString()}
      `,
    }

    // Email confirmation for user
    const userMailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Thank You for Contacting Luxury Concierge',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000; text-decoration: none; border-radius: 4px; font-weight: bold; letter-spacing: 1px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px; letter-spacing: 3px;">LUXURY CONCIERGE</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9; letter-spacing: 2px;">CADIZ & LLUIS</p>
              </div>
              <div class="content">
                <h2 style="margin-top: 0; color: #000;">Thank You for Your Inquiry</h2>
                <p>Dear ${name},</p>
                <p>Thank you for contacting Luxury Concierge. We have received your message and will respond within 24 hours.</p>
                <p>Our team is committed to providing you with exceptional service and finding the perfect property to match your needs.</p>
                <p><strong>Your Message:</strong></p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; border-left: 4px solid #000; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <p>If you need immediate assistance, please feel free to call us or reply to this email.</p>
                <p style="margin-top: 30px;">Best regards,<br><strong>The Luxury Concierge Team</strong><br>Cadiz & Lluis</p>
              </div>
              <div class="footer">
                <p><strong>Luxury Concierge</strong></p>
                <p>Premium Property Management</p>
                <p>${process.env.CONTACT_EMAIL}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Dear ${name},

Thank you for contacting Luxury Concierge. We have received your message and will respond within 24 hours.

Your Message:
${message}

If you need immediate assistance, please feel free to call us or reply to this email.

Best regards,
The Luxury Concierge Team
Cadiz & Lluis

${process.env.CONTACT_EMAIL}
      `,
    }

    // Send emails
    await transporter.sendMail(adminMailOptions)
    await transporter.sendMail(userMailOptions)

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
