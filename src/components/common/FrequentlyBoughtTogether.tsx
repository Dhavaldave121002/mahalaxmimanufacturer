import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Plus, Check, ShoppingBag, Sparkles } from 'lucide-react';

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product;
  bundleProducts: Product[];
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  currentProduct,
  bundleProducts
}) => {
  const { addToCart, bundleOffer } = useApp();
  const [selectedItems, setSelectedItems] = useState<string[]>([
    currentProduct.id,
    ...bundleProducts.map(p => p.id)
  ]);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // If disabled by admin or no bundle products, do not render
  if (bundleOffer?.enabled === false || bundleProducts.length === 0) return null;

  const toggleItem = (id: string) => {
    // Current product cannot be deselected
    if (id === currentProduct.id) return;
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  const discountPercent = bundleOffer?.discountPercentage ?? 15;
  const minItemsForDiscount = bundleOffer?.minItemsForDiscount ?? 2;

  const allAvailable = [currentProduct, ...bundleProducts];
  const activeProducts = allAvailable.filter(p => selectedItems.includes(p.id));

  const standardTotal = activeProducts.reduce((sum, p) => sum + p.retailPrice, 0);
  const bundleDiscountMultiplier = activeProducts.length >= minItemsForDiscount ? (100 - discountPercent) / 100 : 1.0;
  const finalBundlePrice = Math.round(standardTotal * bundleDiscountMultiplier);
  const bundleSavings = standardTotal - finalBundlePrice;

  const handleAddBundle = () => {
    activeProducts.forEach(p => {
      addToCart(p, p.moq || 1);
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 rounded-3xl p-6 sm:p-7 border border-indigo-100 shadow-subtle space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-champagne" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-navy">
              {bundleOffer?.title || 'Frequently Bought Together • Mill Saver Bundle'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {bundleOffer?.subtitle || 'Customers frequently combine these complementary mill-grade essentials'}
            </p>
          </div>
        </div>

        {bundleSavings > 0 && (
          <span className="hidden sm:inline-block text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
            {bundleOffer?.badgeText || `Extra ${discountPercent}% Bundle Discount Applied`}
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Products Visual Strip */}
        <div className="flex flex-wrap items-center gap-3">
          {allAvailable.map((prod, idx) => {
            const isSelected = selectedItems.includes(prod.id);
            const isMain = prod.id === currentProduct.id;
            return (
              <React.Fragment key={prod.id}>
                {idx > 0 && <Plus className="w-4 h-4 text-slate-400 shrink-0" />}
                <div
                  onClick={() => toggleItem(prod.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl border transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-indigo/50 bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="w-14 h-14 object-cover rounded-xl border border-slate-100"
                  />
                  <div className="text-xs max-w-[150px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isMain}
                        onChange={() => toggleItem(prod.id)}
                        className="rounded text-indigo focus:ring-indigo h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-indigo truncate">
                        {isMain ? 'Current Item' : 'Add On'}
                      </span>
                    </div>
                    <p className="font-bold text-navy text-[11px] line-clamp-1">{prod.name}</p>
                    <p className="font-extrabold text-navy text-xs">
                      ₹{prod.retailPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & CTA */}
        <div className="w-full md:w-auto p-4 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex flex-col justify-between gap-3 min-w-[240px]">
          <div>
            <span className="text-[11px] text-slate-500 block">
              Bundle Price ({activeProducts.length} items):
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-navy">
                ₹{finalBundlePrice.toLocaleString('en-IN')}
              </span>
              {bundleSavings > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{standardTotal.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {bundleSavings > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                You save ₹{bundleSavings.toLocaleString('en-IN')} ({discountPercent}% off combo)
              </span>
            )}
          </div>

          <button
            onClick={handleAddBundle}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo hover:bg-indigo-dark text-white'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4" />
                <span>Bundle Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-champagne" />
                <span>Add {activeProducts.length} Items to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
