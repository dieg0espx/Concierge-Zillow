require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
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

  console.log('Creating user_profiles table...');

  // Execute SQL statements one by one
  const statements = [
    `CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    )`,
    `ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles`,
    `CREATE POLICY "Users can view their own profile"
      ON public.user_profiles
      FOR SELECT
      USING (auth.uid() = user_id OR auth.role() = 'authenticated')`,
    `DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles`,
    `CREATE POLICY "Users can update their own profile"
      ON public.user_profiles
      FOR UPDATE
      USING (auth.uid() = user_id)`,
    `DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles`,
    `CREATE POLICY "Users can insert their own profile"
      ON public.user_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email)`,
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`,
    `DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles`,
    `CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`
  ];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);

    const { error } = await supabase.rpc('exec', { sql: statement });

    if (error) {
      console.error(`Error on statement ${i + 1}:`, error.message);
      // Try to continue with other statements
    } else {
      console.log(`✓ Statement ${i + 1} executed successfully`);
    }
  }

  // Verify the table was created
  console.log('\nVerifying user_profiles table...');
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error verifying table:', error);
  } else {
    console.log('✓ user_profiles table is accessible');
  }
}

applyMigration().catch(console.error);
