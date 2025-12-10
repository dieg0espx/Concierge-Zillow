/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
}

/**
 * Generate a unique slug with a random suffix
 * @param baseSlug - The base slug to make unique
 * @returns A unique slug with random suffix
 */
export function generateUniqueSlug(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${baseSlug}-${randomSuffix}`
}

/**
 * Validate if a slug is valid
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Slug must be 1-100 characters, lowercase alphanumeric and hyphens only
  // Cannot start or end with hyphen
  const slugRegex = /^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$/
  return slugRegex.test(slug)
}

/**
 * Sanitize a slug to ensure it's valid
 * @param slug - The slug to sanitize
 * @returns A sanitized valid slug
 */
export function sanitizeSlug(slug: string): string {
  const sanitized = generateSlug(slug)

  // If empty after sanitization, generate a random one
  if (!sanitized) {
    return `client-${Math.random().toString(36).substring(2, 8)}`
  }

  // Limit length to 100 characters
  return sanitized.substring(0, 100)
}
