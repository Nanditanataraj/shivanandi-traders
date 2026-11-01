import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Truck,
  Settings,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Volume2,
  VolumeX,
  PhoneCall,
  MessageSquare,
  Eye,
  XCircle,
  Search,
  FileText,
  Clock,
  MapPin,
  X,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Product, Order, Coupon, WarehouseConfig, DeliveryPartner, OrderStatus } from '../types/index.ts';
import { formatINR } from '../utils/mysuruLocations.ts';
import {
  playOrderChime,
  playCancellationChime,
  createOwnerWhatsAppLink,
  triggerDesktopNotification
} from '../utils/audioAlert.ts';

const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- SHIVANANDI TRADERS - SUPABASE POSTGRESQL DATABASE SETUP SCRIPT
-- Project ID: aswuluewjyvdzynfcsbg
-- Direct Link: https://supabase.com/dashboard/project/aswuluewjyvdzynfcsbg/sql
-- ====================================================================

-- 1. Create ORDERS Table
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  customer_id text,
  customer_name text,
  customer_phone text,
  delivery_address jsonb,
  items jsonb,
  subtotal numeric,
  delivery_fee numeric,
  discount_amount numeric default 0,
  coupon_code text,
  total_amount numeric not null,
  payment_status text not null default 'paid',
  payment_method text not null,
  razorpay_payment_id text,
  status text not null default 'ORDER_PLACED',
  delivery_distance_km numeric,
  estimated_delivery_mins numeric,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;

-- Drop policy if exists so script can be re-run safely
drop policy if exists "Allow all public operations on orders" on public.orders;

-- Create policy allowing inserts and updates from website
create policy "Allow all public operations on orders"
  on public.orders for all
  using (true)
  with check (true);

-- Indexes for lightning fast lookups
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_phone on public.orders (customer_phone);
create index if not exists idx_orders_order_number on public.orders (order_number);

-- 2. Create CUSTOMERS Table
create table if not exists public.customers (
  id text primary key,
  phone text unique not null,
  name text,
  email text,
  addresses jsonb,
  created_at timestamptz default now()
);

alter table public.customers enable row level security;
drop policy if exists "Allow all public operations on customers" on public.customers;
create policy "Allow all public operations on customers"
  on public.customers for all
  using (true)
  with check (true);

-- 3. Create PRODUCTS Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  category_name text,
  price numeric not null,
  discount_price numeric not null,
  stock integer default 20,
  weight text,
  images jsonb,
  expiry_date text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
