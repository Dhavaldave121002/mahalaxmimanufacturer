import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG } from '../data/mockProducts';
import { ProductCard } from '../components/common/ProductCard';
import { CategoryId } from '../types';
import { Layers, ArrowLeft, SlidersHorizontal } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { products, categories } = useApp();

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');

  const allCats = categories && categories.length > 0 ? categories : CATEGORIES_CONFIG;
  const categoryConfig = allCats.find(c => c.id === categoryId);

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

  // Filter products for this category
  const categoryProducts = products
    .filter(p => {
      if (p.category !== categoryId) return false;
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
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
    products.filter(product => product.category === categoryId).map(product => product.subcategory)
  ));

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
            <span className="text-champagne font-semibold">{categoryConfig.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="badge-mill text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                PRODUCT CATEGORY
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {categoryConfig.name}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Browse source-listed products in {categoryConfig.name}. Confirm product specifications, current availability and prices before ordering.
              </p>
              <p className="pt-2 text-xs text-amber-200">
                Confirm product specifications, availability and current pricing before ordering.
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-slate-700 shadow-premium">
                <img
                  src={categoryConfig.image}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          {/* Subcategory Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedSubcategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedSubcategory === ''
                  ? 'bg-navy text-white shadow-subtle'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All {categoryConfig.name} ({products.filter(p => p.category === categoryId).length})
            </button>

            {availableSubcategories.map((sub, i) => {
              const count = products.filter(p => p.category === categoryId && p.subcategory === sub).length;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? '' : sub)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedSubcategory === sub
                      ? 'bg-indigo text-white shadow-subtle'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub} {count > 0 && <span className="opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:border-indigo outline-none text-navy"
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
                onClick={() => setSelectedSubcategory('')}
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
