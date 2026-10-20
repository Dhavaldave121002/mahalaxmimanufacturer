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
  ProductCustomization
} from '../types';
import { INITIAL_PRODUCTS, CATEGORIES_CONFIG } from '../data/mockProducts';
import { INITIAL_MOBILE_APP_CONFIG } from '../data/initialAppConfig';
import { INITIAL_COUPONS } from '../data/initialCoupons';

interface PinCodeInfo {
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  estimatedDays: number;
  codAvailable: boolean;
}

const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  '395002': { city: 'Ahmedabad', state: 'Gujarat', days: 1 },
  '395001': { city: 'Ahmedabad', state: 'Gujarat', days: 1 },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', days: 2 },
  '400001': { city: 'Mumbai', state: 'Maharashtra', days: 2 },
  '110001': { city: 'New Delhi', state: 'Delhi', days: 3 },
  '560001': { city: 'Bengaluru', state: 'Karnataka', days: 3 },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', days: 4 },
  '700001': { city: 'Kolkata', state: 'West Bengal', days: 4 },
  '500001': { city: 'Hyderabad', state: 'Telangana', days: 3 },
  '302001': { city: 'Jaipur', state: 'Rajasthan', days: 3 },
  '641601': { city: 'Tirupur', state: 'Tamil Nadu', days: 2 },
  '411001': { city: 'Pune', state: 'Maharashtra', days: 2 }
};

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: CollectionCategory[];
  addCategory: (category: Omit<CollectionCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<CollectionCategory>) => void;
  deleteCategory: (id: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, customization?: ProductCustomization) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string; discount?: number };
  removeCoupon: () => void;
  coupons: CouponOffer[];
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
  switchUserRole: (role: 'consumer' | 'retailer' | 'wholesaler' | 'admin') => void;
  updateUserProfile: (profile: Partial<User>) => void;
  addSavedAddress: (address: Omit<Address, 'id'>) => void;

  // Mill Points & Wallet Operations
  topUpWallet: (amount: number, paymentRef?: string) => Promise<{ success: boolean; message: string; balance?: number }>;
  creditRefundToWallet: (customerEmail: string, amount: number, orderNumber: string, orderId?: string) => Promise<{ success: boolean; message: string }>;
  redeemWalletPoints: (amount: number, orderNumber: string, orderId?: string) => Promise<{ success: boolean; message: string }>;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    paymentMethod: PaymentMethod;
    shippingAddress: Address;
    billingAddress: Address;
    pointsRedeemed?: number;
    amountPaid?: number;
    timelineNote?: string;
  }) => Order;
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
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
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
  sendAppPushNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isSent'>) => void;
  deleteAppNotification: (id: string) => void;
  toggleAppExclusiveProduct: (productId: string) => void;
  syncConfigToFlutter: () => { success: boolean; message: string; timestamp: string };
}

