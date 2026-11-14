import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { InfiniteProductGrid } from '../components/common/InfiniteProductGrid';
import { ProductGridSkeleton } from '../components/common/SkeletonLoader';
import { ProductGridLayoutControls } from '../components/common/ProductGridLayoutControls';
import { getProductGridColumnsClassName } from '../components/common/productGridLayout';
import { FilterAccordion } from '../components/common/FilterAccordion';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { getProductSearchScore } from '../utils/searchProducts';
import { toSubcategorySlug, matchesSubcategorySlug, productBelongsToCollection } from '../utils/productCategories';
import {
  SlidersHorizontal,
  X,
  Search,
  Check,
  Star,
  Plus,
  Minus
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products, productsLoading, categories } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const filterParam = searchParams.get('filter') || '';

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(subcategoryParam);
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [directMillOnly, setDirectMillOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(categoryParam);
  const [desktopGridColumns, setDesktopGridColumns] = useState<2 | 3>(3);
  const [mobileGridColumns, setMobileGridColumns] = useState<1 | 2>(2);

  // Auto-clean any percent-encoded (%20) or uppercase query param in the URL address bar to a sleek SEO slug
  useEffect(() => {
    const raw = searchParams.get('subcategory');
    if (raw && (raw.includes(' ') || raw.includes('%20') || /[A-Z]/.test(raw))) {
      const cleanSlug = toSubcategorySlug(raw);
      if (cleanSlug && cleanSlug !== raw) {
        const next = new URLSearchParams(searchParams);
        next.set('subcategory', cleanSlug);
        setSearchParams(next, { replace: true });
        setSelectedSubcategory(cleanSlug);
      }
    }
  }, [searchParams, setSearchParams]);

  const toggleSubcategory = (sub: string) => {
    if (!sub || matchesSubcategorySlug(sub, selectedSubcategory)) {
      setSelectedSubcategory('');
      const next = new URLSearchParams(searchParams);
      next.delete('subcategory');
      setSearchParams(next, { replace: true });
    } else {
      const slug = toSubcategorySlug(sub);
      setSelectedSubcategory(slug);
      const next = new URLSearchParams(searchParams);
      next.set('subcategory', slug);
      setSearchParams(next, { replace: true });
    }
  };

  // Available subcategories based on selected category (supports multi-collection products)
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) {
      return Array.from(new Set(products.map(p => p.subcategory)));
    }
    return Array.from(new Set(
      products
        .filter(product => productBelongsToCollection(product, selectedCategory))
        .map(product => product.subcategory)
    ));
  }, [selectedCategory, products]);

  const categoryFilterOptions = useMemo(() => {
    const sourceCategories = categories.length > 0 ? categories : CATEGORIES_CONFIG;
    return sourceCategories.map(category => {
      const categoryProducts = products.filter(product => productBelongsToCollection(product, category.id));
      const productSubcategories = Array.from(new Set(
        categoryProducts.map(product => product.subcategory.trim()).filter(Boolean)
      ));

      return {
        ...category,
        productCount: categoryProducts.length,
        subcategories: productSubcategories.length > 0
          ? productSubcategories
          : Array.isArray(category.subcategories) ? category.subcategories : []
      };
    });
  }, [categories, products]);

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (selectedCategory !== categoryId) setSelectedSubcategory('');
    const next = new URLSearchParams(searchParams);
    next.set('category', categoryId);
    if (selectedCategory !== categoryId) next.delete('subcategory');
    setSearchParams(next, { replace: true });
  };

  const selectCategorySubcategory = (categoryId: string, subcategory: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(toSubcategorySlug(subcategory));
    const next = new URLSearchParams(searchParams);
    next.set('category', categoryId);
    next.set('subcategory', toSubcategorySlug(subcategory));
    setSearchParams(next, { replace: true });
  };

  const clearCatalogCategory = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setExpandedCategory('');
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.delete('subcategory');
    setSearchParams(next, { replace: true });
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .map(product => ({
        product,
        searchScore: getProductSearchScore(product, queryParam)
      }))
      .filter(({ product, searchScore }) => {
        // Search query filter
        if (queryParam.trim() && searchScore === 0) return false;

        // Category / Collection filter
        if (selectedCategory && !productBelongsToCollection(product, selectedCategory)) {
          return false;
        }

        // Subcategory filter with slug matching
        if (selectedSubcategory && !matchesSubcategorySlug(product.subcategory, selectedSubcategory)) {
          return false;
        }

        // Filter Param (e.g. bestseller)
        if ((filterParam === 'bestseller' || filterParam === 'featured') && !product.isBestSeller) {
          return false;
        }

        // Price filter
        if (product.retailPrice > maxPrice) {
          return false;
        }

        // In-stock filter
        if (inStockOnly && product.stock <= 0) {
          return false;
        }

        // Direct Mill Deal filter
        if (directMillOnly && !product.isDirectMillDeal) {
          return false;
        }

        // Rating filter
        if (minRating > 0 && product.rating < minRating) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        const a = left.product;
        const b = right.product;
        if (sortBy === 'price-low') return a.retailPrice - b.retailPrice;
        if (sortBy === 'price-high') return b.retailPrice - a.retailPrice;
        if (sortBy === 'discount') {
          const discA = (a.mrp - a.retailPrice) / a.mrp;
          const discB = (b.mrp - b.retailPrice) / b.mrp;
          return discB - discA;
        }
        if (sortBy === 'rating') return b.rating - a.rating;
        return right.searchScore - left.searchScore;
      })
      .map(({ product }) => product);
  }, [
    products,
    queryParam,
    selectedCategory,
    selectedSubcategory,
    filterParam,
    maxPrice,
    inStockOnly,
    directMillOnly,
    minRating,
    sortBy
  ]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setExpandedCategory('');
    setMaxPrice(3000);
    setInStockOnly(false);
    setDirectMillOnly(false);
    setMinRating(0);
    setSearchParams({});
  };

  const hasActiveFilters =
    !!selectedCategory ||
    !!selectedSubcategory ||
    maxPrice < 3000 ||
    inStockOnly ||
    directMillOnly ||
    minRating > 0 ||
    !!queryParam;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Link to="/" className="hover:text-indigo">Home</Link>
        <span>/</span>
        <span className="font-semibold text-navy">Master Product Catalog</span>
        {queryParam && (
          <>
            <span>/</span>
            <span className="text-indigo">Search: "{queryParam}"</span>
          </>
        )}
      </div>

      {/* Catalog Title & Search Bar Ticker */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
            Direct Mill Catalog & Commercial Supplies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {filteredProducts.length} products. Confirm specifications, availability and current pricing before ordering.
          </p>
        </div>

      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle lg:sticky lg:top-36 lg:block">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-navy flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo" />
              <span>Catalog Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-indigo hover:underline font-bold"
              >
                Reset All
              </button>
            )}
          </div>

          <FilterAccordion
            title="Category"
            defaultOpen
            summaryValue={selectedCategory
              ? categoryFilterOptions.find(category => category.id === selectedCategory)?.name
              : 'All Categories'}
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={clearCatalogCategory}
                className={`flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  selectedCategory === ''
                    ? 'bg-indigo-light font-bold text-indigo'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
                {selectedCategory === '' && <Check className="h-3.5 w-3.5" />}
              </button>
              {categoryFilterOptions.map(category => {
                const isExpanded = expandedCategory === category.id;
                const isSelectedCategory = selectedCategory === category.id;
                const selectedSubcategoryName = category.subcategories.find(sub =>
                  matchesSubcategorySlug(sub, selectedSubcategory)
                );

                return (
                  <div key={category.id} className="overflow-hidden rounded-lg border border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCategory('');
                          return;
                        }
                        setExpandedCategory(category.id);
                        selectCategory(category.id);
                      }}
                      aria-expanded={isExpanded}
                      className={`flex min-h-9 w-full items-center gap-1.5 px-2.5 py-2 text-left text-xs ${
                        isSelectedCategory ? 'bg-indigo-light font-bold text-indigo' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{category.name}</span>
                      {selectedSubcategoryName && isSelectedCategory && (
                        <span className="max-w-[35%] truncate text-[10px] font-medium text-indigo">{selectedSubcategoryName}</span>
                      )}
                      <span className="text-[10px] text-slate-400">{category.productCount}</span>
                      {isExpanded
                        ? <Minus className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        : <Plus className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="hide-scrollbar max-h-40 space-y-0.5 overflow-y-auto overscroll-contain border-t border-slate-100 bg-slate-50/70 p-1.5">
                        <button
                          type="button"
                          onClick={() => selectCategory(category.id)}
                          aria-pressed={isSelectedCategory && !selectedSubcategory}
                          className={`flex min-h-8 w-full items-center justify-between rounded-md px-2 text-left text-[11px] ${
                            isSelectedCategory && !selectedSubcategory
                              ? 'bg-white font-bold text-indigo shadow-sm'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span>All {category.name}</span>
                          <span className="flex items-center gap-1.5">
                            {category.productCount}
                            {isSelectedCategory && !selectedSubcategory && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                        {category.subcategories.map(subcategory => {
                          const subcategoryCount = products.filter(product =>
                            productBelongsToCollection(product, category.id) &&
                            product.subcategory.trim() === subcategory
                          ).length;
                          const isSelected = isSelectedCategory && matchesSubcategorySlug(subcategory, selectedSubcategory);
                          return (
                            <button
                              key={subcategory}
                              type="button"
                              onClick={() => selectCategorySubcategory(category.id, subcategory)}
                              aria-pressed={isSelected}
                              className={`flex min-h-8 w-full items-center justify-between gap-1.5 rounded-md px-2 text-left text-[11px] ${
                                isSelected ? 'bg-white font-bold text-indigo shadow-sm' : 'text-slate-600 hover:bg-white'
                              }`}
                            >
                              <span className="min-w-0 truncate">{subcategory}</span>
                              <span className="flex shrink-0 items-center gap-1.5">
                                {subcategoryCount}
                                {isSelected && <Check className="h-3 w-3" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </FilterAccordion>

          <FilterAccordion title="Price" summaryValue={`Up to ₹${maxPrice.toLocaleString('en-IN')}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Maximum retail price</span>
                <span className="font-bold text-indigo">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full cursor-pointer accent-indigo"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹100</span>
                <span>₹1,500</span>
                <span>₹3,000+</span>
              </div>
            </div>
          </FilterAccordion>

          <FilterAccordion
            title="Availability & Deals"
            summaryValue={[inStockOnly && 'In stock', directMillOnly && 'Direct mill'].filter(Boolean).join(', ') || 'Any'}
          >
            <div className="space-y-3 text-xs text-slate-700">
              <label className="flex cursor-pointer select-none items-start gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-indigo focus:ring-indigo/20"
                />
                <span className="font-medium">In Stock Only (Immediate Dispatch)</span>
              </label>

              <label className="flex cursor-pointer select-none items-start gap-2">
                <input
                  type="checkbox"
                  checked={directMillOnly}
                  onChange={e => setDirectMillOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-indigo focus:ring-indigo/20"
                />
                <span className="font-medium">Direct Mill Factory Runs</span>
              </label>
            </div>
          </FilterAccordion>

          <FilterAccordion title="Customer Rating" summaryValue={minRating ? `${minRating}★ & above` : 'Any'}>
            <div className="space-y-1 text-xs">
              {[4, 3, 0].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`w-full text-left px-2.5 py-1 rounded flex items-center gap-1.5 ${
                    minRating === rating
                      ? 'bg-amber-50 text-amber-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating === 0 ? 'All Ratings' : `${rating}★ and above`}</span>
                </button>
              ))}
            </div>
          </FilterAccordion>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Active:</span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  Category: {categoryFilterOptions.find(category => category.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
                </span>
              )}

              {selectedSubcategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  Subcategory: {availableSubcategories.find(s => matchesSubcategorySlug(s, selectedSubcategory)) || selectedSubcategory}
                  <button onClick={() => toggleSubcategory('')}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
                </span>
              )}

              {maxPrice < 3000 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  Under ₹{maxPrice}
                  <button onClick={() => setMaxPrice(3000)}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  In Stock
                  <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-indigo font-bold hover:underline ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <form
              role="search"
              onSubmit={event => event.preventDefault()}
              className="relative min-w-0 w-full lg:flex-1"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={queryParam}
                onChange={event => {
                  const next = new URLSearchParams(searchParams);
                  const query = event.currentTarget.value;
                  if (query.trim()) next.set('q', query);
                  else next.delete('q');
                  setSearchParams(next, { replace: true });
                }}
                placeholder="Search products by name, SKU, or category"
                aria-label="Search catalog products"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-indigo focus:ring-2 focus:ring-indigo/10"
              />
              {queryParam && (
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('q');
                    setSearchParams(next, { replace: true });
                  }}
                  aria-label="Clear catalog search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            <div className="flex items-center justify-between gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-navy shadow-sm transition hover:border-indigo/40 lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={mobileFilterOpen}
              >
                <SlidersHorizontal className="h-4 w-4 text-indigo" />
                <span>Filter &amp; Sort</span>
                {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-indigo" aria-label="Filters active" />}
              </button>
              <div className="hidden min-w-0 items-center gap-2 lg:flex">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-indigo"
                >
                  <option value="relevance">Relevance & Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Highest Discount %</option>
                  <option value="rating">Highest Customer Rating</option>
                </select>
              </div>
              <ProductGridLayoutControls
                desktopColumns={desktopGridColumns}
                mobileColumns={mobileGridColumns}
                onDesktopColumnsChange={setDesktopGridColumns}
                onMobileColumnsChange={setMobileGridColumns}
              />
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <ProductGridSkeleton
              count={8}
              columnsClassName={getProductGridColumnsClassName(mobileGridColumns, desktopGridColumns)}
            />
          ) : filteredProducts.length > 0 ? (
            <InfiniteProductGrid
              key={[
                queryParam,
                categoryParam,
                subcategoryParam,
                filterParam,
                selectedCategory,
                selectedSubcategory,
                maxPrice,
                inStockOnly,
                directMillOnly,
                minRating,
                sortBy
              ].join('|')}
              products={filteredProducts}
              className={getProductGridColumnsClassName(mobileGridColumns, desktopGridColumns)}
            />
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-navy">No Matching Products Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any items matching your active filter criteria. Try adjusting your price range or resetting filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-indigo text-white rounded-xl text-xs font-bold hover:bg-indigo-dark transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Bottom Sheet Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo" />
                <h3 className="font-extrabold text-sm text-navy">Filter &amp; Sort</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 text-slate-400 hover:text-navy rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 overflow-y-auto space-y-5 text-xs flex-1">
              <FilterAccordion title="Sort products" summaryValue={{
                relevance: 'Relevance',
                'price-low': 'Price: Low to High',
                'price-high': 'Price: High to Low',
                discount: 'Highest Discount',
                rating: 'Top Rated'
              }[sortBy]}>
                <div className="space-y-1" role="group" aria-label="Sort products">
                  {[
                    ['relevance', 'Relevance & Best Match'],
                    ['price-low', 'Price: Low to High'],
                    ['price-high', 'Price: High to Low'],
                    ['discount', 'Highest Discount %'],
                    ['rating', 'Highest Customer Rating']
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

              {/* Category Filter */}
              {categoryFilterOptions.length > 0 && (
                <FilterAccordion
                  title="Category"
                  defaultOpen
                  summaryValue={selectedCategory
                    ? categoryFilterOptions.find(category => category.id === selectedCategory)?.name
                    : 'All Categories'}
                >
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={clearCatalogCategory}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selectedCategory === ''
                        ? 'bg-indigo-light text-indigo font-bold border-indigo'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                    {selectedCategory === '' && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                  {categoryFilterOptions.map(category => {
                    const isExpanded = expandedCategory === category.id;
                    const isSelectedCategory = selectedCategory === category.id;
                    const selectedSubcategoryName = category.subcategories.find(sub =>
                      matchesSubcategorySlug(sub, selectedSubcategory)
                    );

                    return (
                      <div key={category.id} className="overflow-hidden rounded-xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedCategory('');
                              return;
                            }
                            setExpandedCategory(category.id);
                            selectCategory(category.id);
                          }}
                          aria-expanded={isExpanded}
                          className={`flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                            isSelectedCategory ? 'bg-indigo-light font-bold text-indigo' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{category.name}</span>
                          {selectedSubcategoryName && isSelectedCategory && (
                            <span className="max-w-[38%] truncate text-xs font-medium text-indigo">{selectedSubcategoryName}</span>
                          )}
                          <span className="text-[11px] text-slate-400">{category.productCount}</span>
                          {isExpanded
                            ? <Minus className="h-4 w-4 shrink-0 text-slate-500" />
                            : <Plus className="h-4 w-4 shrink-0 text-slate-500" />}
                        </button>
                        {isExpanded && (
                          <div className="hide-scrollbar max-h-44 space-y-1 overflow-y-auto overscroll-contain border-t border-slate-100 bg-slate-50/70 p-2">
                            <button
                              type="button"
                              onClick={() => selectCategory(category.id)}
                              aria-pressed={isSelectedCategory && !selectedSubcategory}
                              className={`flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${
                                isSelectedCategory && !selectedSubcategory
                                  ? 'bg-white font-bold text-indigo shadow-sm'
                                  : 'text-slate-600 hover:bg-white'
                              }`}
                            >
                              <span>All {category.name}</span>
                              <span className="flex items-center gap-2">
                                {category.productCount}
                                {isSelectedCategory && !selectedSubcategory && <Check className="h-3.5 w-3.5" />}
                              </span>
                            </button>
                            {category.subcategories.map(subcategory => {
                              const subcategoryCount = products.filter(product =>
                                productBelongsToCollection(product, category.id) &&
                                product.subcategory.trim() === subcategory
                              ).length;
                              const isSelected = isSelectedCategory && matchesSubcategorySlug(subcategory, selectedSubcategory);
                              return (
                                <button
                                  key={subcategory}
                                  type="button"
                                  onClick={() => selectCategorySubcategory(category.id, subcategory)}
                                  aria-pressed={isSelected}
                                  className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${
                                    isSelected ? 'bg-white font-bold text-indigo shadow-sm' : 'text-slate-600 hover:bg-white'
                                  }`}
                                >
                                  <span className="min-w-0 truncate">{subcategory}</span>
                                  <span className="flex shrink-0 items-center gap-2">
                                    {subcategoryCount}
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </FilterAccordion>
              )}

              {/* Price Filter */}
              <FilterAccordion title="Price" summaryValue={`Up to ₹${maxPrice.toLocaleString('en-IN')}`}>
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Maximum retail price</span>
                    <span className="text-indigo">₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="3000"
                    step="50"
                    value={maxPrice}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer rounded-lg bg-slate-200 accent-indigo"
                  />
                </div>
              </FilterAccordion>

              <FilterAccordion
                title="Availability & Deals"
                summaryValue={[inStockOnly && 'In stock', directMillOnly && 'Direct mill'].filter(Boolean).join(', ') || 'Any'}
              >
                <div className="space-y-3">
                  <label className="flex cursor-pointer select-none items-start gap-2">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-indigo focus:ring-indigo/20"
                    />
                    <span className="font-medium text-slate-800">In-Stock Only (Ahmedabad Mill Ready)</span>
                  </label>

                  <label className="flex cursor-pointer select-none items-start gap-2">
                    <input
                      type="checkbox"
                      checked={directMillOnly}
                      onChange={e => setDirectMillOnly(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-indigo focus:ring-indigo/20"
                    />
                    <span className="font-medium text-slate-800">Direct Mill Factory Runs Only</span>
                  </label>
                </div>
              </FilterAccordion>

              <FilterAccordion title="Customer Rating" summaryValue={minRating ? `${minRating}★ & above` : 'Any'}>
                <div className="space-y-1 text-xs">
                  {[4, 3, 0].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setMinRating(rating)}
                      aria-pressed={minRating === rating}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left ${
                        minRating === rating ? 'bg-amber-50 font-bold text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                      <span>{rating === 0 ? 'All Ratings' : `${rating}★ and above`}</span>
                      {minRating === rating && <Check className="ml-auto h-4 w-4 shrink-0" />}
                    </button>
                  ))}
                </div>
              </FilterAccordion>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition text-center"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-4 bg-indigo text-white rounded-xl font-bold text-xs hover:bg-indigo-dark transition text-center shadow-sm"
              >
                Apply ({filteredProducts.length} Items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
