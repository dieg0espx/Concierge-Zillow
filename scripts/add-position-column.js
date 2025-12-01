require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addPositionColumn() {
  console.log('Adding position column to properties table...')

  // Note: Since we're using anon key, we might not have permission to alter table
  // The user may need to add this column manually via Supabase dashboard
  // SQL: ALTER TABLE properties ADD COLUMN IF NOT EXISTS position INTEGER;

  // For now, let's just update existing properties with position values
  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return
  }

  console.log(`Found ${properties.length} properties`)

  // Try to update each property with a position
  for (let i = 0; i < properties.length; i++) {
    const { error: updateError } = await supabase
      .from('properties')
      .update({ position: i })
      .eq('id', properties[i].id)

    if (updateError) {
      if (updateError.message.includes('column') || updateError.code === '42703') {
        console.log('\n⚠️  The "position" column does not exist yet.')
        console.log('Please add it manually via Supabase Dashboard:')
        console.log('1. Go to your Supabase project')
        console.log('2. Navigate to Table Editor > properties')
        console.log('3. Click "Edit Table"')
        console.log('4. Add a new column: name="position", type="int4" (integer)')
        console.log('5. Run this script again to set initial positions')
        return
      }
      console.error(`Error updating property ${properties[i].id}:`, updateError)
    } else {
      console.log(`Set position ${i} for property ${properties[i].id}`)
    }
  }

  console.log('\n✅ Done! All properties have been assigned positions.')
}

addPositionColumn()
