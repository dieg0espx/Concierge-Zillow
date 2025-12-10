import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { propertyId, address, bedrooms, bathrooms, area } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API || process.env.OPEN_AI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Generate description with OpenAI
    const prompt = `Write a professional, engaging property listing description for a luxury property. Use markdown formatting with **bold text** for emphasis and proper line breaks.

Property Details:
- Address: ${address || 'Luxury Property'}
- Bedrooms: ${bedrooms || 'Contact for details'}
- Bathrooms: ${bathrooms || 'Contact for details'}
- Square Feet: ${area || 'Contact for details'}

FORMAT REQUIREMENTS:
1. Start with a compelling opening paragraph about the property
2. Add a blank line, then a **Property Highlights** section with key features using bold for emphasis
3. Add a blank line, then a **Lifestyle & Location** section
4. Use **bold text** to highlight important features like: **gourmet kitchen**, **master suite**, **pool**, etc.
5. Keep it to 3 sections with clear line breaks between them
6. Do NOT include the address, price, beds, baths, or sqft in the text - those are shown separately in the UI
7. Be concise but descriptive - about 150-200 words total`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API error:', errorData)
      return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const generatedDescription = openaiData.choices?.[0]?.message?.content

    if (!generatedDescription) {
      return NextResponse.json({ error: 'No description generated' }, { status: 500 })
    }

    // Update property in Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: updateError } = await supabase
      .from('properties')
      .update({ description: generatedDescription })
      .eq('id', propertyId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      description: generatedDescription
    })

  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
