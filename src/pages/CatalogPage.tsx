import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  Search,
  ArrowUpDown,
  Check,
  Star,
  Layers,
  Sparkles
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { products } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const filterParam = searchParams.get('filter') || '';

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [directMillOnly, setDirectMillOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory) {
      return Array.from(new Set(products.map(p => p.subcategory)));
    }
    const cat = CATEGORIES_CONFIG.find(c => c.id === selectedCategory);
    return cat ? cat.subcategories : [];
  }, [selectedCategory, products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        // Search query filter
        if (queryParam) {
          const q = queryParam.toLowerCase();
          const matches =
            product.name.toLowerCase().includes(q) ||
            product.categoryName.toLowerCase().includes(q) ||
            product.subcategory.toLowerCase().includes(q) ||
            product.tags.some(t => t.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category filter
        if (selectedCategory && product.category !== selectedCategory) {
          return false;
        }

        // Subcategory filter
        if (selectedSubcategory && product.subcategory !== selectedSubcategory) {
          return false;
        }

        // Filter Param (e.g. bestseller)
        if (filterParam === 'bestseller' && !product.isBestSeller) {
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
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.retailPrice - b.retailPrice;
        if (sortBy === 'price-high') return b.retailPrice - a.retailPrice;
        if (sortBy === 'discount') {
          const discA = (a.mrp - a.retailPrice) / a.mrp;
          const discB = (b.mrp - b.retailPrice) / b.mrp;
          return discB - discA;
        }
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // relevance
      });
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
            Showing {filteredProducts.length} certified products with multi-tier wholesale rates.
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo" />
            <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 focus:border-indigo outline-none text-navy"
            >
              <option value="relevance">Relevance & Best Match</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount %</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6 sticky top-36">
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

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">Category</label>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(''); setSelectedSubcategory(''); }}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition ${
                  selectedCategory === ''
                    ? 'bg-indigo-light text-indigo font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES_CONFIG.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory('');
                  }}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-light text-indigo font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory Pills */}
          {availableSubcategories.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">Subcategory</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSubcategories.map((sub, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? '' : sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      selectedSubcategory === sub
                        ? 'bg-navy text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Max Retail Price:</span>
              <span className="font-bold text-indigo">₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-indigo cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹100</span>
              <span>₹1,500</span>
              <span>₹3,000+</span>
            </div>
          </div>

          {/* Checkbox Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-indigo focus:ring-indigo/20 accent-indigo"
              />
              <span className="font-medium">In Stock Only (Immediate Dispatch)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={directMillOnly}
                onChange={e => setDirectMillOnly(e.target.checked)}
                className="w-4 h-4 rounded text-indigo focus:ring-indigo/20 accent-indigo"
              />
              <span className="font-medium">Direct Mill Factory Runs</span>
            </label>
          </div>

          {/* Customer Rating Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block">Customer Rating</label>
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
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Active:</span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  Category: {CATEGORIES_CONFIG.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
                </span>
              )}

              {selectedSubcategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                  Subcategory: {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory('')}><X className="w-3 h-3 text-slate-400 hover:text-navy" /></button>
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

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
                <h3 className="font-extrabold text-sm text-navy">Filter Products</h3>
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
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Category</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setSelectedCategory(''); setSelectedSubcategory(''); }}
                    className={`text-left p-2 rounded-xl border text-xs transition ${
                      selectedCategory === ''
                        ? 'bg-indigo-light text-indigo font-bold border-indigo'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES_CONFIG.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory('');
                      }}
                      className={`text-left p-2 rounded-xl border text-xs transition truncate ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-light text-indigo font-bold border-indigo'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories */}
              {availableSubcategories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-800 block">Subcategory</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubcategories.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? '' : sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          selectedSubcategory === sub
                            ? 'bg-navy text-white font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Max Price</span>
                  <span className="text-indigo">₹{maxPrice.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-indigo cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Fast Filters (Checkboxes) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo focus:ring-indigo/20 accent-indigo"
                  />
                  <span className="font-medium text-slate-800">In-Stock Only (Ahmedabad Mill Ready)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={directMillOnly}
                    onChange={e => setDirectMillOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo focus:ring-indigo/20 accent-indigo"
                  />
                  <span className="font-medium text-slate-800">Direct Mill Factory Runs Only</span>
                </label>
              </div>
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
