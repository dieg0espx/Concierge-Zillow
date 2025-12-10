const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

console.log('\n=== Adding Property Customization Fields ===\n')
console.log('Please run this SQL in your Supabase SQL Editor:\n')

console.log(`
-- Add field visibility toggles to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS show_bedrooms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_bathrooms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_area BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_address BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_images BOOLEAN DEFAULT true;

-- Add custom label fields
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS label_bedrooms TEXT DEFAULT 'Bedrooms',
ADD COLUMN IF NOT EXISTS label_bathrooms TEXT DEFAULT 'Bathrooms',
ADD COLUMN IF NOT EXISTS label_area TEXT DEFAULT 'Square Feet',
ADD COLUMN IF NOT EXISTS label_monthly_rent TEXT DEFAULT 'Monthly Rent',
ADD COLUMN IF NOT EXISTS label_nightly_rate TEXT DEFAULT 'Nightly Rate',
ADD COLUMN IF NOT EXISTS label_purchase_price TEXT DEFAULT 'Purchase Price';

-- Add custom notes field (separate from description)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS custom_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN properties.show_bedrooms IS 'Toggle visibility of bedrooms field on client view';
COMMENT ON COLUMN properties.show_bathrooms IS 'Toggle visibility of bathrooms field on client view';
COMMENT ON COLUMN properties.show_area IS 'Toggle visibility of square footage on client view';
COMMENT ON COLUMN properties.show_address IS 'Toggle visibility of full address on client view';
COMMENT ON COLUMN properties.show_images IS 'Toggle visibility of property images on client view';
COMMENT ON COLUMN properties.label_bedrooms IS 'Custom label for bedrooms field (e.g., "Rooms", "Bed")';
COMMENT ON COLUMN properties.label_bathrooms IS 'Custom label for bathrooms field (e.g., "Baths", "Full Baths")';
COMMENT ON COLUMN properties.label_area IS 'Custom label for area field (e.g., "Living Space", "Interior")';
COMMENT ON COLUMN properties.label_monthly_rent IS 'Custom label for monthly rent (e.g., "Starting at", "Monthly")';
COMMENT ON COLUMN properties.label_nightly_rate IS 'Custom label for nightly rate (e.g., "Per Night", "Nightly")';
COMMENT ON COLUMN properties.label_purchase_price IS 'Custom label for purchase price (e.g., "List Price", "Asking Price")';
COMMENT ON COLUMN properties.custom_notes IS 'Admin notes visible to clients (separate from Zillow description)';

-- Update existing properties to have all visibility enabled by default
UPDATE properties
SET
  show_bedrooms = true,
  show_bathrooms = true,
  show_area = true,
  show_address = true,
  show_images = true,
  label_bedrooms = 'Bedrooms',
  label_bathrooms = 'Bathrooms',
  label_area = 'Square Feet',
  label_monthly_rent = 'Monthly Rent',
  label_nightly_rate = 'Nightly Rate',
  label_purchase_price = 'Purchase Price'
WHERE
  show_bedrooms IS NULL
  OR show_bathrooms IS NULL
  OR show_area IS NULL
  OR show_address IS NULL
  OR show_images IS NULL;
`)

console.log('\n✅ After running this SQL, properties will have:')
console.log('   • Visibility toggles for all major fields')
console.log('   • Custom label fields for renaming')
console.log('   • Custom notes field for admin annotations')
console.log('   • All existing properties default to visible\n')
