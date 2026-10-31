import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  CartItem,
  User,
  Order,
  Quotation,
  BusinessEnquiry,
  Address,
  WholesaleTier,
  ProductVariant,
  AppBanner,
  AppCategoryConfig,
  AppNotification,
  AppSettings,
  MobileAppConfig,
  CouponOffer,
  PaymentMethod,
  CollectionCategory,
  WalletTransaction,
  ProductCustomization,
  BundleOfferConfig
} from '../types';
import { INITIAL_PRODUCTS, CATEGORIES_CONFIG } from '../data/mockProducts';
import { normalizeProductCategory } from '../utils/productCategories';
import { INITIAL_MOBILE_APP_CONFIG } from '../data/initialAppConfig';
import { INITIAL_COUPONS } from '../data/initialCoupons';
import { getCustomizationCharge, getSizeCharge, updateCustomizationPricing } from '../constants/customizationPricing';

interface PinCodeInfo {
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  estimatedDays: number;
  verified?: boolean;
}

const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  // Surat & South Gujarat Direct Dispatch Hub
  '395001': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395002': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395003': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395004': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395005': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395006': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395007': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395008': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395009': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395010': { city: 'Surat', state: 'Gujarat', days: 1 },
  '394210': { city: 'Surat', state: 'Gujarat', days: 1 },
  '394221': { city: 'Surat', state: 'Gujarat', days: 1 },
  // Ahmedabad & North Gujarat
  '380001': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '380006': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '380009': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '380015': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '380054': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '382481': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  // Other Gujarat Cities
  '390001': { city: 'Vadodara', state: 'Gujarat', days: 2 },
  '360001': { city: 'Rajkot', state: 'Gujarat', days: 2 },
  '361001': { city: 'Jamnagar', state: 'Gujarat', days: 2 },
  '364001': { city: 'Bhavnagar', state: 'Gujarat', days: 2 },
  '396001': { city: 'Valsad', state: 'Gujarat', days: 1 },
  '396191': { city: 'Vapi', state: 'Gujarat', days: 1 },
  '396445': { city: 'Navsari', state: 'Gujarat', days: 1 },
  // Major Metros & National Hubs
  '400001': { city: 'Mumbai', state: 'Maharashtra', days: 2 },
  '411001': { city: 'Pune', state: 'Maharashtra', days: 2 },
  '110001': { city: 'New Delhi', state: 'Delhi', days: 3 },
  '560001': { city: 'Bengaluru', state: 'Karnataka', days: 3 },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', days: 4 },
  '700001': { city: 'Kolkata', state: 'West Bengal', days: 4 },
  '500001': { city: 'Hyderabad', state: 'Telangana', days: 3 },
  '302001': { city: 'Jaipur', state: 'Rajasthan', days: 3 },
  '641601': { city: 'Tirupur', state: 'Tamil Nadu', days: 2 },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', days: 3 },
  '122001': { city: 'Gurugram', state: 'Haryana', days: 3 }
};

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: CollectionCategory[];
  addCategory: (category: Omit<CollectionCategory, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CollectionCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, customization?: ProductCustomization) => boolean;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discount?: number }>;
  removeCoupon: () => void;
  coupons: CouponOffer[];
  refreshCoupons: () => Promise<void>;
  addCoupon: (coupon: Omit<CouponOffer, 'id' | 'usedCount' | 'createdAt'>) => void;
  updateCoupon: (id: string, updates: Partial<CouponOffer>) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponActive: (id: string) => void;
  toggleCouponFeatured: (id: string) => void;
  cartSubtotal: number;
  cartTax: { cgst: number; sgst: number; igst: number; totalTax: number };
  cartShipping: number;
  cartTotal: number;
  cartTotalItemsCount: number;

  // Wishlist
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // User & Auth
  currentUser: User;
  isLoggedIn: boolean;
  registeredUsers: User[];
  login: (identifier: string, password?: string, otp?: string) => { success: boolean; message: string; user?: User };
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: 'consumer' | 'retailer' | 'wholesaler' | 'admin';
    businessType?: User['businessType'];
    companyName?: string;
    gstNumber?: string;
  }) => { success: boolean; message: string; user?: User };
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; message: string }>;
  requestOtp: (identifier: string) => { success: boolean; message: string; otp?: string };
  resetPassword: (identifier: string, otp: string, newPassword: string) => { success: boolean; message: string };
  updateUserProfile: (profile: Partial<User>) => void;
  addSavedAddress: (address: Omit<Address, 'id'>) => void;

  // Mill Points & Wallet Operations
  topUpWallet: (amount: number, paymentRef?: string) => Promise<{ success: boolean; message: string; balance?: number }>;
  creditRefundToWallet: (customerEmail: string, amount: number, orderNumber: string, orderId?: string) => Promise<{ success: boolean; message: string }>;
  redeemWalletPoints: (amount: number, orderNumber: string, orderId?: string) => Promise<{ success: boolean; message: string }>;

  // Orders
  orders: Order[];
  ordersSyncError: string | null;
  createOrder: (orderData: {
    paymentMethod: PaymentMethod;
    shippingAddress: Address;
    billingAddress: Address;
    pointsRedeemed?: number;
    amountPaid?: number;
    timelineNote?: string;
    customerEmail?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingNumber?: string, courierName?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  requestReturnOrExchange: (orderId: string, type: 'RETURN' | 'EXCHANGE', reason: string, comment?: string) => Promise<{ success: boolean; message: string }>;
  sendAbandonedCartEmail: (email?: string, name?: string) => Promise<{ success: boolean; message: string }>;
  refreshOrders: () => Promise<void>;

  // Wholesale RFQs & Quotations
  quotations: Quotation[];
  createQuotationRequest: (items: { productId: string; quantity: number; targetPrice?: number }[], notes?: string) => Quotation;
  updateQuotationByStaff: (quoteId: string, updatedItems: { productId: string; quotedUnitPrice: number }[], notes?: string) => void;
  acceptAndConvertQuotation: (quoteId: string) => Order | null;

  // Enquiries
  enquiries: BusinessEnquiry[];
  submitBusinessEnquiry: (enquiry: Omit<BusinessEnquiry, 'id' | 'createdAt' | 'status'>) => void;

  // Product Admin Operations
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => void;
  adjustProductStock: (id: string, delta: number) => void;

  // PIN Code Tool
  deliveryPincode: string;
  deliveryInfo: PinCodeInfo | null;
  checkPincode: (pin: string) => PinCodeInfo;

  // Search & Navigation
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;

  // Mobile App (Flutter) Management
  mobileAppConfig: MobileAppConfig;
  updateMobileAppBanners: (banners: AppBanner[]) => void;
  addMobileAppBanner: (banner: Omit<AppBanner, 'id' | 'displayOrder'>) => void;
  updateMobileAppBanner: (id: string, banner: Partial<AppBanner>) => void;
  deleteMobileAppBanner: (id: string) => void;
  reorderMobileAppBanner: (bannerId: string, direction: 'up' | 'down') => void;
  toggleMobileAppBannerActive: (id: string) => void;
  updateMobileAppCategories: (categories: AppCategoryConfig[]) => void;
  updateMobileAppCategoryConfig: (id: string, updates: Partial<AppCategoryConfig>) => void;
  updateMobileAppSettings: (settings: Partial<AppSettings>) => void;
  sendAppPushNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isSent'>) => Promise<void>;
  deleteAppNotification: (id: string) => void;
  toggleAppExclusiveProduct: (productId: string) => void;
  syncConfigToFlutter: () => { success: boolean; message: string; timestamp: string };

  // Mill Saver Bundle Config (Admin & Database Controllable)
  bundleOffer: BundleOfferConfig;
  updateBundleOffer: (config: Partial<BundleOfferConfig>) => Promise<boolean>;

  // Customization Condition Pricing Config (Admin Controllable)
  customizationPricing: Record<string, number>;
  updateCustomizationPricingConfig: (pricing: Record<string, number>) => Promise<{ success: boolean; message: string }>;
}

const GUEST_USER_PROFILE: User = {
  id: 'guest',
  name: '',
  email: '',
  phone: '',
  role: 'consumer',
  addresses: [],
  walletBalance: 0,
  walletTransactions: []
};

function safeLoadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') {
      return fallback;
    }
    const parsed = JSON.parse(saved);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch (err) {
    console.warn(`[MLE Storage] Corrupted localStorage key "${key}" detected; resetting:`, err);
    try {
      localStorage.removeItem(key);
    } catch {}
    return fallback;
  }
}

function safeLoadArray<T>(key: string, fallback: T[]): T[] {
  const data = safeLoadFromStorage<T[]>(key, fallback);
  return Array.isArray(data) && data.length > 0 ? data : fallback;
}

