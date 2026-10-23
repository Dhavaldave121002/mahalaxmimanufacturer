import { Product } from '../types';

export function matchesProductSearch(product: Product, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = [
    product.name,
    product.sku,
    product.hsnCode,
    product.categoryName,
    product.subcategory,
    product.shortDescription,
    product.description,
    ...product.tags,
    ...Object.values(product.specifications),
    ...(product.variants || []).flatMap(variant => [
      variant.name,
      variant.colorName,
      variant.size,
      variant.sku
    ].filter((value): value is string => Boolean(value)))
  ].join(' ').toLowerCase();

  return terms.every(term => searchableText.includes(term));
}
