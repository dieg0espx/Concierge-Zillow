const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createClientSharesTable() {
  console.log('Creating client_shares table...')

  // Create the client_shares table
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create client_shares table
      CREATE TABLE IF NOT EXISTS client_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        shared_with_manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
        shared_by_manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Ensure a client can only be shared once with each manager
        UNIQUE(client_id, shared_with_manager_id)
      );

      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_client_shares_client_id ON client_shares(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_shares_shared_with ON client_shares(shared_with_manager_id);

      -- Add RLS policies
      ALTER TABLE client_shares ENABLE ROW LEVEL SECURITY;

      -- Policy: Users can view shares where they are involved (owner or shared with)
      CREATE POLICY "Users can view their client shares"
        ON client_shares
        FOR SELECT
        USING (
          shared_with_manager_id IN (
            SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
          )
          OR
          shared_by_manager_id IN (
            SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
          )
        );

      -- Policy: Only client owners can share
      CREATE POLICY "Client owners can create shares"
        ON client_shares
        FOR INSERT
        WITH CHECK (
          shared_by_manager_id IN (
            SELECT manager_id FROM clients WHERE id = client_id
          )
        );

      -- Policy: Only client owners can remove shares
      CREATE POLICY "Client owners can delete shares"
        ON client_shares
        FOR DELETE
        USING (
          shared_by_manager_id IN (
            SELECT manager_id FROM clients WHERE id = client_id
          )
        );
    `
  })

  if (tableError) {
    // If exec_sql doesn't exist, try direct SQL execution
    console.log('Trying alternative method...')

    const { error } = await supabase.from('client_shares').select('id').limit(1)

    if (error && error.code === '42P01') {
      console.error('Please run this SQL in your Supabase SQL Editor:')
      console.log(`
-- Create client_shares table
CREATE TABLE IF NOT EXISTS client_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shared_with_manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
  shared_by_manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(client_id, shared_with_manager_id)
);

CREATE INDEX IF NOT EXISTS idx_client_shares_client_id ON client_shares(client_id);
CREATE INDEX IF NOT EXISTS idx_client_shares_shared_with ON client_shares(shared_with_manager_id);

ALTER TABLE client_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their client shares"
  ON client_shares
  FOR SELECT
  USING (
    shared_with_manager_id IN (
      SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
    )
    OR
    shared_by_manager_id IN (
      SELECT id FROM property_managers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Client owners can create shares"
  ON client_shares
  FOR INSERT
  WITH CHECK (
    shared_by_manager_id IN (
      SELECT manager_id FROM clients WHERE id = client_id
    )
  );

CREATE POLICY "Client owners can delete shares"
  ON client_shares
  FOR DELETE
  USING (
    shared_by_manager_id IN (
      SELECT manager_id FROM clients WHERE id = client_id
    )
  );
      `)
      process.exit(1)
    }

    console.log('Table might already exist or was created successfully')
  } else {
    console.log('✅ client_shares table created successfully!')
  }
}

createClientSharesTable()
  .then(() => {
    console.log('Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
