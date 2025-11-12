const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '../.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    let value = match[2].trim()
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    envVars[match[1]] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage\n')
  console.log('=============================\n')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      process.exit(1)
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'profile-pictures')

    if (bucketExists) {
      console.log('✅ Bucket "profile-pictures" already exists\n')
    } else {
      // Create the bucket
      const { data: bucket, error: createError } = await supabase.storage.createBucket('profile-pictures', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
      })

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message)
        process.exit(1)
      }

      console.log('✅ Created bucket "profile-pictures"\n')
    }

    console.log('📋 Bucket Configuration:')
    console.log('   - Name: profile-pictures')
    console.log('   - Public: Yes')
    console.log('   - Max file size: 5MB')
    console.log('   - Allowed types: PNG, JPEG, JPG, WEBP, GIF\n')

    console.log('🔒 Setting up RLS policies...\n')

    // Note: Storage RLS policies are typically managed through Supabase Dashboard
    // or SQL commands. Here's the SQL you can run manually:
    console.log('📝 Run these SQL commands in Supabase SQL Editor:\n')
    console.log('-- Allow authenticated users to upload profile pictures')
    console.log(`CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow authenticated users to update their profile pictures
CREATE POLICY "Authenticated users can update profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to delete their profile pictures
CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Allow public read access to all profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');\n`)

    console.log('🎉 Storage setup completed successfully!\n')
    console.log('✨ Next steps:')
    console.log('1. Run the SQL commands above in Supabase Dashboard')
    console.log('2. Run migrations: npm run db:migrate')
    console.log('3. Profile pictures will be accessible at:')
    console.log(`   ${supabaseUrl}/storage/v1/object/public/profile-pictures/{filename}\n`)

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

setupStorage()
