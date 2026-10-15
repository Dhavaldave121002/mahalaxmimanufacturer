import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Home, Layers, Building2, Package, ShoppingCart } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cartTotalItemsCount } = useApp();

  // Hide on product detail pages and admin dashboard
  if (location.pathname.startsWith('/product/') || location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Categories', path: '/catalog', icon: Layers },
    { label: 'Bulk RFQ', path: '/wholesale', icon: Building2 },
    { label: 'My Orders', path: '/orders', icon: Package },
    { label: 'Cart', path: '/cart', icon: ShoppingCart, hasBadge: true }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 shadow-premium flex items-center justify-around">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={idx}
            to={item.path}
            aria-label={item.hasBadge && cartTotalItemsCount > 0 ? `${item.label}, ${cartTotalItemsCount} items in cart` : item.label}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition relative ${
              isActive ? 'text-indigo font-bold' : 'text-slate-500 hover:text-navy font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo' : 'text-slate-500'}`} />
              {item.hasBadge && cartTotalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-error text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartTotalItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
