import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { WhatsAppWidget } from './components/common/WhatsAppWidget';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Eager load HomePage for instant LCP & FCP
import { HomePage } from './pages/HomePage';

// Code-split remaining routes for minimal initial JS payload
const CatalogPage = lazy(() => import('./pages/CatalogPage').then(m => ({ default: m.CatalogPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const WholesalePage = lazy(() => import('./pages/WholesalePage').then(m => ({ default: m.WholesalePage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lightweight loading placeholder
const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="w-8 h-8 border-3 border-indigo border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Scroll to top component on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  // Handle chunk loading failures when a new version deploys to Vercel
  useEffect(() => {
    const handlePreloadError = () => {
      console.warn('Vite preload error detected, reloading page with latest chunks...');
      window.location.reload();
    };
    window.addEventListener('vite:preloadError', handlePreloadError);
    return () => window.removeEventListener('vite:preloadError', handlePreloadError);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-ivory text-navy selection:bg-indigo selection:text-white w-full max-w-full">
            <Header />
            <main className="flex-1">
              <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrderTrackingPage />} />
                <Route path="/wholesale" element={<WholesalePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/login" element={<LoginPage defaultTab="login" />} />
                <Route path="/register" element={<LoginPage defaultTab="register" />} />
                <Route path="/forgot-password" element={<LoginPage defaultTab="forgot" />} />
                {/* Fallback */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <WhatsAppWidget />
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
