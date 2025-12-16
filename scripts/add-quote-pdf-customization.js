const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Try to read from .env file
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(__dirname, '..', '.env')

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')

    for (const line of lines) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=').trim()
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        process.env.NEXT_PUBLIC_SUPABASE_URL = value
      }
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = value
      }
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addPdfCustomizationColumn() {
  console.log('Adding pdf_customization column to quotes table...')

  // Check if column already exists by trying to select it
  const { data: testData, error: testError } = await supabase
    .from('quotes')
    .select('pdf_customization')
    .limit(1)

  if (!testError) {
    console.log('Column pdf_customization already exists!')
    return
  }

  // Column doesn't exist, we need to add it via SQL
  // Since Supabase JS client doesn't support DDL, we'll use the REST API
  // or the user can run this SQL directly in Supabase dashboard:

  console.log('\n==============================================')
  console.log('Please run the following SQL in your Supabase dashboard:')
  console.log('==============================================\n')
  console.log(`
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS pdf_customization JSONB DEFAULT NULL;

-- Add a comment to document the column structure
COMMENT ON COLUMN quotes.pdf_customization IS 'JSON structure for PDF customization: {header_title, header_subtitle, service_overrides: {[id]: {display_name, display_description, display_images, details}}, custom_notes, custom_terms, accent_color}';
  `)
  console.log('\n==============================================')
  console.log('Go to: https://supabase.com/dashboard/project/esdkkyekfnpmwifyohac/sql/new')
  console.log('==============================================\n')
}

addPdfCustomizationColumn()
  .then(() => {
    console.log('Script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
