import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './SkeletonLoader';

const INITIAL_BATCH_SIZE = 16;
const NEXT_BATCH_SIZE = 12;

interface InfiniteProductGridProps {
  products: Product[];
  className: string;
}

export const InfiniteProductGrid: React.FC<InfiniteProductGridProps> = ({
  products,
  className
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [isAppending, setIsAppending] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < products.length;

  const loadNextBatch = useCallback(() => {
    if (!hasMore || isAppending) return;
    setIsAppending(true);
  }, [hasMore, isAppending]);

  useEffect(() => {
    if (!isAppending) return;
    const frame = window.requestAnimationFrame(() => {
      setVisibleCount(count => Math.min(count + NEXT_BATCH_SIZE, products.length));
      setIsAppending(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAppending, products.length]);

  useEffect(() => {
    if (!hasMore || isAppending) return;
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) loadNextBatch();
      },
      { rootMargin: '500px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isAppending, loadNextBatch]);

  return (
    <div className={className}>
      {products.slice(0, visibleCount).map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      {isAppending && (
        <ProductGridSkeleton count={4} className="col-span-full" />
      )}
      {hasMore && (
        <div className="col-span-full flex flex-col items-center justify-center gap-2">
          <div ref={sentinelRef} className="h-2 w-full" aria-hidden="true" />
          <button
            type="button"
            onClick={loadNextBatch}
            disabled={isAppending}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-navy shadow-sm disabled:opacity-60"
          >
            Load more products
          </button>
        </div>
      )}
    </div>
  );
};
