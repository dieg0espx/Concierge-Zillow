const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esdkkyekfnpmwifyohac.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjU1MTE1OSwiZXhwIjoyMDc4MTI3MTU5fQ.kQuu3lRhkavLZXldOgSLd77xz0-Oa2Dqn0ODQG4TNzM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('Updating RLS policies to allow anon access...');

    // First, let's try to insert a test property to see what the actual error is
    const testProperty = {
      address: 'Test Address',
      monthly_rent: '1000',
      bedrooms: '2',
      bathrooms: '1',
      area: '1000',
      zillow_url: 'https://test-' + Date.now() + '.com',
      images: [],
      description: 'Test property'
    };

    console.log('Testing insert with service key...');
    const { data: serviceData, error: serviceError } = await supabase
      .from('properties')
      .insert([testProperty])
      .select()
      .single();

    if (serviceError) {
      console.error('Error with service key:', serviceError);
    } else {
      console.log('✓ Insert with service key worked!', serviceData);

      // Clean up test property
      await supabase.from('properties').delete().eq('id', serviceData.id);
      console.log('✓ Test property cleaned up');
    }

    // Now test with anon key
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZGtreWVrZm5wbXdpZnlvaGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTExNTksImV4cCI6MjA3ODEyNzE1OX0.pLBFkoQJ42hS_8bTXjqfwYPrMyLzq_GiIpEdAu4itj4';
    const anonSupabase = createClient(supabaseUrl, anonKey);

    console.log('\nTesting insert with anon key...');
    const testProperty2 = {
      ...testProperty,
      zillow_url: 'https://test-anon-' + Date.now() + '.com'
    };

    const { data: anonData, error: anonError } = await anonSupabase
      .from('properties')
      .insert([testProperty2])
      .select()
      .single();

    if (anonError) {
      console.error('Error with anon key:', anonError);
      console.log('\nThe issue is RLS policies blocking anon users.');
      console.log('Adding policies for anon users...');

      // Add policies for anon users
      const addAnonPoliciesSQL = `
        -- Properties table policies for anon
        CREATE POLICY IF NOT EXISTS "Allow anon users to read properties"
          ON public.properties
          FOR SELECT
          TO anon
          USING (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to insert properties"
          ON public.properties
          FOR INSERT
          TO anon
          WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to update properties"
          ON public.properties
          FOR UPDATE
          TO anon
          USING (true)
          WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to delete properties"
          ON public.properties
          FOR DELETE
          TO anon
          USING (true);

        -- Property managers table policies for anon
        CREATE POLICY IF NOT EXISTS "Allow anon users to read property managers"
          ON public.property_managers
          FOR SELECT
          TO anon
          USING (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to insert property managers"
          ON public.property_managers
          FOR INSERT
          TO anon
          WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to update property managers"
          ON public.property_managers
          FOR UPDATE
          TO anon
          USING (true)
          WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to delete property managers"
          ON public.property_managers
          FOR DELETE
          TO anon
          USING (true);

        -- Property manager assignments table policies for anon
        CREATE POLICY IF NOT EXISTS "Allow anon users to read assignments"
          ON public.property_manager_assignments
          FOR SELECT
          TO anon
          USING (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to insert assignments"
          ON public.property_manager_assignments
          FOR INSERT
          TO anon
          WITH CHECK (true);

        CREATE POLICY IF NOT EXISTS "Allow anon users to delete assignments"
          ON public.property_manager_assignments
          FOR DELETE
          TO anon
          USING (true);
      `;

      // Execute SQL using service role
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: addAnonPoliciesSQL });

      if (sqlError) {
        console.log('\nCannot add policies via RPC. Please run this SQL manually in Supabase SQL Editor:');
        console.log('\n' + addAnonPoliciesSQL);
      } else {
        console.log('✓ Anon policies added successfully!');
      }
    } else {
      console.log('✓ Insert with anon key worked!', anonData);
      await supabase.from('properties').delete().eq('id', anonData.id);
      console.log('✓ Test property cleaned up');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

fixRLSPolicies();
