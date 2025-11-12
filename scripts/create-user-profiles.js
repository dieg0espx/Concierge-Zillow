const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function createUserProfiles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250112000003_create_user_profiles.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Creating user_profiles table...');

  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
    // If rpc doesn't exist, try direct execution
    console.log('Trying direct SQL execution...');
    return await supabase.from('_migrations').select('*').limit(1).then(async () => {
      // Split into individual statements and execute
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.trim().substring(0, 50) + '...');
          const result = await supabase.rpc('exec', { sql: statement.trim() + ';' }).catch(async (e) => {
            // Direct query execution
            const { error: execError } = await supabase.auth.admin.listUsers().then(() => {
              throw new Error('Need to use SQL editor or psql');
            }).catch(() => {
              throw e;
            });
          });
        }
      }
      return { data: true, error: null };
    });
  });

  if (error) {
    console.error('Error creating user_profiles table:', error);
    throw error;
  }

  console.log('✓ user_profiles table created successfully');
}

createUserProfiles().catch(console.error);
