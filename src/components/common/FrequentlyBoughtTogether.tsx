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
  const bundleProductIds = bundleProducts.map(p => p.id).join('|');
  const selectionKey = `${currentProduct.id}|${bundleProductIds}`;
  const allAvailable = [currentProduct, ...bundleProducts];
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] });
  const selectedItems = selection.key === selectionKey
    ? selection.ids
    : allAvailable.map(p => p.id);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // If disabled by admin or no bundle products, do not render
  if (bundleOffer?.enabled === false || bundleProducts.length === 0) return null;

  const toggleItem = (id: string) => {
    // Current product cannot be deselected
    if (id === currentProduct.id) return;
    if (selectedItems.includes(id)) {
      setSelection({ key: selectionKey, ids: selectedItems.filter(item => item !== id) });
    } else {
      setSelection({ key: selectionKey, ids: [...selectedItems, id] });
    }
  };

  const activeProducts = allAvailable.filter(p => selectedItems.includes(p.id));

  const handleAddBundle = () => {
    activeProducts.forEach(p => {
      addToCart(p, p.moq || 1);
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2500);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 rounded-2xl p-4 sm:rounded-3xl sm:p-7 border border-indigo-100 shadow-subtle space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo text-white flex shrink-0 items-center justify-center">
            <Sparkles className="w-4 h-4 text-champagne" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base text-navy">
              {bundleOffer?.title || 'Frequently Bought Together • Mill Saver Bundle'}
            </h3>
            <p className="text-[10px] leading-snug text-slate-500 sm:text-[11px]">
              {bundleOffer?.subtitle || 'Customers frequently combine these complementary mill-grade essentials'}
            </p>
          </div>
        </div>

      </div>

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
        {/* Products Visual Strip */}
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-3">
          {allAvailable.map((prod, idx) => {
            const isSelected = selectedItems.includes(prod.id);
            const isMain = prod.id === currentProduct.id;
            return (
              <React.Fragment key={prod.id}>
                {idx > 0 && <Plus className="h-4 w-4 rotate-90 self-center text-slate-400 md:rotate-0" />}
                <div
                  onClick={() => toggleItem(prod.id)}
                  className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border p-2.5 transition cursor-pointer select-none md:w-auto md:gap-3 md:rounded-2xl ${
                    isSelected
                      ? 'border-indigo/50 bg-white shadow-sm'
                      : 'border-slate-200 bg-slate-50/60 opacity-60'
                  }`}
                >
                  <img
                    src={prod.images[0]}
                    alt={prod.name}
                    className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 object-cover sm:h-14 sm:w-14 sm:rounded-xl"
                  />
                  <div className="min-w-0 flex-1 text-xs md:max-w-[150px]">
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
                    <p className="line-clamp-2 break-words text-[11px] font-bold text-navy">{prod.name}</p>
                    <p className="font-extrabold text-navy text-xs">
                      ₹{prod.retailPrice.toLocaleString('en-IN')} each
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & CTA */}
        <div className="flex w-full min-w-0 shrink-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:w-auto md:min-w-[240px]">
          <div>
            <span className="text-[11px] text-slate-500 block">
              {activeProducts.length} selected items
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Cart prices use each item&apos;s quantity tier. No bundle discount is applied.
            </p>
          </div>

          <button
            onClick={handleAddBundle}
            className={`min-h-11 w-full rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
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
