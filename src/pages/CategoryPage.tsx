import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { ProductCard } from '../components/common/ProductCard';
import { CategoryId } from '../types';
import { Layers, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { toSubcategorySlug, matchesSubcategorySlug, productBelongsToCollection } from '../utils/productCategories';

export const CategoryPage: React.FC = () => {
  const { categoryId, subcategorySlug } = useParams<{ categoryId: string; subcategorySlug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, categories } = useApp();

  const selectedSubcategory = subcategorySlug || searchParams.get('subcategory') || '';
  const [sortBy, setSortBy] = useState<string>('relevance');

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

  // Filter products for this category using multi-collection and slug-tolerant matching
  const categoryProducts = products
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
    });
  const availableSubcategories = Array.from(new Set(
    products.filter(product => productBelongsToCollection(product, categoryId)).map(product => product.subcategory)
  ));

  const matchedSubcategoryName = availableSubcategories.find(s => matchesSubcategorySlug(s, selectedSubcategory));

  // Dynamic SEO title
  useEffect(() => {
    if (categoryConfig) {
      const subTitle = matchedSubcategoryName ? ` - ${matchedSubcategoryName}` : '';
      document.title = `${categoryConfig.name}${subTitle} | Mahalaxmi Enterprises`;
    }
  }, [categoryConfig, matchedSubcategoryName]);

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
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:flex md:items-center md:justify-between md:gap-6 md:rounded-none md:border-0 md:border-b md:bg-transparent md:px-0 md:pb-4 md:shadow-none">
          {/* Subcategory Pills */}
          <div className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2 md:mb-3">
              <span className="text-xs font-bold text-navy sm:text-sm">Shop by type</span>
              <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            <div
              aria-label="Filter by subcategory"
              className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0"
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

          {/* Sort Dropdown */}
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 md:mt-0 md:shrink-0 md:border-0 md:pt-0">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
            <label htmlFor="category-sort" className="shrink-0 text-xs font-medium text-slate-500">Sort:</label>
            <select
              id="category-sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-indigo md:flex-none"
            >
              <option value="relevance">Featured & Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Savings %</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8">
          {categoryProducts.length > 0 ? (
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {categoryProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
    </div>
  );
};
