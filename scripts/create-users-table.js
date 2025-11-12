const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    value = value.replace(/^["']|["']$/g, '')
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

async function createTable() {
  console.log('Creating user_profiles table...')
  console.log('\nPlease run the following SQL in your Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/esdkkyekfnpmwifyohac/sql/new')
  console.log('\n' + '='.repeat(80))

  const sql = `
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to delete profiles" ON public.user_profiles;

-- Create policies for user_profiles
CREATE POLICY "Allow authenticated users to read all profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert profiles"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to delete profiles"
    ON public.user_profiles
    FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
`

  console.log(sql)
  console.log('='.repeat(80))
  console.log('\nAfter running the SQL, your user management system will be ready!')
  console.log('\nAlternatively, you can also go to:')
  console.log('Supabase Dashboard > Table Editor > New Table')
  console.log('And create the table manually with these columns:')
  console.log('- id (uuid, primary key, foreign key to auth.users)')
  console.log('- email (text, unique)')
  console.log('- first_name (text)')
  console.log('- last_name (text)')
  console.log('- created_at (timestamptz, default: now())')
  console.log('- updated_at (timestamptz, default: now())')
}

createTable()
