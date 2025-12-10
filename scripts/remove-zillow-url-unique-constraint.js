// Migration script to remove the unique constraint on zillow_url
// This allows multiple managers to add the same property with different pricing
// Run with: node scripts/remove-zillow-url-unique-constraint.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esdkkyekfnpmwifyohac.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function removeUniqueConstraint() {
  console.log('Removing unique constraint on zillow_url column...')
  console.log('\nThis will allow multiple managers to add the same property with different pricing.')
  console.log('\n⚠️  IMPORTANT: You need to run this SQL in your Supabase SQL Editor:\n')
  console.log('--------------------------------------------------')

  const sqlToRun = `
-- Remove the unique constraint on zillow_url
-- This allows different managers to add the same property with different pricing
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_zillow_url_key;

-- Verify the constraint was removed
SELECT conname
FROM pg_constraint
WHERE conrelid = 'properties'::regclass
  AND conname LIKE '%zillow_url%';
  `

  console.log(sqlToRun)
  console.log('--------------------------------------------------')
  console.log('\nAfter running this SQL:')
  console.log('✓ Multiple managers can add the same property')
  console.log('✓ Each manager can set their own pricing')
  console.log('✓ The main properties page will deduplicate and show each property only once')
}

removeUniqueConstraint()
