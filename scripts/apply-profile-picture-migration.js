const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('Checking if profile_picture_url column exists...');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112000001_add_profile_picture_to_managers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.log('Trying alternative method...');
      // Try using the REST API to check column existence
      const { data: managers, error: fetchError } = await supabase
        .from('property_managers')
        .select('id, profile_picture_url')
        .limit(1);

      if (fetchError) {
        if (fetchError.message.includes('column') && fetchError.message.includes('profile_picture_url')) {
          console.error('Column does not exist. Migration needs to be applied manually.');
          console.error('Please run this SQL in your Supabase SQL Editor:');
          console.error('\n' + migrationSQL);
        } else {
          console.error('Error:', fetchError);
        }
      } else {
        console.log('✓ Column exists! Migration already applied.');
      }
    } else {
      console.log('✓ Migration applied successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

applyMigration();
