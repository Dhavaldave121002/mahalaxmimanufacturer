import React from 'react';

const SkeletonBlock: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />
);

export const ProductGridSkeleton: React.FC<{
  count?: number;
  className?: string;
  columnsClassName?: string;
}> = ({ count = 8, className = '', columnsClassName }) => (
  <div
    className={`${columnsClassName || 'grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4'} ${className}`}
    role="status"
    aria-label="Loading products"
    aria-busy="true"
  >
    {Array.from({ length: count }, (_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4"
      >
        <SkeletonBlock className="aspect-square w-full rounded-xl sm:rounded-2xl" />
        <div className="space-y-3 pt-4">
          <SkeletonBlock className="h-3 w-1/3" />
          <SkeletonBlock className="h-4 w-5/6" />
          <SkeletonBlock className="h-3 w-2/3" />
          <div className="flex items-center justify-between pt-1">
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-9 w-1/3 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
    <span className="sr-only">Loading products…</span>
  </div>
);

export const PageLoadingSkeleton: React.FC = () => (
  <div
    className="mx-auto min-h-[50vh] max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12"
    role="status"
    aria-label="Loading page"
    aria-busy="true"
  >
    <div className="space-y-3">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="h-8 w-2/3 max-w-lg sm:h-10" />
      <SkeletonBlock className="h-4 w-full max-w-2xl" />
      <SkeletonBlock className="h-4 w-4/5 max-w-xl" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonBlock key={index} className="h-20 rounded-2xl sm:h-24" />
      ))}
    </div>
    <ProductGridSkeleton count={4} />
    <span className="sr-only">Loading page…</span>
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div
    className="mx-auto grid min-h-[55vh] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-12"
    role="status"
    aria-label="Loading product details"
    aria-busy="true"
  >
    <SkeletonBlock className="aspect-square w-full rounded-3xl" />
    <div className="space-y-5 py-2">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-9 w-5/6" />
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      <SkeletonBlock className="h-24 w-full rounded-2xl" />
      <SkeletonBlock className="h-12 w-full rounded-xl" />
      <SkeletonBlock className="h-12 w-full rounded-xl" />
    </div>
    <span className="sr-only">Loading product details…</span>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3" role="status" aria-label="Loading items" aria-busy="true">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
        <SkeletonBlock className="h-4 w-2/5" />
        <SkeletonBlock className="mt-3 h-3 w-4/5" />
        <SkeletonBlock className="mt-2 h-3 w-3/5" />
      </div>
    ))}
    <span className="sr-only">Loading items…</span>
  </div>
);
