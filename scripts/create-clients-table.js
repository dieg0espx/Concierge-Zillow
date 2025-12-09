const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClientsTable() {
  try {
    console.log('Checking if clients table exists...');

    // Try to query the clients table
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Clients table does not exist. Please run this SQL in your Supabase SQL Editor:\n');
      console.log(`
-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by manager
CREATE INDEX IF NOT EXISTS idx_clients_manager_id ON clients(manager_id);

-- Create client_property_assignments junction table
CREATE TABLE IF NOT EXISTS client_property_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, property_id)
);

-- Create indexes for the junction table
CREATE INDEX IF NOT EXISTS idx_client_property_client ON client_property_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_property_property ON client_property_assignments(property_id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_property_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients (allow all authenticated users for now)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for client_property_assignments
CREATE POLICY "Allow all operations on client_property_assignments" ON client_property_assignments FOR ALL USING (true) WITH CHECK (true);
`);
    } else {
      console.log('✓ Clients table exists!');

      // Check client_property_assignments table
      const { error: junctionError } = await supabase
        .from('client_property_assignments')
        .select('id')
        .limit(1);

      if (junctionError) {
        console.log('\nClient property assignments table does not exist. Run the SQL above to create it.');
      } else {
        console.log('✓ Client property assignments table exists!');
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkClientsTable();
