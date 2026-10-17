import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose }) => {
  const { wishlist, removeFromWishlist, clearWishlist, addToCart, products, currentUser } = useApp();

  if (!isOpen) return null;

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const handleMoveToCart = (prod: any) => {
    addToCart(prod, prod.moq || 1);
    removeFromWishlist(prod.id);
  };

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach(prod => {
      addToCart(prod, prod.moq || 1);
    });
    clearWishlist();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-navy text-sm sm:text-base">Saved Mill Essentials</h3>
                <p className="text-[11px] text-slate-500">
                  {currentUser?.name ? `${currentUser.name.split(' ')[0]}'s Wishlist` : 'Guest Wishlist'} ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm">Your wishlist is currently empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Save your favourite cotton bedsheets, bath towels, and institutional linen for instant future booking.
                  </p>
                </div>
                <Link
                  to="/catalog"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo hover:bg-indigo-dark text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  <span>Explore Direct Mill Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              wishlistProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-white flex gap-3.5 items-center group shadow-subtle"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/product/${product.slug}`}
                      onClick={onClose}
                      className="font-bold text-xs text-navy hover:text-indigo transition line-clamp-1 block"
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-indigo text-xs">₹{product.retailPrice}</span>
                      <span className="text-[11px] text-slate-400 line-through">₹{product.mrp}</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                        Direct Mill
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(product)}
                        className="px-2.5 py-1 bg-navy hover:bg-navy-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <ShoppingCart className="w-3 h-3 text-champagne" />
                        <span>Move to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(product.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition rounded-lg"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {wishlistProducts.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
              <button
                type="button"
                onClick={handleMoveAllToCart}
                className="w-full py-3 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <ShoppingCart className="w-4 h-4 text-champagne" />
                <span>Move All to Cart ({wishlistProducts.length} Items)</span>
              </button>
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-slate-500 hover:text-red-600 text-[11px] font-medium transition cursor-pointer"
                >
                  Clear Wishlist
                </button>
                <span className="text-[11px] text-slate-400">
                  Auto-saved to your account
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
