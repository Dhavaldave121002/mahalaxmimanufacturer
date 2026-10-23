export function validateCouponRecord(
  coupon,
  { subtotal, platform, customerType }
) {
  if (!coupon) return { valid: false, message: 'Coupon code was not found.' };

  const isActive = coupon.is_active ?? coupon.isActive;
  if (!(isActive === true || Number(isActive) === 1)) {
    return { valid: false, message: 'This coupon is inactive.' };
  }

  const usageLimit = coupon.usage_limit ?? coupon.usageLimit;
  const usedCount = Number(coupon.used_count ?? coupon.usedCount ?? 0);
  if (usageLimit != null && Number(usageLimit) > 0 && usedCount >= Number(usageLimit)) {
    return { valid: false, message: 'This coupon has reached its usage limit.' };
  }

  const validUntil = coupon.valid_until ?? coupon.validUntil;
  if (validUntil && new Date(validUntil).getTime() < Date.now()) {
    return { valid: false, message: 'This coupon has expired.' };
  }

  const targetPlatform = String(
    coupon.target_platform ?? coupon.targetPlatform ?? 'ALL'
  ).toUpperCase();
  if (targetPlatform !== 'ALL' && targetPlatform !== `${platform}_ONLY`) {
    return {
      valid: false,
      message: `This coupon is not available on ${platform === 'APP' ? 'the app' : 'the website'}.`
    };
  }

  const applicableFor = String(
    coupon.applicable_for ?? coupon.applicableFor ?? 'ALL'
  ).toUpperCase();
  if (applicableFor !== 'ALL' && applicableFor !== customerType) {
    return {
      valid: false,
      message: `This coupon is available to ${applicableFor} customers only.`
    };
  }

  const minimum = Number(coupon.min_order_value ?? coupon.minOrderValue ?? 0);
  if (subtotal < minimum) {
    return {
      valid: false,
      message: `This coupon requires a minimum order value of ₹${minimum.toLocaleString('en-IN')}.`
    };
  }

  const discountType = coupon.discount_type ?? coupon.discountType;
  const discountValue = Number(coupon.discount_value ?? coupon.discountValue ?? 0);
  const maxDiscountAmount = coupon.max_discount_amount ?? coupon.maxDiscountAmount;
  const discount = discountType === 'PERCENTAGE'
    ? Math.min(
        Math.round((subtotal * discountValue) / 100),
        maxDiscountAmount == null || Number(maxDiscountAmount) <= 0
          ? Number.POSITIVE_INFINITY
          : Number(maxDiscountAmount)
      )
    : Math.min(discountValue, subtotal);

  if (!Number.isFinite(discount) || discount < 0) {
    return { valid: false, message: 'This coupon has invalid discount settings.' };
  }
  return { valid: true, discount };
}
