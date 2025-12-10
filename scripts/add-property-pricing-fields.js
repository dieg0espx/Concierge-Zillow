const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPricingFields() {
  try {
    console.log('Checking if pricing fields exist in properties table...');

    // Try to query with the new columns
    const { data, error } = await supabase
      .from('properties')
      .select('id, show_monthly_rent, show_nightly_rate, show_purchase_price')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('Pricing fields do not exist. Please run this SQL in your Supabase SQL Editor:\n');
      console.log(`
-- Add flexible pricing fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS show_monthly_rent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_monthly_rent NUMERIC,
ADD COLUMN IF NOT EXISTS show_nightly_rate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_nightly_rate NUMERIC,
ADD COLUMN IF NOT EXISTS show_purchase_price BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_purchase_price NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN properties.show_monthly_rent IS 'Whether to display monthly rent on property pages';
COMMENT ON COLUMN properties.custom_monthly_rent IS 'Custom monthly rent amount (overrides default monthly_rent)';
COMMENT ON COLUMN properties.show_nightly_rate IS 'Whether to display nightly rate on property pages';
COMMENT ON COLUMN properties.custom_nightly_rate IS 'Nightly rate amount';
COMMENT ON COLUMN properties.show_purchase_price IS 'Whether to display purchase price on property pages';
COMMENT ON COLUMN properties.custom_purchase_price IS 'Purchase price amount';
`);
    } else if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('✓ Pricing fields already exist in properties table!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkPricingFields();
