export type CategoryId = 'home-kitchen' | 'household' | 'textile' | 'cotton-products';

export interface WholesaleTier {
  minQty: number;
  maxQty?: number;
  pricePerUnit: number;
  savingsPercent: number;
  label: string;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Royal Blue / King Size (Pack of 2)"
  colorName?: string;
  colorHex?: string;
  size?: string;
  packSize?: number;
  sku: string;
  priceDelta?: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: CategoryId;
  categoryName: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  images: string[];
  mrp: number;
  retailPrice: number;
  wholesaleTiers: WholesaleTier[];
  moq: number; // Minimum Order Quantity for bulk/wholesale
  stock: number;
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isDirectMillDeal?: boolean;
  isTrending?: boolean;
  specifications: Record<string, string>;
  careInstructions?: string[];
  variants?: ProductVariant[];
  tags: string[];
  hsnCode: string;
  gstRate: number; // e.g. 5 for 5% or 12 for 12%
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  unitPrice: number;
  totalPrice: number;
  appliedTier?: WholesaleTier;
}

export type UserRole = 'consumer' | 'retailer' | 'wholesaler' | 'admin';

export interface Address {
  id: string;
  fullName: string;
  companyName?: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'HOME' | 'COMMERCIAL' | 'WAREHOUSE';
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessType?: 'Retailer' | 'Reseller' | 'Hotel/Hospitality' | 'Institution' | 'Individual';
  companyName?: string;
  gstNumber?: string;
  isGstVerified?: boolean;
  addresses: Address[];
  creditLimit?: number;
  availableCredit?: number;
  password?: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'MILL_PROCESSING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'EXCHANGE_REQUESTED'
  | 'RETURN_APPROVED'
  | 'REFUNDED'
  | 'EXCHANGE_APPROVED'
  | 'RETURN_REJECTED';

export type PaymentMethod = 'RAZORPAY' | 'UPI' | 'COD' | 'NET_BANKING' | 'CREDIT_30_DAYS';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED' | 'CREDIT_APPROVED';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantDescription?: string;
  image: string;
  gstRate: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    gstNumber?: string;
    isB2B: boolean;
  };
  items: OrderItem[];
  subtotal: number;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };
  shippingCharge: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  source?: 'WEB' | 'FLUTTER_APP';
  deviceInfo?: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    description: string;
    location?: string;
  }[];
}

export interface QuotationItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  targetPrice?: number;
  quotedUnitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  buyer: {
    name: string;
    companyName: string;
    gstNumber?: string;
    email: string;
    phone: string;
    businessType: string;
  };
  items: QuotationItem[];
  subtotal: number;
  estimatedTax: number;
  estimatedFreight: number;
  grandTotal: number;
  status: 'PENDING' | 'PREPARED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  notes?: string;
  preparedBy?: string;
}

export interface BusinessEnquiry {
  id: string;
  createdAt: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  businessType: 'Retailer' | 'Reseller' | 'Hotel/Hospitality' | 'Institution' | 'Exporter' | 'Other';
  city: string;
  state: string;
  expectedMonthlyVolume: string;
  interestedCategories: string[];
  notes: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED';
}

// ==========================================
// MOBILE APP MANAGEMENT (FLUTTER APP CMS)
// ==========================================
export interface AppBanner {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  tag: string;
  cta: string;
  ctaLink?: string;
  badge?: string;
  tagline?: string;
  image: string;
  mobileImage?: string;
  gradientFrom: string;
  gradientVia?: string;
  gradientTo: string;
  accentColor: string;
  iconName: string;
  badgeIcon: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AppCategoryConfig {
  id: string;
  name: string;
  color: string;
  iconName: string;
  image: string;
  productCountText: string;
  isFeaturedInApp: boolean;
  displayOrder: number;
}

export interface CollectionCategory {
  id: string;
  name: string;
  tagline: string;
  image: string;
  description: string;
  subcategories: string[];
  color?: string;
  isFeaturedInApp?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  targetCategory?: string;
  type: 'OFFER' | 'ORDER' | 'SYSTEM' | 'PRICE_DROP';
  isSent: boolean;
}

export interface AppSettings {
  appName: string;
  appVersion: string;
  minSupportedVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  flashSaleActive: boolean;
  flashSaleTag: string;
  catalogDownloadUrl: string;
  gstNotice: string;
  localFlutterProjectPath: string;
}

export interface MobileAppConfig {
  banners: AppBanner[];
  categories: AppCategoryConfig[];
  settings: AppSettings;
  notifications: AppNotification[];
  appExclusiveProductIds: string[];
  lastSyncedAt: string;
}

// ==========================================
// PROMO COUPONS & MILL OFFERS MANAGEMENT
// ==========================================
export interface CouponOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  validUntil?: string;
  isActive: boolean;
  isFeatured: boolean;
  applicableFor: 'ALL' | 'B2B' | 'B2C';
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}


