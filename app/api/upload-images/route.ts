import { NextRequest, NextResponse } from 'next/server'
import { uploadPropertyImages } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrls, propertyAddress } = body

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls array is required' },
        { status: 400 }
      )
    }

    if (!propertyAddress) {
      return NextResponse.json(
        { error: 'propertyAddress is required' },
        { status: 400 }
      )
    }

    // Upload images to Cloudinary
    const cloudinaryUrls = await uploadPropertyImages(imageUrls, propertyAddress)

    return NextResponse.json({
      success: true,
      urls: cloudinaryUrls,
      message: `Successfully uploaded ${cloudinaryUrls.length} of ${imageUrls.length} images`,
    })
  } catch (error) {
    console.error('Error in upload-images API:', error)
    return NextResponse.json(
      { error: 'Failed to upload images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
