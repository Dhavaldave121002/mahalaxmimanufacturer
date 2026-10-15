import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, User, Order, Quotation, BusinessEnquiry, Address, WholesaleTier, ProductVariant } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';

interface PinCodeInfo {
  pincode: string;
  city: string;
  state: string;
  serviceable: boolean;
  estimatedDays: number;
  codAvailable: boolean;
}

const PINCODE_DATABASE: Record<string, { city: string; state: string; days: number }> = {
  '395002': { city: 'Surat', state: 'Gujarat', days: 1 },
  '395001': { city: 'Surat', state: 'Gujarat', days: 1 },
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
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  cartSubtotal: number;
  cartTax: { cgst: number; sgst: number; igst: number; totalTax: number };
  cartShipping: number;
  cartTotal: number;
  cartTotalItemsCount: number;

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
  requestOtp: (identifier: string) => { success: boolean; message: string; otp?: string };
  resetPassword: (identifier: string, otp: string, newPassword: string) => { success: boolean; message: string };
  switchUserRole: (role: 'consumer' | 'retailer' | 'wholesaler' | 'admin') => void;
  updateUserProfile: (profile: Partial<User>) => void;
  addSavedAddress: (address: Omit<Address, 'id'>) => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    paymentMethod: 'UPI' | 'COD' | 'NET_BANKING' | 'CREDIT_30_DAYS';
    shippingAddress: Address;
    billingAddress: Address;
  }) => Order;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingNumber?: string, courierName?: string) => void;

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
    addresses: [
      {
        id: 'addr-1',
        fullName: 'Rajesh Sharma',
        phone: '+91 98201 12345',
        street: 'Flat 402, Lotus Greens, Ring Road',
        landmark: 'Opposite City Mall',
        city: 'Surat',
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
    addresses: [
      {
        id: 'addr-admin',
        fullName: 'Admin Operations Desk',
        companyName: 'Mahalaxmi Enterprises Unit 1',
        phone: '+91 98765 00001',
        street: 'Plot 72, GIDC Textile Estate, Ring Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395002',
        addressType: 'COMMERCIAL',
        isDefault: true
      }
    ]
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mle_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mle_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return Object.values(DEMO_USER_PROFILES);
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('mle_is_logged_in');
    return saved !== null ? saved === 'true' : true;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('mle_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEMO_USER_PROFILES.consumer;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mle_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [deliveryPincode, setDeliveryPincode] = useState<string>('395002');
  const [deliveryInfo, setDeliveryInfo] = useState<PinCodeInfo | null>({
    pincode: '395002',
    city: 'Surat',
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
    const saved = localStorage.getItem('mle_orders');
    if (saved) return JSON.parse(saved);
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
            productName: 'Mahalaxmi Super-Plush 600 GSM Cotton Bath Towel',
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
        shippingAddress: DEMO_USER_PROFILES.retailer.addresses[0],
        billingAddress: DEMO_USER_PROFILES.retailer.addresses[0],
        trackingNumber: 'VRL-SUR-984421',
        courierName: 'VRL Logistics (Freight Express)',
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
        timeline: [
          { status: 'PLACED', timestamp: '2026-10-12T10:30:00Z', description: 'Order verified & wholesale payment confirmed via RTGS.' },
          { status: 'MILL_PROCESSING', timestamp: '2026-10-12T14:15:00Z', description: 'Batch inspected at Surat Mill Dispatch Unit 2.' },
          { status: 'PACKED', timestamp: '2026-10-13T09:00:00Z', description: 'Pallet shrink-wrapped and barcoded for freight.' },
          { status: 'IN_TRANSIT', timestamp: '2026-10-13T18:00:00Z', description: 'Departed Surat Hub towards Ahmedabad Central Yard.', location: 'Surat Cargo Terminal' }
        ]
      }
    ];
  });

  // Quotations State
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('mle_quotations');
    if (saved) return JSON.parse(saved);
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
            productName: 'Mahalaxmi Super-Plush 600 GSM Cotton Bath Towel',
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

  // Persist storage
  useEffect(() => {
    localStorage.setItem('mle_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mle_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('mle_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('mle_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('mle_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('mle_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('mle_current_user', JSON.stringify(currentUser));
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

  const addToCart = (product: Product, quantity: number = 1, variant?: ProductVariant) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.selectedVariant?.id === variant?.id
      );

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
          appliedTier
        };
        return updated;
      } else {
        const { unitPrice, appliedTier } = calculateEffectiveUnitPrice(product, quantity);
        const newItem: CartItem = {
          id: `${product.id}-${variant?.id || 'std'}-${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          selectedVariant: variant,
          unitPrice,
          totalPrice: unitPrice * quantity,
          appliedTier
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
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'LAUNCH150' || clean === 'FIRSTORDER') {
      const disc = Math.min(150, cartSubtotal);
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      return { success: true, message: '🎉 Launch Offer Applied! Flat ₹150 OFF on your first mill order.' };
    } else if (clean === 'MILLDIRECT10') {
      const disc = Math.round(cartSubtotal * 0.1);
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      return { success: true, message: 'Coupon applied! 10% instant direct mill discount.' };
    } else if (clean === 'BULK500') {
      if (cartSubtotal < 3000) {
        return { success: false, message: 'BULK500 requires a minimum order value of ₹3,000.' };
      }
      setAppliedCoupon(clean);
      setCouponDiscount(500);
      return { success: true, message: 'Coupon applied! ₹500 instant bulk discount.' };
    } else if (clean === 'MAHALAXMI20') {
      if (cartSubtotal < 10000) {
        return { success: false, message: 'MAHALAXMI20 requires minimum order value of ₹10,000 for wholesale buyers.' };
      }
      const disc = Math.round(cartSubtotal * 0.2);
      setAppliedCoupon(clean);
      setCouponDiscount(disc);
      return { success: true, message: 'Wholesale coupon applied! 20% commercial discount applied.' };
    }
    return { success: false, message: 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartTotalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Accurate GST breakdown
  const cartTax = cart.reduce(
    (acc, item) => {
      const itemTaxRate = (item.product.gstRate || 5) / 100;
      const lineTax = item.totalPrice * itemTaxRate;
      acc.totalTax += lineTax;
      // If buyer is in Gujarat (same state as mill 24), CGST + SGST; otherwise IGST
      if (currentUser.addresses[0]?.state.toLowerCase() === 'gujarat') {
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

  // User switcher
  const switchUserRole = (role: 'consumer' | 'retailer' | 'wholesaler' | 'admin') => {
    const matched = DEMO_USER_PROFILES[role];
    setCurrentUser(matched);
    setIsLoggedIn(true);
  };

  const requestOtp = (identifier: string): { success: boolean; message: string; otp?: string } => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { success: false, message: 'Please enter a valid mobile number or email address.' };
    }
    return {
      success: true,
      message: `OTP sent successfully to ${identifier}! Use demo verification code: 1210`,
      otp: '1210'
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

    if (otp) {
      if (otp.trim() !== '1210' && otp.trim() !== '1234') {
        return { success: false, message: 'Incorrect OTP. Please enter the 4-digit code (use demo: 1210).' };
      }

      if (!found) {
        const autoUser: User = {
          id: `usr-${Date.now()}`,
          name: cleanDigits.length >= 10 ? `Customer ${cleanDigits.slice(-4)}` : identifier.split('@')[0],
          email: clean.includes('@') ? clean : `${cleanDigits || Date.now()}@mahalaxmicustomer.in`,
          phone: cleanDigits.length >= 10 ? `+91 ${cleanDigits.slice(-10)}` : '+91 98765 00000',
          role: 'consumer',
          businessType: 'Individual',
          addresses: [],
          password: 'password123'
        };
        setRegisteredUsers(prev => [...prev, autoUser]);
        found = autoUser;
      }

      setCurrentUser(found);
      setIsLoggedIn(true);
      return {
        success: true,
        message: `Welcome back, ${found.name}! Successfully signed in via OTP.`,
        user: found
      };
    }

    if (!found) {
      return {
        success: false,
        message: 'No account found with this email or mobile. Please register or sign in with OTP.'
      };
    }

    if (password && (found.password === password || password === 'password123' || password === '123456')) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      return {
        success: true,
        message: `Welcome back, ${found.name}!`,
        user: found
      };
    }

    return {
      success: false,
      message: 'Incorrect password. Try "password123" or use instant OTP login (code: 1210).'
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

    return {
      success: true,
      message: `Account registered successfully! Welcome to Mahalaxmi Enterprises, ${newUser.name}.`,
      user: newUser
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  const resetPassword = (
    identifier: string,
    otp: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (otp.trim() !== '1210' && otp.trim() !== '1234') {
      return { success: false, message: 'Invalid verification code. Use demo OTP 1210.' };
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

    if (currentUser.id === updated[userIndex].id) {
      setCurrentUser(updated[userIndex]);
    }

    return {
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    };
  };

  const updateUserProfile = (profile: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...profile }));
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
    paymentMethod: 'UPI' | 'COD' | 'NET_BANKING' | 'CREDIT_30_DAYS';
    shippingAddress: Address;
    billingAddress: Address;
  }): Order => {
    const orderNum = `MLE-ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderItems = cart.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      hsnCode: item.product.hsnCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      variantDescription: item.selectedVariant?.name || `${item.quantity} standard pack`,
      image: item.product.images[0],
      gstRate: item.product.gstRate
    }));

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
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
      status: 'PLACED',
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      estimatedDelivery: new Date(Date.now() + 86400000 * (deliveryInfo?.estimatedDays || 3)).toISOString(),
      timeline: [
        {
          status: 'PLACED',
          timestamp: new Date().toISOString(),
          description: 'Order placed successfully. Allocated to Mahalaxmi Surat Central Warehouse.'
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
              description: `Status updated to ${status} by logistics dispatcher.`
            }
          ];
          return {
            ...ord,
            status,
            trackingNumber: trackingNumber || ord.trackingNumber,
            courierName: courierName || ord.courierName,
            timeline: updatedTimeline
          };
        }
        return ord;
      })
    );
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
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustProductStock = (id: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
  };

  // PIN code check
  const checkPincode = (pin: string): PinCodeInfo => {
    setDeliveryPincode(pin);
    const found = PINCODE_DATABASE[pin.trim()];
    if (found) {
      const info: PinCodeInfo = {
        pincode: pin,
        city: found.city,
        state: found.state,
        serviceable: true,
        estimatedDays: found.days,
        codAvailable: true
      };
      setDeliveryInfo(info);
      return info;
    } else {
      // Default fallback for any 6-digit Indian pin
      const is6Digit = /^[1-9][0-9]{5}$/.test(pin.trim());
      const info: PinCodeInfo = {
        pincode: pin,
        city: is6Digit ? 'Pan-India Hub' : 'Unknown',
        state: is6Digit ? 'India' : 'Unknown',
        serviceable: is6Digit,
        estimatedDays: is6Digit ? 4 : 0,
        codAvailable: is6Digit
      };
      setDeliveryInfo(info);
      return info;
    }
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => [query, ...prev.filter(q => q.toLowerCase() !== query.toLowerCase())].slice(0, 6));
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
        cartSubtotal,
        cartTax,
        cartShipping,
        cartTotal,
        cartTotalItemsCount,

        currentUser,
        isLoggedIn,
        registeredUsers,
        login,
        register,
        logout,
        requestOtp,
        resetPassword,
        switchUserRole,
        updateUserProfile,
        addSavedAddress,

        orders,
        createOrder,
        updateOrderStatus,

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

        deliveryPincode,
        deliveryInfo,
        checkPincode,

        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch
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
