import React from 'react';
import { Order } from '../../types';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  type?: 'INVOICE' | 'PACKING_SLIP';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  type = 'INVOICE'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isB2B = order.customer.isB2B && !!order.customer.gstNumber;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-navy/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-premium max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Control Bar - hidden during actual window.print() */}
        <div className="no-print bg-navy text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-navy-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-indigo/30 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-champagne" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-lg text-white truncate">
                {type === 'INVOICE' ? 'Official GST Tax Invoice' : 'Warehouse Packing Slip'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 truncate">
                Ref: {order.orderNumber} • Dated: {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo hover:bg-indigo-dark text-white rounded-lg text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-3 sm:p-8 overflow-y-auto bg-white text-navy print-only-container">
          {/* Header */}
          <div className="border-b-2 border-navy pb-4 sm:pb-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-navy">
                    MAHALAXMI<span className="text-indigo">.</span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-navy text-champagne px-2 py-0.5 rounded">
                    ENTERPRISES
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">Direct Mill Rates & Wholesale Essentials</p>
                <div className="text-[11px] sm:text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>Plot No. 42-45, Ring Road Textile Park Phase II</p>
                  <p>Surat, Gujarat - 395002, India</p>
                  <p><span className="font-semibold text-slate-800">GSTIN:</span> 24AAECM8921P1ZA | <span className="font-semibold text-slate-800">PAN:</span> AAECM8921P</p>
                  <p><span className="font-semibold text-slate-800">State Code:</span> 24 (Gujarat) | <span className="font-semibold text-slate-800">Email:</span> billing@mahalaxmienterprises.com</p>
                </div>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-ivory text-navy border border-slate-300 rounded mb-1.5 sm:mb-2">
                  {type === 'INVOICE' ? 'TAX INVOICE' : 'PACKING SLIP / DISPATCH NOTE'}
                </span>
                <p className="text-xs sm:text-sm font-bold text-navy">Invoice No: {order.orderNumber.replace('ORD', 'INV')}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Invoice Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                <p className="text-[11px] sm:text-xs text-slate-500">Order ID: {order.orderNumber}</p>
                <p className="text-[11px] sm:text-xs text-slate-500">Payment: {order.paymentMethod} ({order.paymentStatus})</p>
                {order.trackingNumber && (
                  <p className="text-[11px] sm:text-xs text-indigo font-semibold mt-1">Waybill: {order.trackingNumber} ({order.courierName})</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Ship To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200 text-xs">
            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-indigo">
                Billed To ({isB2B ? 'Registered Business' : 'Consumer Buyer'}):
              </h4>
              <p className="font-semibold text-slate-900 text-xs sm:text-sm">{order.customer.companyName || order.customer.name}</p>
              {order.customer.companyName && <p className="text-slate-600">Attn: {order.customer.name}</p>}
              <p className="text-slate-700 mt-1">{order.billingAddress.street}</p>
              {order.billingAddress.landmark && <p className="text-slate-600">Landmark: {order.billingAddress.landmark}</p>}
              <p className="text-slate-700">{order.billingAddress.city}, {order.billingAddress.state} - {order.billingAddress.pincode}</p>
              <p className="text-slate-700">Phone: {order.customer.phone} | Email: {order.customer.email}</p>
              {order.customer.gstNumber && (
                <p className="font-bold text-navy mt-1.5 bg-indigo-light/50 p-1 rounded inline-block text-[11px]">
                  Buyer GSTIN: {order.customer.gstNumber}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-slate-700">
                Shipped To (Delivery Destination):
              </h4>
              <p className="font-semibold text-slate-900 text-xs sm:text-sm">{order.shippingAddress.fullName}</p>
              {order.shippingAddress.companyName && <p className="text-slate-600">{order.shippingAddress.companyName}</p>}
              <p className="text-slate-700 mt-1">{order.shippingAddress.street}</p>
              <p className="text-slate-700">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p className="text-slate-700">Contact: {order.shippingAddress.phone}</p>
              <p className="text-slate-500 mt-1">Place of Supply: {order.shippingAddress.state} (Destination)</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto mb-4 sm:mb-6 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th className="py-2 px-2.5 font-semibold text-center w-8">#</th>
                  <th className="py-2 px-2.5 font-semibold">Item & Specification</th>
                  <th className="py-2 px-2 font-semibold text-center">HSN</th>
                  <th className="py-2 px-2 font-semibold text-center">Qty</th>
                  <th className="py-2 px-2.5 font-semibold text-right">Unit Rate (₹)</th>
                  <th className="py-2 px-2 font-semibold text-center">GST %</th>
                  <th className="py-2 px-2.5 font-semibold text-right">Taxable Amt (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-2.5 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2.5">
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] text-slate-500">
                        SKU: {item.sku} {item.variantDescription ? `| ${item.variantDescription}` : ''}
                      </p>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-600 font-mono text-[11px]">{item.hsnCode}</td>
                    <td className="py-2 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-2 px-2.5 text-right text-slate-800">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-2 text-center text-slate-600">{item.gstRate}%</td>
                    <td className="py-2 px-2.5 text-right font-medium text-slate-900">
                      ₹{item.totalPrice.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation & Tax Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 items-start mb-4 sm:mb-6">
            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">GST Tax Summary:</p>
                {order.taxBreakdown.cgst > 0 && (
                  <p>Central GST (CGST): ₹{order.taxBreakdown.cgst.toLocaleString('en-IN')}</p>
                )}
                {order.taxBreakdown.sgst > 0 && (
                  <p>State GST (SGST): ₹{order.taxBreakdown.sgst.toLocaleString('en-IN')}</p>
                )}
                {order.taxBreakdown.igst > 0 && (
                  <p>Integrated GST (IGST): ₹{order.taxBreakdown.igst.toLocaleString('en-IN')}</p>
                )}
                <p className="font-semibold text-slate-900 mt-1">Total Tax Levy: ₹{order.taxBreakdown.totalTax.toLocaleString('en-IN')}</p>
              </div>

              <div className="text-[10px] sm:text-[11px] text-slate-500 space-y-1">
                <p>1. Goods sold under direct mill rate contract are subject to standard Surat jurisdiction.</p>
                <p>2. E-Way bill reference generated under GSTIN 24AAECM8921P1ZA.</p>
                <p>3. This is a computer generated tax invoice in compliance with CGST Rule 46.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-semibold text-slate-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount ({order.couponCode || 'Promotional'}):</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>GST Tax (CGST + SGST / IGST):</span>
                <span className="font-semibold text-slate-900">₹{Math.round(order.taxBreakdown.totalTax).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Freight & Handling:</span>
                <span className="font-semibold text-slate-900">
                  {order.shippingCharge === 0 ? 'FREE (Mill Dispatch)' : `₹${order.shippingCharge}`}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between text-xs sm:text-sm font-bold text-navy">
                <span>Total Invoice Value (INR):</span>
                <span className="text-sm sm:text-base text-indigo font-black">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-3 sm:pt-4 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-500 text-[11px]">Authorized Digital Verification Code: <span className="font-mono text-slate-800">MLE-{order.id.slice(-6).toUpperCase()}</span></p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="font-bold text-slate-800">For Mahalaxmi Enterprises</p>
              <div className="h-6 sm:h-10"></div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 border-t border-slate-400 pt-1">Authorized Mill Signatory / Dispatch Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
