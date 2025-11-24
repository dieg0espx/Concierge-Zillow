import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Uploads an image from a URL to Cloudinary
 * @param imageUrl - The URL of the image to upload
 * @param folderPath - The folder path in Cloudinary (e.g., "Concierge/123-Main-St")
 * @returns The secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(
  imageUrl: string,
  folderPath: string
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folderPath,
      resource_type: 'image',
    })
    return result.secure_url
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw error
  }
}

/**
 * Uploads multiple images to Cloudinary
 * @param imageUrls - Array of image URLs to upload
 * @param propertyAddress - Property address for folder naming
 * @returns Array of Cloudinary URLs
 */
export async function uploadPropertyImages(
  imageUrls: string[],
  propertyAddress: string
): Promise<string[]> {
  // Create a safe folder name from the address
  const folderName = propertyAddress
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 100) // Limit length

  const folderPath = `Concierge/${folderName}`

  console.log(`Uploading ${imageUrls.length} images to Cloudinary folder: ${folderPath}`)

  // Upload all images in parallel
  const uploadPromises = imageUrls.map((url, index) =>
    uploadImageToCloudinary(url, folderPath).catch((error) => {
      console.error(`Failed to upload image ${index + 1}:`, error)
      return null // Return null for failed uploads instead of breaking everything
    })
  )

  const results = await Promise.all(uploadPromises)

  // Filter out any failed uploads (null values)
  const successfulUploads = results.filter((url): url is string => url !== null)

  console.log(`Successfully uploaded ${successfulUploads.length} of ${imageUrls.length} images`)

  return successfulUploads
}
