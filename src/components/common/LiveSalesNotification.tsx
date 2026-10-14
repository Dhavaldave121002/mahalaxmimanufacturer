import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, X } from 'lucide-react';

interface PurchaseEvent {
  buyerName: string;
  city: string;
  productName: string;
  quantity: number;
  timeAgo: string;
  image: string;
}

const RECENT_PURCHASES: PurchaseEvent[] = [
  {
    buyerName: 'Anand Patel',
    city: 'Ahmedabad, Gujarat',
    productName: 'Glance 300 TC Combed Cotton Bedsheet',
    quantity: 50,
    timeAgo: '2 minutes ago',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=200&auto=format&fit=crop'
  },
  {
    buyerName: 'Hotel Royal Grand',
    city: 'New Delhi',
    productName: 'Super-Plush 600 GSM Cotton Bath Towel',
    quantity: 100,
    timeAgo: '5 minutes ago',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=200&auto=format&fit=crop'
  },
  {
    buyerName: 'Priya Sharma',
    city: 'Mumbai, Maharashtra',
    productName: 'Heritage Linen-Blend Eyelet Curtains',
    quantity: 4,
    timeAgo: '7 minutes ago',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=200&auto=format&fit=crop'
  },
  {
    buyerName: 'Cloud Kitchen Hub',
    city: 'Bengaluru, Karnataka',
    productName: 'Chef-Pro Herringbone Kitchen Towels (12-Pk)',
    quantity: 20,
    timeAgo: '11 minutes ago',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop'
  },
  {
    buyerName: 'Facility Care Corp',
    city: 'Surat, Gujarat',
    productName: 'Commercial 350 GSM Microfiber Cloths (24-Pk)',
    quantity: 40,
    timeAgo: '14 minutes ago',
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=200&auto=format&fit=crop'
  }
];

export const LiveSalesNotification: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<PurchaseEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let index = 0;
    const interval = setInterval(() => {
      setCurrentNotification(RECENT_PURCHASES[index % RECENT_PURCHASES.length]);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      index++;
    }, 14000);

    // Initial trigger after 4 seconds
    const initialTimer = setTimeout(() => {
      setCurrentNotification(RECENT_PURCHASES[0]);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 5000);
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [dismissed]);

  if (!currentNotification || !isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 hidden sm:block animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-premium border border-slate-200/90 max-w-sm flex items-center gap-3 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-1.5 -right-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-0.5 transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <img
          src={currentNotification.image}
          alt={currentNotification.productName}
          className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
        />

        <div className="text-xs space-y-0.5 min-w-0 pr-2">
          <p className="font-extrabold text-navy truncate">
            {currentNotification.buyerName} <span className="font-normal text-slate-400">({currentNotification.city})</span>
          </p>
          <p className="text-[11px] text-slate-600 line-clamp-1">
            Bought <strong className="text-indigo font-bold">{currentNotification.quantity}x</strong> {currentNotification.productName}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified Purchase • {currentNotification.timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
