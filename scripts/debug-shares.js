const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugShares() {
  console.log('\n=== Checking client_shares table ===\n')

  // Get all shares
  const { data: shares, error: sharesError } = await supabase
    .from('client_shares')
    .select('*')

  if (sharesError) {
    console.error('Error fetching shares:', sharesError)
  } else {
    console.log('Total shares:', shares?.length || 0)
    console.log('Shares:', JSON.stringify(shares, null, 2))
  }

  console.log('\n=== Checking property_managers table ===\n')

  // Get all managers
  const { data: managers, error: managersError } = await supabase
    .from('property_managers')
    .select('id, name, email, auth_user_id')

  if (managersError) {
    console.error('Error fetching managers:', managersError)
  } else {
    console.log('Total managers:', managers?.length || 0)
    console.log('Managers:', JSON.stringify(managers, null, 2))
  }

  console.log('\n=== Checking clients table ===\n')

  // Get all clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, manager_id')

  if (clientsError) {
    console.error('Error fetching clients:', clientsError)
  } else {
    console.log('Total clients:', clients?.length || 0)
    console.log('Clients:', JSON.stringify(clients, null, 2))
  }
}

debugShares()
  .then(() => {
    console.log('\nDebug completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Debug failed:', error)
    process.exit(1)
  })
