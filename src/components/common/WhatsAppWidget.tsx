import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';

export const WhatsAppWidget: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const isProductPage = location.pathname.startsWith('/product/');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = '919876543210';
    const text = encodeURIComponent(
      message.trim() || 'Hello Mahalaxmi Enterprises, I want to inquire about direct mill rates and bulk wholesale catalog.'
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  return (
    <div
      className={`fixed right-4 md:right-6 z-40 flex flex-col items-end transition-all duration-300 ease-in-out ${
        isProductPage && isScrolled
          ? 'bottom-24 md:bottom-24'
          : isProductPage
          ? 'bottom-6 md:bottom-6'
          : 'bottom-20 md:bottom-6'
      }`}
    >
      {/* Pop-up chat card */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-3xl shadow-float border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white text-emerald-700 font-bold flex items-center justify-center text-base shadow-sm">
                  M
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm">Mahalaxmi Mill Desk</h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span>Direct Sales • Online</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close WhatsApp chat dialog"
              className="p-1.5 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-slate-50 space-y-3 text-xs">
            <div className="bg-white p-3 rounded-2xl shadow-subtle border border-slate-100 max-w-[85%] text-slate-800 space-y-1">
              <p className="font-semibold text-emerald-800 text-[11px]">Mahalaxmi Enterprises</p>
              <p>
                Namaste! 🙏 Welcome to Mahalaxmi Enterprises. Looking for direct mill rates on bedsheets, 600 GSM towels, or commercial wholesale?
              </p>
              <span className="text-[9px] text-slate-500 block text-right">Just now</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setMessage('Can I get the wholesale price list PDF for bedsheets & towels?')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-[11px] text-slate-700 transition"
              >
                📄 Wholesale Price List PDF
              </button>
              <button
                type="button"
                onClick={() => setMessage('I want to place a bulk order for 100+ pieces with GST invoice.')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-[11px] text-slate-700 transition"
              >
                📦 100+ Pcs Bulk Order
              </button>
              <button
                type="button"
                onClick={() => setMessage('What is the minimum order quantity for direct mill rates?')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-full text-[11px] text-slate-700 transition"
              >
                ❓ What is the MOQ?
              </button>
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              id="whatsapp-message-input"
              name="whatsappMessage"
              aria-label="Type message for WhatsApp sales desk"
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your requirement on WhatsApp..."
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
            />
            <button
              type="submit"
              aria-label="Send WhatsApp message"
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm"
              title="Chat on WhatsApp"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat on WhatsApp with direct mill sales desk"
        className="group flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-premium transition-all duration-300 hover:scale-105"
        title="Chat on WhatsApp with Mill Merchandiser"
      >
        <MessageCircle className="w-6 h-6 fill-current text-white animate-bounce" />
        <span className="text-xs font-bold hidden sm:inline">
          Direct Mill WhatsApp Desk
        </span>
      </button>
    </div>
  );
};