drop policy if exists "Allow all public operations on products" on public.products;
create policy "Allow all public operations on products"
  on public.products for all
  using (true)
  with check (true);`;

export const AdminDashboard: React.FC = () => {
  const {
    products,
    refreshProducts,
    categories,
    warehouse,
    updateWarehouseConfig,
    setSelectedOrderForInvoice
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'delivery' | 'coupons' | 'settings' | 'supabase'>('orders');
  const [stats, setStats] = useState<any>(null);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Sound chime settings
  const [soundAlerts, setSoundAlerts] = useState<boolean>(warehouse.soundAlertsEnabled ?? true);

  // Order management filters and search
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [isPullingSupabase, setIsPullingSupabase] = useState(false);
  const [supabaseSyncBanner, setSupabaseSyncBanner] = useState<string | null>(null);

  // Order modals state
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');

  // Edit form state
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editAddressArea, setEditAddressArea] = useState('');
  const [editAddressDetails, setEditAddressDetails] = useState('');
  const [editRiderId, setEditRiderId] = useState('');
  const [editEstimatedMins, setEditEstimatedMins] = useState(20);
  const [editAdminNotes, setEditAdminNotes] = useState('');

  // Product edit modal state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Warehouse settings form state (including logoUrl and Supabase)
  const [warehouseForm, setWarehouseForm] = useState<WarehouseConfig>(warehouse);

  // Supabase test connection state
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // New Coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'fixed' | 'percentage' | 'free_delivery'>('fixed');
  const [newCouponValue, setNewCouponValue] = useState(50);
  const [newCouponMin, setNewCouponMin] = useState(399);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, partnersRes, couponsRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/delivery-partners').then(r => r.json()),
        fetch('/api/coupons').then(r => r.json())
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success) setAdminOrders(ordersRes.data);
      if (partnersRes.success) setDeliveryPartners(partnersRes.data);
      if (couponsRes.success) setCoupons(couponsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setWarehouseForm(warehouse);
    if (warehouse.soundAlertsEnabled !== undefined) {
      setSoundAlerts(warehouse.soundAlertsEnabled);
    }
  }, [warehouse]);

  // Pull orders directly from Supabase PostgreSQL orders table
  const handlePullFromSupabase = async () => {
    setIsPullingSupabase(true);
    setSupabaseSyncBanner(null);
    try {
      const res = await fetch('/api/supabase/orders');
      const data = await res.json();
      if (data.success) {
        setAdminOrders(data.data);
        setSupabaseSyncBanner(`✅ Successfully retrieved and synced ${data.count} bookings from Supabase!`);
        if (soundAlerts) playOrderChime();
      } else {
        setSupabaseSyncBanner(`⚠️ ${data.message || 'Could not fetch from Supabase'}`);
      }
    } catch (err: any) {
      setSupabaseSyncBanner(`⚠️ Network error: ${err.message}`);
    } finally {
      setIsPullingSupabase(false);
      setTimeout(() => setSupabaseSyncBanner(null), 5000);
    }
  };

  // Test notification chime
  const handleTestSoundAlert = () => {
    playOrderChime();
    triggerDesktopNotification('SHIVANANDI TRADERS - Sound Alert Test', 'New order notification sound working properly!');
  };

  // Test WhatsApp alert
  const handleTestWhatsApp = () => {
    const ownerPhone = warehouse.notificationPhone || '7892566419';
    const sampleText = `🔔 *SHIVANANDI TRADERS - NOTIFICATION TEST*%0A%0A` +
      `Test notification for Store Manager (${ownerPhone})%0A` +
      `Fast Delivery Hub: Saraswathipuram, Mysuru%0A` +
      `System Status: Online & Connected to Supabase.`;
    window.open(`https://wa.me/91${ownerPhone}?text=${sampleText}`, '_blank');
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditCustomerName(order.customerName);
    setEditCustomerPhone(order.customerPhone);
    setEditAddressArea(order.deliveryAddress?.area || 'Mysuru');
    setEditAddressDetails(`${order.deliveryAddress?.houseNumber || ''}, ${order.deliveryAddress?.landmark || ''}`.trim());
    setEditRiderId(order.deliveryPartner?.id || '');
    setEditEstimatedMins(order.estimatedDeliveryMins || 20);
    setEditAdminNotes(order.adminNotes || '');
  };

  // Save Order Edit
  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const selectedRider = deliveryPartners.find(p => p.id === editRiderId);
      const updatedPartner = selectedRider ? {
        id: selectedRider.id,
        name: selectedRider.name,
        phone: selectedRider.phone,
        currentLat: selectedRider.currentLat,
        currentLng: selectedRider.currentLng,
        lastUpdated: new Date().toISOString()
      } : editingOrder.deliveryPartner;

      const payload = {
        customerName: editCustomerName,
        customerPhone: editCustomerPhone,
        deliveryAddress: {
          ...editingOrder.deliveryAddress,
          area: editAddressArea,
          houseNumber: editAddressDetails
        },
        deliveryPartner: updatedPartner,
        estimatedDeliveryMins: Number(editEstimatedMins),
        adminNotes: editAdminNotes
      };

      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAdminOrders(prev => prev.map(o => o.id === editingOrder.id ? data.data : o));
        setEditingOrder(null);
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating order');
    }
  };

  // Confirm Cancellation
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      const data = await res.json();
      if (data.success) {
        setAdminOrders(prev => prev.map(o => o.id === cancellingOrder.id ? data.data : o));
        playCancellationChime();
        setCancellingOrder(null);
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (err: any) {
      alert(err.message || 'Error cancelling order');
    }
  };

  // Update order pipeline status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, note?: string, deliveryPartnerId?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, deliveryPartnerId })
      });
      const data = await res.json();
      if (data.success) {
        setAdminOrders(prev => prev.map(o => o.id === orderId ? data.data : o));
        if (soundAlerts && (status === 'ORDER_ACCEPTED' || status === 'DELIVERED')) {
          playOrderChime();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingProduct,
        discountPrice: editingProduct.discountPrice || editingProduct.price,
        stock: Number(editingProduct.stock || 20),
        images: editingProduct.images && editingProduct.images.length > 0
          ? editingProduct.images
          : ['/src/assets/images/product_whey_protein_1793517247259.jpg'],
        tags: editingProduct.tags || ['Fitness', 'Mysuru Delivery'],
        rating: editingProduct.rating || 4.9,
        reviewCount: editingProduct.reviewCount || 10
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await refreshProducts();
        setIsProductModalOpen(false);
        setEditingProduct(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await refreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // Warehouse settings save
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...warehouseForm,
      soundAlertsEnabled: soundAlerts
    };
    await updateWarehouseConfig(payload);
    alert('Settings and Supabase configuration saved successfully!');
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseTestStatus(null);
    try {
      const res = await fetch('/api/supabase/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: warehouseForm.supabaseUrl,
          key: warehouseForm.supabaseKey
        })
      });
      const data = await res.json();
      setSupabaseTestStatus(data);
    } catch (e: any) {
      setSupabaseTestStatus({
        success: false,
        message: e.message || 'Could not connect to Supabase endpoint'
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered orders list
  const filteredOrders = adminOrders.filter(order => {
    // Search query match
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = order.customerPhone.includes(q);
      const matchArea = order.deliveryAddress?.area?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchArea) return false;
    }

    // Status filter
    if (orderStatusFilter === 'active') {
      return order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    }
    if (orderStatusFilter === 'delivered') {
      return order.status === 'DELIVERED';
    }
    if (orderStatusFilter === 'cancelled') {
      return order.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* STORE NOTIFICATION & AUDIO ALERT BAR */}
      <div className="p-4 rounded-3xl bg-[#FAF7EE] border border-amber-300/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111827] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-neutral-900 text-sm">Store Manager Phone Alerts Active</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                +91 {warehouse.notificationPhone || '7892566419'}
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              Audio chime triggers on new orders. Direct PhonePe/Google Pay links and Supabase auto-sync enabled.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundAlerts(!soundAlerts)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundAlerts
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-neutral-100 border-neutral-300 text-neutral-600'
            }`}
          >
            {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span>Sound Chime: {soundAlerts ? 'ON' : 'OFF'}</span>
          </button>

          {/* Test Sound */}
          <button
            type="button"
            onClick={handleTestSoundAlert}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <span>Test Sound Chime</span>
          </button>

          {/* Test WhatsApp Alert */}
          <button
            type="button"
            onClick={handleTestWhatsApp}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Test Alert on WhatsApp</span>
          </button>

          {/* Pull from Supabase */}
          <button
            type="button"
            onClick={handlePullFromSupabase}
            disabled={isPullingSupabase}
            className="px-3 py-1.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isPullingSupabase ? 'animate-spin' : ''}`} />
            <span>{isPullingSupabase ? 'Syncing...' : 'Sync Supabase Orders'}</span>
          </button>
        </div>
      </div>

      {supabaseSyncBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 font-bold flex items-center justify-between animate-fade-in">
          <span>{supabaseSyncBanner}</span>
          <button onClick={() => setSupabaseSyncBanner(null)} className="text-emerald-700 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Admin Navigation Tabs */}
      <div className="flex border-b border-neutral-200 overflow-x-auto gap-1 sm:gap-2 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'orders'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Bookings & Orders ({adminOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'supabase'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase Database ({warehouseForm.supabaseProjectId || 'aswuluewjyvdzynfcsbg'})</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'delivery'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Fleet & Slabs</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'coupons'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Coupons</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'border-[#B48C14] text-[#B48C14] bg-amber-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Business & Logo Settings</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div>

        {/* 1. COMPREHENSIVE BOOKINGS & ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter and Search Bar */}
            <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    orderStatusFilter === 'all'
                      ? 'bg-[#111827] text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  All ({adminOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    orderStatusFilter === 'active'
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Active ({adminOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('delivered')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    orderStatusFilter === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Delivered ({adminOrders.filter(o => o.status === 'DELIVERED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('cancelled')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    orderStatusFilter === 'cancelled'
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Cancelled ({adminOrders.filter(o => o.status === 'CANCELLED').length})
                </button>
              </div>

              {/* Search bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  placeholder="Search by Order #, Customer Name, Phone, or Area..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className={`p-5 rounded-3xl bg-white border transition-shadow shadow-xs space-y-3 ${
                    order.status === 'CANCELLED'
                      ? 'border-red-200 bg-red-50/20'
                      : order.status === 'DELIVERED'
                      ? 'border-emerald-200'
                      : 'border-neutral-200'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 text-xs">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-neutral-900 text-sm tracking-wide">
                          {order.orderNumber}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] border ${
                          order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono text-[10px]">
                          {order.paymentMethod?.toUpperCase() || 'UPI'} · {order.razorpayPaymentId || 'Verified'}
                        </span>
                      </div>

                      <p className="text-neutral-500 mt-1 text-[11px]">
                        Placed on {new Date(order.createdAt).toLocaleString()} · Recipient: <strong className="text-neutral-900">{order.customerName}</strong>
                      </p>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center gap-1 border border-neutral-300"
                        title="View Full Booking Data"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-700" />
                        <span>View</span>
                      </button>

                      {/* Edit Order */}
                      <button
                        onClick={() => handleOpenEditOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center gap-1 border border-neutral-300"
                        title="Edit Booking & Details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Edit</span>
                      </button>

                      {/* Cancel Order */}
                      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1 border border-red-200"
                          title="Cancel Order"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* View Invoice */}
                      <button
                        onClick={() => setSelectedOrderForInvoice(order)}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center gap-1 border border-neutral-300"
                        title="Print GST Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Customer & Call / WhatsApp */}
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                      <h4 className="font-bold text-neutral-500 uppercase text-[10px]">Customer Details</h4>
                      <div>
                        <p className="font-extrabold text-neutral-900">{order.customerName}</p>
                        <p className="text-[11px] text-neutral-600 font-mono mt-0.5">📞 +91 {order.customerPhone}</p>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="px-2.5 py-1 rounded-lg bg-white border border-neutral-300 text-[11px] font-bold text-neutral-800 hover:bg-neutral-100 flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-600" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/91${order.customerPhone.replace(/[^0-9]/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(order.customerName)},%20this%20is%20Shivanandi%20Traders%20Mysuru%20regarding%20your%20Order%20${order.orderNumber}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                      <h4 className="font-bold text-neutral-500 uppercase text-[10px]">Delivery Destination</h4>
                      <p className="font-bold text-neutral-900">
                        {order.deliveryAddress?.houseNumber || 'House'}, {order.deliveryAddress?.landmark || ''}
                      </p>
                      <p className="text-[11px] text-neutral-600">
                        {order.deliveryAddress?.area || 'Mysuru'}, {order.deliveryAddress?.city || 'Mysuru'} - {order.deliveryAddress?.pincode || '570009'}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold">
                        📍 {order.deliveryDistanceKm} km · ETA ~{order.estimatedDeliveryMins || 20} mins
                      </p>
                      {order.deliveryPartner && (
                        <p className="text-[11px] text-amber-900 font-bold pt-1">
                          🛵 Rider: {order.deliveryPartner.name} ({order.deliveryPartner.phone})
                        </p>
                      )}
                    </div>

                    {/* Amount & Items Summary */}
                    <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-neutral-500 uppercase text-[10px]">Ordered Items ({order.items?.length || 0})</h4>
                        <div className="space-y-0.5 max-h-16 overflow-y-auto text-[11px] text-neutral-700">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2">{it.quantity}x {it.product?.name || 'Item'}</span>
                              <span className="font-bold shrink-0">{formatINR(it.totalPrice || it.unitPrice * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                        <span className="font-bold text-neutral-600 text-xs">Total Amount</span>
                        <span className="font-black text-[#B48C14] text-sm">{formatINR(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason if cancelled */}
                  {order.status === 'CANCELLED' && order.cancellationReason && (
                    <div className="p-2.5 bg-red-100/70 border border-red-300 rounded-xl text-xs text-red-900 font-semibold">
                      <strong>Cancellation Reason:</strong> {order.cancellationReason}
                    </div>
                  )}

                  {/* Admin Notes if present */}
                  {order.adminNotes && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-semibold">
                      <strong>Admin Notes:</strong> {order.adminNotes}
                    </div>
                  )}

                  {/* Order Pipeline Status Action Buttons */}
                  {order.status !== 'CANCELLED' && (
                    <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-bold text-neutral-500 mr-1">Move Pipeline:</span>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'ORDER_ACCEPTED', 'Order accepted by store')}
                        className={`px-3 py-1 rounded-xl font-bold ${
                          order.status === 'ORDER_ACCEPTED'
                            ? 'bg-[#111827] text-white'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING_ORDER', 'Packing station packing products')}
                        className={`px-3 py-1 rounded-xl font-bold ${
                          order.status === 'PREPARING_ORDER'
                            ? 'bg-[#111827] text-white'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        Prepare
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'ORDER_PACKED', 'Tamper-evident sealed')}
                        className={`px-3 py-1 rounded-xl font-bold ${
                          order.status === 'ORDER_PACKED'
                            ? 'bg-[#111827] text-white'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        Packed
                      </button>

                      {/* Partner assignment dropdown */}
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handleUpdateOrderStatus(order.id, 'DELIVERY_PARTNER_ASSIGNED', 'Partner assigned', e.target.value);
                          }
                        }}
                        defaultValue={order.deliveryPartner?.id || ''}
                        className="bg-white border border-neutral-300 text-xs text-neutral-900 rounded-xl px-2 py-1 font-semibold"
                      >
                        <option value="" disabled>Assign Rider...</option>
                        {deliveryPartners.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.vehicleNumber})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY', 'Rider is en route')}
                        className={`px-3 py-1 rounded-xl font-bold ${
                          order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-[#111827] text-white'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        Out for Delivery
                      </button>

                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED', 'Delivered to customer')}
                        className={`px-3 py-1 rounded-xl font-bold ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                        }`}
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="p-12 text-center bg-white border border-neutral-200 rounded-3xl space-y-2">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="font-extrabold text-neutral-800 text-sm">No Bookings Found</p>
                  <p className="text-xs text-neutral-500">
                    {orderSearchQuery ? 'Try adjusting your search query.' : 'New customer orders will appear here automatically.'}
                  </p>
                  <button
                    type="button"
                    onClick={handlePullFromSupabase}
                    className="mt-2 px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Check Supabase Database</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Total Revenue</span>
                <p className="text-xl font-black text-neutral-900 mt-1">{formatINR(stats?.totalRevenue || 0)}</p>
                <span className="text-[10px] text-emerald-700 font-bold">100% Online UPI Verified</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Total Bookings</span>
                <p className="text-xl font-black text-neutral-900 mt-1">{adminOrders.length}</p>
                <span className="text-[10px] text-neutral-500 font-medium">Auto-Synced to Supabase</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Active Fleet</span>
                <p className="text-xl font-black text-neutral-900 mt-1">{deliveryPartners.length} Riders</p>
                <span className="text-[10px] text-neutral-500 font-medium">Mysuru 20km Coverage</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Avg Delivery Time</span>
                <p className="text-xl font-black text-neutral-900 mt-1">18 mins</p>
                <span className="text-[10px] text-emerald-700 font-bold">Fast Delivery Express</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCTS & INVENTORY */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-neutral-900">Products Catalog ({products.length})</h2>
                <p className="text-xs text-neutral-500">Manage prices, video demos, inventory counts, expiry dates</p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    categoryId: categories[0]?.id || 'cat-protein',
                    categoryName: categories[0]?.name || 'PROTEIN & FITNESS',
                    price: 999,
                    discountPrice: 849,
                    description: '',
                    weight: '500 g',
                    ingredients: '',
                    expiryDate: '2027-12-31',
                    stock: 30,
                    tags: ['Mysuru Fast Delivery', 'Trending']
                  });
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#111827] text-white font-extrabold text-xs flex items-center gap-1.5 hover:bg-black shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(p => (
                <div key={p.id} className="p-4 rounded-3xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-2xl object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-[#B48C14] uppercase">{p.categoryName}</span>
                      <h4 className="text-xs font-black text-neutral-900 line-clamp-2 mt-0.5">{p.name}</h4>
                      <p className="text-[11px] text-neutral-500">{p.weight}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="font-black text-neutral-900 text-sm tabular-nums">
                          {formatINR(p.discountPrice)}
                        </span>
                        <span className="text-xs text-neutral-400 line-through tabular-nums">
                          {formatINR(p.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stock <= 10 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        Stock: {p.stock}
                      </span>
                      <span className="text-neutral-400 text-[10px]">Exp: {p.expiryDate}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-700 border border-neutral-200"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUPABASE DATABASE TAB */}
        {activeTab === 'supabase' && (
          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-6 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 shadow-xs">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-neutral-900">Supabase Cloud Database Connection</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      Live Connected
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    Customer orders and bookings automatically stream directly to your Supabase PostgreSQL tables.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePullFromSupabase}
                  disabled={isPullingSupabase}
                  className="px-4 py-2 bg-[#111827] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 hover:bg-black"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isPullingSupabase ? 'animate-spin' : ''}`} />
                  <span>Pull Orders from Supabase</span>
                </button>

                <a
                  href={`https://supabase.com/dashboard/project/${warehouseForm.supabaseProjectId || 'aswuluewjyvdzynfcsbg'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs rounded-xl border border-neutral-300 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Connection Credentials Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Supabase Project ID</label>
                <input
                  type="text"
                  value={warehouseForm.supabaseProjectId || 'aswuluewjyvdzynfcsbg'}
                  onChange={e => {
                    const pid = e.target.value.trim();
                    setWarehouseForm({
                      ...warehouseForm,
                      supabaseProjectId: pid,
                      supabaseUrl: `https://${pid}.supabase.co`
                    });
                  }}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono font-bold"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Configured for your provided project: <strong>aswuluewjyvdzynfcsbg</strong></p>
              </div>

              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Supabase Project URL</label>
                <input
                  type="text"
                  value={warehouseForm.supabaseUrl || 'https://aswuluewjyvdzynfcsbg.supabase.co'}
                  onChange={e => setWarehouseForm({ ...warehouseForm, supabaseUrl: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-700 font-bold">
                    Supabase API Key (Publishable / Anon key)
                  </label>
                  <a
                    href={`https://supabase.com/dashboard/project/${warehouseForm.supabaseProjectId || 'aswuluewjyvdzynfcsbg'}/settings/api`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#B48C14] font-bold hover:underline"
                  >
                    Find your API keys in Supabase Settings → API
                  </a>
                </div>
                <input
                  type="text"
                  value={warehouseForm.supabaseKey || ''}
                  onChange={e => setWarehouseForm({ ...warehouseForm, supabaseKey: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Test Connection Button and Status */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveWarehouse}
                className="py-2.5 px-5 rounded-xl bg-[#111827] text-white font-black text-xs hover:bg-black flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Supabase Configuration</span>
              </button>

              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testingSupabase}
                className="py-2.5 px-5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 font-extrabold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testingSupabase ? 'animate-spin' : ''}`} />
                <span>{testingSupabase ? 'Pinging Supabase...' : 'Test Connection'}</span>
              </button>
            </div>

            {supabaseTestStatus && (
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                supabaseTestStatus.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                {supabaseTestStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-extrabold text-sm">
                    {supabaseTestStatus.success ? 'Supabase Connection Verified!' : 'Supabase Setup Required'}
                  </p>
                  <p className="mt-0.5 leading-relaxed">{supabaseTestStatus.message}</p>
                </div>
              </div>
            )}

            {/* SQL Table Setup Helper */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-neutral-900 text-sm">Supabase Database SQL Schema</h4>
                  <p className="text-[11px] text-neutral-500">
                    Execute this SQL script in your Supabase SQL Editor to initialize tables.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 font-bold text-xs flex items-center gap-1.5 text-neutral-800 transition-colors shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5 text-[#B48C14]" />
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-neutral-900 text-[#D4AF37] font-mono text-[11px] overflow-x-auto leading-relaxed max-h-56">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        )}

        {/* 5. DELIVERY & SLABS */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-neutral-900">Delivery Fleet Partners ({deliveryPartners.length})</h3>
                  <p className="text-xs text-neutral-500">Authorized riders for Mysuru city fast delivery</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {deliveryPartners.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-neutral-900 text-sm">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-neutral-500">Vehicle: {p.vehicleNumber}</p>
                    <p className="text-neutral-500">Phone: {p.phone}</p>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      GPS: {p.currentLat.toFixed(4)}, {p.currentLng.toFixed(4)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. COUPONS */}
        {activeTab === 'coupons' && (
          <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-neutral-900">Coupons & Promotional Codes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map(c => (
                <div key={c.code} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-neutral-900 text-sm font-mono">{c.code}</span>
                    <p className="text-neutral-500">{c.description}</p>
                    <p className="text-[10px] text-neutral-400">Min Order: {formatINR(c.minOrderValue)}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-[#B48C14] font-black text-xs">
                    {c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BUSINESS & LOGO SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveWarehouse} className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-6 text-xs">
            <div>
              <h3 className="text-base font-black text-neutral-900">Business, UPI & Notification Settings</h3>
              <p className="text-xs text-neutral-500">
                Sellers & Administrators can update the official logo picture, PhonePe/Google Pay UPI ID, contact number, and warehouse GPS.
              </p>
            </div>

            {/* Logo Customization Card */}
            <div className="p-4 bg-[#FAF7EE] rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-black shadow-md shrink-0">
                <img
                  src={warehouseForm.logoUrl || '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg'}
                  alt="Official Logo Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-800 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#B48C14]" />
                    <span>Official Website Logo URL / Path</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setWarehouseForm({
                      ...warehouseForm,
                      logoUrl: '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg'
                    })}
                    className="text-[11px] font-bold text-[#B48C14] hover:underline"
                  >
                    Use Uploaded Shiva Nandi Image
                  </button>
                </div>

                <input
                  type="text"
                  value={warehouseForm.logoUrl || ''}
                  onChange={e => setWarehouseForm({ ...warehouseForm, logoUrl: e.target.value })}
                  placeholder="/assets/aistudio/..."
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Official Business Name</label>
                <input
                  type="text"
                  value={warehouseForm.name}
                  onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Official Contact Number</label>
                <input
                  type="text"
                  value={warehouseForm.contactNumber}
                  onChange={e => setWarehouseForm({ ...warehouseForm, contactNumber: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                />
              </div>

              {/* UPI ID for PhonePe & Google Pay */}
              <div>
                <label className="text-neutral-700 block mb-1 font-bold">
                  Merchant UPI ID (for PhonePe & Google Pay)
                </label>
                <input
                  type="text"
                  value={warehouseForm.upiId || '7892566419@ybl'}
                  onChange={e => setWarehouseForm({ ...warehouseForm, upiId: e.target.value })}
                  placeholder="7892566419@ybl or 7892566419@upi"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono font-bold"
                />
                <p className="text-[10px] text-neutral-500 mt-1">This VPA receives all PhonePe & Google Pay customer payments.</p>
              </div>

              {/* Owner notification phone */}
              <div>
                <label className="text-neutral-700 block mb-1 font-bold">
                  Owner Mobile for WhatsApp & SMS Alerts
                </label>
                <input
                  type="text"
                  value={warehouseForm.notificationPhone || '7892566419'}
                  onChange={e => setWarehouseForm({ ...warehouseForm, notificationPhone: e.target.value })}
                  placeholder="7892566419"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                />
                <p className="text-[10px] text-neutral-500 mt-1">Instant order alerts are directed to this number.</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-neutral-700 block mb-1 font-bold">Warehouse Physical Address in Mysuru</label>
                <input
                  type="text"
                  value={warehouseForm.address}
                  onChange={e => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-[#111827] text-white font-black text-xs hover:bg-black flex items-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Business & Payment Settings</span>
            </button>
          </form>
        )}
      </div>

      {/* VIEW ORDER DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 my-auto text-neutral-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-neutral-900">{viewingOrder.orderNumber}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    viewingOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {viewingOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">Booked on {new Date(viewingOrder.createdAt).toLocaleString()}</p>
              </div>

              <button onClick={() => setViewingOrder(null)} className="p-1 rounded-lg text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <h4 className="font-bold text-neutral-500 uppercase text-[10px]">Customer Details</h4>
                <p className="font-black text-neutral-900">{viewingOrder.customerName}</p>
                <p className="font-mono text-neutral-700">📞 +91 {viewingOrder.customerPhone}</p>
                <div className="flex gap-2 pt-1">
                  <a href={`tel:${viewingOrder.customerPhone}`} className="text-[#B48C14] font-bold hover:underline">
                    Call Customer →
                  </a>
                  <a
                    href={`https://wa.me/91${viewingOrder.customerPhone.replace(/[^0-9]/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    WhatsApp →
                  </a>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <h4 className="font-bold text-neutral-500 uppercase text-[10px]">Delivery Destination</h4>
                <p className="font-bold text-neutral-900">{viewingOrder.deliveryAddress?.houseNumber}, {viewingOrder.deliveryAddress?.landmark}</p>
                <p className="text-neutral-600">{viewingOrder.deliveryAddress?.area}, Mysuru - {viewingOrder.deliveryAddress?.pincode}</p>
                <p className="text-emerald-700 font-bold text-[11px]">📍 Distance: {viewingOrder.deliveryDistanceKm} km (~{viewingOrder.estimatedDeliveryMins || 20} mins)</p>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
              <div className="p-3 bg-[#FAF7EE] border-b border-amber-200/60 font-black text-neutral-900 flex justify-between">
                <span>Ordered Products ({viewingOrder.items?.length || 0})</span>
                <span>Total Amount</span>
              </div>
              <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                {viewingOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-neutral-900">{it.quantity}x {it.product?.name}</p>
                      <p className="text-[11px] text-neutral-500">{it.product?.weight} · Unit Price: {formatINR(it.unitPrice || it.product?.discountPrice || 0)}</p>
                    </div>
                    <span className="font-black text-neutral-900">{formatINR(it.totalPrice || it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-neutral-50 border-t border-neutral-200 space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatINR(viewingOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span>{viewingOrder.deliveryFee === 0 ? 'FREE' : formatINR(viewingOrder.deliveryFee)}</span>
                </div>
                {viewingOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon ({viewingOrder.couponCode})</span>
                    <span>-{formatINR(viewingOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>Total Paid (via {viewingOrder.paymentMethod?.toUpperCase() || 'UPI'})</span>
                  <span className="text-[#B48C14]">{formatINR(viewingOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <a
                href={createOwnerWhatsAppLink(viewingOrder, warehouse.notificationPhone || '7892566419')}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Alert to 7892566419</span>
              </a>

              <button
                onClick={() => {
                  setSelectedOrderForInvoice(viewingOrder);
                  setViewingOrder(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-[#111827] text-white font-black text-xs hover:bg-black"
              >
                Download / Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 my-auto text-neutral-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-black text-neutral-900">Edit Booking: {editingOrder.orderNumber}</h3>
              <button onClick={() => setEditingOrder(null)} className="p-1 rounded-lg text-neutral-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-700 font-bold block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={e => setEditCustomerName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-neutral-700 font-bold block mb-1">Customer Phone Number</label>
                  <input
                    type="text"
                    value={editCustomerPhone}
                    onChange={e => setEditCustomerPhone(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-700 font-bold block mb-1">Mysuru Delivery Area</label>
                  <input
                    type="text"
                    value={editAddressArea}
                    onChange={e => setEditAddressArea(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-neutral-700 font-bold block mb-1">House # & Landmark</label>
                  <input
                    type="text"
                    value={editAddressDetails}
                    onChange={e => setEditAddressDetails(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-700 font-bold block mb-1">Assign Delivery Rider</label>
                  <select
                    value={editRiderId}
                    onChange={e => setEditRiderId(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                  >
                    <option value="">No rider assigned</option>
                    {deliveryPartners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.vehicleNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-700 font-bold block mb-1">Estimated Delivery Time (mins)</label>
                  <input
                    type="number"
                    value={editEstimatedMins}
                    onChange={e => setEditEstimatedMins(Number(e.target.value))}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-700 font-bold block mb-1">Admin / Store Internal Notes</label>
                <textarea
                  value={editAdminNotes}
                  onChange={e => setEditAdminNotes(e.target.value)}
                  placeholder="e.g. Customer requested call upon arrival at front gate"
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold border border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#111827] text-white font-black hover:bg-black"
                >
                  Save & Sync to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 my-auto text-neutral-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">Cancel Booking</h3>
                <p className="text-xs text-neutral-500">Order #{cancellingOrder.orderNumber}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Cancelling this booking will mark the order as <strong>CANCELLED</strong> in both the local database and your Supabase cloud tables, release the assigned rider, and return items to available inventory.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-neutral-700 font-bold block">Select Cancellation Reason:</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
              >
                <option value="Customer requested cancellation">Customer requested cancellation</option>
                <option value="Delivery address exceeds 20 km warehouse limit">Delivery address exceeds 20 km warehouse limit</option>
                <option value="Ordered fitness supplements temporarily out of stock">Ordered fitness supplements temporarily out of stock</option>
                <option value="Customer unreachable on phone number">Customer unreachable on phone number</option>
                <option value="UPI Payment unverified or disputed">UPI Payment unverified or disputed</option>
                <option value="Store closing / Weather delay in Mysuru">Store closing / Weather delay in Mysuru</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="w-1/2 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/ADD PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 my-auto text-neutral-900">
            <h3 className="text-base font-black text-neutral-900 mb-3">
              {editingProduct.id ? 'Edit Product' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-700 block mb-1 font-bold">Category</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={e => {
                      const cat = categories.find(c => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categoryName: cat?.name || 'FITNESS'
                      });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-700 block mb-1 font-bold">Weight / Pack Size</label>
                  <input
                    type="text"
                    value={editingProduct.weight || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                    placeholder="e.g. 1 kg / 500g"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-700 block mb-1 font-bold">Regular MRP (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-neutral-700 block mb-1 font-bold">Discount Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, discountPrice: Number(e.target.value) })}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                  />
                </div>

                <div>
                  <label className="text-neutral-700 block mb-1 font-bold">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-700 block mb-1 font-bold">Product Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold border border-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#111827] text-white font-black hover:bg-black"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
