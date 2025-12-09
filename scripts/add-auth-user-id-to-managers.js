// Migration script to add auth_user_id column to property_managers table
// This links each property manager to their Supabase auth account
// Run with: node scripts/add-auth-user-id-to-managers.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addAuthUserIdColumn() {
  console.log('Adding auth_user_id column to property_managers table...')

  const alterTableSQL = `
    -- Add auth_user_id column to link property managers to auth users
    ALTER TABLE property_managers
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_property_managers_auth_user_id
    ON property_managers(auth_user_id);

    -- Make sure each auth user can only be linked to one manager
    CREATE UNIQUE INDEX IF NOT EXISTS idx_property_managers_auth_user_id_unique
    ON property_managers(auth_user_id) WHERE auth_user_id IS NOT NULL;
  `

  // Check if column already exists
  const { data, error } = await supabase
    .from('property_managers')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error checking table:', error.message)
    console.log('\nPlease run this SQL in your Supabase SQL Editor:')
    console.log(alterTableSQL)
    return
  }

  if (data && data[0] && 'auth_user_id' in data[0]) {
    console.log('auth_user_id column already exists!')
    return
  }

  console.log('\nThe auth_user_id column needs to be added.')
  console.log('Please run this SQL in your Supabase SQL Editor:\n')
  console.log('--------------------------------------------------')
  console.log(alterTableSQL)
  console.log('--------------------------------------------------')
  console.log('\nAfter running the SQL, you need to link each property manager to their auth account.')
  console.log('You can do this by updating the property_managers table with the correct auth_user_id.')
  console.log('\nExample:')
  console.log(`
UPDATE property_managers
SET auth_user_id = (SELECT id FROM auth.users WHERE email = property_managers.email)
WHERE email IN (SELECT email FROM auth.users);
  `)
}

addAuthUserIdColumn()
