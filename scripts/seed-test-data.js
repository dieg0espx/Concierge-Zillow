#!/usr/bin/env node

// Comprehensive Test Data Seeder
// Adds sample data for property managers, properties, clients, invoices, and quotes
// Uses Supabase client with service role key

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample luxury property images (Unsplash)
const propertyImages = [
  [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  ],
  [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  ],
  [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
  ],
  [
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  ],
]

// Property Manager data
const propertyManagers = [
  {
    name: 'Diego Espinoza',
    email: 'diego@comcreate.org',
    phone: '(818) 642-4050'
  },
  {
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@luxuryproperties.com',
    phone: '(310) 555-1234'
  },
  {
    name: 'James Rodriguez',
    email: 'james.rodriguez@premiumrentals.com',
    phone: '(424) 555-5678'
  }
]

// Property data
const properties = [
  {
    address: '1200 Ocean Drive, Miami Beach, FL 33139',
    bedrooms: '5',
    bathrooms: '6',
    area: '4500',
    zillow_url: 'https://www.zillow.com/homedetails/1200-Ocean-Dr-Miami-Beach-FL-33139',
    custom_monthly_rent: 25000,
    custom_nightly_rate: 1500,
    custom_purchase_price: 5500000,
    description: 'Stunning oceanfront estate with panoramic views of the Atlantic. This luxurious property features a private pool, home theater, and direct beach access.',
  },
  {
    address: '8742 Sunset Boulevard, West Hollywood, CA 90069',
    bedrooms: '4',
    bathrooms: '5',
    area: '3800',
    zillow_url: 'https://www.zillow.com/homedetails/8742-Sunset-Blvd-West-Hollywood-CA-90069',
    custom_monthly_rent: 18000,
    custom_nightly_rate: 1200,
    custom_purchase_price: 4200000,
    description: 'Modern architectural masterpiece in the heart of West Hollywood. Features floor-to-ceiling windows, smart home technology, and a rooftop terrace with city views.',
  },
  {
    address: '456 Palm Avenue, Beverly Hills, CA 90210',
    bedrooms: '6',
    bathrooms: '8',
    area: '6200',
    zillow_url: 'https://www.zillow.com/homedetails/456-Palm-Ave-Beverly-Hills-CA-90210',
    custom_monthly_rent: 45000,
    custom_nightly_rate: 2500,
    custom_purchase_price: 12000000,
    description: 'Iconic Beverly Hills estate with manicured gardens, tennis court, and guest house. This property offers the ultimate in luxury living with unparalleled privacy.',
  },
  {
    address: '789 Collins Avenue, Miami Beach, FL 33140',
    bedrooms: '3',
    bathrooms: '3',
    area: '2200',
    zillow_url: 'https://www.zillow.com/homedetails/789-Collins-Ave-Miami-Beach-FL-33140',
    custom_monthly_rent: 12000,
    custom_nightly_rate: 800,
    custom_purchase_price: 2800000,
    description: 'Sleek Art Deco condominium with ocean views from every room. Recently renovated with high-end finishes and building amenities including pool and fitness center.',
  },
  {
    address: '2100 Mulholland Drive, Los Angeles, CA 90068',
    bedrooms: '5',
    bathrooms: '5',
    area: '4800',
    zillow_url: 'https://www.zillow.com/homedetails/2100-Mulholland-Dr-Los-Angeles-CA-90068',
    custom_monthly_rent: 22000,
    custom_nightly_rate: 1400,
    custom_purchase_price: 6500000,
    description: 'Dramatic hillside retreat with sweeping views of the city lights. Features infinity pool, wine cellar, and state-of-the-art entertainment system.',
  },
  {
    address: '333 Fisher Island Drive, Miami Beach, FL 33109',
    bedrooms: '4',
    bathrooms: '4',
    area: '3500',
    zillow_url: 'https://www.zillow.com/homedetails/333-Fisher-Island-Dr-Miami-Beach-FL-33109',
    custom_monthly_rent: 35000,
    custom_nightly_rate: 2000,
    custom_purchase_price: 8500000,
    description: 'Exclusive Fisher Island residence accessible only by ferry. Features private marina slip, golf course access, and world-class spa amenities.',
  }
]

