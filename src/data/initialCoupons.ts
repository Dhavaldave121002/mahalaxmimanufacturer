import { CouponOffer } from '../types';

export const INITIAL_COUPONS: CouponOffer[] = [
  {
    id: 'coup-launch150',
    code: 'LAUNCH150',
    title: 'Subscriber Welcome Email Voucher',
    description: 'Exclusive ₹150 OFF voucher sent via email for new subscribers & signups',
    discountType: 'FLAT',
    discountValue: 150,
    minOrderValue: 0,
    isActive: true,
    isFeatured: false,
    suggestionMode: 'SECRET_MANUAL_ONLY',
    applicableFor: 'ALL',
    usedCount: 42,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'coup-milldirect10',
    code: 'MILLDIRECT10',
    title: 'Direct Loom 10% Discount',
    description: 'Get instant 10% OFF across all fabric and linen collections',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 1000,
    maxDiscountAmount: 1500,
    isActive: true,
    isFeatured: true,
    applicableFor: 'ALL',
    usedCount: 78,
    createdAt: '2026-10-02T00:00:00.000Z'
  },
  {
    id: 'coup-bulk500',
    code: 'BULK500',
    title: 'Wholesale Commercial Rebate',
    description: 'Flat ₹500 instant discount on commercial orders above ₹3,000',
    discountType: 'FLAT',
    discountValue: 500,
    minOrderValue: 3000,
    isActive: true,
    isFeatured: true,
    applicableFor: 'ALL',
    usedCount: 29,
    createdAt: '2026-10-05T00:00:00.000Z'
  },
  {
    id: 'coup-mahalaxmi20',
    code: 'MAHALAXMI20',
    title: 'Festival Mill Master Offer',
    description: 'Exclusive 20% OFF for bulk and wholesale trade consignments',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderValue: 10000,
    maxDiscountAmount: 5000,
    isActive: true,
    isFeatured: true,
    applicableFor: 'B2B',
    usedCount: 15,
    createdAt: '2026-10-08T00:00:00.000Z'
  }
];
