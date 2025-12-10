const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSlugAndLastAccessed() {
  try {
    console.log('Adding slug and last_accessed columns to clients table...')

    // Add slug column (unique, nullable initially)
    const { error: slugError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add slug column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'clients' AND column_name = 'slug'
          ) THEN
            ALTER TABLE clients ADD COLUMN slug TEXT UNIQUE;
            CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
            COMMENT ON COLUMN clients.slug IS 'URL-friendly slug for client (e.g., smith-family)';
          END IF;
        END $$;
      `
    })

    if (slugError) {
      console.error('Error adding slug column:', slugError)
    } else {
      console.log('✓ Slug column added successfully')
    }

    // Add last_accessed column
    const { error: lastAccessedError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add last_accessed column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'clients' AND column_name = 'last_accessed'
          ) THEN
            ALTER TABLE clients ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE;
            CREATE INDEX IF NOT EXISTS idx_clients_last_accessed ON clients(last_accessed);
            COMMENT ON COLUMN clients.last_accessed IS 'Timestamp when client last viewed their portfolio page';
          END IF;
        END $$;
      `
    })

    if (lastAccessedError) {
      console.error('Error adding last_accessed column:', lastAccessedError)
    } else {
      console.log('✓ Last accessed column added successfully')
    }

    // Generate slugs for existing clients without slugs
    console.log('\nGenerating slugs for existing clients...')
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, slug')
      .is('slug', null)

    if (fetchError) {
      console.error('Error fetching clients:', fetchError)
    } else if (clients && clients.length > 0) {
      console.log(`Found ${clients.length} clients without slugs`)

      for (const client of clients) {
        // Generate slug from name
        let slug = client.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        // Ensure uniqueness by appending random suffix if needed
        let finalSlug = slug
        let attempt = 0
        let isUnique = false

        while (!isUnique && attempt < 10) {
          const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('slug', finalSlug)
            .single()

          if (!existing) {
            isUnique = true
          } else {
            attempt++
            finalSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
          }
        }

        // Update client with slug
        const { error: updateError } = await supabase
          .from('clients')
          .update({ slug: finalSlug })
          .eq('id', client.id)

        if (updateError) {
          console.error(`Error updating client ${client.name}:`, updateError)
        } else {
          console.log(`  ✓ Generated slug for "${client.name}": ${finalSlug}`)
        }
      }

      console.log('\n✓ All slugs generated successfully')
    } else {
      console.log('No clients need slug generation')
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update client creation to generate slugs')
    console.log('2. Add slug field to client forms')
    console.log('3. Update routes to support /client/[slug] format')
    console.log('4. Add middleware to track last_accessed')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Direct SQL approach if rpc doesn't work
async function addSlugAndLastAccessedSQL() {
  console.log('Using direct SQL approach...')
  console.log('\nPlease run this SQL in your Supabase SQL Editor:\n')
  console.log(`
-- Add slug column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
COMMENT ON COLUMN clients.slug IS 'URL-friendly slug for client (e.g., smith-family)';

-- Add last_accessed column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_clients_last_accessed ON clients(last_accessed);
COMMENT ON COLUMN clients.last_accessed IS 'Timestamp when client last viewed their portfolio page';

-- Generate slugs for existing clients (run this after the columns are added)
DO $$
DECLARE
  client_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  attempt INT;
BEGIN
  FOR client_record IN
    SELECT id, name FROM clients WHERE slug IS NULL
  LOOP
    -- Generate base slug from name
    base_slug := regexp_replace(
      regexp_replace(lower(client_record.name), '[^a-z0-9]+', '-', 'g'),
      '^-+|-+$', '', 'g'
    );

    final_slug := base_slug;
    attempt := 0;

    -- Ensure uniqueness
    LOOP
      SELECT EXISTS(SELECT 1 FROM clients WHERE slug = final_slug) INTO slug_exists;

      IF NOT slug_exists THEN
        EXIT;
      END IF;

      attempt := attempt + 1;
      final_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);

      IF attempt > 10 THEN
        EXIT;
      END IF;
    END LOOP;

    -- Update client with generated slug
    UPDATE clients SET slug = final_slug WHERE id = client_record.id;
    RAISE NOTICE 'Generated slug for %: %', client_record.name, final_slug;
  END LOOP;
END $$;
  `)
  console.log('\nAfter running the SQL, the columns will be added and slugs generated.')
}

// Run the appropriate migration
addSlugAndLastAccessedSQL()
