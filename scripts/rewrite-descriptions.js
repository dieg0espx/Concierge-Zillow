require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API,
});

async function rewriteDescription(property) {
  const prompt = `You are a luxury real estate copywriter. Rewrite the following property description to be more engaging, professional, and luxurious. Keep it concise (2-3 sentences, max 150 words) and highlight the key features.

Property Address: ${property.address}
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Area: ${property.area} sq ft
Monthly Rent: $${property.monthly_rent}

Current Description: ${property.description || 'No description available'}

Write a compelling luxury property description (just the description, no other text):`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional luxury real estate copywriter. Write engaging, sophisticated property descriptions that highlight key features and amenities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    return text.trim();
  } catch (error) {
    console.error(`Error generating description for ${property.address}:`, error.message);
    return property.description; // Keep original if generation fails
  }
}

async function main() {
  console.log('🏠 Starting property description rewrite process...\n');

  // Fetch all properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching properties:', error);
    process.exit(1);
  }

  if (!properties || properties.length === 0) {
    console.log('No properties found in the database.');
    process.exit(0);
  }

  console.log(`Found ${properties.length} properties to process.\n`);

  let successCount = 0;
  let errorCount = 0;

  // Process each property
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    console.log(`\n[${i + 1}/${properties.length}] Processing: ${property.address}`);
    console.log(`Current description: ${property.description ? property.description.substring(0, 100) + '...' : 'None'}`);

    // Generate new description
    const newDescription = await rewriteDescription(property);
    console.log(`New description: ${newDescription ? newDescription.substring(0, 100) + '...' : 'None'}`);

    // Update in Supabase
    const { error: updateError } = await supabase
      .from('properties')
      .update({ description: newDescription })
      .eq('id', property.id);

    if (updateError) {
      console.error(`❌ Error updating property ${property.id}:`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ Successfully updated description for ${property.address}`);
      successCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed to update: ${errorCount}`);
  console.log(`📝 Total processed: ${properties.length}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
