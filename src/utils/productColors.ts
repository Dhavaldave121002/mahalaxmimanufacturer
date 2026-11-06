import type { Product, ProductColorOption } from '../types';

const STANDARD_COLORS: ProductColorOption[] = [
  { id: 'pink', name: 'Pink', colorHex: '#EC4899' },
  { id: 'green', name: 'Green', colorHex: '#22C55E' },
  { id: 'blue', name: 'Blue', colorHex: '#3B82F6' },
  { id: 'orange', name: 'Orange', colorHex: '#F97316' }
];

const TOTE_BAG_COLORS: ProductColorOption[] = [
  { id: 'off-white-bright', name: 'Off-white', colorHex: '#F8F3E8' },
  { id: 'black', name: 'Black', colorHex: '#171717' }
];

const PRODUCE_BAG_COLORS: ProductColorOption[] = [
  { id: 'off-white-bright', name: 'Off-white', colorHex: '#F8F3E8' }
];
const SAREE_COVER_COLORS: ProductColorOption[] = [
  { id: 'off-white', name: 'Off-white', colorHex: '#F8F3E8' }
];

const isProduceBagName = (name: string) =>
  /\b(?:vegetable|fruit|produce)\b/i.test(name) &&
  /\bbags?\b/i.test(name) &&
  !/\b(?:kit|bundle)\b/i.test(name);
const isToteBagName = (name: string) =>
  /\btote\b/i.test(name) &&
  /\bbags?\b/i.test(name) &&
  !/\b(?:kit|bundle)\b/i.test(name);
const isSareeCoverName = (name: string) =>
  /\bsaree\b/i.test(name) &&
  /\bcovers?\b/i.test(name) &&
  !/\b(?:kit|bundle)\b/i.test(name);
const isCottonDryingClothName = (name: string) =>
  /\bcotton\b/i.test(name) &&
  /\bdrying\s+cloth\b/i.test(name) &&
  !/\b(?:kit|bundle)\b/i.test(name);

export const getDefaultProductColors = (productName: string, productContext = ''): ProductColorOption[] => {
  const productText = `${productName} ${productContext}`;
  const defaults = isProduceBagName(productText)
    ? PRODUCE_BAG_COLORS
    : isCottonDryingClothName(productText)
      ? PRODUCE_BAG_COLORS
      : isSareeCoverName(productText)
      ? SAREE_COVER_COLORS
      : isToteBagName(productText)
        ? TOTE_BAG_COLORS
        : STANDARD_COLORS;
  return defaults.map(color => ({ ...color }));
};

export const getProductColorOptions = (product: Product): ProductColorOption[] =>
  Array.isArray(product.colorOptions)
    ? product.colorOptions
    : getDefaultProductColors(`${product.name} ${product.categoryName} ${product.subcategory}`);

export const isProduceBagProduct = (
  product: Pick<Product, 'name' | 'categoryName' | 'subcategory'>
): boolean => {
  const productText = `${product.name} ${product.categoryName} ${product.subcategory}`;
  return /\b(?:vegetable|fruit|produce)\b/i.test(productText) &&
    /\bbags?\b/i.test(productText) &&
    !/\b(?:kit|bundle)\b/i.test(product.name);
};

export const isPaperProduct = (product: Pick<Product, 'name' | 'categoryName' | 'subcategory'>): boolean =>
  /\bpaper\b/i.test(`${product.name} ${product.categoryName} ${product.subcategory}`);
