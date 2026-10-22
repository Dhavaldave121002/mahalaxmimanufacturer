import { useState, useEffect } from 'react';

interface RatingData {
  rating: number;
  count: number;
}

// Module-level singleton cache — shared across all cards, fetched only once
let cachedMap: Record<string, RatingData> | null = null;
let fetchPromise: Promise<Record<string, RatingData>> | null = null;

function buildRatingsMap(reviews: any[]): Record<string, RatingData> {
  const accum: Record<string, { total: number; count: number }> = {};
  for (const r of reviews) {
    const key = r.product_id || r.productId || '';
    if (!key) continue;
    if (!accum[key]) accum[key] = { total: 0, count: 0 };
    accum[key].count++;
    accum[key].total += (Number(r.rating) || 5);
  }
  const result: Record<string, RatingData> = {};
  for (const [key, val] of Object.entries(accum)) {
    result[key] = {
      rating: Number((val.total / val.count).toFixed(1)),
      count: val.count
    };
  }
  return result;
}

function fetchAllReviews(): Promise<Record<string, RatingData>> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = (async () => {
    // Try live API first
    try {
      const res = await fetch('/api/products?action=reviews');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews) && json.reviews.length > 0) {
          cachedMap = buildRatingsMap(json.reviews);
          return cachedMap;
        }
      }
    } catch {}

    // Fallback: static reviews.json
    try {
      const res = await fetch('/reviews.json');
      if (res.ok) {
        const all: any[] = await res.json();
        cachedMap = buildRatingsMap(all);
        return cachedMap;
      }
    } catch {}

    cachedMap = {};
    return cachedMap;
  })();
  return fetchPromise;
}

/**
 * Returns the real (actual) rating & review count for a product,
 * computed from live reviews database / reviews.json.
 * Returns null if no real reviews exist for this product.
 */
export function useRealRating(
  productId: string,
  productSlug?: string
): RatingData | null {
  const [map, setMap] = useState<Record<string, RatingData> | null>(cachedMap);

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap);
      return;
    }
    let cancelled = false;
    fetchAllReviews().then(result => {
      if (!cancelled) setMap(result);
    });
    return () => { cancelled = true; };
  }, []);

  if (!map) return null;

  // Try product ID first, then slug, then common mapping aliases
  return map[productId]
    || (productSlug ? map[productSlug] : null)
    || null;
}
