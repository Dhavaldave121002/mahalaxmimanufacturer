import type { Product } from '../types';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'at', 'buy', 'for', 'in', 'of', 'online', 'the', 'with',
  'product', 'products', 'show', 'find', 'me',
  'મને', 'મારું', 'મારે', 'બતાવો', 'દેખાડો', 'શોધો', 'જોઈએ',
  'मुझे', 'मेरा', 'मेरी', 'दिखाओ', 'बताओ', 'खोजो', 'चाहिए', 'का', 'की', 'के'
]);

const SEARCH_SYNONYM_GROUPS = [
  ['kid', 'kids', 'child', 'children', 'childrens', 'baby', 'babies', 'infant', 'newborn', 'toddler', 'બાળક', 'બાળકો', 'બાળકોની', 'બાળકોના', 'બેબી', 'बच्चा', 'बच्चे', 'बच्चों', 'शिशु'],
  ['bag', 'bags', 'tote', 'બેગ', 'થેલો', 'થેલી', 'बैग'],
  ['saree', 'sari', 'સાડી', 'સાડીઓ', 'साड़ी', 'साड़ियां'],
  ['tiffin', 'lunchbox', 'lunch', 'ટિફિન', 'લંચબોક્સ', 'टिफिन', 'लंचबॉक्स'],
  ['swaddle', 'wrap', 'wrapping', 'ઓઢણી', 'लपेटना'],
  ['towel', 'ટુવાલ', 'तौलिया']
];

const SYNONYMS_BY_TERM = new Map(
  SEARCH_SYNONYM_GROUPS.flatMap(group => group.map(term => [term, group] as const))
);

function tokenize(value: string | null | undefined) {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .match(/[\p{L}\p{M}\p{N}]+/gu) || [];
}

function isWithinEditDistance(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) return false;

  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const currentRow = [leftIndex];
    let rowMinimum = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      const distance = Math.min(
        previousRow[rightIndex] + 1,
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex - 1] + cost
      );
      currentRow.push(distance);
      rowMinimum = Math.min(rowMinimum, distance);
    }

    if (rowMinimum > limit) return false;
    previousRow = currentRow;
  }

  return previousRow[right.length] <= limit;
}

export function getProductSearchScore(product: Product, query: string): number {
  const queryTerms = tokenize(query).filter(term => !STOP_WORDS.has(term));
  if (queryTerms.length === 0) return 0;

  const fields = [
    { value: product.name, weight: 14 },
    { value: product.sku, weight: 12 },
    { value: product.hsnCode, weight: 12 },
    { value: `${product.categoryName} ${product.subcategory}`, weight: 8 },
    { value: (product.collections || []).join(' '), weight: 6 },
    { value: (product.tags || []).join(' '), weight: 7 },
    { value: product.shortDescription, weight: 4 },
    { value: product.description, weight: 2 },
    { value: Object.values(product.specifications || {}).join(' '), weight: 3 },
    {
      value: (product.variants || []).flatMap(variant => [
        variant.name,
        variant.colorName,
        variant.size,
        variant.sku
      ]).filter((value): value is string => Boolean(value)).join(' '),
      weight: 5
    },
    { value: (product.colorOptions || []).map(color => color.name).join(' '), weight: 4 }
  ].map(field => ({ ...field, terms: tokenize(field.value) }));

  let totalScore = 0;
  let matchedTerms = 0;

  for (const queryTerm of queryTerms) {
    let bestTermScore = 0;
    const candidateTerms = SYNONYMS_BY_TERM.get(queryTerm) || [queryTerm];

    for (const candidate of candidateTerms) {
      const synonymMultiplier = candidate === queryTerm ? 1 : 0.85;
      const fuzzyLimit = candidate.length >= 7 ? 2 : candidate.length >= 4 ? 1 : 0;

      for (const field of fields) {
        for (const productTerm of field.terms) {
          let matchMultiplier = 0;
          if (productTerm === candidate) {
            matchMultiplier = 1;
          } else if (
            Math.min(productTerm.length, candidate.length) >= 3 &&
            (productTerm.startsWith(candidate) || candidate.startsWith(productTerm))
          ) {
            matchMultiplier = 0.72;
          } else if (
            fuzzyLimit > 0 &&
            isWithinEditDistance(candidate, productTerm, fuzzyLimit)
          ) {
            matchMultiplier = 0.45;
          }

          bestTermScore = Math.max(
            bestTermScore,
            field.weight * matchMultiplier * synonymMultiplier
          );
        }
      }
    }

    if (bestTermScore > 0) {
      matchedTerms++;
      totalScore += bestTermScore;
    }
  }

  if (matchedTerms === 0) return 0;

  const normalizedQuery = queryTerms.join(' ');
  const normalizedName = tokenize(product.name).join(' ');
  const exactNamePhrase = normalizedName.includes(normalizedQuery) ? 18 : 0;
  const coverageBonus = (matchedTerms / queryTerms.length) * 10;

  return totalScore + exactNamePhrase + coverageBonus + (matchedTerms === queryTerms.length ? 8 : 0);
}

export function matchesProductSearch(product: Product, query: string): boolean {
  return !query.trim() || getProductSearchScore(product, query) > 0;
}
