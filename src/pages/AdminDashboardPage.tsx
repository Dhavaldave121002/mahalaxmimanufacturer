import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order, OrderStatus, Quotation, CategoryId } from '../types';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Building2,
  Plus,
  Trash2,
  Edit,
  Printer,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AdminDashboardPage: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustProductStock,
    orders,
    updateOrderStatus,
    quotations,
    updateQuotationByStaff,
    enquiries
  } = useApp();

  // Active Admin View: 'overview' | 'products' | 'orders' | 'quotations' | 'enquiries' | 'import-export'
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'quotations' | 'enquiries' | 'import-export'
  >('overview');

  // Product Add / Edit Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    sku: string;
    category: CategoryId;
    categoryName: string;
    subcategory: string;
    mrp: number;
    retailPrice: number;
    stock: number;
    moq: number;
    hsnCode: string;
    gstRate: number;
    shortDescription: string;
    description: string;
    image: string;
  }>({
    name: '',
    sku: '',
    category: 'textile',
    categoryName: 'Textile',
    subcategory: 'Double Bedsheets',
    mrp: 1499,
    retailPrice: 799,
    stock: 200,
    moq: 1,
    hsnCode: '630221',
    gstRate: 5,
    shortDescription: 'Direct mill combed cotton fabric.',
    description: 'High-durability weaving from Surat looms.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop'
  });

  // Quotation Editor Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});
  const [quoteStaffNote, setQuoteStaffNote] = useState('');

  // Invoice Modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [invoiceType, setInvoiceType] = useState<'INVOICE' | 'PACKING_SLIP'>('INVOICE');

  // Search queries in admin
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Order status updater modal / inline
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('MILL_PROCESSING');
  const [courierName, setCourierName] = useState('VRL Express Cargo');
  const [trackingNumber, setTrackingNumber] = useState('');

  // KPI Metrics Calculations
  const grossSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
  const lowStockProducts = products.filter(p => p.stock < 100);
  const pendingQuotes = quotations.filter(q => q.status === 'PENDING');
  const b2bOrders = orders.filter(o => o.customer.isB2B);

  // Open Product Modal for Edit
  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      categoryName: p.categoryName,
      subcategory: p.subcategory,
      mrp: p.mrp,
      retailPrice: p.retailPrice,
      stock: p.stock,
      moq: p.moq,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
      shortDescription: p.shortDescription,
      description: p.description,
      image: p.images[0]
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProductId) {
      updateProduct(editingProductId, {
        name: productForm.name,
        sku: productForm.sku,
        category: productForm.category,
        categoryName: productForm.categoryName,
        subcategory: productForm.subcategory,
        mrp: productForm.mrp,
        retailPrice: productForm.retailPrice,
        stock: productForm.stock,
        moq: productForm.moq,
        hsnCode: productForm.hsnCode,
        gstRate: productForm.gstRate,
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        images: [productForm.image]
      });
    } else {
      addProduct({
        name: productForm.name,
        slug: productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: productForm.sku || `MLE-${Math.floor(1000 + Math.random() * 9000)}`,
        category: productForm.category,
        categoryName: productForm.categoryName,
        subcategory: productForm.subcategory,
        mrp: productForm.mrp,
        retailPrice: productForm.retailPrice,
        stock: productForm.stock,
        moq: productForm.moq,
        rating: 4.8,
        reviewCount: 12,
        isDirectMillDeal: true,
        hsnCode: productForm.hsnCode,
        gstRate: productForm.gstRate,
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        images: [productForm.image],
        tags: [productForm.category, productForm.subcategory.toLowerCase()],
        specifications: {
          'Composition': 'Commercial Cotton / Textile',
          'Origin': 'Surat Textile Park'
        },
        wholesaleTiers: [
          { minQty: 1, maxQty: 9, pricePerUnit: productForm.retailPrice, savingsPercent: 0, label: 'Standard Retail' },
          { minQty: 10, maxQty: 49, pricePerUnit: Math.round(productForm.retailPrice * 0.75), savingsPercent: 25, label: 'Wholesale Tier 1' },
          { minQty: 50, pricePerUnit: Math.round(productForm.retailPrice * 0.65), savingsPercent: 35, label: 'Direct Mill Contract' }
        ]
      });
    }
    setProductModalOpen(false);
    setEditingProductId(null);
  };

  // Open Quote Editor
  const handleOpenQuoteEditor = (quote: Quotation) => {
    setSelectedQuote(quote);
    const initialRates: Record<string, number> = {};
    quote.items.forEach(it => {
      initialRates[it.productId] = it.quotedUnitPrice;
    });
    setQuotePrices(initialRates);
    setQuoteStaffNote(quote.notes || '');
    setQuoteModalOpen(true);
  };

  const handleSaveStaffQuote = () => {
    if (!selectedQuote) return;
    const updatedItems = selectedQuote.items.map(it => ({
      productId: it.productId,
      quotedUnitPrice: quotePrices[it.productId] || it.quotedUnitPrice
    }));
    updateQuotationByStaff(selectedQuote.id, updatedItems, quoteStaffNote);
    setQuoteModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Subcategory', 'MRP', 'RetailPrice', 'Stock', 'HSN', 'GST'];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.category,
      p.subcategory,
      p.mrp,
      p.retailPrice,
      p.stock,
      p.hsnCode,
      p.gstRate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mahalaxmi_Enterprises_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Admin Title & Ops Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-mill text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              OPERATIONS DESK
            </span>
            <span className="text-xs text-slate-400">Surat Central Warehouse Unit 1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight mt-1">
            Mahalaxmi Enterprises Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingProductId(null);
              setProductForm({
                name: '',
                sku: `MLE-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
                category: 'textile',
                categoryName: 'Textile',
                subcategory: 'Double Bedsheets',
                mrp: 1699,
                retailPrice: 849,
                stock: 300,
                moq: 1,
                hsnCode: '630221',
                gstRate: 5,
                shortDescription: '100% Combed Indian Cotton product.',
                description: 'Direct mill woven fabric with high thread density.',
                image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop'
              });
              setProductModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo hover:bg-indigo-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-4 sm:gap-6 hide-scrollbar touch-pan-x w-full max-w-full pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Operations Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Order Management ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'quotations'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Wholesale RFQ Desk ({quotations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'enquiries'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Business Leads ({enquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import-export')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'import-export'
              ? 'border-indigo text-indigo'
              : 'border-transparent text-slate-500 hover:text-navy'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>CSV Data Tools</span>
        </button>
      </div>

      {/* 1. OVERVIEW TAB: KPI Cards & Trend Summaries */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gross Invoiced Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-black text-navy">
                ₹{grossSales.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Across {orders.length} confirmed consignments
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Commercial Order Value (AOV)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-navy">
                ₹{avgOrderValue.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-indigo font-semibold">
                B2B Bulk Split: {Math.round((b2bOrders.length / (orders.length || 1)) * 100)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pending Mill RFQs
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">
                {pendingQuotes.length} Quotes
              </p>
              <p className="text-[11px] text-slate-500">
                Requires production pricing review
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Catalog Lines
              </span>
              <p className="text-2xl sm:text-3xl font-black text-navy">
                {products.length} SKUs
              </p>
              <p className="text-[11px] text-slate-500">
                {lowStockProducts.length > 0 ? (
                  <span className="text-amber-700 font-semibold">{lowStockProducts.length} items low in stock</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Healthy inventory levels</span>
                )}
              </p>
            </div>
          </div>

          {/* Recent Orders and Pending Quotes Quick Glance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orders Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-navy">Recent Consignments</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-indigo hover:underline">
                  View All Orders &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {orders.slice(0, 3).map(ord => (
                  <div key={ord.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-navy font-mono">{ord.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {ord.customer.companyName || ord.customer.name} • {ord.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-navy">₹{ord.totalAmount.toLocaleString('en-IN')}</p>
                      <Badge size="sm" variant={ord.status === 'DELIVERED' ? 'success' : 'primary'}>
                        {ord.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Quotations */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-navy">Wholesale Quotes Pending Review</h3>
                <button onClick={() => setActiveTab('quotations')} className="text-xs font-bold text-indigo hover:underline">
                  RFQ Desk &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {quotations.map(q => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-navy font-mono">{q.quoteNumber}</p>
                      <p className="text-[11px] text-slate-500">{q.buyer.companyName} ({q.buyer.businessType})</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge size="sm" variant={q.status === 'PREPARED' ? 'success' : 'warning'}>
                        {q.status}
                      </Badge>
                      <button
                        onClick={() => handleOpenQuoteEditor(q)}
                        className="px-2.5 py-1 bg-navy text-white rounded text-[11px] font-semibold hover:bg-navy-800"
                      >
                        Edit Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS TAB: Catalog CRUD & Stock adjustments */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-navy">Master Product Inventory & Wholesale Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage SKUs, stock levels, wholesale volume tiers, and GST rates.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Filter by name or SKU..."
                className="text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-3 px-3">Product Name & Category</th>
                  <th className="py-3 px-2 text-center">SKU</th>
                  <th className="py-3 px-3 text-right">Retail Rate</th>
                  <th className="py-3 px-3 text-center">Tiers</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3 text-center">Adjust Stock</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter(
                    p =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(productSearch.toLowerCase())
                  )
                  .map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-navy line-clamp-1">{prod.name}</p>
                            <span className="text-[10px] text-indigo font-semibold">{prod.categoryName} • {prod.subcategory}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center font-mono text-slate-500">{prod.sku}</td>

                      <td className="py-3 px-3 text-right font-bold text-navy">
                        ₹{prod.retailPrice}
                        <span className="block text-[10px] text-slate-400 line-through">₹{prod.mrp}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="bg-indigo-light text-indigo px-2 py-0.5 rounded font-bold text-[10px]">
                          {prod.wholesaleTiers?.length || 0} Tiers
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold ${prod.stock < 100 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {prod.stock} units
                        </span>
                      </td>

                      {/* Instant Stock Adjustment */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => adjustProductStock(prod.id, -10)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs"
                            title="Decrease by 10"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => adjustProductStock(prod.id, 50)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold text-xs"
                            title="Add 50 units"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Edit & Delete */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="p-1.5 text-slate-600 hover:text-indigo rounded hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-error rounded hover:bg-red-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ORDERS TAB: Manage status, Invoices, Shipments */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-navy">Order Fulfillment & Dispatch Control</h3>
              <p className="text-xs text-slate-500 mt-0.5">Update shipment status, assign waybill numbers, and print legal tax invoices.</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder="Search orders..."
                className="text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:border-indigo outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-3 px-3">Order ID & Date</th>
                  <th className="py-3 px-3">Customer / Business</th>
                  <th className="py-3 px-3 text-right">Invoice Value</th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3 text-center">Current Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter(
                    o =>
                      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      o.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
                      (o.customer.companyName && o.customer.companyName.toLowerCase().includes(orderSearch.toLowerCase()))
                  )
                  .map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <p className="font-mono font-bold text-navy">{ord.orderNumber}</p>
                        <p className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-navy">{ord.customer.companyName || ord.customer.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {ord.customer.phone} {ord.customer.gstNumber ? `• GST: ${ord.customer.gstNumber}` : ''}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-right font-black text-navy">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-700 text-[11px] block">{ord.paymentMethod}</span>
                        <span className={`text-[10px] font-bold ${ord.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {ord.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge size="sm" variant={ord.status === 'DELIVERED' ? 'success' : 'primary'}>
                          {ord.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Update Status Button */}
                          <button
                            onClick={() => {
                              setEditingOrderId(ord.id);
                              setNewOrderStatus(ord.status);
                              setTrackingNumber(ord.trackingNumber || '');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-navy font-semibold rounded text-[11px]"
                          >
                            Update
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => {
                              setSelectedInvoiceOrder(ord);
                              setInvoiceType('INVOICE');
                            }}
                            className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded"
                            title="Generate GST Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Inline Order Status Update Modal */}
          {editingOrderId && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <h4 className="font-bold text-navy">Update Order Consignment #{editingOrderId}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">New Fulfillment Status</label>
                  <select
                    value={newOrderStatus}
                    onChange={e => setNewOrderStatus(e.target.value as OrderStatus)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white outline-none"
                  >
                    <option value="PLACED">PLACED (Order Verified)</option>
                    <option value="MILL_PROCESSING">MILL_PROCESSING (Loom Batching)</option>
                    <option value="PACKED">PACKED (Palletized & Barcoded)</option>
                    <option value="IN_TRANSIT">IN_TRANSIT (Carrier Waybill En Route)</option>
                    <option value="DELIVERED">DELIVERED (Handover Complete)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Freight Carrier</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Docket / Waybill No.</label>
                  <input
                    type="text"
                    placeholder="e.g. VRL-SUR-98442"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateOrderStatus(editingOrderId, newOrderStatus, trackingNumber, courierName);
                    setEditingOrderId(null);
                  }}
                  className="px-4 py-2 bg-indigo text-white font-bold rounded-lg hover:bg-indigo-dark transition"
                >
                  Save Status & Notify Buyer
                </button>
                <button
                  onClick={() => setEditingOrderId(null)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. QUOTATIONS TAB: Prepare & Approve RFQs */}
      {activeTab === 'quotations' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-navy">Wholesale RFQ Review Desk</h3>
            <p className="text-xs text-slate-500 mt-0.5">Review buyer purchase enquiries, adjust unit mill rates, and lock quotations for 14 days.</p>
          </div>

          <div className="space-y-4">
            {quotations.map(quote => (
              <div
                key={quote.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-mono font-bold text-navy text-sm">{quote.quoteNumber}</span>
                    <p className="text-[11px] text-slate-500">
                      Buyer: <span className="font-semibold text-slate-800">{quote.buyer.companyName}</span> ({quote.buyer.name}) • Email: {quote.buyer.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge size="sm" variant={quote.status === 'PREPARED' ? 'success' : 'warning'}>
                      {quote.status}
                    </Badge>
                    <button
                      onClick={() => handleOpenQuoteEditor(quote)}
                      className="px-3 py-1.5 bg-indigo text-white font-bold rounded-lg hover:bg-indigo-dark transition"
                    >
                      Prepare / Adjust Rates
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {quote.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <p className="font-semibold text-navy truncate">{it.productName}</p>
                      <p className="text-slate-500 mt-0.5">
                        Qty: <span className="font-bold">{it.quantity}</span> • Target: ₹{it.targetPrice || '-'} • Quoted: <span className="font-bold text-indigo">₹{it.quotedUnitPrice}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                  <span>Grand Total Estimate: <strong className="text-navy text-xs">₹{quote.grandTotal.toLocaleString('en-IN')}</strong></span>
                  <span>Valid Until: {new Date(quote.validUntil).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ENQUIRIES TAB */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-navy">Business Lead Enquiries</h3>
            <p className="text-xs text-slate-500 mt-0.5">Direct commercial leads generated from the homepage RFQ form.</p>
          </div>

          <div className="space-y-3">
            {enquiries.map(enq => (
              <div key={enq.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-navy text-sm">{enq.businessName}</h4>
                    <p className="text-slate-500 text-[11px]">Contact: {enq.fullName} • Phone: {enq.phone} • Email: {enq.email}</p>
                  </div>
                  <Badge size="sm" variant="primary">{enq.businessType}</Badge>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
                  <p className="text-[11px] font-semibold text-slate-500 mb-0.5">Expected Monthly Volume: {enq.expectedMonthlyVolume}</p>
                  <p>{enq.notes || 'No notes specified.'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. IMPORT / EXPORT TAB */}
      {activeTab === 'import-export' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-navy">Product Catalog CSV Import & Export</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sync inventory and wholesale tiers with ERP or accounting software.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Download className="w-8 h-8 text-indigo" />
              <h4 className="font-bold text-sm text-navy">Export Product Catalog to CSV</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download the complete active product database with current MRPs, retail rates, wholesale volume tiers, and inventory stocks.
              </p>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-indigo text-white font-bold rounded-xl text-xs hover:bg-indigo-dark transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Active Catalog CSV</span>
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Upload className="w-8 h-8 text-navy" />
              <h4 className="font-bold text-sm text-navy">Bulk Stock Adjustment Feed</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reset or replenish stocks across all products back to factory standard levels.
              </p>
              <button
                onClick={() => {
                  products.forEach(p => adjustProductStock(p.id, 100));
                  alert('Added +100 units to all products in inventory!');
                }}
                className="px-4 py-2.5 bg-navy text-white font-bold rounded-xl text-xs hover:bg-navy-800 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 text-champagne" />
                <span>Replenish All Inventory (+100 Units)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-premium space-y-4">
            <h3 className="font-bold text-lg text-navy">
              {editingProductId ? 'Edit Product Details' : 'Create New Catalog Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={e => {
                      const cat = e.target.value as CategoryId;
                      const catName = {
                        textile: 'Textile',
                        'cotton-products': 'Cotton Products',
                        'home-kitchen': 'Home and Kitchen',
                        household: 'Household'
                      }[cat];
                      setProductForm({ ...productForm, category: cat, categoryName: catName });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="textile">Textile</option>
                    <option value="cotton-products">Cotton Products</option>
                    <option value="home-kitchen">Home and Kitchen</option>
                    <option value="household">Household</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    value={productForm.subcategory}
                    onChange={e => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.mrp}
                    onChange={e => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Retail Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.retailPrice}
                    onChange={e => setProductForm({ ...productForm, retailPrice: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-bold text-indigo"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Wholesale MOQ</label>
                  <input
                    type="number"
                    required
                    value={productForm.moq}
                    onChange={e => setProductForm({ ...productForm, moq: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={productForm.hsnCode}
                    onChange={e => setProductForm({ ...productForm, hsnCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">GST Rate (%)</label>
                  <select
                    value={productForm.gstRate}
                    onChange={e => setProductForm({ ...productForm, gstRate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value={5}>5% (Cotton & Bedsheets)</option>
                    <option value={12}>12% (Household & Linen)</option>
                    <option value={18}>18% (Dusters & Plastic Equipment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo text-white font-bold rounded-xl hover:bg-indigo-dark transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Quote Editor Modal */}
      {quoteModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-premium space-y-4 text-xs">
            <h3 className="font-bold text-base text-navy">
              Prepare Official Quotation #{selectedQuote.quoteNumber}
            </h3>
            <p className="text-slate-500">
              Buyer: <span className="font-semibold text-slate-800">{selectedQuote.buyer.companyName}</span>
            </p>

            <div className="space-y-3 pt-2">
              {selectedQuote.items.map(it => (
                <div key={it.productId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-navy">{it.productName}</p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>Quantity: {it.quantity} Pcs</span>
                    <span>Buyer Target: ₹{it.targetPrice || '-'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">Quoted Unit Rate (₹):</span>
                      <input
                        type="number"
                        value={quotePrices[it.productId] ?? it.quotedUnitPrice}
                        onChange={e =>
                          setQuotePrices({
                            ...quotePrices,
                            [it.productId]: Number(e.target.value)
                          })
                        }
                        className="w-20 p-1 border border-slate-300 rounded text-right font-bold text-indigo"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Staff Notes / Payment Terms</label>
              <textarea
                rows={2}
                value={quoteStaffNote}
                onChange={e => setQuoteStaffNote(e.target.value)}
                placeholder="e.g. Free pallet freight to Delhi hub. Net 30 payment upon delivery."
                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStaffQuote}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
              >
                Approve & Send to Buyer Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal for Admin */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          type={invoiceType}
        />
      )}
    </div>
  );
};
