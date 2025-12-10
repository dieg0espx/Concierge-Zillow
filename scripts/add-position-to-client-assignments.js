const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

console.log('\n=== Adding position field to client_property_assignments table ===\n')
console.log('Please run this SQL in your Supabase SQL Editor:\n')

console.log(`
-- Add position column to client_property_assignments
ALTER TABLE client_property_assignments
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_property_assignments_position
ON client_property_assignments(client_id, position);

-- Add comment
COMMENT ON COLUMN client_property_assignments.position IS 'Display order of property for this client';

-- Initialize position values for existing assignments (ordered by created_at)
DO $$
DECLARE
  client_rec RECORD;
  assignment_rec RECORD;
  pos INTEGER;
BEGIN
  -- For each client
  FOR client_rec IN
    SELECT DISTINCT client_id FROM client_property_assignments
  LOOP
    pos := 0;

    -- For each assignment for this client (ordered by created_at)
    FOR assignment_rec IN
      SELECT id
      FROM client_property_assignments
      WHERE client_id = client_rec.client_id
        AND position IS NULL
      ORDER BY created_at ASC
    LOOP
      -- Set position
      UPDATE client_property_assignments
      SET position = pos
      WHERE id = assignment_rec.id;

      pos := pos + 1;
    END LOOP;

    RAISE NOTICE 'Initialized % assignments for client %', pos, client_rec.client_id;
  END LOOP;
END $$;
`)

console.log('\n✅ After running this SQL, the position field will be added and initialized.')
console.log('✅ Existing assignments will be ordered by creation date.\n')
