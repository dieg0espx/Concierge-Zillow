const { Client } = require('pg');
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

async function fixTable() {
  const client = new Client({
    host: envVars.POSTGRES_HOST,
    port: 5432,
    user: envVars.POSTGRES_USER,
    password: envVars.POSTGRES_PASSWORD,
    database: envVars.POSTGRES_DATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected!');

    console.log('Dropping old table structure...');
    await client.query('DROP TABLE IF EXISTS public.user_profiles CASCADE');
    console.log('✓ Dropped old table');

    console.log('Creating new table with correct structure...');
    const createSQL = `
      CREATE TABLE public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );

      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Allow authenticated users to read all profiles"
        ON public.user_profiles FOR SELECT TO authenticated USING (true);

      CREATE POLICY "Allow authenticated users to insert profiles"
        ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (true);

      CREATE POLICY "Allow users to update own profile"
        ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

      CREATE POLICY "Allow authenticated users to delete profiles"
        ON public.user_profiles FOR DELETE TO authenticated USING (true);

      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    `;

    await client.query(createSQL);
    console.log('✓ Table created successfully!');

    // Verify
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    console.log('\n✓ New table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✓ Done! Please refresh your admin/users page.');
  }
}

fixTable();
