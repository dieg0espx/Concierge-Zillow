// Migration script to add per-client pricing visibility columns to client_property_assignments table
// Run with: node scripts/add-client-pricing-columns.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addClientPricingColumns() {
  console.log('Adding per-client pricing visibility columns to client_property_assignments table...')

  // Note: These columns control which pricing options from the property are visible to this specific client
  // show_monthly_rent_to_client - if true, show the property's monthly rent to this client
  // show_nightly_rate_to_client - if true, show the property's nightly rate to this client
  // show_purchase_price_to_client - if true, show the property's purchase price to this client

  const alterTableSQL = `
    ALTER TABLE client_property_assignments
    ADD COLUMN IF NOT EXISTS show_monthly_rent_to_client BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_nightly_rate_to_client BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_purchase_price_to_client BOOLEAN DEFAULT true;
  `

  // We can't run raw SQL directly with the JS client, so we'll use the REST API
  // For now, let's check if the columns exist by trying to query them

  const { data, error } = await supabase
    .from('client_property_assignments')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking table:', error.message)
    console.log('\nPlease run this SQL in your Supabase SQL Editor:')
    console.log(alterTableSQL)
    return
  }

  // Check if columns already exist
  if (data && data[0] && 'show_monthly_rent_to_client' in data[0]) {
    console.log('Columns already exist!')
    return
  }

  console.log('\nThe columns need to be added. Please run this SQL in your Supabase SQL Editor:\n')
  console.log('--------------------------------------------------')
  console.log(alterTableSQL)
  console.log('--------------------------------------------------')
  console.log('\nAfter running the SQL, the client_property_assignments table will have:')
  console.log('- show_monthly_rent_to_client (boolean, default true)')
  console.log('- show_nightly_rate_to_client (boolean, default true)')
  console.log('- show_purchase_price_to_client (boolean, default true)')
  console.log('\nThese columns control which pricing options are visible to each specific client.')
}

addClientPricingColumns()
