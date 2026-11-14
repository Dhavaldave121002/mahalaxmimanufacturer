import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

const PAGE_SIZE = 12;

interface InfiniteProductGridProps {
  products: Product[];
  className: string;
}

export const InfiniteProductGrid: React.FC<InfiniteProductGridProps> = ({
  products,
  className
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.ceil(products.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(pageCount, 1));
  const firstProductIndex = (safePage - 1) * PAGE_SIZE;
  const visibleProducts = products.slice(firstProductIndex, firstProductIndex + PAGE_SIZE);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), pageCount);
    if (nextPage === safePage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      if (!gridRef.current) return;
      const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 112;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  };

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
  const visiblePageNumbers = pageNumbers.length <= 5
    ? pageNumbers
    : Array.from(new Set([1, safePage - 1, safePage, safePage + 1, pageCount]))
      .filter(page => page >= 1 && page <= pageCount);

  return (
    <div>
      <div ref={gridRef} className={`${className} scroll-mt-28`}>
        {visibleProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pageCount > 1 && (
        <nav
          className="mt-8 flex flex-col items-center gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between"
          aria-label="Product pages"
        >
          <p className="text-xs text-slate-500" aria-live="polite">
            Showing {firstProductIndex + 1}–{Math.min(firstProductIndex + PAGE_SIZE, products.length)} of {products.length} products
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-navy transition hover:border-indigo/40 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous product page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            {visiblePageNumbers.map((page, index) => {
              const previousPage = visiblePageNumbers[index - 1];
              return (
                <React.Fragment key={page}>
                  {previousPage && page - previousPage > 1 && (
                    <span className="px-1 text-xs text-slate-400" aria-hidden="true">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => goToPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={page === safePage ? 'page' : undefined}
                    className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-bold transition ${
                      page === safePage
                        ? 'border-indigo bg-indigo text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo/40 hover:text-indigo'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === pageCount}
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-navy transition hover:border-indigo/40 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next product page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
