import { CategoryId, Product } from '../types';

const CATEGORY_NAMES: Record<CategoryId, string> = {
  'home-kitchen': 'Home and Kitchen',
  'roti-covers': 'Roti Covers',
  household: 'Household',
  textile: 'Textile',
  'cotton-products': 'Cotton Products'
};

export const getCategoryName = (category: CategoryId): string => CATEGORY_NAMES[category];

export const normalizeProductCategory = (product: Product): Product => ({
  ...product,
  categoryName: getCategoryName(product.category)
});

/**
 * Converts a subcategory or product name into a clean, human-readable SEO slug.
 * e.g., "Cotton Saree Cover" -> "cotton-saree-cover"
 * e.g., "Home & Kitchen" -> "home-kitchen"
 */
export const toSubcategorySlug = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[/\\_]/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Checks if a product's subcategory matches a URL slug or raw parameter.
 * Supports:
 * - "cotton-saree-cover" (clean slug)
 * - "Cotton Saree Cover" (raw name)
 * - "Cotton%20Saree%20Cover" (encoded name)
 */
export const matchesSubcategorySlug = (subcategoryName?: string, slugOrName?: string): boolean => {
  if (!subcategoryName || !slugOrName) return false;
  const subNorm = subcategoryName.trim().toLowerCase();
  const targetNorm = decodeURIComponent(slugOrName).trim().toLowerCase();
  if (subNorm === targetNorm) return true;
  if (toSubcategorySlug(subcategoryName) === toSubcategorySlug(slugOrName)) return true;
  return false;
};