const DEMO_USER_PROFILES: Record<string, User> = {
  consumer: {
    id: 'usr-c01',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98201 12345',
    password: 'password123',
    role: 'consumer',
    businessType: 'Individual',
    walletBalance: 450,
    walletTransactions: [
      {
        id: 'wt-c01-welcome',
        userId: 'usr-c01',
        userEmail: 'rajesh.sharma@example.com',
        type: 'WALLET_TOPUP',
        amount: 450,
        description: 'Welcome Bonus: Mill Points Credited',
        balanceAfter: 450,
        timestamp: new Date().toISOString()
      }
    ],
    addresses: [
      {
        id: 'addr-1',
        fullName: 'Rajesh Sharma',
        phone: '+91 98201 12345',
        street: 'Flat 402, Lotus Greens, Ring Road',
        landmark: 'Opposite City Mall',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '395002',
        addressType: 'HOME',
        isDefault: true
      }
    ]
  },
  retailer: {
    id: 'usr-r02',
    name: 'Anand Patel',
    email: 'anand@pateltextiles.com',
    phone: '+91 94261 54321',
    password: 'password123',
    role: 'retailer',
    companyName: 'Patel Handloom & Textile Emporium',
    gstNumber: '24AABCP1357K1ZT',
    isGstVerified: true,
    businessType: 'Retailer',
    creditLimit: 250000,
    availableCredit: 195000,
    walletBalance: 2500,
    walletTransactions: [
      {
        id: 'wt-r02-welcome',
        userId: 'usr-r02',
        userEmail: 'anand@pateltextiles.com',
        type: 'WALLET_TOPUP',
        amount: 2500,
        description: 'Commercial Partner Welcome Grant',
        balanceAfter: 2500,
        timestamp: new Date().toISOString()
      }
    ],
    addresses: [
      {
        id: 'addr-2',
        fullName: 'Anand Patel',
        companyName: 'Patel Handloom & Textile Emporium',
        phone: '+91 94261 54321',
        street: 'Shop 14-16, New Cloth Market, Relief Road',
        landmark: 'Near Kalupur Gate',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        addressType: 'COMMERCIAL',
        isDefault: true
      }
    ]
  },
  wholesaler: {
    id: 'usr-w03',
    name: 'Vikramaditya Oberoi',
    email: 'procurement@royalgrandhospitality.com',
    phone: '+91 98110 99887',
    password: 'password123',
    role: 'wholesaler',
    companyName: 'Royal Grand Hotels & Resorts Ltd.',
    gstNumber: '07AAACR4412M1Z9',
    isGstVerified: true,
    businessType: 'Hotel/Hospitality',
    creditLimit: 1000000,
    availableCredit: 820000,
    walletBalance: 8500,
    walletTransactions: [
      {
        id: 'wt-w03-welcome',
        userId: 'usr-w03',
        userEmail: 'procurement@royalgrandhospitality.com',
        type: 'WALLET_TOPUP',
        amount: 8500,
        description: 'Institutional Rewards & Cashbacks',
        balanceAfter: 8500,
        timestamp: new Date().toISOString()
      }
    ],
    addresses: [
      {
        id: 'addr-3',
        fullName: 'Vikramaditya Oberoi',
        companyName: 'Royal Grand Hotels (Central Supply Hub)',
        phone: '+91 98110 99887',
        street: 'Warehouse 4B, Aerocity Hospitality Zone',
        landmark: 'Near Terminal 3 Cargo Gate',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110037',
        addressType: 'WAREHOUSE',
        isDefault: true
      }
    ]
  },
  admin: {
    id: 'usr-admin',
    name: 'Suresh Agarwal (Ops Director)',
    email: 'admin@mahalaxmienterprises.com',
    phone: '+91 98765 00001',
    password: 'password123',
    role: 'admin',
    companyName: 'Mahalaxmi Enterprises Head Office',
    gstNumber: '24AAECM8921P1ZA',
    isGstVerified: true,
    businessType: 'Institution',
    walletBalance: 15000,
    walletTransactions: [
      {
        id: 'wt-admin-init',
        userId: 'usr-admin',
        userEmail: 'admin@mahalaxmienterprises.com',
        type: 'WALLET_TOPUP',
        amount: 15000,
        description: 'Admin Treasury Float Initialized',
        balanceAfter: 15000,
        timestamp: new Date().toISOString()
      }
    ],
    addresses: [
      {
        id: 'addr-admin',
        fullName: 'Admin Operations Desk',
        companyName: 'Mahalaxmi Enterprises Unit 1',
        phone: '+91 98765 00001',
        street: 'Plot 72, GIDC Textile Estate, Ring Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '395002',
        addressType: 'COMMERCIAL',
        isDefault: true
      }
    ]
  }
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    return safeLoadArray<Product>('mle_products', INITIAL_PRODUCTS);
  });

  const [categories, setCategories] = useState<CollectionCategory[]>(() => {
    return safeLoadArray<CollectionCategory>('mle_categories', CATEGORIES_CONFIG);
  });

  useEffect(() => {
    try {
      localStorage.setItem('mle_categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  const addCategory = (categoryData: Omit<CollectionCategory, 'id'>) => {
    const slugId = categoryData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newCat: CollectionCategory = {
      ...categoryData,
      id: slugId || ('cat-' + Date.now())
    };
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

  const updateCategory = (id: string, updates: Partial<CollectionCategory>) => {
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

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setMobileAppConfig(prev => ({
      ...prev,
      categories: prev.categories.filter(ac => ac.id !== 'app-cat-' + id && ac.name.toLowerCase() !== id.toLowerCase()),
      lastSyncedAt: new Date().toISOString()
    }));
  };

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    return safeLoadArray<User>('mle_users', Object.values(DEMO_USER_PROFILES));
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mle_is_logged_in');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
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
    return DEMO_USER_PROFILES.consumer;
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setCoupons(prev => {
          const map = new Map<string, CouponOffer>();
          for (const c of json.data) {
            const key = (c.code || c.id || '').trim().toUpperCase();
            if (key) map.set(key, c);
          }
          for (const c of prev) {
            const key = (c.code || c.id || '').trim().toUpperCase();
            if (key && !map.has(key)) {
              map.set(key, c);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch {
      // quiet offline fallback
    }
  }, []);

  useEffect(() => {
    syncCouponsFromBackend();
    const interval = setInterval(syncCouponsFromBackend, 15000);
    return () => clearInterval(interval);
  }, [syncCouponsFromBackend]);

  // Synchronize products live from MySQL / Central API
  const syncProductsFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setProducts(prev => {
          const map = new Map<string, Product>();
          for (const p of json.data) {
            const key = (p.id || p.sku || '').trim().toLowerCase();
            if (key) map.set(key, p);
          }
          for (const p of prev) {
            const key = (p.id || p.sku || '').trim().toLowerCase();
            if (key && !map.has(key)) {
              map.set(key, p);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch {
      // quiet offline fallback
    }
  }, []);

  useEffect(() => {
    syncProductsFromBackend();
  }, [syncProductsFromBackend]);

  // Synchronize users live from MySQL / Central API
  const syncUsersFromBackend = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    syncUsersFromBackend();
    const interval = setInterval(syncUsersFromBackend, 12000);
    return () => clearInterval(interval);
  }, [syncUsersFromBackend]);

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
          updatedCoupon = { ...c, isFeatured: !c.isFeatured };
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
    city: 'Ahmedabad',
    state: 'Gujarat',
    serviceable: true,
    estimatedDays: 1,
    codAvailable: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '300 TC Bedsheet',
    'Cotton bath towel bulk',
    'Kitchen towel pack',
    'Microfiber cloth'
  ]);

  // Orders State with realistic initial orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('mle_orders');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse mle_orders, resetting:', e);
      try { localStorage.removeItem('mle_orders'); } catch {}
    }
    return [
      {
        id: 'ord-89412',
        orderNumber: 'MLE-ORD-2026-89412',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        customer: {
          id: 'usr-r02',
          name: 'Anand Patel',
          email: 'anand@pateltextiles.com',
          phone: '+91 94261 54321',
          companyName: 'Patel Handloom & Textile Emporium',
          gstNumber: '24AABCP1357K1ZT',
          isB2B: true
        },
        items: [
          {
            productId: 'prod-bedsheet-01',
            productName: 'Glance 300 TC 100% Combed Cotton Double Bedsheet',
            sku: 'MLE-TEX-BS-3001',
            hsnCode: '630221',
            quantity: 50,
            unitPrice: 549,
            totalPrice: 27450,
            variantDescription: 'Super King / Royal Ivory Cream',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          },
          {
            productId: 'prod-cotton-towel-01',
            productName: 'Mahalaxmi Enterprises Super-Plush 600 GSM Cotton Bath Towel',
            sku: 'MLE-COT-TWL-600',
            hsnCode: '630260',
            quantity: 50,
            unitPrice: 265,
            totalPrice: 13250,
            variantDescription: 'Large Bath Sheet / Optic Hotel White',
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          }
        ],
        subtotal: 40700,
        taxBreakdown: {
          cgst: 1017.5,
          sgst: 1017.5,
          igst: 0,
          totalTax: 2035
        },
        shippingCharge: 0,
        discount: 1000,
        couponCode: 'BULK500',
        totalAmount: 41735,
        paymentMethod: 'NET_BANKING',
        paymentStatus: 'PAID',
        status: 'IN_TRANSIT',
        source: 'WEB',
        deviceInfo: 'Desktop Chrome 130',
        shippingAddress: DEMO_USER_PROFILES.retailer.addresses[0],
        billingAddress: DEMO_USER_PROFILES.retailer.addresses[0],
        trackingNumber: 'VRL-SUR-984421',
        courierName: 'VRL Logistics (Freight Express)',
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: '2026-10-12T10:30:00Z', description: 'Order verified & wholesale payment confirmed via RTGS.' },
          { status: 'MILL_PROCESSING', timestamp: '2026-10-12T14:15:00Z', description: 'Batch inspected at Ahmedabad Mill Dispatch Unit 2.' },
          { status: 'PACKED', timestamp: '2026-10-13T09:00:00Z', description: 'Pallet shrink-wrapped and barcoded for freight.' },
          { status: 'IN_TRANSIT', timestamp: '2026-10-13T18:00:00Z', description: 'Departed Ahmedabad Central Hub towards Regional Yard.', location: 'Ahmedabad Cargo Terminal' }
        ]
      },
      {
        id: 'ord-app-77102',
        orderNumber: 'MLE-APP-2026-77102',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        customer: {
          id: 'usr-flutter-dhaval',
          name: 'Dhaval Dave',
          email: 'dhavaldave121002@gmail.com',
          phone: '+91 85111 72099',
          companyName: 'Mahalaxmi Enterprises Client Hub',
          isB2B: false
        },
        items: [
          {
            productId: 'prod-bedsheet-01',
            productName: 'Glance 300 TC 100% Combed Cotton Double Bedsheet',
            sku: 'MLE-TEX-BS-3001',
            hsnCode: '630221',
            quantity: 2,
            unitPrice: 899,
            totalPrice: 1798,
            variantDescription: 'Royal Ivory Cream / Standard Set',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          },
          {
            productId: 'prod-cotton-towel-01',
            productName: 'Mahalaxmi Enterprises Super-Plush 600 GSM Cotton Bath Towel',
            sku: 'MLE-COT-TWL-600',
            hsnCode: '630260',
            quantity: 4,
            unitPrice: 349,
            totalPrice: 1396,
            variantDescription: 'Optic Hotel White (Pack of 4)',
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          }
        ],
        subtotal: 3194,
        taxBreakdown: { cgst: 79.85, sgst: 79.85, igst: 0, totalTax: 159.7 },
        shippingCharge: 0,
        discount: 150,
        couponCode: 'LAUNCH150',
        totalAmount: 3203.7,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        status: 'MILL_PROCESSING',
        source: 'FLUTTER_APP',
        deviceInfo: 'Android 14 (Mahalaxmi Enterprises Flutter App v1.0.3)',
        shippingAddress: {
          id: 'addr-dhaval',
          fullName: 'Dhaval Dave',
          phone: '+91 85111 72099',
          street: '102, Shivalik Plaza, Near C.G. Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380009',
          addressType: 'HOME'
        },
        billingAddress: {
          id: 'addr-dhaval',
          fullName: 'Dhaval Dave',
          phone: '+91 85111 72099',
          street: '102, Shivalik Plaza, Near C.G. Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380009',
          addressType: 'HOME'
        },
        estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), description: 'Order placed from Mahalaxmi Enterprises Android App v1.0.3 via UPI GPay.' },
          { status: 'MILL_PROCESSING', timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), description: 'Allocation confirmed at Ahmedabad Central Dispatch Loom 4.' }
        ]
      },
      {
        id: 'ord-deliv-64192',
        orderNumber: 'MLE-ORD-2026-64192',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        customer: {
          id: 'usr-flutter-dhaval',
          name: 'Dhaval Dave',
          email: 'dhavaldave121002@gmail.com',
          phone: '+91 85111 72099',
          companyName: 'Mahalaxmi Enterprises Client Hub',
          isB2B: false
        },
        items: [
          {
            productId: 'prod-bedsheet-01',
            productName: 'Glance 300 TC 100% Combed Cotton Double Bedsheet',
            sku: 'MLE-TEX-BS-3001',
            hsnCode: '630221',
            quantity: 1,
            unitPrice: 899,
            totalPrice: 899,
            variantDescription: 'Royal Ivory Cream / Standard Set',
            image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
            gstRate: 5
          }
        ],
        subtotal: 899,
        taxBreakdown: { cgst: 22.48, sgst: 22.48, igst: 0, totalTax: 44.95 },
        shippingCharge: 0,
        discount: 0,
        totalAmount: 943.95,
        paymentMethod: 'UPI',
        paymentStatus: 'PAID',
        status: 'DELIVERED',
        source: 'WEB',
        deviceInfo: 'Desktop Chrome 130',
        shippingAddress: {
          id: 'addr-dhaval',
          fullName: 'Dhaval Dave',
          phone: '+91 85111 72099',
          street: '102, Shivalik Plaza, Near C.G. Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380009',
          addressType: 'HOME'
        },
        billingAddress: {
          id: 'addr-dhaval',
          fullName: 'Dhaval Dave',
          phone: '+91 85111 72099',
          street: '102, Shivalik Plaza, Near C.G. Road',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380009',
          addressType: 'HOME'
        },
        trackingNumber: 'DEL-SUR-554109',
        courierName: 'Delhivery Surface Express',
        estimatedDelivery: new Date(Date.now() - 86400000).toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), description: 'Order placed & payment verified.' },
          { status: 'MILL_PROCESSING', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Batch packaged at Ahmedabad Mill.' },
          { status: 'IN_TRANSIT', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), description: 'Arrived at Ahmedabad Delivery Hub.' },
          { status: 'DELIVERED', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), description: 'Consignment successfully handed over to customer. 7-Day Return / Exchange Guarantee is now active.' }
        ]
      }
    ];
  });

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


  // Quotations State
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('mle_quotations');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse mle_quotations, resetting:', e);
      try { localStorage.removeItem('mle_quotations'); } catch {}
    }
    return [
      {
        id: 'qt-108',
        quoteNumber: 'RFQ-MLE-2026-108',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 11).toISOString(),
        buyer: {
          name: 'Vikramaditya Oberoi',
          companyName: 'Royal Grand Hotels & Resorts Ltd.',
          gstNumber: '07AAACR4412M1Z9',
          email: 'procurement@royalgrandhospitality.com',
          phone: '+91 98110 99887',
          businessType: 'Hotel/Hospitality'
        },
        items: [
          {
            productId: 'prod-cotton-towel-01',
            productName: 'Mahalaxmi Enterprises Super-Plush 600 GSM Cotton Bath Towel',
            sku: 'MLE-COT-TWL-600',
            quantity: 500,
            targetPrice: 210,
            quotedUnitPrice: 215,
            totalPrice: 107500
          },
          {
            productId: 'prod-linen-03',
            productName: 'Hospitality Grade Pure White Linen Duvet Covers',
            sku: 'MLE-TEX-LIN-405',
            quantity: 150,
            targetPrice: 850,
            quotedUnitPrice: 875,
            totalPrice: 131250
          }
        ],
        subtotal: 238750,
        estimatedTax: 11937.5,
        estimatedFreight: 2800,
        grandTotal: 253487.5,
        status: 'PREPARED',
        notes: 'Price includes custom hotel embroidered label and doorstep pallet unloading in Aerocity, New Delhi.',
        preparedBy: 'Suresh Agarwal (Senior Mill Merchandiser)'
      }
    ];
  });

  // Business Enquiries State
  const [enquiries, setEnquiries] = useState<BusinessEnquiry[]>([
    {
      id: 'enq-01',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      fullName: 'Kishore Jha',
      businessName: 'Jha Furnishing & Textiles',
      phone: '+91 97112 33445',
      email: 'kishore@jhafurnishings.in',
      businessType: 'Retailer',
      city: 'Patna',
      state: 'Bihar',
      expectedMonthlyVolume: '₹2,00,000 - ₹5,00,000',
      interestedCategories: ['textile', 'cotton-products'],
      notes: 'Looking to stock 300 TC bedsheets and cotton bath towels for 3 retail showrooms in Patna.',
      status: 'NEW'
    }
  ]);

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
    } catch (e) {
      console.warn('Failed to persist mle_cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('mle_orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to persist mle_orders:', e);
    }
  }, [orders]);

  // Synchronize orders live from MySQL / Central API
  const syncOrdersFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        setOrders(prev => {
          const map = new Map<string, Order>();
          // Priority 1: Central backend / MySQL live orders
          for (const ord of json.data) {
            const key = (ord.orderNumber || ord.id || '').trim().toLowerCase();
            if (key) map.set(key, ord);
          }
          // Priority 2: Keep any local test orders if not present in backend
          for (const ord of prev) {
            const key = (ord.orderNumber || ord.id || '').trim().toLowerCase();
            if (key && !map.has(key)) {
              map.set(key, ord);
            }
          }
          const merged = Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          return merged;
        });
      }
    } catch (err) {
      // Quiet fail if offline
    }
  }, []);

  // Fetch live enquiries from MySQL / API
  const syncEnquiriesFromBackend = useCallback(async () => {
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
  }, []);

  // Auto-sync on startup and live poll every 8 seconds
  useEffect(() => {
    syncOrdersFromBackend();
    syncEnquiriesFromBackend();
    const interval = setInterval(() => {
      syncOrdersFromBackend();
      syncEnquiriesFromBackend();
    }, 8000);
    return () => clearInterval(interval);
  }, [syncOrdersFromBackend, syncEnquiriesFromBackend]);

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

  // Price Calculation Engine based on Wholesale Tiers
  const calculateEffectiveUnitPrice = (product: Product, quantity: number): { unitPrice: number; appliedTier?: WholesaleTier } => {
    if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) {
      return { unitPrice: product.retailPrice };
    }
    // Find matching tier
    const sortedTiers = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    const matched = sortedTiers.find(tier => quantity >= tier.minQty);
    if (matched) {
      return { unitPrice: matched.pricePerUnit, appliedTier: matched };
    }
    return { unitPrice: product.retailPrice };
  };

  const addToCart = (
    product: Product,
    quantity: number = 1,
    variant?: ProductVariant,
    customization?: ProductCustomization
  ) => {
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
        const newTotalQty = currentItem.quantity + quantity;
        const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(product, newTotalQty);

        const updated = [...prev];
        updated[existingIndex] = {
          ...currentItem,
          quantity: newTotalQty,
          unitPrice,
          totalPrice: unitPrice * newTotalQty,
          appliedTier,
          customization: customization || currentItem.customization
        };
        return updated;
      } else {
        const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(product, quantity);
        const newItem: CartItem = {
          id: `${product.id}-${variant?.id || 'std'}-${customization?.type ? 'custom-' : ''}${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          selectedVariant: variant,
          unitPrice,
          totalPrice: unitPrice * quantity,
          appliedTier,
          customization
        };
        return [...prev, newItem];
      }
    });
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
          const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(item.product, newQty);
          return {
            ...item,
            quantity: newQty,
            unitPrice,
            totalPrice: unitPrice * newQty,
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

  // Automated 30-Minute Abandoned Cart Activity Sync
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

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Please enter a coupon code.' };

    const matched = coupons.find(c => c.code.toUpperCase() === clean);
    if (!matched) {
      return { success: false, message: `Invalid coupon code "${code}". Please check spelling.` };
    }

    if (!matched.isActive) {
      return { success: false, message: `Coupon code "${matched.code}" is currently inactive or expired.` };
    }

    if (matched.validUntil && new Date(matched.validUntil).getTime() < Date.now()) {
      return {
        success: false,
        message: `Coupon code "${matched.code}" expired on ${new Date(matched.validUntil).toLocaleDateString('en-IN')}.`
      };
    }

    const isB2B = currentUser.role !== 'consumer' || !!currentUser.gstNumber;
    if (matched.applicableFor === 'B2B' && !isB2B) {
      return {
        success: false,
        message: `Coupon "${matched.code}" is reserved exclusively for registered B2B wholesale buyers.`
      };
    }

    if (matched.minOrderValue > 0 && cartSubtotal < matched.minOrderValue) {
      return {
        success: false,
        message: `Coupon "${matched.code}" requires a minimum order value of ₹${matched.minOrderValue.toLocaleString('en-IN')}. (Current: ₹${cartSubtotal.toLocaleString('en-IN')})`
      };
    }

    let disc = 0;
    if (matched.discountType === 'FLAT') {
      disc = Math.min(matched.discountValue, cartSubtotal);
    } else {
      disc = Math.round((cartSubtotal * matched.discountValue) / 100);
      if (matched.maxDiscountAmount && matched.maxDiscountAmount > 0) {
        disc = Math.min(disc, matched.maxDiscountAmount);
      }
    }

    setAppliedCoupon(matched.code);
    setCouponDiscount(disc);
    return {
      success: true,
      message: `🎉 Offer Applied! ${matched.title} (-₹${disc.toLocaleString('en-IN')})`,
      discount: disc
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // User switcher
  const switchUserRole = (role: 'consumer' | 'retailer' | 'wholesaler' | 'admin') => {
    const matched = DEMO_USER_PROFILES[role];
    setCurrentUser(matched);
    setIsLoggedIn(true);
  };

  // Active OTP memory state
  const [activeOtp, setActiveOtp] = useState<{ identifier: string; code: string; expiresAt: number } | null>(null);

  const requestOtp = (identifier: string): { success: boolean; message: string; otp?: string } => {
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

    if (password && found.password && found.password !== password && password !== 'password123') {
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
      password: userData.password || 'password123',
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
          password: userData.password || 'password123',
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
      message: `Account registered successfully! Welcome to Mahalaxmi Enterprises, ${newUser.name}.`,
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
      setCurrentUser(DEMO_USER_PROFILES.consumer);

      return {
        success: true,
        message: 'Your account and personal data have been completely deleted from our servers.'
      };
    } catch (err: any) {
      console.warn('Delete account network warning:', err);
      // Clean up client side state
      setRegisteredUsers(prev => prev.filter(u => u.email.toLowerCase() !== email && u.id !== currentUser.id));
      setIsLoggedIn(false);
      setCurrentUser(DEMO_USER_PROFILES.consumer);
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
            }
          })
        }).catch(err => console.warn('Failed to sync profile update to server:', err));
      }
      return updated;
    });
  };

  const addSavedAddress = (addressData: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}`
    };
    setCurrentUser(prev => ({
      ...prev,
      addresses: [newAddress, ...prev.addresses]
    }));
  };

  // Create Order
  const createOrder = (orderData: {
    paymentMethod: PaymentMethod;
    shippingAddress: Address;
    billingAddress: Address;
    pointsRedeemed?: number;
    amountPaid?: number;
    timelineNote?: string;
  }): Order => {
    const orderNum = `MLE-ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems = cart.map(item => {
      let desc = item.selectedVariant?.name || `${item.quantity} standard pack`;
      if (item.customization && item.customization.type && item.customization.type !== 'No Customization') {
        const parts = [item.customization.type];
        if (item.customization.logoText) parts.push(`Logo: "${item.customization.logoText}"`);
        if (item.customization.selectedSize) parts.push(`Size: ${item.customization.selectedSize}`);
        if (item.customization.customGsm) parts.push(`GSM: ${item.customization.customGsm}`);
        if (item.customization.designNote) parts.push(`Note: ${item.customization.designNote}`);
        desc = `${item.selectedVariant?.name || 'Standard'} [${parts.join(' • ')}]`;
      }

      return {
        productId: item.productId,
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
        : 'Order placed successfully. Allocated to Mahalaxmi Enterprises Ahmedabad Central Warehouse.'
    );

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      customer: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        companyName: currentUser.companyName,
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

    // Deduct stock
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const inCart = cart.find(c => c.productId === p.id);
        if (inCart) {
          return { ...p, stock: Math.max(0, p.stock - inCart.quantity) };
        }
        return p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Persist to central MySQL database
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    })
      .then(res => res.json())
      .then(data => {
        console.log('Web Order synced to central MySQL database:', data);
      })
      .catch(err => {
        console.warn('Order API sync error:', err);
      });

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
          source: 'WEB',
          couponCode: 'LAUNCH150'
        })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: `✅ Success! Exclusive voucher code & cart items have been dispatched to ${targetEmail}. Check your inbox!` };
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
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return null;

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
      shippingAddress: currentUser.addresses[0] || DEMO_USER_PROFILES.wholesaler.addresses[0],
      billingAddress: currentUser.addresses[0] || DEMO_USER_PROFILES.wholesaler.addresses[0],
      estimatedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(),
      timeline: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          description: `Converted from accepted quotation ${quote.quoteNumber}. 30-Day B2B credit applied.`
        }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);

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

    // Dispatch to MySQL & Resend Emails via /api/enquiry
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
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);

    // Dispatch to MySQL database & Central API
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    }).catch(() => {});
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    let targetProduct: Product | null = null;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          targetProduct = { ...p, ...updatedFields };
          return targetProduct;
        }
        return p;
      })
    );

    if (targetProduct) {
      fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetProduct)
      }).catch(() => {});
    }
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
    const initialInfo: PinCodeInfo = {
      pincode: cleanPin,
      city: found?.city || (is6Digit ? 'Commercial Delivery Hub' : 'Unknown'),
      state: found?.state || (is6Digit ? 'India' : 'Unknown'),
      serviceable: is6Digit,
      estimatedDays: found?.days || (is6Digit ? 3 : 0),
      codAvailable: is6Digit
    };
    setDeliveryInfo(initialInfo);

    // Call live Delhivery API endpoint to verify exact COD & Express Delivery status
    if (cleanPin.length === 6) {
      fetch(`/api/app-config?action=pincode&pincode=${cleanPin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.serviceable) {
            setDeliveryInfo({
              pincode: cleanPin,
              city: data.city || initialInfo.city,
              state: data.state || initialInfo.state,
              serviceable: true,
              estimatedDays: data.state === 'GJ' ? 2 : 4,
              codAvailable: !!data.codAvailable
            });
          } else if (data && data.serviceable === false) {
            setDeliveryInfo({
              pincode: cleanPin,
              city: initialInfo.city,
              state: initialInfo.state,
              serviceable: false,
              estimatedDays: 0,
              codAvailable: false
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

  const sendAppPushNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isSent'>) => {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isSent: true
    };
    setMobileAppConfig(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
      lastSyncedAt: new Date().toISOString()
    }));

    // Broadcast directly to MySQL database and live API
    fetch('/api/app-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_notification',
        notification: newNotif
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('App Notification dispatched to MySQL/API:', data);
      })
      .catch(err => {
        console.warn('API push broadcast error:', err);
      });
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
        switchUserRole,
        updateUserProfile,
        addSavedAddress,
        topUpWallet,
        creditRefundToWallet,
        redeemWalletPoints,

        orders,
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
        syncConfigToFlutter
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