// Client data
const clients = [
  { name: 'Alexander Thompson', email: 'alex.thompson@email.com', phone: '(212) 555-0101', status: 'active' },
  { name: 'Sophia Williams', email: 'sophia.w@email.com', phone: '(415) 555-0202', status: 'active' },
  { name: 'Michael Chen', email: 'michael.chen@email.com', phone: '(305) 555-0303', status: 'active' },
  { name: 'Emma Johnson', email: 'emma.j@email.com', phone: '(310) 555-0404', status: 'pending' },
  { name: 'William Davis', email: 'will.davis@email.com', phone: '(424) 555-0505', status: 'active' },
  { name: 'Olivia Martinez', email: 'olivia.m@email.com', phone: '(786) 555-0606', status: 'closed' },
]

// Invoice line items templates
const invoiceTemplates = [
  {
    client_name: 'Alexander Thompson',
    line_items: [
      { description: 'Monthly Property Management Fee - 1200 Ocean Drive', quantity: 1, unit_price: 2500 },
      { description: 'Pool Maintenance Service', quantity: 1, unit_price: 350 },
      { description: 'Landscaping Services', quantity: 1, unit_price: 450 },
    ],
    tax_rate: 7,
    notes: 'Payment due within 30 days. Thank you for your business.',
    status: 'sent'
  },
  {
    client_name: 'Sophia Williams',
    line_items: [
      { description: 'Monthly Rent - 8742 Sunset Boulevard', quantity: 1, unit_price: 18000 },
      { description: 'Cleaning Service (Move-in)', quantity: 1, unit_price: 500 },
    ],
    tax_rate: 0,
    notes: 'First month rent and cleaning fee.',
    status: 'paid'
  },
  {
    client_name: 'Michael Chen',
    line_items: [
      { description: 'Monthly Property Management Fee', quantity: 1, unit_price: 3500 },
      { description: 'Emergency Plumbing Repair', quantity: 1, unit_price: 850 },
      { description: 'HVAC Maintenance', quantity: 1, unit_price: 275 },
    ],
    tax_rate: 7,
    notes: 'Includes emergency repair charges from December.',
    status: 'overdue'
  }
]

