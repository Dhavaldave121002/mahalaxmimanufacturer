import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProductVariant, ProductCustomization } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { Badge } from '../components/common/Badge';
import { ProductCard } from '../components/common/ProductCard';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ShoppingCart,
  Zap,
  Building2,
  Layers,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Share2,
  Heart,
  Check,
  Eye,
  Flame,
  Timer,
  Sparkles,
  Box,
  PackageCheck,
  Package,
  Boxes,
  MessageSquare,
  Camera,
  X,
  Palette,
  Crown,
  Shield,
  UploadCloud,
  FileText,
  Trash2,
  Paperclip,
  Mail
} from 'lucide-react';
import { StickyPurchaseBar } from '../components/common/StickyPurchaseBar';
import { FrequentlyBoughtTogether } from '../components/common/FrequentlyBoughtTogether';
import { SEOProductHead } from '../components/common/SEOProductHead';
import { orderProductImagesByResolution } from '../utils/productImages';
import { BuyNowPaymentIcons } from '../components/common/BuyNowPaymentIcons';

const TAB_CONTENT_COLLAPSED_HEIGHT = 200;
const isInternalProductSpecification = (key: string) =>
  key.startsWith('Source ') || key === 'Admin Price Note';

const hasProductSpecificationValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (!text) return false;
  return !/^(?:not\s+(?:provided|available|specified|listed|known)|n\/?a|none|unknown|tbd|[-—])\.?$/i.test(text);
};

const ExpandableTabContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const updateExpandableState = () => {
      setCanExpand(content.scrollHeight > TAB_CONTENT_COLLAPSED_HEIGHT);
    };

    updateExpandableState();
    const observer = new ResizeObserver(updateExpandableState);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="space-y-2">
      <div className="relative" style={!isExpanded && canExpand ? { maxHeight: TAB_CONTENT_COLLAPSED_HEIGHT, overflow: 'hidden' } : undefined}>
        <div ref={contentRef}>{children}</div>
        {canExpand && !isExpanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {canExpand && (
        <button
          type="button"
          onClick={() => setIsExpanded(expanded => !expanded)}
          aria-expanded={isExpanded}
          className="text-xs font-bold text-indigo hover:text-indigo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo rounded"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    products,
    addToCart,
    deliveryPincode,
    deliveryInfo,
    checkPincode,
    currentUser,
    isInWishlist,
    toggleWishlist
  } = useApp();

  const product = products.find(p => p.slug === slug);
  const productImages = useMemo(
    () => orderProductImagesByResolution(product?.images ?? []),
    [product?.images]
  );
  const viewedProductId = product?.id;

  useEffect(() => {
    if (!viewedProductId) return;
    try {
      const stored = localStorage.getItem('mle_recently_viewed_products');
      const recentIds: string[] = stored ? JSON.parse(stored) : [];
      const nextIds = [viewedProductId, ...recentIds.filter(id => id !== viewedProductId)].slice(0, 8);
      localStorage.setItem('mle_recently_viewed_products', JSON.stringify(nextIds));
    } catch (error) {
      console.warn('Recently viewed products could not be saved:', error);
    }
  }, [viewedProductId]);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isHoveredGallery, setIsHoveredGallery] = useState(false);

  // Auto-slide / fade product image every 3.5 seconds (pauses on hover)
  useEffect(() => {
    if (productImages.length <= 1 || isHoveredGallery) return;
    const timer = setInterval(() => {
      setSelectedImageIndex(prev => (prev + 1) % productImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [productImages, isHoveredGallery]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants?.[0]
  );
  const [quantity, setQuantity] = useState<number>(product?.moq || 1);
  const [pinInput, setPinInput] = useState(deliveryPincode);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState('');
  const [restockEmail, setRestockEmail] = useState(currentUser?.email || '');
  const [isSubmittingRestockAlert, setIsSubmittingRestockAlert] = useState(false);
  const [restockAlertMessage, setRestockAlertMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    if (!restockEmail && currentUser?.email) {
      setRestockEmail(currentUser.email);
    }
  }, [currentUser?.email, restockEmail]);

  // Interactive Customization Studio State (Matching Flutter App 1-to-1)
  const [customizationType, setCustomizationType] = useState<string>('No Customization');
  const [logoText, setLogoText] = useState<string>('MAHALAXMI');
  const [logoColor, setLogoColor] = useState<string>('#EAB308'); // Mill Gold
  const [logoPosition, setLogoPosition] = useState<'top-left' | 'top-right' | 'center' | 'bottom-right'>('top-right');
  const [logoEmblem, setLogoEmblem] = useState<'crown' | 'shield' | 'star' | 'text-only'>('crown');
  const [selectedSize, setSelectedSize] = useState<string>('Standard Mill Cut');
  const [customSizeText, setCustomSizeText] = useState<string>('');
  const [selectedGsm, setSelectedGsm] = useState<string>('Standard 450 GSM');
  const [designNote, setDesignNote] = useState<string>('');

  // Uploaded Files State for Logo, Design & Tech Pack
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [designFileName, setDesignFileName] = useState<string>('');
  const [techPackFile, setTechPackFile] = useState<string | null>(null);
  const [techPackFileName, setTechPackFileName] = useState<string>('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Logo file must be smaller than 15MB');
      return;
    }
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Design artwork file must be smaller than 20MB');
      return;
    }
    setDesignFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setDesignFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTechPackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Tech-pack / spec sheet must be smaller than 20MB');
      return;
    }
    setTechPackFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setTechPackFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Live Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [photosOnlyFilter, setPhotosOnlyFilter] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    comment: ''
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setReviewImage(compressed);
        } else {
          setReviewImage(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchLiveReviews = useCallback(async () => {
    if (!product?.id) return;
    try {
      const res = await fetch(`/api/products?action=reviews&productId=${encodeURIComponent(product.id)}&slug=${encodeURIComponent(product.slug || '')}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          setReviewsList(json.reviews);
          return;
        }
      }
    } catch (_) {}

    // Static fallback from reviews.json for local/offline dev
    try {
      const res = await fetch('/reviews.json');
      if (res.ok) {
        const all: any[] = await res.json();
        const filtered = all.filter(f =>
          (product.id && (f.product_id === product.id || f.productId === product.id)) ||
          (product.slug && (f.slug === product.slug || f.product_id === product.slug)) ||
          (product.id === 'prod-bedsheet-01' && (f.product_id === 'cotton-double-bedsheet' || f.slug === 'glance-300-tc-cotton-double-bedsheet')) ||
          (product.id === 'prod-cotton-towel-01' && f.product_id === 'cotton-bath-towels')
        );
        setReviewsList(filtered);
      }
    } catch (_) {}
  }, [product?.id, product?.slug]);

  useEffect(() => {
    fetchLiveReviews();
  }, [fetchLiveReviews]);

  // Real Reviews Statistics (Strictly derived from actual reviews)
  const actualReviewCount = reviewsList.length;
  const actualAverageRating = actualReviewCount > 0
    ? Number((reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / actualReviewCount).toFixed(1))
    : (product?.rating || 5.0);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.comment.trim() || !product?.id) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_review',
          productId: product.id,
          productTitle: product.name,
          customerName: newReview.name || currentUser?.name || 'Valued Buyer',
          customerEmail: newReview.email || currentUser?.email || '',
          rating: newReview.rating,
          comment: newReview.comment,
          image: reviewImage || null,
          imageUrl: reviewImage || null,
          source: 'WEBSITE'
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true) {
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Review could not be submitted. Please try again.'
        );
      }
      setReviewSuccess(true);
      window.setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
        setReviewImage(null);
        setNewReview(prev => ({ ...prev, comment: '' }));
      }, 2500);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Review could not be submitted. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'reviews'>('specs');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const activeWholesaleTier = useMemo(() => {
    if (!product?.wholesaleTiers || product.wholesaleTiers.length === 0) return null;
    const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    return sorted.find(t => quantity >= t.minQty) || product.wholesaleTiers[0];
  }, [product, quantity]);

  const nextTier = useMemo(() => {
    if (!product?.wholesaleTiers || product.wholesaleTiers.length === 0) return null;
    const sorted = [...product.wholesaleTiers].sort((a, b) => a.minQty - b.minQty);
    return sorted.find(t => t.minQty > quantity) || null;
  }, [product, quantity]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-navy">Product Not Found</h2>
        <p className="text-sm text-slate-500">The product you are looking for is unavailable or discontinued.</p>
        <Link to="/catalog" className="inline-block px-5 py-2.5 bg-indigo text-white rounded-xl text-xs font-bold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const priceNeedsConfirmation = product.specifications?.['Source Price Status'] === 'Approximate - verify before sale';
  const outOfStock = product.stock <= 0;
  const availabilityNeedsConfirmation = !outOfStock &&
    product.specifications?.['Source Availability'] === 'Needs confirmation';
  const insufficientStockForMoq = product.stock > 0 && product.stock < Math.max(1, product.moq || 1);
  const inquiryOnly = outOfStock || insufficientStockForMoq;
  const stockStatus = outOfStock
    ? 'Out of stock'
    : availabilityNeedsConfirmation
      ? 'In stock • supplier confirmation pending'
      : insufficientStockForMoq
        ? 'Insufficient stock for MOQ'
        : 'In stock';

  // Dynamic Wholesale Tier Calculation for current selected quantity
  const currentUnitPrice = activeWholesaleTier
    ? activeWholesaleTier.pricePerUnit
    : product.retailPrice;

  const currentLineTotal = currentUnitPrice * quantity;
  const standardRetailTotal = product.retailPrice * quantity;
  const wholesaleSavings = standardRetailTotal - currentLineTotal;

  const pcsNeededForNextTier = nextTier ? nextTier.minQty - quantity : 0;
  const nextTierSavingsPerPc = nextTier ? currentUnitPrice - nextTier.pricePerUnit : 0;

  const getCustomizationPayload = (): ProductCustomization | undefined => {
    if (customizationType === 'No Customization') return undefined;
    const effectiveSize =
      selectedSize === 'Custom Dimensions' && customSizeText.trim()
        ? `Custom (${customSizeText.trim()})`
        : selectedSize;

    return {
      type: customizationType,
      logoText:
        (customizationType.includes('Logo') ||
          customizationType.includes('Design') ||
          customizationType === 'Embroidery Branding') &&
        logoText.trim()
          ? logoText.trim()
          : undefined,
      logoColor,
      logoPosition,
      logoStyle: logoEmblem,
      selectedSize: effectiveSize,
      customGsm: selectedGsm !== 'Standard 450 GSM' ? selectedGsm : undefined,
      designNote: designNote.trim() || undefined,
      logoFile: logoFile || undefined,
      logoFileName: logoFileName || undefined,
      designFile: designFile || undefined,
      designFileName: designFileName || undefined,
      techPackFile: techPackFile || undefined,
      techPackFileName: techPackFileName || undefined
    };
  };

  const handleAddToCart = () => {
    const added = addToCart(product, quantity, selectedVariant, getCustomizationPayload());
    if (!added) {
      setCartActionMessage(outOfStock ? 'This product is out of stock.' : 'There is not enough stock for that quantity.');
      return;
    }
    setCartActionMessage('');
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleBuyNow = () => {
    if (addToCart(product, quantity, selectedVariant, getCustomizationPayload())) {
      setCartActionMessage('');
      navigate('/checkout');
      return;
    }
    setCartActionMessage(outOfStock ? 'This product is out of stock.' : 'There is not enough stock for that quantity.');
  };

  const handleOrderSamplePiece = () => {
    const sampleVariant: ProductVariant = {
      id: `sample-${product.id}`,
      name: `${selectedVariant?.name || 'Standard'} [Evaluation Sample 1-Pc]`,
      sku: `${product.sku}-SMP`,
      inStock: true
    };
    const added = addToCart(product, 1, sampleVariant, {
      type: 'Sample Request (1 Pc)',
      designNote: `1-Piece Evaluation Sample for ${product.name}`
    });
    if (added) {
      navigate('/cart');
    } else {
      setCartActionMessage(outOfStock ? 'This product is out of stock.' : 'There is not enough stock for a sample.');
    }
  };

  const handleOrderSampleBundle = () => {
    const bundle = products.find(p => p.id === 'prod-sample-bundle-all')
      || INITIAL_PRODUCTS.find(p => p.id === 'prod-sample-bundle-all')
      || products.find(p => p.id === 'prod-swatch-box-01')
      || INITIAL_PRODUCTS.find(p => p.id === 'prod-swatch-box-01');
    if (!bundle) {
      alert('Sample bundle is currently unavailable. Please contact the mill desk.');
      return;
    }
    addToCart(bundle, 1, undefined, {
      type: 'Commercial Sample Bundle',
      designNote: 'Mahalaxmi Complete Commercial Sample Bundle (₹299 • 12 Swatches + 4 Minis)'
    });
    navigate('/cart');
  };

  const handleOrderSwatchKit = () => {
    const swatch = products.find(p => p.id === 'prod-swatch-box-01')
      || INITIAL_PRODUCTS.find(p => p.id === 'prod-swatch-box-01')
      || products.find(p => p.id === 'prod-sample-bundle-all')
      || INITIAL_PRODUCTS.find(p => p.id === 'prod-sample-bundle-all');
    if (!swatch) {
      alert('Swatch kit is currently unavailable. Please contact the mill desk.');
      return;
    }
    addToCart(swatch, 1, undefined, {
      type: 'Pure Cotton Swatch Kit',
      designNote: 'Mahalaxmi Fabric Swatch Kit (₹199 • 12 Pure Cotton Cuts)'
    });
    navigate('/cart');
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(pinInput);
  };

  const handleRestockAlertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingRestockAlert(true);
    setRestockAlertMessage(null);
    try {
      const response = await fetch('/api/restock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, email: restockEmail })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        throw new Error(result?.error || 'Could not save your alert. Please try again.');
      }
      setRestockAlertMessage({ text: result.message, success: true });
    } catch (error) {
      setRestockAlertMessage({
        text: error instanceof Error ? error.message : 'Could not save your alert. Please try again.',
        success: false
      });
    } finally {
      setIsSubmittingRestockAlert(false);
    }
  };

  // Related products
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const bundleProducts = relatedProducts.filter(p =>
    p.stock > 0 && p.specifications?.['Source Price Status'] !== 'Approximate - verify before sale'
  ).slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-12 pb-20">
      {/* Dynamic SEO, Schema.org JSON-LD & City/State Geo Ranking */}
      <SEOProductHead product={product} city={deliveryInfo?.city || 'Surat'} state={deliveryInfo?.state || 'Gujarat'} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[10px] text-slate-500 sm:gap-2 sm:text-xs">
        <Link to="/" className="shrink-0 hover:text-indigo">Home</Link>
        <span aria-hidden="true" className="shrink-0">/</span>
        <Link to={`/category/${product.category}`} className="max-w-[30%] shrink truncate hover:text-indigo sm:max-w-[12rem]">
          {product.categoryName}
        </Link>
        {product.subcategory && product.subcategory !== product.categoryName && (
          <>
            <span aria-hidden="true" className="shrink-0">/</span>
            <span className="max-w-[24%] shrink truncate text-slate-400 sm:max-w-[12rem]">
              {product.subcategory}
            </span>
          </>
        )}
        <span aria-hidden="true" className="shrink-0">/</span>
        <span aria-current="page" title={product.name} className="min-w-0 flex-1 truncate font-semibold text-navy">
          {product.name}
        </span>
      </nav>

      {/* Main Product Layout: Gallery (Left) + Details & Tiers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Image Gallery (Sticky on desktop until right column finishes) */}
        <div className="lg:col-span-6 lg:self-stretch">
          <div className="lg:sticky lg:top-20 space-y-3 z-10">
            {/* Hero Main Image with Auto-Slide, Cross-fade & Zoom container */}
            <div 
              onMouseEnter={() => setIsHoveredGallery(true)}
              onMouseLeave={() => setIsHoveredGallery(false)}
              className="relative mx-auto w-full max-w-[600px] aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-subtle group select-none"
            >
              {/* Layered Cross-fade Slide Images */}
              {productImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out transform ${
                    selectedImageIndex === idx
                      ? 'opacity-100 scale-100 pointer-events-auto z-0'
                      : 'opacity-0 scale-105 pointer-events-none -z-10'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} photo ${idx + 1}`}
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== productImages[0]) target.src = productImages[0];
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}

              {/* Prev / Next Slide Arrow Controls (visible on hover or mobile) */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
                    }}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-navy shadow-md flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm active:scale-95"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(prev => (prev + 1) % productImages.length);
                    }}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-navy shadow-md flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm active:scale-95"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Progress Indicators */}
                  <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                    {productImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(idx);
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          selectedImageIndex === idx ? 'w-5 bg-white shadow-sm' : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
                {product.isDirectMillDeal && (
                  <span className="badge-mill text-xs font-bold px-3 py-1 rounded shadow-sm flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    DIRECT MILL WEAVE
                  </span>
                )}
                {product.isBestSeller && (
                  <Badge variant="champagne" size="sm" className="font-bold text-xs py-0.5 px-2.5">
                    FEATURED
                  </Badge>
                )}
              </div>

              <div className="absolute bottom-3.5 right-3.5 bg-navy/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-mono z-10 pointer-events-none">
                HSN {product.hsnCode} • GST {product.gstRate}%
              </div>
            </div>

            {/* Thumbnails Row */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`View photo ${idx + 1} of ${product.name}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-indigo ring-2 ring-indigo/20 scale-105 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== productImages[0]) target.src = productImages[0];
                      }}
                      className="w-full h-full object-contain bg-slate-50"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Factory Direct Assurance Notice */}
            <div className="p-3 bg-ivory rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-navy font-bold text-xs">
                  Ahmedabad Mill Quality Check
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Strength, color and size checked before dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Tiers, Variants, and Action Controls */}
        <div id="product-right-column" className="lg:col-span-6 space-y-6">
          {/* Header & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo uppercase tracking-wider">{product.subcategory}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-slate-500">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Real Ratings & Review summary */}
            <div className="flex items-center gap-3 mt-2.5 text-xs flex-wrap">
              {actualReviewCount > 0 ? (
                <>
                  <div className="flex items-center text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="ml-1 text-slate-900">{actualAverageRating}</span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    ({actualReviewCount} verified {actualReviewCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span>No reviews yet</span>
                </div>
              )}
              <span className="text-slate-300">•</span>
              {outOfStock ? (
                <span className="flex items-center gap-1 font-semibold text-red-700">
                  <Info className="h-3.5 w-3.5" />
                  Out of stock
                </span>
              ) : availabilityNeedsConfirmation ? (
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Info className="h-3.5 w-3.5" />
                  {stockStatus}
                </span>
              ) : insufficientStockForMoq ? (
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Info className="h-3.5 w-3.5" />
                  Insufficient stock for MOQ
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {stockStatus}
                </span>
              )}
            </div>
            {outOfStock && (
              <form
                onSubmit={handleRestockAlertSubmit}
                className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 sm:p-4"
              >
                <label htmlFor="restock-alert-email" className="block text-sm font-bold text-navy">
                  Get an email when this product is back in stock
                </label>
                <p className="mt-1 text-xs text-slate-600">
                  Enter your email and we’ll let you know when the mill restocks it.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="restock-alert-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={restockEmail}
                    onChange={event => setRestockEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-navy outline-none transition focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingRestockAlert}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-xs font-bold text-white transition hover:bg-navy-800 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" />
                    {isSubmittingRestockAlert ? 'Saving…' : 'Notify Me'}
                  </button>
                </div>
                {restockAlertMessage && (
                  <p
                    role={restockAlertMessage.success ? 'status' : 'alert'}
                    className={`mt-2 text-xs font-semibold ${
                      restockAlertMessage.success ? 'text-emerald-800' : 'text-red-700'
                    }`}
                  >
                    {restockAlertMessage.text}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Dynamic Pricing Engine Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-5 border border-slate-200 space-y-3 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2.5">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">
                  {priceNeedsConfirmation ? 'Approximate source-listed price — confirm before ordering:' : `Effective Rate for ${quantity} Units:`}
                </span>
                {product.specifications?.['Source Price Status'] === 'Admin-set temporary price' && (
                  <span className="inline-flex mb-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    Temporary catalogue pricing
                  </span>
                )}
                <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-navy">
                    {priceNeedsConfirmation ? 'Approx. ' : ''}₹{currentUnitPrice.toLocaleString('en-IN')}
                  </span>
                  {!priceNeedsConfirmation && (
                    <>
                      <span className="text-xs sm:text-sm text-slate-400 line-through">
                        MRP ₹{product.mrp.toLocaleString('en-IN')}
                      </span>
                      {product.mrp > 0 && currentUnitPrice < product.mrp && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          {Math.round(((product.mrp - currentUnitPrice) / product.mrp) * 100)}% Off MRP
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {priceNeedsConfirmation
                ? <p className="text-xs text-amber-800">Final price and order total are not confirmed.</p>
                : (
                  <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                    <span className="text-[11px] text-slate-500 block">Total Batch Value:</span>
                    <span className="text-lg sm:text-xl font-bold text-indigo">
                      ₹{currentLineTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
            </div>

            {!priceNeedsConfirmation && wholesaleSavings > 0 && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span className="font-semibold">Wholesale Volume Savings:</span>
                <span className="font-bold">You save ₹{wholesaleSavings.toLocaleString('en-IN')} vs retail</span>
              </div>
            )}
          </div>

          {/* Wholesale Quantity Pricing Tiers Grid */}
          {!priceNeedsConfirmation && product.wholesaleTiers && product.wholesaleTiers.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo" />
                  <span>Quantity-Based Wholesale Pricing Tiers</span>
                </label>
                <span className="text-[10px] text-slate-500">Automatic tier qualification</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {product.wholesaleTiers.map((tier, idx) => {
                  const isActive = activeWholesaleTier?.minQty === tier.minQty;
                  return (
                    <button
                      key={idx}
                      onClick={() => setQuantity(tier.minQty)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isActive
                          ? 'border-indigo bg-indigo-light text-navy ring-2 ring-indigo/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">
                          {tier.maxQty ? `${tier.minQty}-${tier.maxQty} Pcs` : `${tier.minQty}+ Pcs`}
                        </span>
                        <p className="font-black text-sm text-navy mt-1">₹{tier.pricePerUnit}</p>
                      </div>
                      <span className={`text-[10px] font-bold mt-2 ${tier.savingsPercent > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {tier.savingsPercent > 0 ? `${tier.savingsPercent}% Bulk Off` : 'Standard Rate'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Live Tier Progress Bar */}
              {nextTier && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50/60 rounded-xl border border-indigo-200/70 text-xs space-y-1.5 mt-2">
                  <div className="flex justify-between items-center text-navy font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo fill-indigo" />
                      Next Wholesale Rate Unlock
                    </span>
                    <span className="text-indigo font-black">
                      Add {pcsNeededForNextTier} more pcs
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo to-champagne h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((quantity / nextTier.minQty) * 100))}%`
                      }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-1 text-[11px] text-slate-600">
                    <span>Current: {quantity} pcs</span>
                    <span>
                      Add {pcsNeededForNextTier} pcs to pay <strong>₹{nextTier.pricePerUnit}/pc</strong> (Extra ₹{nextTierSavingsPerPc}/pc savings)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {priceNeedsConfirmation && (!product.wholesaleTiers || product.wholesaleTiers.length === 0) && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-amber-50/70 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <label className="text-sm font-extrabold text-navy flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo" />
                    Wholesale Quantity Pricing
                  </label>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    Confirmed bulk rates depend on your order quantity. Request a quote for current pricing.
                  </p>
                </div>
                <span className="self-start rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                  Rates need confirmation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-indigo-200 bg-white p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Minimum order</span>
                  <p className="mt-1 text-sm font-black text-navy">{product.moq} pcs MOQ</p>
                  <span className="text-[10px] text-slate-500">Price confirmed on enquiry</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bulk quantity</span>
                  <p className="mt-1 text-sm font-black text-navy">Request a rate</p>
                  <span className="text-[10px] text-slate-500">Share your required quantity</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Large orders</span>
                  <p className="mt-1 text-sm font-black text-navy">Custom quote</p>
                  <span className="text-[10px] text-slate-500">Ask about available volume pricing</span>
                </div>
              </div>

              <Link
                to={`/wholesale?sku=${encodeURIComponent(product.sku)}&product=${encodeURIComponent(product.name)}&quantity=${quantity}`}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-800 sm:w-auto"
              >
                Request confirmed bulk pricing
              </Link>
            </div>
          )}

          {/* Variant Picker (Color / Size) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-navy block">
                Select Shade / Dimension: <span className="text-indigo font-semibold">{selectedVariant?.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-2 ${
                      selectedVariant?.id === v.id
                        ? 'border-navy bg-navy text-white shadow-subtle'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {v.colorHex && (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: v.colorHex }}
                      ></span>
                    )}
                    <span>{v.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Commercial Sample & Purchase Buttons Section */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Commercial Sample & Sample Bundle Procurement Suite */}
              <div className="p-4 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200/90 rounded-2xl space-y-3 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1.5">
                <span className="min-w-0 text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  B2B Quality Testing & Sample Evaluation
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full self-start xl:self-auto">
                  100% Rebate Guaranteed
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Test fabric hand-feel, GSM weave weight, and wash durability before booking wholesale consignments. Sample costs are credited back 100% on your next bulk order:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleOrderSamplePiece}
                  className="w-full min-w-0 p-2.5 bg-white hover:bg-amber-100/70 border border-amber-300 text-navy rounded-xl font-bold text-xs transition flex items-start gap-2.5 shadow-sm text-left group"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 group-hover:bg-amber-200 transition">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 break-words">
                    <div className="font-bold text-navy text-xs leading-tight">Order 1-Pc Sample</div>
                    <div className="text-[10px] text-slate-500 font-normal leading-snug">₹{product.retailPrice} • MOQ Bypassed</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOrderSampleBundle}
                  className="w-full min-w-0 p-2.5 bg-white hover:bg-indigo-50/80 border border-indigo-300 text-navy rounded-xl font-bold text-xs transition flex items-start gap-2.5 shadow-sm text-left group"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo shrink-0 group-hover:bg-indigo-100 transition">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 break-words">
                    <div className="font-bold text-navy text-xs leading-tight">Order Sample Bundle</div>
                    <div className="text-[10px] text-slate-500 font-normal leading-snug">₹299 • 12 Swatches + 4 Minis</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOrderSwatchKit}
                  className="w-full min-w-0 p-2.5 bg-white hover:bg-blue-50/80 border border-blue-300 text-navy rounded-xl font-bold text-xs transition flex items-start gap-2.5 shadow-sm text-left group"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0 group-hover:bg-blue-100 transition">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 break-words">
                    <div className="font-bold text-navy text-xs leading-tight">Pure Cotton Swatch Kit</div>
                    <div className="text-[10px] text-slate-500 font-normal leading-snug">₹199 • 12 Cotton Cuts</div>
                  </div>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-amber-900 font-medium pt-0.5 gap-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Includes official Mill GSM Certification
                </span>
                <Link
                  to={`/wholesale?sku=${product.sku}&product=${encodeURIComponent(product.name)}`}
                  className="text-indigo font-bold hover:underline"
                >
                  Need 500+ Units? RFQ →
                </Link>
              </div>
            </div>

            {/* INTERACTIVE CUSTOMIZATION STUDIO (Matching App 1-to-1) */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60 border-2 border-purple-200/90 rounded-2xl shadow-sm space-y-4">
              {/* Studio Header */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
                      <span>Interactive Customization Studio</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-700">
                        Mill Direct
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Customize logo branding, embroidery, custom dimensions & weave specifications
                    </p>
                  </div>
                </div>
                {customizationType !== 'No Customization' && (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Configured
                  </span>
                )}
              </div>

              {/* 1. Customization Type Chips */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  1. Select Customization Type
                </label>
                <div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
                  {[
                    { type: 'Design & Logo', label: 'Design & Logo', icon: Palette, badge: 'Popular' },
                    { type: 'Only Logo', label: 'Only Logo Print', icon: Star, badge: 'Branding' },
                    { type: 'Embroidery Branding', label: 'Embroidery', icon: Sparkles, badge: 'Luxury' },
                    { type: 'Custom Weave & GSM', label: 'Weave & GSM', icon: Layers, badge: 'Bulk Mill' },
                    { type: 'No Customization', label: 'Standard Pack', icon: Check, badge: 'Default' }
                  ].map(opt => {
                    const isSelected = customizationType === opt.type;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setCustomizationType(opt.type)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
                            : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-purple-600'}`} />
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                        <span className="font-bold text-xs leading-snug">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Customization Configuration Fields */}
              {customizationType !== 'No Customization' && (
                <div className="space-y-4 pt-3 border-t border-purple-100">

                  {/* DYNAMIC FILE UPLOAD SECTION BASED ON SELECTED CUSTOMIZATION */}
                  <div className="space-y-3 p-3.5 bg-white/90 rounded-2xl border border-purple-200/80 shadow-xs">
                    <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                        <UploadCloud className="w-4 h-4 text-purple-600" />
                        <span>Upload Custom Artwork & Reference Files</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, PDF, SVG up to 20MB</span>
                    </div>

                    {/* Case 1: Design & Logo (Dual Upload) */}
                    {customizationType === 'Design & Logo' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Logo Upload Card */}
                        <div className="p-3 bg-slate-50/80 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                                Brand Logo File
                              </span>
                              {logoFile && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  ✓ Attached
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mb-2">
                              Vector logo, transparent PNG, or SVG for print & embroidery.
                            </p>
                          </div>

                          {logoFile ? (
                            <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                {logoFile.startsWith('data:image') ? (
                                  <img src={logoFile} alt="Logo" className="w-8 h-8 rounded object-contain border border-slate-200 bg-slate-50 shrink-0" />
                                ) : (
                                  <FileText className="w-6 h-6 text-indigo shrink-0" />
                                )}
                                <span className="text-xs font-bold text-navy truncate" title={logoFileName}>
                                  {logoFileName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setLogoFile(null); setLogoFileName(''); }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                              <UploadCloud className="w-4 h-4 text-purple-600" />
                              <span>Select Logo File</span>
                              <input
                                type="file"
                                accept="image/*,.pdf,.svg,.eps,.ai"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Design Artwork Upload Card */}
                        <div className="p-3 bg-slate-50/80 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-indigo" />
                                Design Pattern / Artwork
                              </span>
                              {designFile && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  ✓ Attached
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 mb-2">
                              Fabric layout pattern, jacquard weave draft, or full design PDF.
                            </p>
                          </div>

                          {designFile ? (
                            <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                {designFile.startsWith('data:image') ? (
                                  <img src={designFile} alt="Design" className="w-8 h-8 rounded object-cover border border-slate-200 bg-slate-50 shrink-0" />
                                ) : (
                                  <FileText className="w-6 h-6 text-purple-600 shrink-0" />
                                )}
                                <span className="text-xs font-bold text-navy truncate" title={designFileName}>
                                  {designFileName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setDesignFile(null); setDesignFileName(''); }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-indigo-50 text-indigo border border-indigo-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                              <UploadCloud className="w-4 h-4 text-indigo" />
                              <span>Select Design Artwork</span>
                              <input
                                type="file"
                                accept="image/*,.pdf,.svg,.eps,.ai,.cdr,.psd"
                                onChange={handleDesignUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Case 2: Only Logo Print */}
                    {customizationType === 'Only Logo' && (
                      <div className="p-3 bg-slate-50/80 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                            Upload Brand Logo (for Loom Printing)
                          </span>
                          {logoFile && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              ✓ Attached
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          Upload high-resolution logo (PNG with transparent background, SVG, AI, or PDF).
                        </p>

                        {logoFile ? (
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              {logoFile.startsWith('data:image') ? (
                                <img src={logoFile} alt="Logo" className="w-8 h-8 rounded object-contain border border-slate-200 bg-slate-50 shrink-0" />
                              ) : (
                                <FileText className="w-6 h-6 text-indigo shrink-0" />
                              )}
                              <span className="text-xs font-bold text-navy truncate" title={logoFileName}>
                                {logoFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setLogoFile(null); setLogoFileName(''); }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                            <UploadCloud className="w-4 h-4 text-purple-600" />
                            <span>Select Brand Logo File</span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.svg,.eps,.ai"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Case 3: Embroidery Branding */}
                    {customizationType === 'Embroidery Branding' && (
                      <div className="p-3 bg-slate-50/80 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Upload Embroidery Crest / Punching Vector
                          </span>
                          {logoFile && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              ✓ Attached
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          Upload crest artwork or embroidery punching file (DST, EMB, PDF, SVG, high-res PNG).
                        </p>

                        {logoFile ? (
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              {logoFile.startsWith('data:image') ? (
                                <img src={logoFile} alt="Embroidery Artwork" className="w-8 h-8 rounded object-contain border border-slate-200 bg-slate-50 shrink-0" />
                              ) : (
                                <FileText className="w-6 h-6 text-amber-500 shrink-0" />
                              )}
                              <span className="text-xs font-bold text-navy truncate" title={logoFileName}>
                                {logoFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setLogoFile(null); setLogoFileName(''); }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                            <UploadCloud className="w-4 h-4 text-purple-600" />
                            <span>Select Embroidery Artwork File</span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.svg,.eps,.dst,.emb"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Case 4: Custom Weave & GSM */}
                    {customizationType === 'Custom Weave & GSM' && (
                      <div className="p-3 bg-slate-50/80 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo" />
                            Upload Tech-Pack / Fabric Spec Sheet (Optional)
                          </span>
                          {techPackFile && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              ✓ Attached
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          Attach your institution's technical specification document, GSM tolerance sheet, or weave construction draft.
                        </p>

                        {techPackFile ? (
                          <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              {techPackFile.startsWith('data:image') ? (
                                <img src={techPackFile} alt="Tech-pack" className="w-8 h-8 rounded object-cover border border-slate-200 bg-slate-50 shrink-0" />
                              ) : (
                                <FileText className="w-6 h-6 text-indigo shrink-0" />
                              )}
                              <span className="text-xs font-bold text-navy truncate" title={techPackFileName}>
                                {techPackFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setTechPackFile(null); setTechPackFileName(''); }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-indigo-50 text-indigo border border-indigo-300 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                            <UploadCloud className="w-4 h-4 text-indigo" />
                            <span>Attach Tech-Pack / Spec Sheet</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                              onChange={handleTechPackUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Logo Text & Styling */}
                  {(customizationType.includes('Logo') ||
                    customizationType.includes('Design') ||
                    customizationType === 'Embroidery Branding') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Logo / Brand Text to Print or Embroider *
                        </label>
                        <input
                          type="text"
                          value={logoText}
                          onChange={e => setLogoText(e.target.value)}
                          placeholder="e.g. TAJ HOTELS, RADISSON, MLE"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none font-bold text-navy"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Logo Position on Fabric
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'top-left', label: 'Top-L' },
                            { id: 'top-right', label: 'Top-R' },
                            { id: 'center', label: 'Center' },
                            { id: 'bottom-right', label: 'Btm-R' }
                          ].map(pos => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setLogoPosition(pos.id as any)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                logoPosition === pos.id
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Logo & Thread Color
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { color: '#EAB308', name: 'Mill Gold' },
                            { color: '#1E3A8A', name: 'Royal Navy' },
                            { color: '#FFFFFF', name: 'Pure White' },
                            { color: '#059669', name: 'Forest Emerald' },
                            { color: '#E11D48', name: 'Crimson' },
                            { color: '#0F172A', name: 'Jet Black' }
                          ].map(c => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setLogoColor(c.color)}
                              className={`w-6 h-6 rounded-full border-2 transition shadow-xs cursor-pointer ${
                                logoColor === c.color ? 'ring-2 ring-purple-600 scale-110' : 'border-slate-300'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Emblem / Crest Style
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[
                            { id: 'crown', label: 'Crown' },
                            { id: 'shield', label: 'Crest' },
                            { id: 'star', label: 'Star' },
                            { id: 'text-only', label: 'Text Only' }
                          ].map(e => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => setLogoEmblem(e.id as any)}
                              className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                logoEmblem === e.id
                                  ? 'bg-navy text-white border-navy'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {e.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Dimensions & GSM Weight Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100/60">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Finished Cut Size / Dimension
                      </label>
                      <select
                        value={selectedSize}
                        onChange={e => setSelectedSize(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-purple-600 outline-none bg-white text-navy font-semibold"
                      >
                        <option value="Standard Mill Cut">Standard Mill Cut (Factory Default)</option>
                        <option value="Medium Commercial Cut (50x100cm)">Medium Commercial Cut (50x100cm)</option>
                        <option value="Large Hospitality Cut (75x150cm)">Large Hospitality Cut (75x150cm)</option>
                        <option value="Custom Dimensions">Custom Dimensions (Enter below)</option>
                      </select>
                      {selectedSize === 'Custom Dimensions' && (
                        <input
                          type="text"
                          value={customSizeText}
                          onChange={e => setCustomSizeText(e.target.value)}
                          placeholder="e.g. 70 x 140 cm / 27 x 54 inches"
                          className="mt-1.5 w-full text-xs px-3 py-1.5 border border-purple-300 rounded-lg outline-none font-medium"
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Yarn Density / GSM Weight
                      </label>
                      <select
                        value={selectedGsm}
                        onChange={e => setSelectedGsm(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:border-purple-600 outline-none bg-white text-navy font-semibold"
                      >
                        <option value="Standard 450 GSM">Standard Commercial 450 GSM</option>
                        <option value="Heavy Duty 550 GSM">Heavy-Duty 550 GSM (High Absorbency)</option>
                        <option value="Luxury Mill Grade 650 GSM">Luxury Mill Grade 650 GSM (5-Star Hotel Grade)</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Mill Production Notes & Instructions */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Special Mill Instructions / Weave Specifications (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={designNote}
                      onChange={e => setDesignNote(e.target.value)}
                      placeholder="e.g. Double-lock stitched borders, gold thread embroidery on right header, barcode label per pack..."
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
                    />
                  </div>

                  <div className="p-2.5 bg-purple-100/70 border border-purple-200 rounded-xl text-[11px] text-purple-950 flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      Custom specs will be attached to your cart item and sent to Ahmedabad Mill production desk.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Purchase Action Row: Quantity + Add to Cart + Buy Now */}
            <div id="main-product-actions" className="space-y-2 sm:space-y-3">
              {!inquiryOnly && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] font-bold text-slate-700 sm:text-xs">Qty:</span>
                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm sm:h-12 sm:rounded-xl">
                  <button
                    disabled={inquiryOnly || quantity <= Math.max(1, product.moq || 1)}
                    onClick={() => setQuantity(prev => Math.max(product.moq || 1, prev - 1))}
                    className="flex h-full items-center justify-center px-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-base"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={product.moq || 1}
                    max={product.stock}
                    value={quantity}
                    disabled={inquiryOnly}
                    onChange={e => {
                      const nextQuantity = Math.floor(Number(e.target.value));
                      if (Number.isFinite(nextQuantity)) {
                        setQuantity(Math.max(product.moq || 1, Math.min(product.stock, nextQuantity)));
                      }
                    }}
                    className="h-full w-10 text-center text-[11px] font-black text-navy focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-14 sm:text-xs"
                    aria-label="Quantity"
                  />
                  <button
                    disabled={inquiryOnly || quantity >= product.stock}
                    onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="flex h-full items-center justify-center px-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-base"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {product.moq > 1 && (
                  <span className="whitespace-nowrap rounded border border-amber-200 bg-amber-50 px-1.5 py-1 text-[9px] font-semibold text-amber-700 sm:px-2 sm:text-[11px]">
                    MOQ {product.moq}
                  </span>
                )}
              </div>
              )}

              {!inquiryOnly ? (
                <>
              <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={inquiryOnly}
                    className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-bold leading-tight shadow-sm transition sm:min-h-12 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-xs ${
                      inquiryOnly
                        ? 'cursor-not-allowed bg-slate-200 text-slate-600'
                        : addedAnimation
                        ? 'bg-emerald-600 text-white'
                        : 'bg-navy hover:bg-navy-800 text-white'
                    }`}
                  >
                    {inquiryOnly ? (
                      <span className="truncate">{outOfStock ? 'Unavailable' : 'MOQ not met'}</span>
                    ) : addedAnimation ? (
                      <>
                        <Check className="h-4 w-4 shrink-0" />
                        <span className="truncate">Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 shrink-0 text-champagne" />
                        <span className="truncate sm:hidden">Add to Cart</span>
                        <span className="hidden truncate sm:inline">Add to Cart (₹{currentLineTotal.toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={inquiryOnly}
                    className={`flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-2 text-[10px] font-bold leading-tight shadow-premium transition sm:min-h-12 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-xs ${
                      inquiryOnly
                        ? 'cursor-not-allowed bg-slate-200 text-slate-600'
                        : 'bg-indigo text-white hover:bg-indigo-dark'
                    }`}
                  >
                    {inquiryOnly ? (
                      <span>{outOfStock ? 'Unavailable' : 'MOQ not met'}</span>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 shrink-0" />
                        <span className="truncate">Buy Now</span>
                        <BuyNowPaymentIcons />
                      </>
                    )}
                  </button>
              </div>
              {cartActionMessage && (
                <p role="alert" className="text-xs font-semibold text-red-700">{cartActionMessage}</p>
              )}
                </>
              ) : null}
            </div>

            {/* Wishlist & WhatsApp Quick Action Row */}
            <div className="grid grid-cols-2 items-center gap-2">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`flex min-h-10 w-full min-w-0 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-bold shadow-sm transition sm:min-h-11 sm:w-auto sm:shrink-0 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs ${
                  isInWishlist(product.id)
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
                title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Save in Wishlist'}
              >
                <Heart className={`h-4 w-4 shrink-0 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
                <span className="truncate">{isInWishlist(product.id) ? 'Saved' : 'Wishlist'}</span>
              </button>

              <a
                href={`https://wa.me/919033598639?text=${encodeURIComponent(
                  `Namaste Mahalaxmi Enterprises, I want to order ${product.name} (SKU: ${product.sku}). Qty: ${quantity} pcs at the listed rate ₹${currentUnitPrice}/pc. Please confirm stock and dispatch availability for ${deliveryInfo?.city || 'my city'}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 w-full min-w-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:min-h-11 sm:flex-1 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate sm:hidden">WhatsApp</span>
                <span className="hidden truncate sm:inline">Order via WhatsApp (Mill Desk)</span>
              </a>
            </div>

            {!inquiryOnly && (
              <>
            {/* Geo & Mill Direct Guarantee Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-navy font-bold">
                <MapPin className="w-3.5 h-3.5 text-indigo shrink-0" />
                <span>Direct Mill Dispatch to {deliveryInfo?.city || 'Ahmedabad'}, {deliveryInfo?.state || 'Gujarat'} & All India</span>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 shrink-0 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Genuine Mill Weave</span>
              </span>
            </div>

            {/* High-Conversion Trust Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="p-2.5 bg-emerald-50/60 hover:bg-emerald-100/70 rounded-xl border border-emerald-200/80 flex flex-col items-center justify-center transition cursor-pointer text-center group"
                title="Click to view 7-Day Return & 100% Refund Policy"
              >
                <RotateCcw className="w-4 h-4 text-emerald-600 mb-1 group-hover:rotate-[-45deg] transition-transform" />
                <span className="font-bold text-emerald-900 text-[11px]">7-Day Return</span>
                <span className="text-[10px] text-emerald-700 font-semibold underline">100% Refund</span>
              </button>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <Truck className="w-4 h-4 text-indigo mb-1" />
                <span className="font-bold text-navy text-[11px]">Fast Delivery</span>
                <span className="text-[10px] text-slate-500">Pan-India Freight</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500 mb-1" />
                <span className="font-bold text-navy text-[11px]">COD Available</span>
                <span className="text-[10px] text-slate-500">Pay on Inspection</span>
              </div>
            </div>
              </>
            )}
          </div>

          {/* Delivery PIN Code Checker with Live Delhivery Integration */}
          {!inquiryOnly && (
          <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl border border-indigo/20 shadow-sm space-y-2.5 text-xs">
            <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center">
              <div className="flex min-w-0 items-start gap-2 font-bold leading-tight text-navy sm:items-center">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo sm:mt-0" />
                <span>Check Delivery & COD to Your Pincode</span>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 sm:text-[10px]">
                Powered by Delhivery
              </span>
            </div>

            <form onSubmit={handlePincodeCheck} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
              <input
                type="text"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Pincode (e.g. 395002)"
                aria-label="6-digit delivery pincode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono shadow-sm outline-none focus:border-indigo focus:ring-1 focus:ring-indigo sm:px-3.5"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl bg-navy px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-navy-800 cursor-pointer sm:px-5"
              >
                Verify Pincode
              </button>
            </form>

            {deliveryInfo && (
              <div className="pt-1.5 space-y-1.5">
                {deliveryInfo.serviceable ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Deliverable to {deliveryInfo.city}, {deliveryInfo.state} ({deliveryInfo.pincode})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-0.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold">
                        ⚡ Est. Delivery: {deliveryInfo.estimatedDays} Days
                      </span>
                      {deliveryInfo.codAvailable ? (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo rounded-md font-semibold">
                          💵 Cash on Delivery (COD) Available
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold">
                          💳 Prepaid Only for this location
                        </span>
                      )}
                      <span className="text-slate-400">Direct Surat Mill Dispatch</span>
                    </div>
                  </>
                ) : (
                  <p className="text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                    <span>✕ Delivery is currently not serviceable to pincode {deliveryInfo.pincode}.</span>
                  </p>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Frequently Bought Together Bundle Cross-Sell */}
      {!inquiryOnly && bundleProducts.length > 0 && (
        <FrequentlyBoughtTogether
          currentProduct={product}
          bundleProducts={bundleProducts}
        />
      )}

      {/* Product information tabs are populated from this listing and its reviews. */}
      <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-subtle space-y-5 sm:space-y-6 sm:p-8">
        <div className="grid min-w-0 grid-cols-3 gap-1 border-b border-slate-200 sm:flex sm:gap-8">
          <button
            onClick={() => setActiveTab('specs')}
            className={`min-w-0 px-1 pb-3 text-center text-xs leading-tight font-bold border-b-2 transition sm:px-0 sm:text-sm sm:whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`min-w-0 px-1 pb-3 text-center text-xs leading-tight font-bold border-b-2 transition sm:px-0 sm:text-sm sm:whitespace-nowrap ${
              activeTab === 'care'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Care Instructions
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`min-w-0 px-1 pb-3 text-center text-xs leading-tight font-bold border-b-2 transition sm:px-0 sm:text-sm sm:whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-indigo text-indigo'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Customer Reviews ({actualReviewCount})
          </button>
        </div>

        {/* Tab 1: Technical Specifications Table */}
        {activeTab === 'specs' && (
          <ExpandableTabContent>
            <div className="space-y-4">
              {product.description ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Source product description — confirm details before ordering
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{product.description}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  A product description has not been provided for this listing.
                </p>
              )}
              <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full min-w-0 table-fixed border-collapse text-left text-[10px] sm:text-xs">
                  <colgroup>
                    <col className="w-[38%] sm:w-1/3" />
                    <col className="w-[62%] sm:w-2/3" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50">
                      <td className="break-words px-2 py-2.5 align-top font-bold text-slate-700 sm:px-4">HSN Code</td>
                      <td className="break-words px-2 py-2.5 align-top font-mono font-semibold text-navy sm:px-4">{product.hsnCode || 'Not provided'}</td>
                    </tr>
                    <tr>
                      <td className="break-words px-2 py-2.5 align-top font-bold text-slate-700 sm:px-4">GST Rate</td>
                      <td className="break-words px-2 py-2.5 align-top font-semibold text-navy sm:px-4">
                        {product.gstRate > 0 ? `${product.gstRate}%` : 'Not provided — verify before ordering'}
                      </td>
                    </tr>
                    {Object.entries(product.specifications)
                      .filter(([key, value]) =>
                        !isInternalProductSpecification(key) && hasProductSpecificationValue(value)
                      )
                      .map(([key, val], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/60' : ''}>
                        <td className="break-words px-2 py-2.5 align-top font-bold text-slate-700 sm:px-4">{key}</td>
                        <td className="break-all px-2 py-2.5 align-top leading-relaxed text-slate-800 sm:px-4">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ExpandableTabContent>
        )}

        {/* Care Instructions */}
        {activeTab === 'care' && (
          <ExpandableTabContent>
            <div className="space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-sm text-navy">Product Care</h4>
              {product.careInstructions?.length ? (
                <>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    General material-based guidance. Follow the product label if it gives different care instructions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.careInstructions.map((instruction, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo shrink-0" />
                        <span>{instruction}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  Care instructions were not provided for this product. Please confirm the correct care method with us.
                </p>
              )}
            </div>
          </ExpandableTabContent>
        )}

        {/* Tab 4: Reviews */}
        {activeTab === 'reviews' && (
          <ExpandableTabContent>
            <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="text-center pr-6 border-r border-slate-200">
                  <span className="text-3xl font-black text-navy">{actualReviewCount > 0 ? actualAverageRating : '—'}</span>
                  <div className="flex text-amber-500 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star
                        key={st}
                        className={`w-3.5 h-3.5 ${
                          actualReviewCount > 0 && st <= Math.round(actualAverageRating)
                            ? 'fill-current'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                    {actualReviewCount} Verified {actualReviewCount === 1 ? 'Review' : 'Reviews'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">100% Genuine Commercial & Retail Feedback</p>
                  <p className="text-slate-500">Directly synchronized with Central MySQL Database & Verified Buyers.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-4 py-2.5 bg-indigo text-white font-bold text-xs rounded-xl hover:bg-indigo-dark transition shadow-sm flex items-center justify-center gap-2"
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>{showReviewForm ? 'Cancel Review' : 'Write a Product Review'}</span>
              </button>
            </div>

            {/* Interactive Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="p-5 bg-white rounded-2xl border-2 border-indigo/20 shadow-md space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-navy text-sm">Write Your Review for {product.name}</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 mr-2 font-medium">Your Rating:</span>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star className={`w-5 h-5 ${star <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {reviewSuccess ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center font-bold">
                    ✓ Review submitted successfully. It will appear after admin approval.
                  </div>
                ) : (
                  <>
                    {reviewError && (
                      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                        {reviewError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={newReview.name}
                          onChange={e => setNewReview({ ...newReview, name: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                          placeholder="e.g. Ramesh Patel"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Your Email (Optional)</label>
                        <input
                          type="email"
                          value={newReview.email}
                          onChange={e => setNewReview({ ...newReview, email: e.target.value })}
                          className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Review Comments & Fabric Experience *</label>
                      <textarea
                        required
                        rows={3}
                        value={newReview.comment}
                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo"
                        placeholder="Describe the fabric quality, finish, wash durability, delivery experience..."
                      />
                    </div>

                    {/* Attach Product Photo */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-navy flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-indigo" />
                          <span>Attach Product / Fabric Photo</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Optional (JPG, PNG, WebP)</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition shadow-xs">
                          <Camera className="w-4 h-4 text-indigo" />
                          <span>{reviewImage ? 'Change Photo' : 'Choose Photo from Device'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>

                        {reviewImage && (
                          <div className="relative group inline-block">
                            <img
                              src={reviewImage}
                              alt="Review Preview"
                              className="w-14 h-14 rounded-xl object-cover border-2 border-indigo shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setReviewImage(null)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow transition"
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                      {reviewImage && (
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Photo attached and ready to submit with review
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-6 py-2 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow-md transition"
                      >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Filter / Header for Published Reviews */}
            {(() => {
              const baseList = reviewsList;
              const photosCount = baseList.filter(r => !!(r.image_url || r.imageUrl || r.image)).length;
              const displayed = photosOnlyFilter
                ? baseList.filter(r => !!(r.image_url || r.imageUrl || r.image))
                : baseList;

              if (baseList.length === 0) {
                return (
                  <div className="text-center py-10 px-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-500">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">No Customer Reviews Yet</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Be the first verified customer to share feedback for this product directly from the mill.
                      </p>
                    </div>
                    {!showReviewForm && (
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(true)}
                        className="px-4 py-2 bg-indigo text-white font-bold text-xs rounded-xl hover:bg-indigo-dark transition inline-flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                        <span>Write the First Review</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotosOnlyFilter(false)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${!photosOnlyFilter ? 'bg-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        All Reviews ({baseList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotosOnlyFilter(true)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${photosOnlyFilter ? 'bg-indigo text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>With Photos ({photosCount})</span>
                      </button>
                    </div>
                  </div>

                  {displayed.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No reviews with customer photos found for this product yet.
                    </div>
                  ) : (
                    displayed.map((rev: any) => (
                      <div key={rev.id} className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-navy flex items-center gap-2">
                            {rev.customer_name || rev.customerName || 'Verified Buyer'}
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">✓ Verified Buyer</span>
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(rev.created_at || rev.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex text-amber-500 pt-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(Number(rev.rating || 5)) ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <p className="text-slate-600 pt-1 leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {(rev.image_url || rev.imageUrl || rev.image) && (
                          <div className="pt-2">
                            <div
                              onClick={() => setSelectedImageModal(rev.image_url || rev.imageUrl || rev.image)}
                              className="inline-block relative cursor-pointer group rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition"
                              title="Click to view full photo"
                            >
                              <img
                                src={rev.image_url || rev.imageUrl || rev.image}
                                alt="Customer review fabric"
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                <span>🔍 View</span>
                              </div>
                            </div>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-1">📷 Customer Verified Photo</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
            </div>
          </ExpandableTabContent>
        )}
      </div>

      {/* Zoom / Lightbox Modal for Review Photo */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo" />
                Customer Verified Review Photo
              </span>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-2">
              <img
                src={selectedImageModal}
                alt="Enlarged customer photo"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Related Products Recommendation Row */}
      {relatedProducts.length > 0 && (
        <div className="space-y-3 pt-4 sm:space-y-6 sm:pt-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="min-w-0 truncate text-base font-extrabold text-navy sm:text-xl">
              Related Products in {product.categoryName}
            </h3>
            <Link to={`/category/${product.category}`} className="shrink-0 text-[10px] font-bold text-indigo hover:underline sm:text-xs">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Return & Refund Policy Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-navy rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReturnModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-navy hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-600">
                <RotateCcw className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-lg font-black text-navy">7-Day Return, Exchange & 100% Refund Policy</h3>
                  <p className="text-xs text-emerald-600 font-semibold">100% Direct Mill Guarantee & Buyer Protection</p>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free Doorstep Reverse Pickup & 100% Money-Back</span>
                </div>
                <p className="leading-relaxed">
                  Every order of <strong>{product.name}</strong> is covered by our unconditional 7-Day Mill Guarantee. If the dimensions, fabric hand-feel, GSM, or shade don't meet your expectations, we arrange reverse pickup and process an instant 100% refund or free exchange.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <h4 className="font-bold text-navy uppercase text-[11px] tracking-wider">Guarantee Highlights:</h4>
                <ul className="space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">1.</span>
                    <span><strong>7-Day Return Window:</strong> You can initiate a return or exchange anytime within 7 days of package delivery.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">2.</span>
                    <span><strong>100% Full Refund:</strong> No hidden restocking fees or return shipping charges. 100% amount credited to your UPI / Bank within 3-5 days of pickup.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">3.</span>
                    <span><strong>Doorstep Pickup in 24-48 Hours:</strong> Delhivery / BlueDart will pick up the parcel directly from your doorstep.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600 shrink-0">4.</span>
                    <span><strong>Free Exchange:</strong> Need a different color or size? We dispatch replacement pieces immediately.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <h4 className="font-bold text-navy">How to Request a Return or Refund:</h4>
                <p className="text-slate-600">
                  • <strong>Online:</strong> Go to <Link to="/orders" className="text-indigo font-bold underline">Track Order</Link> and click <em>"🔄 Return / Exchange"</em> on your delivered order.
                </p>
                <p className="text-slate-600">
                  • <strong>WhatsApp:</strong> Message us at <a href="https://wa.me/919033598639" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold underline">+91 90335 98639</a> with your Order ID.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-5 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-800 transition cursor-pointer"
                >
                  Understood & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Conversion Sticky Bottom Purchase Bar */}
      <StickyPurchaseBar
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        currentUnitPrice={currentUnitPrice}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        addedAnimation={addedAnimation}
        canPurchase={!inquiryOnly}
      />
    </div>
  );
};
