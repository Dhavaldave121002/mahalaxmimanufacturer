import { CategoryId, Product } from '../types';

const CATEGORY_NAMES: Record<CategoryId, string> = {
  'home-kitchen': 'Home and Kitchen',
  household: 'Household',
  textile: 'Textile',
  'cotton-products': 'Cotton Products'
};

export const getCategoryName = (category: CategoryId): string => CATEGORY_NAMES[category];

export const normalizeProductCategory = (product: Product): Product => ({
  ...product,
  categoryName: getCategoryName(product.category)
});