// Quote templates for luxury services
const quoteTemplates = [
  {
    client_name: 'Alexander Thompson',
    service_items: [
      { service_name: 'Private Chef Experience', description: 'Exclusive 5-course dinner prepared by a Michelin-star chef in your home', price: 2500, images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'] },
      { service_name: 'Yacht Charter - Full Day', description: 'Luxury 60ft yacht with captain and crew for 8 hours', price: 5500, images: ['https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'] },
    ],
    notes: 'Services available for your Miami Beach stay. Book 48 hours in advance.',
    status: 'sent'
  },
  {
    client_name: 'Sophia Williams',
    service_items: [
      { service_name: 'Personal Concierge - Weekly', description: 'Dedicated concierge for errands, reservations, and personal assistance', price: 1500, images: [] },
      { service_name: 'Spa Day Package', description: 'Full day spa experience at exclusive Beverly Hills wellness center', price: 850, images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'] },
      { service_name: 'Private Wine Tasting', description: 'Sommelier-led tasting of rare wines in private setting', price: 1200, images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800'] },
    ],
    notes: 'Curated luxury experiences for your Los Angeles stay.',
    status: 'accepted'
  }
]

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function generateInvoiceNumber() {
  const date = new Date()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${random}`
}

function generateQuoteNumber() {
  const date = new Date()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `QT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${random}`
}

async function seedTestData() {
  try {
    console.log('🔌 Connecting to Supabase...')

    // Test connection
    const { data: testData, error: testError } = await supabase.from('property_managers').select('count').limit(1)
    if (testError && !testError.message.includes('count')) {
      throw new Error(`Connection failed: ${testError.message}`)
    }
    console.log('✅ Connected!\n')

    // 1. Seed Property Managers
    console.log('👥 Seeding Property Managers...')
    const managerIds = []
    for (const manager of propertyManagers) {
      const { data, error } = await supabase
        .from('property_managers')
        .upsert(manager, { onConflict: 'email' })
        .select()
        .single()

      if (error) {
        // Try to get existing manager
        const { data: existing } = await supabase
          .from('property_managers')
          .select()
          .eq('email', manager.email)
          .single()
        if (existing) {
          managerIds.push(existing.id)
          console.log(`   ⏭️  ${existing.name} (already exists)`)
        } else {
          console.log(`   ❌ Failed: ${manager.name} - ${error.message}`)
        }
      } else {
        managerIds.push(data.id)
        console.log(`   ✅ ${data.name}`)
      }
    }

    // 2. Seed Properties
    console.log('\n🏠 Seeding Properties...')
    const propertyIds = []
    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i]
      const images = propertyImages[i % propertyImages.length]

      // Check if property already exists
      const { data: existing } = await supabase
        .from('properties')
        .select()
        .eq('zillow_url', prop.zillow_url)
        .single()

      if (existing) {
        propertyIds.push(existing.id)
        console.log(`   ⏭️  ${prop.address.substring(0, 40)}... (exists)`)
        continue
      }

      const propertyData = {
        address: prop.address,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area,
        zillow_url: prop.zillow_url,
        images: images,
        description: prop.description,
        show_monthly_rent: true,
        custom_monthly_rent: prop.custom_monthly_rent,
        show_nightly_rate: true,
        custom_nightly_rate: prop.custom_nightly_rate,
        show_purchase_price: true,
        custom_purchase_price: prop.custom_purchase_price,
        show_bedrooms: true,
        show_bathrooms: true,
        show_area: true,
        show_address: true,
        show_images: true,
      }

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()

      if (error) {
        console.log(`   ❌ Failed: ${prop.address} - ${error.message}`)
      } else {
        propertyIds.push(data.id)
        console.log(`   ✅ ${prop.address.substring(0, 40)}...`)
      }
    }

    // 3. Assign Properties to Managers
    console.log('\n🔗 Assigning Properties to Managers...')
    let assignedCount = 0
    for (let i = 0; i < propertyIds.length; i++) {
      const managerId = managerIds[i % managerIds.length]
      const { error } = await supabase
        .from('property_manager_assignments')
        .upsert({ property_id: propertyIds[i], manager_id: managerId }, { onConflict: 'property_id,manager_id' })

      if (!error) assignedCount++
    }
    console.log(`   ✅ Assigned ${assignedCount} properties to managers`)

    // 4. Seed Clients
    console.log('\n👤 Seeding Clients...')
    const clientIds = []
    for (let i = 0; i < clients.length; i++) {
      const cl = clients[i]
      const managerId = managerIds[i % managerIds.length]
      const slug = generateSlug(cl.name)

      // Check if client already exists
      const { data: existing } = await supabase
        .from('clients')
        .select()
        .eq('email', cl.email)
        .single()

      if (existing) {
        clientIds.push({ id: existing.id, name: existing.name })
        console.log(`   ⏭️  ${cl.name} (exists)`)
        continue
      }

      const clientData = {
        manager_id: managerId,
        name: cl.name,
        email: cl.email,
        phone: cl.phone,
        status: cl.status,
        slug: slug,
      }

      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) {
        console.log(`   ❌ Failed: ${cl.name} - ${error.message}`)
      } else {
        clientIds.push({ id: data.id, name: data.name })
        console.log(`   ✅ ${cl.name} (${cl.status})`)
      }
    }

    // 5. Assign Properties to Clients
    console.log('\n🏘️ Assigning Properties to Clients...')
    let clientAssignedCount = 0
    for (let i = 0; i < clientIds.length; i++) {
      const numProperties = 2 + Math.floor(Math.random() * 2)
      for (let j = 0; j < numProperties && j < propertyIds.length; j++) {
        const propIndex = (i + j) % propertyIds.length
        const { error } = await supabase
          .from('client_property_assignments')
          .upsert({
            client_id: clientIds[i].id,
            property_id: propertyIds[propIndex],
            show_monthly_rent_to_client: true,
            show_nightly_rate_to_client: true,
            show_purchase_price_to_client: true,
            position: j
          }, { onConflict: 'client_id,property_id' })

        if (!error) clientAssignedCount++
      }
    }
    console.log(`   ✅ Created ${clientAssignedCount} client-property assignments`)

    // 6. Seed Invoices
    console.log('\n💰 Seeding Invoices...')
    for (let i = 0; i < invoiceTemplates.length; i++) {
      const template = invoiceTemplates[i]
      const managerId = managerIds[i % managerIds.length]

      const subtotal = template.line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      const taxAmount = subtotal * (template.tax_rate / 100)
      const total = subtotal + taxAmount

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const invoiceNumber = generateInvoiceNumber()
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          manager_id: managerId,
          client_name: template.client_name,
          client_email: clients.find(c => c.name === template.client_name)?.email,
          status: template.status,
          subtotal: subtotal,
          tax_rate: template.tax_rate,
          tax_amount: taxAmount,
          total: total,
          due_date: dueDate.toISOString(),
          notes: template.notes,
          paid_at: template.status === 'paid' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (invoiceError) {
        console.log(`   ❌ Invoice failed: ${invoiceError.message}`)
        continue
      }

      // Add line items
      for (const item of template.line_items) {
        await supabase.from('invoice_line_items').insert({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.quantity * item.unit_price
        })
      }
      console.log(`   ✅ ${invoiceNumber} - ${template.client_name} ($${total.toFixed(2)})`)
    }

    // 7. Seed Quotes
    console.log('\n📋 Seeding Quotes...')
    for (let i = 0; i < quoteTemplates.length; i++) {
      const template = quoteTemplates[i]
      const managerId = managerIds[i % managerIds.length]

      const subtotal = template.service_items.reduce((sum, item) => sum + item.price, 0)
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 14)

      const quoteNumber = generateQuoteNumber()
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          quote_number: quoteNumber,
          manager_id: managerId,
          client_name: template.client_name,
          client_email: clients.find(c => c.name === template.client_name)?.email,
          status: template.status,
          subtotal: subtotal,
          total: subtotal,
          expiration_date: expirationDate.toISOString(),
          notes: template.notes,
          responded_at: template.status === 'accepted' ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (quoteError) {
        console.log(`   ❌ Quote failed: ${quoteError.message}`)
        continue
      }

      // Add service items
      for (const item of template.service_items) {
        await supabase.from('quote_service_items').insert({
          quote_id: quote.id,
          service_name: item.service_name,
          description: item.description,
          price: item.price,
          images: item.images
        })
      }
      console.log(`   ✅ ${quoteNumber} - ${template.client_name} ($${subtotal.toFixed(2)})`)
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 SEEDING COMPLETE!')
    console.log('='.repeat(50))
    console.log(`   👥 Property Managers: ${managerIds.length}`)
    console.log(`   🏠 Properties: ${propertyIds.length}`)
    console.log(`   👤 Clients: ${clientIds.length}`)
    console.log(`   💰 Invoices: ${invoiceTemplates.length}`)
    console.log(`   📋 Quotes: ${quoteTemplates.length}`)
    console.log('\n✨ You can now:')
    console.log('   1. Start your app: npm run dev')
    console.log('   2. View managers: http://localhost:3000/admin/managers')
    console.log('   3. View clients: http://localhost:3000/admin/clients')
    console.log('   4. View invoices: http://localhost:3000/admin/invoices')
    console.log('   5. View quotes: http://localhost:3000/admin/quotes\n')

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

console.log('🌱 Test Data Seeder')
console.log('='.repeat(50) + '\n')

seedTestData().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
