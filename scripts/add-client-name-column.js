const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addClientNameColumn() {
  try {
    console.log('Checking if client_name column exists...');

    // Try to query with the new column
    const { data: managers, error: fetchError } = await supabase
      .from('property_managers')
      .select('id, client_name')
      .limit(1);

    if (fetchError) {
      if (fetchError.message.includes('column') && fetchError.message.includes('client_name')) {
        console.log('Column does not exist. Please run this SQL in your Supabase SQL Editor:');
        console.log('\n-- Add client_name column to property_managers table');
        console.log('ALTER TABLE property_managers ADD COLUMN IF NOT EXISTS client_name TEXT;');
        console.log('\n-- Optional: Add a comment to describe the column');
        console.log("COMMENT ON COLUMN property_managers.client_name IS 'Name of the client for personalized portfolio pages';");
      } else {
        console.error('Error:', fetchError);
      }
    } else {
      console.log('✓ Column exists! Migration already applied.');
      console.log('Current data:', managers);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

addClientNameColumn();
