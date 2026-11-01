/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Flame,
  Dumbbell,
  Gift,
  ChevronRight,
  PhoneCall,
  MessageCircle,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailsModal } from './components/ProductDetailsModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { LocationModal } from './components/LocationModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LiveTrackingView } from './components/LiveTrackingView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { DeliveryPartnerDashboard } from './components/DeliveryPartnerDashboard.tsx';
import { InvoiceModal } from './components/InvoiceModal.tsx';
import { Logo } from './components/Logo.tsx';
import { formatINR } from './utils/mysuruLocations.ts';

const StorefrontContent: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    cartSubtotal,
    cartCount,
    setIsCartOpen,
    warehouse,
    activeOrder,
    deliveryInfo
  } = useApp();

  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'categories' | 'search' | 'cart' | 'profile'>('home');
  const [activeFilterTag, setActiveFilterTag] = useState<string>('All');
  const [priceSort, setPriceSort] = useState<'default' | 'low-high' | 'high-low'>('default');

  // Filtered Products
  let displayedProducts = [...products];

  if (selectedCategory !== 'all') {
    displayedProducts = displayedProducts.filter(p => p.categoryId === selectedCategory);
  }

  if (activeFilterTag !== 'All') {
    displayedProducts = displayedProducts.filter(p => p.tags.includes(activeFilterTag));
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    displayedProducts = displayedProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (priceSort === 'low-high') {
    displayedProducts.sort((a, b) => a.discountPrice - b.discountPrice);
  } else if (priceSort === 'high-low') {
    displayedProducts.sort((a, b) => b.discountPrice - a.discountPrice);
  }

  // Curated collections
  const bestSellers = products.filter(p => p.tags.includes('Bestseller'));
  const gymEssentials = products.filter(p => p.tags.includes('Gym Essential'));

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-neutral-900 pb-28 md:pb-16 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Live Tracking Sticky Strip (if an active order is on its way!) */}
        {activeOrder && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED' && (
          <div className="bg-[#FAF7EE] border-b border-amber-300 py-2.5 px-4 text-xs shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="font-black text-neutral-900">Active Delivery in Progress</span>
                <span className="text-neutral-500 hidden sm:inline">· Order {activeOrder.orderNumber}</span>
                <span className="text-[#B48C14] font-extrabold">({activeOrder.status.replace(/_/g, ' ')})</span>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('live-order-tracker');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3 py-1 bg-[#111827] text-white font-bold rounded-lg hover:bg-black flex items-center gap-1 text-[11px] shadow-xs"
              >
                <span>Track Map</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-8">
          {/* 1. HERO PROMOTIONAL BANNER */}
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-lg">
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[380px] overflow-hidden">
              <img
                src="/src/assets/images/hero_shivanandi_delivery_1793517246862.jpg"
                alt="Shivanandi Traders Fast Delivery"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

              <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-end max-w-2xl text-white">
                <div className="flex items-center gap-2 text-xs font-black text-[#D4AF37] tracking-wider uppercase mb-1">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Delivering in ~{deliveryInfo.estimatedTimeMins} Minutes Across Mysuru</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                  Pure Fitness Fuel & Healthy Dry Fruits At Your Doorstep
                </h1>
                <p className="text-xs sm:text-sm text-neutral-200 mt-2 line-clamp-2 max-w-xl font-medium">
                  Imported Whey Protein, Raw Organic Seeds, Artisan Chocolates & Gym Shakers from our Saraswathipuram Central Warehouse.
                </p>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => {
                      const el = document.getElementById('products-grid');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5B842] text-black font-black text-xs shadow-lg hover:brightness-105 active:scale-95 transition-all uppercase tracking-wider"
                  >
                    Explore Catalog
                  </button>
                  <span className="text-xs font-semibold text-neutral-300 hidden sm:inline">
                    Free delivery on orders over {formatINR(warehouse.freeDeliveryThreshold)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. FREE DELIVERY OFFERS STRIP */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7EE] border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-[#B48C14] shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-neutral-900 text-sm">
                  Free Delivery on Orders Above {formatINR(warehouse.freeDeliveryThreshold)}
                </p>
                <p className="text-neutral-600 text-[11px] font-medium">
                  Use promo coupon <strong className="text-[#9A7B1C]">WELCOME50</strong> for ₹50 OFF or <strong className="text-[#9A7B1C]">FITMYSURU</strong> for 15% OFF!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-600 font-medium">Warehouse: Saraswathipuram</span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Within 20 km Guaranteed
              </span>
            </div>
          </div>

          {/* 3. SHOP BY CATEGORIES (Blinkit style horizontally scrollable cards) */}
          <section id="categories-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">Shop By Category</h2>
                <p className="text-xs text-neutral-500 font-medium">Fast grocery & fitness categories in Mysuru</p>
              </div>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`text-xs font-bold transition-colors ${
                  selectedCategory === 'all' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-black'
                }`}
              >
                View All Categories
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex flex-col items-center justify-center w-28 h-28 rounded-2xl p-2 shrink-0 border transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#FAF7EE] border-[#D4AF37] text-neutral-900 shadow-md ring-1 ring-[#D4AF37]'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-xl mb-1.5 shadow-2xs">
                  ✨
                </div>
                <span className="text-[11px] font-black text-center leading-tight">All Items</span>
                <span className="text-[9px] text-neutral-500 font-bold mt-0.5">{products.length} Products</span>
              </button>

              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`group flex flex-col items-center justify-between w-28 h-28 rounded-2xl p-2 shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-[#FAF7EE] border-[#D4AF37] text-neutral-900 shadow-md ring-1 ring-[#D4AF37]'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 shadow-2xs">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-black text-center line-clamp-2 leading-tight">
                      {cat.name}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-bold">{cat.itemCount} Items</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. BEST SELLERS CAROUSEL */}
          {bestSellers.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-lg font-black text-neutral-900 tracking-tight">Best Sellers in Mysuru</h2>
                </div>
                <span className="text-xs text-neutral-500 font-medium">Most ordered fitness items</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {bestSellers.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 5. GYM ESSENTIALS SPOTLIGHT */}
          {gymEssentials.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-neutral-900" />
                  <h2 className="text-lg font-black text-neutral-900 tracking-tight">Gym & Workout Essentials</h2>
                </div>
                <span className="text-xs text-neutral-500 font-medium">High performance nutrition & gear</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {gymEssentials.slice(0, 4).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* 6. MAIN PRODUCT BROWSER & FILTER BAR */}
          <section id="products-grid" className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                  {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  Showing {displayedProducts.length} items available for fast delivery
                </p>
              </div>

              {/* Price Sort controls */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={priceSort}
                  onChange={e => setPriceSort(e.target.value as any)}
                  className="bg-white border border-neutral-300 text-neutral-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] font-semibold shadow-2xs"
                >
                  <option value="default">Sort by: Recommended</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Tag Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['All', 'Bestseller', 'Gym Essential', 'Trending', 'Special Offer', 'Daily Essential'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveFilterTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeFilterTag === tag
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            {displayedProducts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-neutral-200 space-y-3 shadow-xs">
                <p className="text-base font-black text-neutral-900">No products found matching your search</p>
                <p className="text-xs text-neutral-500">Try searching for "whey", "almonds", "seeds", or "makhana"</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setActiveFilterTag('All');
                  }}
                  className="px-4 py-2 bg-[#111827] text-white font-extrabold text-xs rounded-xl hover:bg-black"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>

          {/* 7. LIVE ORDER TRACKING SECTION (if active order exists) */}
          <LiveTrackingView />

          {/* 8. BULK GYM ORDERS / WHATSAPP SUPPORT BANNER */}
          <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#FAF7EE] via-white to-[#F8F6F0] border border-amber-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-[10px] uppercase font-black text-[#B48C14] tracking-widest">
                Gym Trainers & Bulk Orders
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
                Looking for Wholesale Gym Nutrition in Mysuru?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                We supply Mysore fitness centres, gyms, and sports academies with direct wholesale rates on protein isolate, bulk chia & pumpkin seeds, and peanut butter tubs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="https://wa.me/917892566419?text=Hello%20Shivanandi%20Traders,%20I%20am%20interested%20in%20gym%20bulk%20orders%20in%20Mysuru"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="tel:7892566419"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 font-extrabold text-xs flex items-center justify-center gap-2 border border-neutral-300 transition-all shadow-2xs"
              >
                <PhoneCall className="w-4 h-4 text-[#B48C14]" />
                <span>Call 7892566419</span>
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 bg-[#F1EDE4] border-t border-neutral-200/90 py-8 px-4 text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showSubtitle={false} />
          <p className="text-center sm:text-left text-[11px] font-medium">
            Official Online Fast Delivery Platform for SHIVANANDI TRADERS, Mysuru, Karnataka, India.
          </p>
          <p className="text-[11px] text-neutral-900 font-bold">
            Contact: 7892566419 · Deliveries within 20 km
          </p>
        </div>
      </footer>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav activeTab={activeBottomTab} setActiveTab={setActiveBottomTab} />

      {/* Floating Cart Bar on Mobile when items are in cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 p-3 md:hidden z-30 pointer-events-none">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-[#111827] text-white font-black text-xs shadow-xl flex items-center justify-between pointer-events-auto active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              <span>{cartCount} Items in Cart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-[#D4AF37]">{formatINR(cartSubtotal)}</span>
              <span>· View Cart →</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppRouter />
    </AppProvider>
  );
}

const MainAppRouter: React.FC = () => {
  const { activeRole } = useApp();

  return (
    <>
      {activeRole === 'customer' && <StorefrontContent />}
      {activeRole === 'admin' && <AdminDashboard />}
      {activeRole === 'rider' && <DeliveryPartnerDashboard />}

      {/* Global Modals */}
      <ProductDetailsModal />
      <CartDrawer />
      <CheckoutModal />
      <LocationModal />
      <AuthModal />
      <InvoiceModal />
    </>
  );
};