function uniqueOrders(orders: Order[]): Order[] {
  const unique = new Map<string, Order>();
  const unkeyed: Order[] = [];
  for (const order of orders) {
    const key = (order.orderNumber || order.id || '').trim().toLowerCase();
    if (!key) {
      unkeyed.push(order);
      continue;
    }
    if (!unique.has(key)) unique.set(key, order);
  }
  return [...unique.values(), ...unkeyed];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    if (import.meta.env.PROD) return [];
    return safeLoadArray<Product>('mle_products', INITIAL_PRODUCTS).map(normalizeProductCategory);
  });

  const [categories, setCategories] = useState<CollectionCategory[]>(() => {
    return safeLoadArray<CollectionCategory>('mle_categories', CATEGORIES_CONFIG);
  });

  useEffect(() => {
    try {
      localStorage.setItem('mle_categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories')
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.categories)) {
          throw new Error(data?.error || `Categories could not be loaded (HTTP ${response.status}).`);
        }

        const databaseCategories: CollectionCategory[] = data.categories.map((category: Record<string, unknown>) => {
          const id = String(category.id || '');
          const config = CATEGORIES_CONFIG.find(item => item.id === id);
          const image = typeof category.image === 'string' ? category.image.trim() : '';
          const databaseDescription = typeof category.description === 'string'
            ? category.description.trim()
            : '';
          return {
            id,
            name: typeof category.name === 'string' ? category.name : config?.name || id,
            tagline: config?.tagline || '',
            image: image
              ? image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')
                ? image
                : `/${image}`
              : config?.image || '',
            description: databaseDescription || config?.description || '',
            subcategories: products
              .filter(product => product.category === id)
              .map(product => product.subcategory.trim())
              .filter((subcategory, index, subcategories) =>
                subcategory.length > 0 && subcategories.indexOf(subcategory) === index
              ),
            color: typeof category.color === 'string'
              ? category.color
              : typeof category.theme_color === 'string'
                ? category.theme_color
                : undefined,
            isFeaturedInApp: category.isFeaturedInApp !== false && category.is_featured_in_app !== false
          };
        });
        if (!cancelled) setCategories(databaseCategories);
      })
      .catch(error => {
        console.warn('Category database sync failed; using configured category images:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addCategory = async (categoryData: Omit<CollectionCategory, 'id'>) => {
    const slugId = categoryData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newCat: CollectionCategory = {
      ...categoryData,
      id: slugId || ('cat-' + Date.now())
    };
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || `Collection could not be created (HTTP ${response.status}).`);
    }
    setCategories(prev => [...prev, newCat]);

    // Also sync to Flutter App categories
    setMobileAppConfig(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          id: 'app-cat-' + newCat.id,
          name: newCat.name,
          color: newCat.color || '#312E81',
          iconName: 'checkroom',
          image: newCat.image,
          productCountText: '0 Products',
          isFeaturedInApp: true,
          displayOrder: prev.categories.length + 1
        }
      ],
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const updateCategory = async (id: string, updates: Partial<CollectionCategory>) => {
    const existingCategory = categories.find(category => category.id === id);
    if (!existingCategory) throw new Error('Collection could not be found.');
    const updatedCategory = { ...existingCategory, ...updates };
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategory)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || `Collection could not be saved (HTTP ${response.status}).`);
    }
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));

    // Synchronize to mobileAppConfig as well
    setMobileAppConfig(prev => ({
      ...prev,
      categories: prev.categories.map(ac => {
        if (ac.id === 'app-cat-' + id || ac.name.toLowerCase() === id.toLowerCase()) {
          return {
            ...ac,
            name: updates.name || ac.name,
            image: updates.image || ac.image,
            color: updates.color || ac.color
          };
        }
        return ac;
      }),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || `Collection could not be deleted (HTTP ${response.status}).`);
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    setMobileAppConfig(prev => ({
      ...prev,
      categories: prev.categories.filter(ac => ac.id !== 'app-cat-' + id && ac.name.toLowerCase() !== id.toLowerCase()),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    if (import.meta.env.PROD) return [];
    return safeLoadArray<User>('mle_users', []);
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (import.meta.env.PROD) return false;
    try {
      const saved = localStorage.getItem('mle_is_logged_in');
      // Default to FALSE: fresh/guest sessions must explicitly log in.
      // Previously defaulted to true which caused demo wallet balance to show for guests.
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (import.meta.env.PROD) return GUEST_USER_PROFILE;
    try {
      const saved = localStorage.getItem('mle_current_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse mle_current_user, resetting:', e);
      try { localStorage.removeItem('mle_current_user'); } catch {}
    }
    return GUEST_USER_PROFILE;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    return safeLoadFromStorage<CartItem[]>('mle_cart', []);
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // User-Keyed Persistent Wishlist State
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const email = currentUser?.email ? currentUser.email.toLowerCase() : null;
      const userKey = email ? `mle_wishlist_${email}` : 'mle_wishlist_guest';
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem('mle_wishlist');
      if (legacy) return JSON.parse(legacy);
    } catch {}
    return [];
  });

  // When currentUser logs in or switches, load their user-specific wishlist and merge guest items
  useEffect(() => {
    if (!currentUser?.email) return;
    const email = currentUser.email.toLowerCase();
    const userKey = `mle_wishlist_${email}`;
    let currentItems: string[] = [];

    try {
      const saved = localStorage.getItem(userKey);
      if (saved) currentItems = JSON.parse(saved);
      const guestSaved = localStorage.getItem('mle_wishlist_guest');
      if (guestSaved) {
        const guestItems = JSON.parse(guestSaved);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          currentItems = Array.from(new Set([...currentItems, ...guestItems]));
          localStorage.removeItem('mle_wishlist_guest');
        }
      }
    } catch {}

    if (currentItems.length > 0) {
      setWishlist(currentItems);
      localStorage.setItem(userKey, JSON.stringify(currentItems));
    }

    // Fetch from central MySQL wishlist API
    fetch(`/api/wishlist?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.productIds)) {
          const merged = Array.from(new Set([...currentItems, ...data.productIds]));
          setWishlist(merged);
          localStorage.setItem(userKey, JSON.stringify(merged));
          if (merged.length > data.productIds.length) {
            fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, productIds: merged })
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [currentUser?.email]);

  // Persist wishlist whenever updated
  useEffect(() => {
    const email = currentUser?.email ? currentUser.email.toLowerCase() : null;
    const userKey = email ? `mle_wishlist_${email}` : 'mle_wishlist_guest';
    try {
      localStorage.setItem(userKey, JSON.stringify(wishlist));
      localStorage.setItem('mle_wishlist', JSON.stringify(wishlist));
    } catch {}

    if (email) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productIds: wishlist })
      }).catch(() => {});
    }
  }, [wishlist, currentUser?.email]);

  const addToWishlist = (productId: string) => {
    setWishlist(prev => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(id => id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => (prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  // Dynamic Coupons & Offers Management State
  const [coupons, setCoupons] = useState<CouponOffer[]>(() => {
    try {
      const saved = localStorage.getItem('mle_coupons');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize: Enforce that LAUNCH150 and any SECRET_MANUAL_ONLY coupon is NOT publicly featured
          return parsed.map((c: CouponOffer) => {
            const code = (c.code || '').trim().toUpperCase();
            if (code === 'LAUNCH150' || c.suggestionMode === 'SECRET_MANUAL_ONLY') {
              return {
                ...c,
                isFeatured: false,
                suggestionMode: 'SECRET_MANUAL_ONLY' as const
              };
            }
            return c;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse mle_coupons, resetting:', e);
    }
    return INITIAL_COUPONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mle_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Failed to persist mle_coupons:', e);
    }
  }, [coupons]);

  // Synchronize coupons live from MySQL / Central API
  const syncCouponsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons');
      if (!res.ok) {
        console.error(`Coupon API request failed (${res.status}).`);
        return;
      }
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setCoupons(json.data.map((coupon: CouponOffer) => ({
          ...coupon,
          isFeatured: coupon.code.toUpperCase() === 'LAUNCH150' ? false : coupon.isFeatured,
          suggestionMode: coupon.code.toUpperCase() === 'LAUNCH150'
            ? 'SECRET_MANUAL_ONLY'
            : coupon.suggestionMode
        })));
      } else {
        console.error('Coupon API returned an invalid response.');
      }
    } catch (error) {
      console.error('Failed to load coupons from the API:', error);
    }
  }, []);

  const refreshCoupons = syncCouponsFromBackend;

  useEffect(() => {
    syncCouponsFromBackend();
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncCouponsFromBackend();
    };
    const interval = window.setInterval(syncWhenVisible, 60000);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [syncCouponsFromBackend]);

  // Synchronize products live from MySQL / Central API
  const syncProductsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        console.error(`Product API request failed (${res.status}).`);
        return;
      }
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setProducts((json.data as Product[]).map(normalizeProductCategory));
      } else {
        console.error('Product API returned an invalid response.');
      }
    } catch (error) {
      console.error('Failed to load products from the API:', error);
    }
  }, []);

  useEffect(() => {
    syncProductsFromBackend();
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncProductsFromBackend();
    };
    const interval = window.setInterval(syncWhenVisible, 60000);
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [syncProductsFromBackend]);

  // Synchronize users live from MySQL / Central API
  const syncUsersFromBackend = useCallback(async () => {
    if (!isLoggedIn || currentUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/auth');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.users) && json.users.length > 0) {
        setRegisteredUsers(prev => {
          const map = new Map<string, User>();
          for (const u of json.users) {
            const key = (u.email || '').trim().toLowerCase();
            if (key) map.set(key, u);
          }
          for (const u of prev) {
            const key = (u.email || '').trim().toLowerCase();
            if (key && !map.has(key)) {
              map.set(key, u);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch {
      // quiet offline fallback
    }
  }, [currentUser.role, isLoggedIn, setRegisteredUsers]);

  useEffect(() => {
    if (!isLoggedIn || currentUser.role !== 'admin') return;
    syncUsersFromBackend();
    const interval = setInterval(syncUsersFromBackend, 12000);
    return () => clearInterval(interval);
  }, [currentUser.role, isLoggedIn, syncUsersFromBackend]);

  const addCoupon = (coupon: Omit<CouponOffer, 'id' | 'usedCount' | 'createdAt'>) => {
    const newCoupon: CouponOffer = {
      ...coupon,
      id: `coup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: coupon.code.trim().toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    setCoupons(prev => [newCoupon, ...prev]);

    // Save to MySQL database via API
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon)
    }).catch(() => {});
  };

  const updateCoupon = (id: string, updates: Partial<CouponOffer>) => {
    let targetCoupon: CouponOffer | null = null;
    setCoupons(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (updates.code) updated.code = updates.code.trim().toUpperCase();
          targetCoupon = updated;
          return updated;
        }
        return c;
      })
    );

    if (targetCoupon) {
      fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetCoupon)
      }).catch(() => {});
    }
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const toggleCouponActive = (id: string) => {
    let updatedCoupon: CouponOffer | null = null;
    setCoupons(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedCoupon = { ...c, isActive: !c.isActive };
          return updatedCoupon;
        }
        return c;
      })
    );

    if (updatedCoupon) {
      fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCoupon)
      }).catch(() => {});
    }
  };

  const toggleCouponFeatured = (id: string) => {
    let updatedCoupon: CouponOffer | null = null;
    setCoupons(prev =>
      prev.map(c => {
        if (c.id === id) {
          const newFeatured = !c.isFeatured;
          updatedCoupon = {
            ...c,
            isFeatured: newFeatured,
            suggestionMode: newFeatured ? 'PUBLIC_1CLICK' : 'SECRET_MANUAL_ONLY'
          };
          return updatedCoupon;
        }
        return c;
      })
    );

    if (updatedCoupon) {
      fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCoupon)
      }).catch(() => {});
    }
  };

  const [deliveryPincode, setDeliveryPincode] = useState<string>('395002');
  const [deliveryInfo, setDeliveryInfo] = useState<PinCodeInfo | null>({
    pincode: '395002',
    city: 'Surat',
    state: 'Gujarat',
    serviceable: true,
    estimatedDays: 1
  });

  // Mill Saver Bundle Config (Admin & Database Controllable)
  const defaultBundleOffer: BundleOfferConfig = {
    enabled: true,
    title: 'Frequently Bought Together • Mill Saver Bundle',
    subtitle: 'Customers frequently combine these complementary mill-grade essentials',
    badgeText: 'Extra 15% Bundle Discount Applied',
    discountPercentage: 15,
    minItemsForDiscount: 2,
    savingsNote: 'You save ₹{savings} ({discount}% off combo)',
    bundleMaxProducts: 3
  };

  const [bundleOffer, setBundleOffer] = useState<BundleOfferConfig>(() => {
    try {
      const saved = localStorage.getItem('mle_bundle_offer');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse mle_bundle_offer:', e);
    }
    return defaultBundleOffer;
  });

  // Fetch live bundle and customization config from server / database
  useEffect(() => {
    fetch('/api/app-config')
      .then(res => res.json())
      .then(resData => {
        const liveBundle = resData?.data?.bundleOffer || resData?.bundleOffer;
        if (liveBundle) {
          setBundleOffer(prev => {
            const merged = { ...prev, ...liveBundle };
            try { localStorage.setItem('mle_bundle_offer', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
        const livePricing = resData?.data?.customizationPricing || resData?.customizationPricing;
        if (livePricing) {
          setCustomizationPricingState(prev => ({ ...prev, ...livePricing }));
          updateCustomizationPricing(livePricing);
          try { localStorage.setItem('mle_customization_pricing', JSON.stringify(livePricing)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const [customizationPricingState, setCustomizationPricingState] = useState<Record<string, number>>(() => {
    const saved = safeLoadFromStorage<Record<string, number>>('mle_customization_pricing', {
      'No Customization': 0,
      'Only Logo': 12,
      'Only Design': 22,
      'Design & Logo': 32,
      'Embroidery Branding': 42,
      'Custom Weave & GSM': 55,
      'Custom Size': 20
    });
    updateCustomizationPricing(saved);
    return saved;
  });

  const updateCustomizationPricingConfig = async (newPricing: Record<string, number>): Promise<{ success: boolean; message: string }> => {
    try {
      const merged = { ...customizationPricingState, ...newPricing };
      setCustomizationPricingState(merged);
      updateCustomizationPricing(merged);
      try { localStorage.setItem('mle_customization_pricing', JSON.stringify(merged)); } catch {}

      const res = await fetch('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_customization_pricing',
          customizationPricing: merged
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Failed to update customization pricing on server' };
      }
      return { success: true, message: data.message || 'Customization pricing updated successfully!' };
    } catch (err: any) {
      console.error('Failed to update customization pricing:', err);
      return { success: false, message: err.message || 'Network error updating customization pricing' };
    }
  };

  const updateBundleOffer = async (configUpdate: Partial<BundleOfferConfig>): Promise<boolean> => {
    try {
      const merged: BundleOfferConfig = { ...bundleOffer, ...configUpdate };
      setBundleOffer(merged);
      try { localStorage.setItem('mle_bundle_offer', JSON.stringify(merged)); } catch {}

      const res = await fetch('/api/app-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_bundle_offer',
          bundleOffer: merged
        })
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update bundle offer:', err);
      return false;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Keep local order history available until backend synchronization completes.
  const [orders, setOrders] = useState<Order[]>(() =>
    uniqueOrders(
      import.meta.env.PROD
        ? safeLoadArray<Order>('mle_guest_orders', [])
        : [
            ...safeLoadArray<Order>('mle_guest_orders', []),
            ...safeLoadArray<Order>('mle_orders', [])
          ]
    )
  );
  const [ordersSyncError, setOrdersSyncError] = useState<string | null>(null);

  // Mobile App Configuration State
  const [mobileAppConfig, setMobileAppConfig] = useState<MobileAppConfig>(() => {
    const saved = localStorage.getItem('mle_mobile_app_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_MOBILE_APP_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('mle_mobile_app_config', JSON.stringify(mobileAppConfig));
  }, [mobileAppConfig]);


  // Quotations are loaded only from this browser's own saved data.
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    import.meta.env.PROD ? [] : safeLoadArray<Quotation>('mle_quotations', [])
  );

  // Enquiries are loaded only from this browser's own saved data.
  const [enquiries, setEnquiries] = useState<BusinessEnquiry[]>(() =>
    import.meta.env.PROD ? [] : safeLoadArray<BusinessEnquiry>('mle_enquiries', [])
  );

  // Persist storage safely
  useEffect(() => {
    try {
      localStorage.setItem('mle_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to persist mle_products:', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_cart', JSON.stringify(cart));
      if (cart.length === 0) {
        localStorage.removeItem('mahalaxmi_cart_reserved_until');
      }
    } catch (e) {
      console.warn('Failed to persist mle_cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_orders', JSON.stringify(orders));
      const guestOrders = orders.filter(
        order =>
          typeof order.customer?.id === 'string' &&
          order.customer.id.startsWith('guest-')
      );
      localStorage.setItem('mle_guest_orders', JSON.stringify(guestOrders));
    } catch (e) {
      console.warn('Failed to persist mle_orders:', e);
    }
  }, [orders]);

  // Synchronize orders live from MySQL / Central API
  const syncOrdersFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof json?.error === 'string'
          ? json.error
          : `Order sync failed (HTTP ${res.status}).`;
        setOrdersSyncError(message);
        console.error('Order sync failed:', message);
        return;
      }
      if (json?.success && Array.isArray(json.data)) {
        setOrdersSyncError(null);
        setOrders(prev => {
          const localOrders = new Map<string, Order>();
          for (const ord of prev) {
            const key = (ord.orderNumber || ord.id || '').trim().toLowerCase();
            if (key && !localOrders.has(key)) localOrders.set(key, ord);
          }

          const liveOrders = new Map<string, Order>();
          for (const ord of json.data) {
            const key = (ord.orderNumber || ord.id || '').trim().toLowerCase();
            if (!key) continue;
            const existing = localOrders.get(key);
            if (existing) {
              const mergedItems = (ord.items && ord.items.length > 0)
                ? ord.items.map((it: any, idx: number) => {
                    const localItem = existing.items?.[idx] || existing.items?.find(li => li.productId === it.productId);
                    if (localItem?.customization) {
                      return {
                        ...it,
                        customization: {
                          ...it.customization,
                          ...localItem.customization,
                          logoFile: localItem.customization.logoFile || it.customization?.logoFile,
                          designFile: localItem.customization.designFile || it.customization?.designFile,
                          logoFileName: localItem.customization.logoFileName || it.customization?.logoFileName,
                          designFileName: localItem.customization.designFileName || it.customization?.designFileName,
                        }
                      };
                    }
                    return it;
                  })
                : (existing.items || []);

              liveOrders.set(key, {
                ...ord,
                items: mergedItems
              });
            } else {
              liveOrders.set(key, ord);
            }
          }

          const merged = Array.from(liveOrders.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          return merged;
        });
      } else {
        const message = typeof json?.error === 'string'
          ? json.error
          : 'Order sync returned an invalid response.';
        setOrdersSyncError(message);
        console.error('Order sync failed:', message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Order sync is unavailable.';
      setOrdersSyncError(`Could not load orders: ${message}`);
      console.error('Order sync failed:', err);
    }
  }, []);

  // Fetch live enquiries from MySQL / API
  const syncEnquiriesFromBackend = useCallback(async () => {
    if (!isLoggedIn || currentUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/enquiry');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.enquiries) && json.enquiries.length > 0) {
        setEnquiries(prev => {
          const map = new Map<string, BusinessEnquiry>();
          for (const eq of json.enquiries) {
            const key = (eq.id || eq.enquiryCode || eq.email || '').trim().toLowerCase();
            if (key) map.set(key, eq);
          }
          for (const eq of prev) {
            const key = (eq.id || eq.email || '').trim().toLowerCase();
            if (key && !map.has(key)) map.set(key, eq);
          }
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        });
      }
    } catch (_) {}
  }, [currentUser.role, isLoggedIn]);

  // Auto-sync on startup and live poll every 8 seconds
  useEffect(() => {
    if (!isLoggedIn || currentUser.role !== 'admin') return;
    syncOrdersFromBackend();
    syncEnquiriesFromBackend();
    const interval = setInterval(() => {
      syncOrdersFromBackend();
      syncEnquiriesFromBackend();
    }, 8000);
    return () => clearInterval(interval);
  }, [currentUser.role, isLoggedIn, syncOrdersFromBackend, syncEnquiriesFromBackend]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_quotations', JSON.stringify(quotations));
    } catch (e) {
      console.warn('Failed to persist mle_quotations:', e);
    }
  }, [quotations]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('Failed to persist mle_users:', e);
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_is_logged_in', isLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.warn('Failed to persist mle_is_logged_in:', e);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Failed to persist mle_current_user:', e);
    }
  }, [currentUser]);

  // Price Calculation Engine based on Wholesale Tiers + Customization Charges
  const calculateEffectiveUnitPrice = (
    product: Product,
    quantity: number,
    variant?: ProductVariant,
    customization?: ProductCustomization
  ): { unitPrice: number; appliedTier?: WholesaleTier; baseUnitPrice: number; customizationCharge: number } => {
    const variantAdjustment = variant?.priceDelta || 0;
    const typeCharge = getCustomizationCharge(customization?.type);
    const sizeCharge = getSizeCharge(customization?.selectedSize);
    const customCharge = typeCharge + sizeCharge;
    if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) {
      const base = product.retailPrice + variantAdjustment;
      return {
        unitPrice: base + customCharge,
        baseUnitPrice: base,
        customizationCharge: customCharge
      };
    }
    // Find matching tier
    const sortedTiers = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    const matched = sortedTiers.find(tier => quantity >= tier.minQty);
    if (matched) {
      const base = matched.pricePerUnit + variantAdjustment;
      return {
        unitPrice: base + customCharge,
        appliedTier: matched,
        baseUnitPrice: base,
        customizationCharge: customCharge
      };
    }
    const base = product.retailPrice + variantAdjustment;
    return {
      unitPrice: base + customCharge,
      baseUnitPrice: base,
      customizationCharge: customCharge
    };
  };

  const addToCart = (
    product: Product,
    quantity: number = 1,
    variant?: ProductVariant,
    customization?: ProductCustomization
  ): boolean => {
    const minimumQuantity = variant?.id.startsWith('sample-') ? 1 : Math.max(1, product.moq || 1);
    const requestedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : minimumQuantity;
    const normalizedQuantity = Math.max(minimumQuantity, requestedQuantity);
    const currentProduct = products.find(item => item.id === product.id) ?? product;
    const availableStock = currentProduct.stock;
    const alreadyInCart = cart
      .filter(item => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (
      availableStock <= 0 ||
      alreadyInCart + normalizedQuantity > availableStock
    ) {
      return false;
    }

    setCart(prev => {
      // Find existing item matching product ID, variant ID, and customization type/text
      const existingIndex = prev.findIndex(item => {
        const matchesProduct = item.productId === product.id;
        const matchesVariant = item.selectedVariant?.id === variant?.id;
        const matchesCustom =
          (!item.customization && !customization) ||
          (item.customization?.type === customization?.type &&
            item.customization?.logoText === customization?.logoText &&
            item.customization?.selectedSize === customization?.selectedSize);
        return matchesProduct && matchesVariant && matchesCustom;
      });

      if (existingIndex > -1) {
        const currentItem = prev[existingIndex];
        const newTotalQty = currentItem.quantity + normalizedQuantity;
        const activeCustomization = customization || currentItem.customization;
        const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(
          product,
          newTotalQty,
          variant,
          activeCustomization
        );

        const updated = [...prev];
        updated[existingIndex] = {
          ...currentItem,
          quantity: newTotalQty,
          unitPrice,
          totalPrice: unitPrice * newTotalQty,
          appliedTier,
          customization: activeCustomization
        };
        return updated;
      } else {
        const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(
          product,
          normalizedQuantity,
          variant,
          customization
        );
        const newItem: CartItem = {
          id: `${product.id}-${variant?.id || 'std'}-${customization?.type ? 'custom-' : ''}${Date.now()}`,
          productId: product.id,
          product,
          quantity: normalizedQuantity,
          selectedVariant: variant,
          unitPrice,
          totalPrice: unitPrice * normalizedQuantity,
          appliedTier,
          customization
        };
        return [...prev, newItem];
      }
    });
    return true;
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const currentProduct = products.find(product => product.id === item.productId) ?? item.product;
          const availableStock = currentProduct.stock;
          const otherCartQuantity = prev
            .filter(cartItem => cartItem.productId === item.productId && cartItem.id !== item.id)
            .reduce((total, cartItem) => total + cartItem.quantity, 0);
          if (
            newQty > item.quantity &&
            (
              availableStock <= 0 ||
              otherCartQuantity + newQty > availableStock
            )
          ) {
            return item;
          }
          const minimumQuantity = item.selectedVariant?.id.startsWith('sample-')
            ? 1
            : Math.max(1, item.product.moq || 1);
          const normalizedQuantity = Math.max(minimumQuantity, Math.floor(newQty));
          const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(
            item.product,
            normalizedQuantity,
            item.selectedVariant,
            item.customization
          );
          return {
            ...item,
            quantity: normalizedQuantity,
            unitPrice,
            totalPrice: unitPrice * normalizedQuantity,
            appliedTier
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    if (currentUser?.email) {
      fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLEAR',
          customerEmail: currentUser.email
        })
      }).catch(() => {});
    }
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Accurate GST breakdown
  const cartTax = cart.reduce(
    (acc, item) => {
      const itemTaxRate = (item.product?.gstRate || 5) / 100;
      const lineTax = item.totalPrice * itemTaxRate;
      acc.totalTax += lineTax;
      // If buyer is in Gujarat (same state as mill 24), CGST + SGST; otherwise IGST
      if (currentUser?.addresses?.[0]?.state?.toLowerCase() === 'gujarat') {
        acc.cgst += lineTax / 2;
        acc.sgst += lineTax / 2;
      } else {
        acc.igst += lineTax;
      }
      return acc;
    },
    { cgst: 0, sgst: 0, igst: 0, totalTax: 0 }
  );

  // Free shipping above ₹1499 for retail; ₹99 flat otherwise. If bulk > ₹15000 free freight
  const cartShipping = cartSubtotal >= 1499 || cartSubtotal === 0 ? 0 : 99;
  const cartTotal = Math.max(0, Math.round(cartSubtotal - couponDiscount + cartTax.totalTax + cartShipping));

  // Local cart recovery tracking; durable production tracking is not configured.
  useEffect(() => {
    if (!currentUser?.email || cart.length === 0) return;

    const timer = setTimeout(() => {
      fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD',
          customerEmail: currentUser.email,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          cartTotal: cartTotal,
          subtotal: cartSubtotal,
          customerType: currentUser.role === 'consumer' ? 'B2C' : 'B2B',
          items: cart.map(i => ({
            productName: i.product?.name || 'Textile Item',
            variantDescription: i.selectedVariant?.size || (i.selectedVariant as any)?.color || 'Standard',
            quantity: i.quantity,
            totalPrice: i.totalPrice
          })),
          source: 'WEB'
        })
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, [cart, cartTotal, currentUser]);

  // Auto-validate and re-calculate or remove applied coupon whenever cartSubtotal or cart changes
  useEffect(() => {
    if (!appliedCoupon) return;

    if (cart.length === 0) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    const matched = coupons.find(c => c.code.toUpperCase() === appliedCoupon.toUpperCase());
    if (!matched || !matched.isActive) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    // Check minimum order value threshold
    if (matched.minOrderValue > 0 && cartSubtotal < matched.minOrderValue) {
      // Automatically remove coupon because minimum order criteria is no longer met!
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    // Re-calculate percentage discount based on new subtotal
    let disc = 0;
    if (matched.discountType === 'FLAT') {
      disc = Math.min(matched.discountValue, cartSubtotal);
    } else {
      disc = Math.round((cartSubtotal * matched.discountValue) / 100);
      if (matched.maxDiscountAmount && matched.maxDiscountAmount > 0) {
        disc = Math.min(disc, matched.maxDiscountAmount);
      }
    }
    setCouponDiscount(disc);
  }, [cartSubtotal, cart.length, appliedCoupon, coupons]);

  const applyCoupon = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Please enter a coupon code.' };

    const isB2B = currentUser.role !== 'consumer' || !!currentUser.gstNumber;
    try {
      const response = await fetch('/api/coupons?action=validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clean,
          subtotal: cartSubtotal,
          platform: 'WEB',
          customerType: isB2B ? 'B2B' : 'B2C'
        })
      });
      const result = await response.json();
      if (!response.ok || result?.success !== true || result?.valid !== true) {
        return {
          success: false,
          message: result?.message || result?.error || `Coupon validation failed (HTTP ${response.status}).`
        };
      }

      const discount = Number(result.data?.discount);
      const validatedCode = String(result.data?.code || clean);
      if (!Number.isFinite(discount) || discount < 0) {
        console.error('Coupon API returned an invalid discount amount.');
        return { success: false, message: 'Coupon validation returned invalid discount data.' };
      }

      setAppliedCoupon(validatedCode);
      setCouponDiscount(discount);
      return {
        success: true,
        message: result.message || `Offer applied. Saved ₹${discount.toLocaleString('en-IN')}.`,
        discount
      };
    } catch (error) {
      console.error('Coupon validation request failed:', error);
      return {
        success: false,
        message: 'Coupon validation is unavailable. Please try again before placing your order.'
      };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // Active OTP memory state
  const [activeOtp, setActiveOtp] = useState<{ identifier: string; code: string; expiresAt: number } | null>(null);

  const requestOtp = (identifier: string): { success: boolean; message: string; otp?: string } => {
    if (import.meta.env.PROD) {
      return { success: false, message: 'Customer OTP sign-in is unavailable until server-side authentication is configured.' };
    }
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { success: false, message: 'Please enter a valid mobile number or email address.' };
    }
    // Generate a fresh, random 4-digit OTP
    const generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    setActiveOtp({
      identifier: clean,
      code: generatedCode,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    });

    return {
      success: true,
      message: `OTP generated for ${identifier}`,
      otp: generatedCode
    };
  };

  const login = (
    identifier: string,
    password?: string,
    otp?: string
  ): { success: boolean; message: string; user?: User } => {
    if (import.meta.env.PROD) {
      return { success: false, message: 'Customer sign-in is unavailable until server-side authentication is configured.' };
    }
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    let found = registeredUsers.find(
      u =>
        (clean && u.email.toLowerCase() === clean) ||
        (cleanDigits.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))
    );

    // 1. OTP Mode: Verified User Login
    if (otp !== undefined) {
      if (!found) {
        return {
          success: false,
          message: 'Account not found! Please enter a registered email or click Register.'
        };
      }

      setCurrentUser(found);
      setIsLoggedIn(true);
      return {
        success: true,
        message: `Welcome back, ${found.name}! Verified successfully.`,
        user: found
      };
    }

    // 2. Direct Password Login Mode - STRICT: Must be registered!
    if (!found) {
      return {
        success: false,
        message: 'Account not found! This email or mobile is not registered. Please click Register to create an account first.'
      };
    }

    if (password && found.password && found.password !== password) {
      return {
        success: false,
        message: 'Incorrect password! Please try again or sign in with Email OTP.'
      };
    }

    setCurrentUser(found);
    setIsLoggedIn(true);
    return {
      success: true,
      message: `Welcome back, ${found.name}!`,
      user: found
    };
  };

  const register = (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: 'consumer' | 'retailer' | 'wholesaler' | 'admin';
    businessType?: User['businessType'];
    companyName?: string;
    gstNumber?: string;
  }): { success: boolean; message: string; user?: User } => {
    if (import.meta.env.PROD) {
      return { success: false, message: 'Customer registration is unavailable until server-side authentication is configured.' };
    }
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPhoneDigits = userData.phone.replace(/\D/g, '');

    if (!userData.name.trim()) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    if (cleanPhoneDigits.length < 10) {
      return { success: false, message: 'Please provide a valid 10-digit mobile number.' };
    }

    const exists = registeredUsers.some(
      u =>
        (cleanEmail && u.email.toLowerCase() === cleanEmail) ||
        (cleanPhoneDigits.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-10)))
    );

    if (exists) {
      return {
        success: false,
        message: 'An account with this email or mobile number already exists. Please log in.'
      };
    }

    const assignedRole =
      userData.role ||
      (userData.businessType && userData.businessType !== 'Individual' ? 'retailer' : 'consumer');

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: userData.phone.trim().startsWith('+91') ? userData.phone.trim() : `+91 ${cleanPhoneDigits.slice(-10)}`,
      password: userData.password,
      role: assignedRole,
      businessType: userData.businessType || 'Individual',
      companyName: userData.companyName?.trim() || '',
      gstNumber: userData.gstNumber?.trim().toUpperCase() || '',
      isGstVerified: !!userData.gstNumber && userData.gstNumber.trim().length === 15,
      addresses: [],
      creditLimit: assignedRole === 'wholesaler' ? 500000 : assignedRole === 'retailer' ? 100000 : 0,
      availableCredit: assignedRole === 'wholesaler' ? 500000 : assignedRole === 'retailer' ? 100000 : 0
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);

    // Persist to central MySQL Database via /api/auth
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          password: userData.password,
          role: newUser.role,
          businessType: newUser.businessType,
          companyName: newUser.companyName,
          gstNumber: newUser.gstNumber,
          isGstVerified: newUser.isGstVerified,
          addresses: newUser.addresses
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('User registered in MySQL database:', data);
      })
      .catch(err => {
        console.warn('User auth API sync error:', err);
      });

    return {
      success: true,
      message: `Account registered successfully! Welcome to Mahalaxmi Enterprise, ${newUser.name}.`,
      user: newUser
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) return { success: false, message: 'No active session found.' };

    const email = (currentUser.email || '').toLowerCase().trim();
    const PROTECTED_ADMIN_EMAILS = [
      'admin@mahalaxmienterprises.com',
      'admin@mahalaxmi.in',
      'mahalaxmienterpriseuk@gmail.com',
      'deviltimeisback001@gmail.com'
    ];

    // STRICT ADMINISTRATIVE DATA SAFEGUARD
    if (currentUser.role === 'admin' || PROTECTED_ADMIN_EMAILS.includes(email)) {
      return {
        success: false,
        message: 'Security Alert: Administrator accounts cannot be deleted.'
      };
    }

    try {
      // 1. Delete user from Central Database & Backend
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_account',
          email: currentUser.email,
          id: currentUser.id
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        return {
          success: false,
          message: data.message || 'Administrator accounts cannot be deleted.'
        };
      }

      // 2. Clear user from local registered users state
      setRegisteredUsers(prev => prev.filter(u => u.email.toLowerCase() !== email && u.id !== currentUser.id));

      // 3. Clear user-specific storage keys
      try {
        localStorage.removeItem(`mle_wishlist_${email}`);
        localStorage.removeItem('mle_current_user');
      } catch {}

      // 4. Logout and reset session to default consumer
      setIsLoggedIn(false);
      setCurrentUser(GUEST_USER_PROFILE);

      return {
        success: true,
        message: 'Your account and personal data have been completely deleted from our servers.'
      };
    } catch (err: any) {
      console.warn('Delete account network warning:', err);
      // Clean up client side state
      setRegisteredUsers(prev => prev.filter(u => u.email.toLowerCase() !== email && u.id !== currentUser.id));
      setIsLoggedIn(false);
      setCurrentUser(GUEST_USER_PROFILE);
      return {
        success: true,
        message: 'Your account has been deleted locally.'
      };
    }
  };

  const resetPassword = (
    identifier: string,
    otp: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!otp || !otp.trim()) {
      return { success: false, message: 'Please enter the verification code sent to your email.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    const userIndex = registeredUsers.findIndex(
      u =>
        u.email.toLowerCase() === clean ||
        (cleanDigits.length >= 10 && u.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))
    );

    if (userIndex === -1) {
      return {
        success: false,
        message: 'No account registered with this email or mobile number.'
      };
    }

    const updated = [...registeredUsers];
    updated[userIndex] = {
      ...updated[userIndex],
      password: newPassword
    };
    setRegisteredUsers(updated);
    try {
      localStorage.setItem('mle_users', JSON.stringify(updated));
    } catch {}

    if (currentUser && currentUser.id === updated[userIndex].id) {
      setCurrentUser(updated[userIndex]);
      try {
        localStorage.setItem('mle_current_user', JSON.stringify(updated[userIndex]));
      } catch {}
    }

    // Update password in central MySQL Database via /api/auth
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reset_password',
        identifier: clean,
        newPassword: newPassword
      })
    }).catch(() => {});

    return {
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    };
  };

  const updateUserProfile = (profile: Partial<User>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...profile };
      if (updated.email) {
        fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_profile',
            user: {
              email: updated.email,
              name: updated.name,
              phone: updated.phone,
              companyName: updated.companyName,
              gstNumber: updated.gstNumber,
              addresses: updated.addresses,
            }
          })
        }).catch(err => console.warn('Failed to sync profile update to server:', err));
      }
      return updated;
    });
  };

  const addSavedAddress = (addressData: Omit<Address, 'id'>) => {
    const currentAddresses = currentUser?.addresses || [];
    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
      isDefault: currentAddresses.length === 0 || !!addressData.isDefault
    };
    updateUserProfile({ addresses: [newAddress, ...currentAddresses] });
  };

  // Create Order
  const createOrder = async (orderData: {
    paymentMethod: PaymentMethod;
    shippingAddress: Address;
    billingAddress: Address;
    pointsRedeemed?: number;
    amountPaid?: number;
    timelineNote?: string;
    customerEmail?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }): Promise<Order> => {
    const quantitiesByProduct = cart.reduce<Record<string, number>>((totals, item) => {
      totals[item.productId] = (totals[item.productId] || 0) + item.quantity;
      return totals;
    }, {});
    const unavailableItem = Object.entries(quantitiesByProduct).find(([productId, quantity]) => {
      const product = products.find(item => item.id === productId);
      return !product ||
        product.stock <= 0 ||
        quantity > product.stock;
    });
    if (unavailableItem) {
      const unavailableProduct = products.find(item => item.id === unavailableItem[0]);
      throw new Error(
        unavailableProduct
          ? `${unavailableProduct.name} is out of stock or has insufficient stock. Update your cart before ordering.`
          : 'A product in your cart is no longer available. Update your cart before ordering.'
      );
    }

    const orderNum = `MLE-ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems = cart.map(item => {
      let desc = item.selectedVariant?.name || `${item.quantity} standard pack`;
      if (item.customization && item.customization.type && item.customization.type !== 'No Customization') {
        const parts = [item.customization.type];
        if (item.customization.logoText) parts.push(`Logo: "${item.customization.logoText}"`);
        if (item.customization.selectedSize) parts.push(`Size: ${item.customization.selectedSize}`);
        if (item.customization.customGsm) parts.push(`GSM: ${item.customization.customGsm}`);
        if (item.customization.logoFileName) parts.push(`📎 Logo: ${item.customization.logoFileName}`);
        if (item.customization.designFileName) parts.push(`📎 Design: ${item.customization.designFileName}`);
        if (item.customization.techPackFileName) parts.push(`📎 Spec: ${item.customization.techPackFileName}`);
        if (item.customization.designNote) parts.push(`Note: ${item.customization.designNote}`);
        desc = `${item.selectedVariant?.name || 'Standard'} [${parts.join(' • ')}]`;
      }

      return {
        productId: item.productId,
        variantId: item.selectedVariant?.id,
        productName: item.product.name,
        sku: item.product.sku,
        hsnCode: item.product.hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        variantDescription: desc,
        image: item.product.images[0],
        gstRate: item.product.gstRate,
        customization: item.customization
      };
    });

    const pointsRedeemed = orderData.pointsRedeemed || 0;
    const amountPaid = orderData.amountPaid !== undefined ? orderData.amountPaid : Math.max(0, cartTotal - pointsRedeemed);
    const isCod = orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'PARTIAL_POINTS_COD';

    const defaultTimelineDesc = orderData.timelineNote || (
      pointsRedeemed > 0
        ? `Order booked. 🪙 ${pointsRedeemed.toLocaleString('en-IN')} Mill Points redeemed (-₹${pointsRedeemed.toLocaleString('en-IN')}). Remaining balance ₹${amountPaid.toLocaleString('en-IN')} ${isCod ? 'payable on delivery (COD)' : 'paid via Razorpay'}.`
        : 'Order placed successfully. Allocated to Mahalaxmi Enterprise Ahmedabad Central Warehouse.'
    );

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      customer: {
        id: isLoggedIn ? currentUser.id : `guest-${Date.now()}`,
        name: isLoggedIn ? currentUser.name : (orderData.shippingAddress.fullName || 'Valued Buyer'),
        email: isLoggedIn ? currentUser.email : (orderData.customerEmail || 'guest@mahalaxmi.in'),
        phone: isLoggedIn ? currentUser.phone : (orderData.shippingAddress.phone || ''),
        companyName: orderData.shippingAddress.companyName || currentUser.companyName,
        gstNumber: currentUser.gstNumber,
        isB2B: currentUser.role !== 'consumer'
      },
      items: orderItems,
      subtotal: cartSubtotal,
      taxBreakdown: cartTax,
      shippingCharge: cartShipping,
      discount: couponDiscount,
      couponCode: appliedCoupon || undefined,
      totalAmount: cartTotal,
      pointsRedeemed,
      amountPaid,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: isCod ? 'PENDING' : 'PAID',
      status: 'PLACED',
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      estimatedDelivery: new Date(Date.now() + 86400000 * (deliveryInfo?.estimatedDays || 3)).toISOString(),
      timeline: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          description: defaultTimelineDesc
        }
      ]
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newOrder,
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: orderData.razorpayPaymentId,
        razorpaySignature: orderData.razorpaySignature
      })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true) {
      throw new Error(
        typeof result?.error === 'string'
          ? result.error
          : `The order was not saved (HTTP ${response.status}). Please retry.`
      );
    }

    // Apply local state only after the server confirms persistence.
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const inCart = cart.find(c => c.productId === p.id);
        if (inCart) {
          return { ...p, stock: Math.max(0, p.stock - inCart.quantity) };
        }
        return p;
      })
    );

    setOrders(prev => uniqueOrders([newOrder, ...prev]));
    if (!isLoggedIn) {
      try {
        const savedGuestOrders = safeLoadArray<Order>('mle_guest_orders', []);
        localStorage.setItem(
          'mle_guest_orders',
          JSON.stringify([newOrder, ...savedGuestOrders.filter(order => order.id !== newOrder.id)])
        );
      } catch (error) {
        console.warn('Failed to save guest order history on this device:', error);
      }
    }
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: Order['status'],
    trackingNumber?: string,
    courierName?: string
  ) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          const updatedTimeline = [
            ...ord.timeline,
            {
              status,
              timestamp: new Date().toISOString(),
              description: status === 'REFUNDED'
                ? `Return approved and 100% refund credited as Mill Points to customer wallet.`
                : `Status updated to ${status} by logistics dispatcher.`
            }
          ];
          const isRefunded = status === 'REFUNDED' || status === 'RETURN_APPROVED';

          // When refund is approved, automatically credit the customer's wallet points!
          if (isRefunded && ord.customer?.email) {
            creditRefundToWallet(ord.customer.email, ord.totalAmount, ord.orderNumber, ord.id);
          }

          return {
            ...ord,
            status,
            paymentStatus: isRefunded ? 'REFUNDED' : ord.paymentStatus,
            trackingNumber: trackingNumber || ord.trackingNumber,
            courierName: courierName || ord.courierName,
            timeline: updatedTimeline
          };
        }
        return ord;
      })
    );
  };

  // Mill Points & Wallet Operations
  const topUpWallet = async (amount: number, paymentRef?: string): Promise<{ success: boolean; message: string; balance?: number }> => {
    if (!amount || amount <= 0) return { success: false, message: 'Please enter a valid amount to add.' };
    const email = currentUser?.email?.toLowerCase();
    if (!email) return { success: false, message: 'Please sign in to add points.' };

    const ref = paymentRef || `UPI-${Math.floor(100000 + Math.random() * 900000)}`;
    const newBalance = (currentUser.walletBalance || 0) + amount;
    const newTx: WalletTransaction = {
      id: `wt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userEmail: email,
      type: 'WALLET_TOPUP',
      amount,
      description: `Added ₹${amount} to Mill Points (Payment Ref: ${ref})`,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString()
    };
    const newTxns = [newTx, ...(currentUser.walletTransactions || [])];

    setCurrentUser(prev => {
      const updated = {
        ...prev,
        walletBalance: newBalance,
        walletTransactions: newTxns
      };
      try {
        localStorage.setItem('mle_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet_topup',
          email,
          amount,
          paymentRef: ref,
          description: newTx.description
        })
      });
    } catch (err) {
      console.warn('Wallet topup sync warning:', err);
    }

    return {
      success: true,
      message: `🎉 Successfully added 🪙 ${amount} Mill Points to your wallet!`,
      balance: newBalance
    };
  };

  const creditRefundToWallet = async (
    customerEmail: string,
    amount: number,
    orderNumber: string,
    orderId?: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = customerEmail.trim().toLowerCase();
    const isCurrent = currentUser?.email?.toLowerCase() === cleanEmail;

    if (isCurrent) {
      const newBalance = (currentUser.walletBalance || 0) + amount;
      const newTx: WalletTransaction = {
        id: `wt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: currentUser.id,
        userEmail: cleanEmail,
        type: 'CREDIT_REFUND',
        amount,
        description: `100% Refund of ₹${amount} credited as Mill Points for Order #${orderNumber}`,
        orderId,
        orderNumber,
        balanceAfter: newBalance,
        timestamp: new Date().toISOString()
      };
      const newTxns = [newTx, ...(currentUser.walletTransactions || [])];

      setCurrentUser(prev => {
        const updated = {
          ...prev,
          walletBalance: newBalance,
          walletTransactions: newTxns
        };
        try {
          localStorage.setItem('mle_current_user', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet_refund',
          email: cleanEmail,
          amount,
          orderNumber,
          orderId,
          description: `100% Refund credited for Order #${orderNumber}`
        })
      });
    } catch (err) {
      console.warn('Wallet refund sync warning:', err);
    }

    return {
      success: true,
      message: `₹${amount} credited as Mill Points to customer (${cleanEmail})!`
    };
  };

  const redeemWalletPoints = async (
    amount: number,
    orderNumber: string,
    orderId?: string
  ): Promise<{ success: boolean; message: string }> => {
    const email = currentUser?.email?.toLowerCase();
    if (!email) return { success: false, message: 'Please sign in to redeem points.' };
    const currentBal = currentUser.walletBalance || 0;
    if (currentBal < amount) {
      return { success: false, message: `Insufficient points! Available: 🪙 ${currentBal}` };
    }

    const newBalance = currentBal - amount;
    const newTx: WalletTransaction = {
      id: `wt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userEmail: email,
      type: 'ORDER_PAYMENT',
      amount,
      description: `Redeemed 🪙 ${amount} Points for Order #${orderNumber}`,
      orderId,
      orderNumber,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString()
    };
    const newTxns = [newTx, ...(currentUser.walletTransactions || [])];

    setCurrentUser(prev => {
      const updated = {
        ...prev,
        walletBalance: newBalance,
        walletTransactions: newTxns
      };
      try {
        localStorage.setItem('mle_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet_pay',
          email,
          amount,
          orderNumber,
          orderId,
          description: newTx.description
        })
      });
    } catch (err) {
      console.warn('Wallet redeem sync warning:', err);
    }

    return {
      success: true,
      message: `Redeemed ${amount} points successfully!`
    };
  };

  const cancelOrder = async (orderId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const target = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!target) {
      return { success: false, message: 'Order reference not found.' };
    }

    const cancelReason = reason || 'Customer requested order cancellation.';

    // Update state locally
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === target.id) {
          return {
            ...ord,
            status: 'CANCELLED',
            timeline: [
              ...ord.timeline,
              {
                status: 'CANCELLED',
                timestamp: new Date().toISOString(),
                description: `Order cancelled. Reason: ${cancelReason}`
              }
            ]
          };
        }
        return ord;
      })
    );

    // Call API to send cancellation email and update MySQL database
    try {
      const res = await fetch('/api/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: target.orderNumber,
          orderId: target.id,
          customerName: target.customer.name,
          customerEmail: target.customer.email,
          customerPhone: target.customer.phone,
          reason: cancelReason,
          totalAmount: target.totalAmount,
          items: target.items,
          source: 'WEB',
          paymentStatus: target.paymentStatus
        })
      });
      const data = await res.json();
      return {
        success: true,
        message: data.message || `Order #${target.orderNumber} cancelled successfully.`
      };
    } catch {
      return {
        success: true,
        message: `Order #${target.orderNumber} cancelled successfully.`
      };
    }
  };

  const requestReturnOrExchange = async (
    orderId: string,
    type: 'RETURN' | 'EXCHANGE',
    reason: string,
    comment?: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!target) {
      return { success: false, message: 'Order reference not found.' };
    }

    const newStatus = type === 'EXCHANGE' ? 'EXCHANGE_REQUESTED' : 'RETURN_REQUESTED';
    const desc = `${type === 'EXCHANGE' ? 'Exchange' : 'Return'} requested. Reason: ${reason}${comment ? ` (${comment})` : ''}`;

    // Update state locally
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === target.id) {
          return {
            ...ord,
            status: newStatus as any,
            timeline: [
              ...ord.timeline,
              {
                status: newStatus as any,
                timestamp: new Date().toISOString(),
                description: desc
              }
            ]
          };
        }
        return ord;
      })
    );

    // Call API to update MySQL database and send notification emails
    try {
      const res = await fetch('/api/return-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: target.orderNumber,
          orderId: target.id,
          type,
          reason,
          comment,
          customerName: target.customer.name,
          customerEmail: target.customer.email,
          customerPhone: target.customer.phone,
          totalAmount: target.totalAmount,
          items: target.items,
          source: 'WEB'
        })
      });
      const data = await res.json();
      return {
        success: true,
        message: data.message || `${type === 'EXCHANGE' ? 'Exchange' : 'Return'} request submitted successfully.`
      };
    } catch {
      return {
        success: true,
        message: `${type === 'EXCHANGE' ? 'Exchange' : 'Return'} request submitted successfully.`
      };
    }
  };

  const sendAbandonedCartEmail = async (email?: string, name?: string): Promise<{ success: boolean; message: string }> => {
    const targetEmail = (email || currentUser.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (cart.length === 0) {
      return { success: false, message: 'Your shopping cart is currently empty.' };
    }

    try {
      const res = await fetch('/api/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name || currentUser.name || 'Valued Buyer',
          customerEmail: targetEmail,
          customerPhone: currentUser.phone || '+91 85111 72099',
          cartTotal: cartTotal,
          items: cart.map(i => ({
            productName: i.product.name,
            variantDescription: i.selectedVariant?.name || 'Standard Mill Quality',
            quantity: i.quantity,
            totalPrice: i.totalPrice
          })),
          subtotal: cartSubtotal,
          source: 'WEB',
          customerType: currentUser.role === 'consumer' ? 'B2C' : 'B2B'
        })
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message || `✅ Your cart reminder was emailed to ${targetEmail}.`
        };
      }
      return { success: false, message: data.error || 'Failed to dispatch email.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error.' };
    }
  };

  // RFQs & Quotations
  const createQuotationRequest = (
    items: { productId: string; quantity: number; targetPrice?: number }[],
    notes?: string
  ): Quotation => {
    const qNum = `RFQ-MLE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const quoteItems = items.map(req => {
      const prod = products.find(p => p.id === req.productId)!;
      const { unitPrice } = calculateEffectiveUnitPrice(prod, req.quantity);
      return {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: req.quantity,
        targetPrice: req.targetPrice,
        quotedUnitPrice: unitPrice,
        totalPrice: unitPrice * req.quantity
      };
    });

    const sub = quoteItems.reduce((s, i) => s + i.totalPrice, 0);
    const tax = sub * 0.05;
    const freight = sub > 50000 ? 0 : 2500;

    const newQuote: Quotation = {
      id: `qt-${Date.now()}`,
      quoteNumber: qNum,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000 * 14).toISOString(),
      buyer: {
        name: currentUser.name,
        companyName: currentUser.companyName || 'Business Buyer',
        gstNumber: currentUser.gstNumber,
        email: currentUser.email,
        phone: currentUser.phone,
        businessType: currentUser.businessType || 'Retailer'
      },
      items: quoteItems,
      subtotal: sub,
      estimatedTax: tax,
      estimatedFreight: freight,
      grandTotal: sub + tax + freight,
      status: 'PENDING',
      notes
    };

    setQuotations(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuotationByStaff = (
    quoteId: string,
    updatedItems: { productId: string; quotedUnitPrice: number }[],
    notes?: string
  ) => {
    setQuotations(prev =>
      prev.map(q => {
        if (q.id === quoteId) {
          const newItems = q.items.map(it => {
            const match = updatedItems.find(u => u.productId === it.productId);
            if (match) {
              return {
                ...it,
                quotedUnitPrice: match.quotedUnitPrice,
                totalPrice: match.quotedUnitPrice * it.quantity
              };
            }
            return it;
          });

          const sub = newItems.reduce((s, i) => s + i.totalPrice, 0);
          const tax = sub * 0.05;
          const freight = sub > 50000 ? 0 : 2500;

          return {
            ...q,
            items: newItems,
            subtotal: sub,
            estimatedTax: tax,
            estimatedFreight: freight,
            grandTotal: sub + tax + freight,
            status: 'PREPARED',
            notes: notes || q.notes,
            preparedBy: currentUser.name
          };
        }
        return q;
      })
    );
  };

  const acceptAndConvertQuotation = (quoteId: string): Order | null => {
    if (import.meta.env.PROD) return null;
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return null;
    const savedAddress = currentUser.addresses[0];
    if (!savedAddress) return null;

    // Convert quote items to order items
    const orderItems = quote.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        productName: it.productName,
        sku: it.sku,
        hsnCode: prod?.hsnCode || '630221',
        quantity: it.quantity,
        unitPrice: it.quotedUnitPrice,
        totalPrice: it.totalPrice,
        variantDescription: 'Custom Wholesale Quotation Batch',
        image: prod?.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
        gstRate: prod?.gstRate || 5
      };
    });

    const newOrder: Order = {
      id: `ord-q-${Date.now()}`,
      orderNumber: `MLE-ORD-Q-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      customer: {
        id: currentUser.id,
        name: quote.buyer.name,
        email: quote.buyer.email,
        phone: quote.buyer.phone,
        companyName: quote.buyer.companyName,
        gstNumber: quote.buyer.gstNumber,
        isB2B: true
      },
      items: orderItems,
      subtotal: quote.subtotal,
      taxBreakdown: {
        cgst: quote.estimatedTax / 2,
        sgst: quote.estimatedTax / 2,
        igst: 0,
        totalTax: quote.estimatedTax
      },
      shippingCharge: quote.estimatedFreight,
      discount: 0,
      totalAmount: quote.grandTotal,
      paymentMethod: 'CREDIT_30_DAYS',
      paymentStatus: 'CREDIT_APPROVED',
      status: 'PLACED',
      shippingAddress: savedAddress,
      billingAddress: savedAddress,
      estimatedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(),
      timeline: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          description: `Converted from accepted quotation ${quote.quoteNumber}. 30-Day B2B credit applied.`
        }
      ]
    };

    setOrders(prev => uniqueOrders([newOrder, ...prev]));

    // Mark quote as converted
    setQuotations(prev =>
      prev.map(q => (q.id === quoteId ? { ...q, status: 'CONVERTED' } : q))
    );

    return newOrder;
  };

  // Submit Business Enquiry
  const submitBusinessEnquiry = (enquiryData: Omit<BusinessEnquiry, 'id' | 'createdAt' | 'status'>) => {
    const newEnquiry: BusinessEnquiry = {
      ...enquiryData,
      id: `enq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'NEW'
    };
    setEnquiries(prev => [newEnquiry, ...prev]);

    // Dispatch to MySQL & Pure EmailJS via /api/enquiry
    fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: enquiryData.fullName,
        businessName: enquiryData.businessName,
        phone: enquiryData.phone,
        email: enquiryData.email,
        businessType: enquiryData.businessType,
        city: enquiryData.city,
        state: enquiryData.state,
        expectedMonthlyVolume: enquiryData.expectedMonthlyVolume,
        interestedCategories: enquiryData.interestedCategories,
        notes: enquiryData.notes,
        source: 'WEBSITE_ACCOUNT_PAGE'
      })
    }).catch(err => console.warn('Enquiry dispatch warning:', err));
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct = normalizeProductCategory({
      ...productData,
      id: `prod-${Date.now()}`
    });
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true || result?.dbSaved !== true) {
      throw new Error(result?.error || 'Product and images were not saved to the shared database.');
    }
    setProducts(prev => [normalizeProductCategory(result.data as Product), ...prev]);
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const existingProduct = products.find(product => product.id === id);
    if (!existingProduct) throw new Error('Product is no longer available to edit.');
    const targetProduct = normalizeProductCategory({ ...existingProduct, ...updatedFields });

    const response = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetProduct)
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true || result?.dbSaved !== true) {
      throw new Error(result?.error || 'Product changes and images were not saved to the shared database.');
    }
    const savedProduct = normalizeProductCategory(result.data as Product);
    setProducts(prev =>
      prev.map(product => product.id === id ? savedProduct : product)
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));

    fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  const adjustProductStock = (id: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );

    fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta })
    }).catch(() => {});
  };

  // PIN code check (Integrated with Live Delhivery Logistics API)
  const checkPincode = (pin: string): PinCodeInfo => {
    const cleanPin = pin.trim().replace(/\D/g, '');
    setDeliveryPincode(cleanPin);

    // Initial instant local estimate
    const found = PINCODE_DATABASE[cleanPin];
    const is6Digit = /^[1-9][0-9]{5}$/.test(cleanPin);

    let detectedCity = found?.city;
    let detectedState = found?.state;

    if (!detectedCity && is6Digit) {
      if (cleanPin.startsWith('395') || cleanPin.startsWith('394')) {
        detectedCity = 'Surat';
        detectedState = 'Gujarat';
      } else if (cleanPin.startsWith('380') || cleanPin.startsWith('382')) {
        detectedCity = 'Ahmedabad';
        detectedState = 'Gujarat';
      } else if (cleanPin.startsWith('390') || cleanPin.startsWith('391')) {
        detectedCity = 'Vadodara';
        detectedState = 'Gujarat';
      } else if (cleanPin.startsWith('360')) {
        detectedCity = 'Rajkot';
        detectedState = 'Gujarat';
      } else if (cleanPin.startsWith('400')) {
        detectedCity = 'Mumbai';
        detectedState = 'Maharashtra';
      } else if (cleanPin.startsWith('110')) {
        detectedCity = 'New Delhi';
        detectedState = 'Delhi';
      } else {
        detectedCity = 'City not verified';
        detectedState = 'India';
      }
    }

    const initialInfo: PinCodeInfo = {
      pincode: cleanPin,
      city: detectedCity || (is6Digit ? 'City not verified' : 'Unknown'),
      state: detectedState || (is6Digit ? 'India' : 'Unknown'),
      serviceable: false,
      estimatedDays: 0
    };
    setDeliveryInfo(initialInfo);

    // Verify delivery serviceability for the entered postal code.
    if (cleanPin.length === 6) {
      fetch(`/api/app-config?action=pincode&pincode=${cleanPin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.serviceable) {
            const verifiedState = String(data.state || '').trim().toLowerCase();
            const isGujarat = verifiedState === 'gj' || verifiedState === 'gujarat'
              || cleanPin.startsWith('395') || cleanPin.startsWith('394');
            setDeliveryInfo({
              pincode: cleanPin,
              city: cleanPin.startsWith('395') || cleanPin.startsWith('394') ? 'Surat' : (data.city || initialInfo.city),
              state: cleanPin.startsWith('395') || cleanPin.startsWith('394') ? 'Gujarat' : (data.state || initialInfo.state),
              serviceable: true,
              estimatedDays: isGujarat ? 1 : 3,
              verified: true
            });
          } else if (data && data.serviceable === false) {
            setDeliveryInfo({
              pincode: cleanPin,
              city: initialInfo.city,
              state: initialInfo.state,
              serviceable: false,
              estimatedDays: 0,
              verified: true
            });
          }
        })
        .catch(() => {});
    }

    return initialInfo;
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => [query, ...prev.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, 6));
  };

  // Mobile App Handlers
  const updateMobileAppBanners = (banners: AppBanner[]) => {
    setMobileAppConfig(prev => ({
      ...prev,
      banners,
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const addMobileAppBanner = (banner: Omit<AppBanner, 'id' | 'displayOrder'>) => {
    const newBanner: AppBanner = {
      ...banner,
      id: `banner-${Date.now()}`,
      displayOrder: mobileAppConfig.banners.length + 1
    };
    setMobileAppConfig(prev => ({
      ...prev,
      banners: [...prev.banners, newBanner],
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const updateMobileAppBanner = (id: string, bannerUpdates: Partial<AppBanner>) => {
    setMobileAppConfig(prev => ({
      ...prev,
      banners: prev.banners.map(b => (b.id === id ? { ...b, ...bannerUpdates } : b)),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const deleteMobileAppBanner = (id: string) => {
    setMobileAppConfig(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const reorderMobileAppBanner = (bannerId: string, direction: 'up' | 'down') => {
    setMobileAppConfig(prev => {
      const idx = prev.banners.findIndex(b => b.id === bannerId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.banners.length) return prev;
      const updated = [...prev.banners];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      const reordered = updated.map((b, i) => ({ ...b, displayOrder: i + 1 }));
      return {
        ...prev,
        banners: reordered,
        lastSyncedAt: new Date().toISOString()
      };
    });
  };

  const toggleMobileAppBannerActive = (id: string) => {
    setMobileAppConfig(prev => ({
      ...prev,
      banners: prev.banners.map(b => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const updateMobileAppCategories = (categories: AppCategoryConfig[]) => {
    setMobileAppConfig(prev => ({
      ...prev,
      categories,
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const updateMobileAppCategoryConfig = (id: string, updates: Partial<AppCategoryConfig>) => {
    setMobileAppConfig(prev => ({
      ...prev,
      categories: prev.categories.map(c => (c.id === id ? { ...c, ...updates } : c)),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const updateMobileAppSettings = (settings: Partial<AppSettings>) => {
    setMobileAppConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const sendAppPushNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isSent'>) => {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSent: true
    };

    const response = await fetch('/api/app-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_notification',
        notification: newNotif
      })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'The notification could not be saved.');
    }

    setMobileAppConfig(prev => ({
      ...prev,
      notifications: [data.notification || newNotif, ...prev.notifications],
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const deleteAppNotification = (id: string) => {
    setMobileAppConfig(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const toggleAppExclusiveProduct = (productId: string) => {
    setMobileAppConfig(prev => {
      const exists = prev.appExclusiveProductIds.includes(productId);
      const appExclusiveProductIds = exists
        ? prev.appExclusiveProductIds.filter(id => id !== productId)
        : [...prev.appExclusiveProductIds, productId];
      return {
        ...prev,
        appExclusiveProductIds,
        lastSyncedAt: new Date().toISOString()
      };
    });
  };

  const syncConfigToFlutter = () => {
    const now = new Date().toISOString();
    const updated = {
      ...mobileAppConfig,
      lastSyncedAt: now
    };
    setMobileAppConfig(updated);
    localStorage.setItem('mle_mobile_app_config', JSON.stringify(updated));

    // Post live banners & config to MySQL database & API
    fetch('/api/app-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_banners',
        banners: updated.banners
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Banners synced to MySQL/API:', data);
      })
      .catch(err => {
        console.warn('Banners sync error:', err);
      });

    return {
      success: true,
      message: 'Mobile app configuration synced to live MySQL database and Flutter workspace successfully.',
      timestamp: now
    };
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        coupons,
        refreshCoupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        toggleCouponFeatured,
        cartSubtotal,
        cartTax,
        cartShipping,
        cartTotal,
        cartTotalItemsCount,

        // Wishlist
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,

        currentUser,
        isLoggedIn,
        registeredUsers,
        login,
        register,
        logout,
        deleteAccount,
        requestOtp,
        resetPassword,
        updateUserProfile,
        addSavedAddress,
        topUpWallet,
        creditRefundToWallet,
        redeemWalletPoints,

        orders,
        ordersSyncError,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        requestReturnOrExchange,
        sendAbandonedCartEmail,
        refreshOrders: syncOrdersFromBackend,

        quotations,
        createQuotationRequest,
        updateQuotationByStaff,
        acceptAndConvertQuotation,

        enquiries,
        submitBusinessEnquiry,

        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,

        // Categories & Collections
        categories,
        addCategory,
        updateCategory,
        deleteCategory,

        deliveryPincode,
        deliveryInfo,
        checkPincode,

        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch,

        // Mobile App
        mobileAppConfig,
        updateMobileAppBanners,
        addMobileAppBanner,
        updateMobileAppBanner,
        deleteMobileAppBanner,
        reorderMobileAppBanner,
        toggleMobileAppBannerActive,
        updateMobileAppCategories,
        updateMobileAppCategoryConfig,
        updateMobileAppSettings,
        sendAppPushNotification,
        deleteAppNotification,
        toggleAppExclusiveProduct,
        syncConfigToFlutter,

        // Mill Saver Bundle Config
        bundleOffer,
        updateBundleOffer,

        // Customization Pricing Config
        customizationPricing: customizationPricingState,
        updateCustomizationPricingConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
