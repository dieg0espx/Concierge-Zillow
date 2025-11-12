const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load environment variables
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseServiceKey ? '***' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserProfilesTable() {
  try {
    console.log('Checking if user_profiles table exists...');

    // First, check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✓ Table already exists!');
      return;
    }

    console.log('Table does not exist, reading SQL migration file...');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20250112000003_create_user_profiles.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Please run this SQL in your Supabase dashboard SQL editor:   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('Dashboard URL:');
    console.log('https://supabase.com/dashboard/project/esdkkyekfnpmwifyohac/sql/new');
    console.log('\n--- Copy and paste this SQL ---\n');
    console.log(sql);
    console.log('\n--- End of SQL ---\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUserProfilesTable();
