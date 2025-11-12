import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message, managerId, managerName, managerEmail } = body

    // Validate required fields
    if (!name || !email || !message || !managerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!managerEmail) {
      return NextResponse.json(
        { error: 'No manager email found' },
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

    // Email content for property manager
    const managerMailOptions = {
      from: process.env.SMTP_FROM,
      to: managerEmail,
      subject: `New Inquiry from ${name}`,
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
              .inquiry-badge { display: inline-block; background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%); color: #000; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-bottom: 15px; }
              .field { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 4px; }
              .label { font-weight: bold; color: #000; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; margin-bottom: 5px; }
              .value { color: #333; font-size: 16px; }
              .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">NEW INQUIRY</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Luxury Concierge - Property Management</p>
              </div>
              <div class="content">
                <div class="inquiry-badge">GENERAL INQUIRY</div>
                <h2 style="margin: 0 0 20px 0; color: #000;">Hello ${managerName},</h2>
                <p>You have received a new inquiry from your property portfolio page.</p>

                <div class="field">
                  <div class="label">Contact Name</div>
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
                <p>This inquiry was submitted from your property manager portfolio page.</p>
                <p>Received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <p style="margin-top: 15px; font-size: 11px; color: #999;">
                  Please respond to the customer within 24 hours for best service.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
New Inquiry

Hello ${managerName},

You have received a new inquiry from your property portfolio page.

Contact Information:
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}

Message:
${message}

Received on ${new Date().toLocaleString()}

Please respond to the customer within 24 hours.
      `,
    }

    // Email confirmation for user
    const userMailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Your Inquiry to ${managerName}`,
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
              .manager-box { background: #f9f9f9; padding: 20px; border-radius: 4px; border-left: 4px solid #000; margin: 20px 0; }
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
                <p>Thank you for reaching out. We have received your inquiry and notified ${managerName}.</p>

                <div class="manager-box">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #000; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Property Manager</p>
                  <p style="margin: 0; font-size: 18px; color: #000;">${managerName}</p>
                </div>

                <p><strong>Your Message:</strong></p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                </div>

                <p>${managerName} will review your inquiry and respond within 24 hours.</p>
                <p>If you need immediate assistance, please feel free to reply to this email.</p>

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

Thank you for reaching out. We have received your inquiry and notified ${managerName}.

Property Manager: ${managerName}

Your Message:
${message}

${managerName} will review your inquiry and respond within 24 hours.

If you need immediate assistance, please feel free to reply to this email.

Best regards,
The Luxury Concierge Team
Cadiz & Lluis

${process.env.CONTACT_EMAIL}
      `,
    }

    // Send emails
    await transporter.sendMail(managerMailOptions)
    await transporter.sendMail(userMailOptions)

    return NextResponse.json(
      { message: 'Inquiry sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending manager inquiry email:', error)
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    )
  }
}
