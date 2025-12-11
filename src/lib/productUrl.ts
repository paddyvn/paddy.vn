/**
 * Product URL utilities for slug+ID pattern
 * URL format: /products/{slug}-{id}
 * Example: /products/premium-dog-food-abc123def456
 */

/**
 * Generate a product URL from slug and ID
 */
export function generateProductUrl(slug: string, id: string): string {
  return `/products/${slug}-${id}`;
}

/**
 * Parse product ID from URL parameter (slug-id format)
 * Returns the ID portion for database lookup
 */
export function parseProductIdFromUrl(slugId: string): string {
  // UUID is 36 characters (8-4-4-4-12 with hyphens)
  // The ID is at the end after the last hyphen group
  // Since UUID contains hyphens, we need to extract the last 36 characters
  if (slugId.length >= 36) {
    const potentialId = slugId.slice(-36);
    // Validate UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
      return potentialId;
    }
  }
  
  // Fallback: return the whole thing (for backward compatibility with old slug-only URLs)
  return slugId;
}

/**
 * Parse slug from URL parameter (slug-id format)
 * Returns the slug portion for SEO verification
 */
export function parseProductSlugFromUrl(slugId: string): string {
  // Remove the UUID (last 36 chars + 1 hyphen = 37 chars from end)
  if (slugId.length > 37) {
    const potentialId = slugId.slice(-36);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId)) {
      return slugId.slice(0, -37);
    }
  }
  
  // Fallback: return the whole thing as slug
  return slugId;
}

/**
 * Check if a URL parameter contains an ID (new format) or is slug-only (old format)
 */
export function isNewUrlFormat(slugId: string): boolean {
  if (slugId.length >= 36) {
    const potentialId = slugId.slice(-36);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialId);
  }
  return false;
}
