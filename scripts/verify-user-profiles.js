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

async function verifyTable() {
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

    // Check table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);

    console.log('\nTable structure:');
    console.log('================');
    result.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
    });

    // Try to select from the table
    console.log('\nTesting query...');
    const testQuery = await client.query('SELECT * FROM public.user_profiles LIMIT 1');
    console.log('✓ Query successful!');
    console.log(`Rows: ${testQuery.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nAttempting to recreate table with correct structure...');

    try {
      // Drop and recreate
      await client.query('DROP TABLE IF EXISTS public.user_profiles CASCADE');
      console.log('Dropped existing table');

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
      `;

      await client.query(createSQL);
      console.log('✓ Table recreated successfully!');

    } catch (recreateError) {
      console.error('Failed to recreate:', recreateError.message);
    }
  } finally {
    await client.end();
    console.log('\n✓ Database connection closed');
  }
}

verifyTable();
