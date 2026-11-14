import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { InfiniteProductGrid } from '../components/common/InfiniteProductGrid';
import { ProductGridSkeleton } from '../components/common/SkeletonLoader';
import { ProductGridLayoutControls } from '../components/common/ProductGridLayoutControls';
import { getProductGridColumnsClassName } from '../components/common/productGridLayout';
import { FilterAccordion } from '../components/common/FilterAccordion';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { toSubcategorySlug, matchesSubcategorySlug, productBelongsToCollection } from '../utils/productCategories';

export const CategoryPage: React.FC = () => {
  const { categoryId, subcategorySlug } = useParams<{ categoryId: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, productsLoading, categories } = useApp();

  const selectedSubcategory = subcategorySlug || searchParams.get('subcategory') || '';
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [desktopGridColumns, setDesktopGridColumns] = useState<2 | 3>(3);
  const [mobileGridColumns, setMobileGridColumns] = useState<1 | 2>(2);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (!mobileFilterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFilterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileFilterOpen]);

  // Auto-clean any percent-encoded (%20) or uppercase query param in the URL address bar to a sleek SEO slug
  useEffect(() => {
    const raw = searchParams.get('subcategory');
    if (raw && (raw.includes(' ') || raw.includes('%20') || /[A-Z]/.test(raw))) {
      const cleanSlug = toSubcategorySlug(raw);
      if (cleanSlug && cleanSlug !== raw) {
        const next = new URLSearchParams(searchParams);
        next.set('subcategory', cleanSlug);
        setSearchParams(next, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  const allCats = categories && categories.length > 0 ? categories : CATEGORIES_CONFIG;
  const categoryConfig = allCats.find(c => c.id === categoryId);
  const categoryHeroImage = categoryId === 'home-kitchen'
    ? products.find(product => productBelongsToCollection(product, categoryId) && product.subcategory === 'Aprons')?.images[0] || null
    : null;

  // Filter products for this category using multi-collection and slug-tolerant matching
  const categoryProducts = useMemo(() => products
    .filter(p => {
      if (!productBelongsToCollection(p, categoryId)) return false;
      if (selectedSubcategory && !matchesSubcategorySlug(p.subcategory, selectedSubcategory)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.retailPrice - b.retailPrice;
      if (sortBy === 'price-high') return b.retailPrice - a.retailPrice;
      if (sortBy === 'discount') return (b.mrp - b.retailPrice) / b.mrp - (a.mrp - a.retailPrice) / a.mrp;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    }), [products, categoryId, selectedSubcategory, sortBy]);
  const availableSubcategories = Array.from(new Set(
    products.filter(product => productBelongsToCollection(product, categoryId)).map(product => product.subcategory)
  ));

  const matchedSubcategoryName = availableSubcategories.find(s => matchesSubcategorySlug(s, selectedSubcategory));

  useEffect(() => {
    if (!categoryConfig) return;

    const categoryName = matchedSubcategoryName
      ? `${matchedSubcategoryName} - ${categoryConfig.name}`
      : categoryConfig.name;
    const title = `Shop ${categoryName} Online | Mahalaxmi Enterprise`;
    const description = `${categoryConfig.description} Browse ${categoryName.toLowerCase()} online from Mahalaxmi Enterprise. Check product details, delivery availability by PIN code and bulk order options.`;
    const canonicalPath = subcategorySlug
      ? `/category/${categoryId}/${subcategorySlug}`
      : `/category/${categoryId}`;
    const canonicalUrl = `https://mahalaxmimanufacturer.com${canonicalPath}`;
    const previousTitle = document.title;
    document.title = title;

    const updateMeta = (selector: string, key: 'name' | 'property', value: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      const previousContent = element?.content;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(key, value);
        document.head.appendChild(element);
      }
      element.content = content;
      return () => {
        if (previousContent === undefined) element?.remove();
        else if (element) element.content = previousContent;
      };
    };

    const restoreMeta = [
      updateMeta('meta[name="description"]', 'name', 'description', description),
      updateMeta('meta[property="og:title"]', 'property', 'og:title', title),
      updateMeta('meta[property="og:description"]', 'property', 'og:description', description),
      updateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    ];
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    return () => {
      document.title = previousTitle;
      restoreMeta.forEach(restore => restore());
      if (previousCanonical && canonical) canonical.href = previousCanonical;
      else canonical?.remove();
    };
  }, [categoryConfig, categoryId, matchedSubcategoryName, subcategorySlug]);

  const handleSelectSubcategory = (sub?: string) => {
    if (!sub || matchesSubcategorySlug(sub, selectedSubcategory)) {
      if (subcategorySlug) {
        navigate(`/category/${categoryId}`);
      } else {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('subcategory');
        setSearchParams(nextParams, { replace: true });
      }
    } else {
      const slug = toSubcategorySlug(sub);
      if (subcategorySlug) {
        navigate(`/category/${categoryId}/${slug}`);
      } else {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('subcategory', slug);
        setSearchParams(nextParams, { replace: true });
      }
    }
  };

  if (!categoryConfig) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-navy">Category Not Found</h2>
        <p className="text-sm text-slate-500">The requested category does not exist in our catalog.</p>
        <Link to="/catalog" className="inline-block px-5 py-2.5 bg-indigo text-white rounded-xl text-xs font-bold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Category Hero Banner */}
      <section className="bg-navy text-white relative overflow-hidden py-12 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C6AA80_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-white">Catalog</Link>
            <span>/</span>
            {selectedSubcategory ? (
              <>
                <Link to={`/category/${categoryId}`} className="hover:text-white">{categoryConfig.name}</Link>
                <span>/</span>
                <span className="text-champagne font-semibold">{matchedSubcategoryName || selectedSubcategory.replace(/-/g, ' ')}</span>
              </>
            ) : (
              <span className="text-champagne font-semibold">{categoryConfig.name}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                PRODUCT CATEGORY
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {matchedSubcategoryName ? `${categoryConfig.name} - ${matchedSubcategoryName}` : categoryConfig.name}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Browse source-listed products in {categoryConfig.name}. Confirm product specifications, current availability and prices before ordering.
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-slate-700 shadow-premium">
                <img
                  src={categoryHeroImage || categoryConfig.image}
                  alt={categoryConfig.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategory Filter Tabs & Sorting */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:flex md:items-center md:gap-4 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-0 md:pb-4 md:shadow-none">
          {/* Subcategory Pills */}
          <div className="min-w-0 md:flex md:flex-1 md:items-center md:gap-4">
            <div className="mb-2 flex items-center justify-between gap-2 md:mb-0 md:w-28 md:shrink-0 md:flex-col md:items-start md:gap-0">
              <span className="text-xs font-bold text-navy sm:text-sm">Shop by type</span>
              <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            <div
              aria-label="Filter by subcategory"
              className="hidden snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex md:flex-1 md:flex-nowrap"
            >
            <button
              onClick={() => handleSelectSubcategory()}
              aria-pressed={!selectedSubcategory}
              className={`shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold transition sm:text-xs ${
                !selectedSubcategory
                  ? 'bg-navy text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All {categoryConfig.name} ({products.filter(p => productBelongsToCollection(p, categoryId)).length})
            </button>

            {availableSubcategories.map((sub, i) => {
              const count = products.filter(p => productBelongsToCollection(p, categoryId) && p.subcategory === sub).length;
              const isSelected = matchesSubcategorySlug(sub, selectedSubcategory);
              return (
                <button
                  key={i}
                  onClick={() => handleSelectSubcategory(sub)}
                  aria-pressed={isSelected}
                  className={`shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold transition sm:text-xs ${
                    isSelected
                      ? 'bg-indigo text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sub} <span className={isSelected ? 'opacity-80' : 'text-slate-400'}>({count})</span>
                </button>
              );
            })}
            </div>
          </div>

        </div>

        {/* Product Grid */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-navy shadow-sm transition hover:border-indigo/40 md:hidden"
              aria-haspopup="dialog"
              aria-expanded={mobileFilterOpen}
            >
              <SlidersHorizontal className="h-4 w-4 text-indigo" />
              <span>Filter &amp; Sort</span>
              {selectedSubcategory && <span className="h-1.5 w-1.5 rounded-full bg-indigo" aria-label="Filter active" />}
            </button>
            <div className="hidden min-w-0 items-center gap-2 md:flex">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
              <label htmlFor="category-sort" className="shrink-0 text-xs font-medium text-slate-500">Sort:</label>
              <select
                id="category-sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-indigo"
              >
                <option value="relevance">Featured & Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Highest Savings %</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <ProductGridLayoutControls
                  desktopColumns={desktopGridColumns}
                  mobileColumns={mobileGridColumns}
                  onDesktopColumnsChange={setDesktopGridColumns}
                  onMobileColumnsChange={setMobileGridColumns}
                />
              </div>
              <div className="hidden md:block">
                <ProductGridLayoutControls
                  desktopColumns={desktopGridColumns}
                  mobileColumns={mobileGridColumns}
                  onDesktopColumnsChange={setDesktopGridColumns}
                  onMobileColumnsChange={setMobileGridColumns}
                />
              </div>
            </div>
          </div>
          {productsLoading ? (
            <ProductGridSkeleton
              count={8}
              columnsClassName={getProductGridColumnsClassName(mobileGridColumns, desktopGridColumns)}
            />
          ) : categoryProducts.length > 0 ? (
            <InfiniteProductGrid
              key={`${categoryId}|${selectedSubcategory}|${sortBy}`}
              products={categoryProducts}
              className={getProductGridColumnsClassName(mobileGridColumns, desktopGridColumns)}
            />
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
              <h3 className="font-bold text-lg text-navy">No items in this subcategory</h3>
              <p className="text-xs text-slate-500">Try selecting "All {categoryConfig.name}" above.</p>
              <button
                onClick={() => handleSelectSubcategory()}
                className="px-4 py-2 bg-indigo text-white rounded-xl text-xs font-bold"
              >
                Show All Subcategories
              </button>
            </div>
          )}
        </div>
      </section>

      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-navy/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileFilterOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-filter-title"
            className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={event => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-indigo" />
                <h2 id="category-filter-title" className="text-sm font-extrabold text-navy">Filter &amp; Sort</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-navy"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <FilterAccordion
                title="Sort products"
                summaryValue={{
                  relevance: 'Featured',
                  'price-low': 'Price: Low to High',
                  'price-high': 'Price: High to Low',
                  discount: 'Highest Savings',
                  rating: 'Top Rated'
                }[sortBy]}
              >
                <div className="space-y-1" role="group" aria-label="Sort products">
                  {[
                    ['relevance', 'Featured & Relevance'],
                    ['price-low', 'Price: Low to High'],
                    ['price-high', 'Price: High to Low'],
                    ['discount', 'Highest Savings %'],
                    ['rating', 'Top Rated']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSortBy(value)}
                      aria-pressed={sortBy === value}
                      className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        sortBy === value ? 'bg-indigo-light font-bold text-indigo' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="min-w-0 break-words">{label}</span>
                      {sortBy === value && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </FilterAccordion>

              <FilterAccordion
                title="Shop by type"
                defaultOpen
                summaryValue={matchedSubcategoryName || `All ${categoryConfig.name}`}
              >
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectSubcategory()}
                    aria-pressed={!selectedSubcategory}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                      !selectedSubcategory ? 'bg-indigo-light font-bold text-indigo' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All {categoryConfig.name}</span>
                    {!selectedSubcategory && <Check className="h-4 w-4" />}
                  </button>
                  {availableSubcategories.map((sub, index) => {
                    const isSelected = matchesSubcategorySlug(sub, selectedSubcategory);
                    return (
                      <button
                        key={`${sub}-${index}`}
                        type="button"
                        onClick={() => handleSelectSubcategory(sub)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                          isSelected ? 'bg-indigo-light font-bold text-indigo' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{sub}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </FilterAccordion>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-xl bg-indigo px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-dark"
              >
                Show {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
