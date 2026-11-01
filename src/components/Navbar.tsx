import React from 'react';
import { MapPin, ShoppingBag, User as UserIcon, Search, ShieldCheck, Bike, Clock, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Logo } from './Logo.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';

export const Navbar: React.FC = () => {
  const {
    currentAddress,
    setIsLocationModalOpen,
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    user,
    setIsAuthModalOpen,
    activeRole,
    setActiveRole,
    activeOrder,
    deliveryInfo,
    searchQuery,
    setSearchQuery
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      {/* Top micro bar for portal switching & direct warehouse phone */}
      <div className="bg-[#FAF7EE] border-b border-amber-200/40 px-4 py-1.5 text-xs text-neutral-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-neutral-900 font-semibold">Fast Delivery Across Mysuru City</span>
            <span className="hidden sm:inline text-neutral-400">·</span>
            <span className="hidden sm:inline text-neutral-700">
              Helpline: <a href="tel:7892566419" className="text-[#B48C14] font-bold hover:underline">7892566419</a>
            </span>
          </div>

          {/* Quick Role Switcher for testing and demonstration */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-200 shadow-2xs">
            <button
              onClick={() => setActiveRole('customer')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                activeRole === 'customer'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Shop
            </button>
            <button
              onClick={() => setActiveRole('admin')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                activeRole === 'admin'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
              Admin
            </button>
            <button
              onClick={() => setActiveRole('rider')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                activeRole === 'rider'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Bike className="w-3 h-3 text-[#D4AF37]" />
              Rider
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Zone 1: Official Brand Logo & Deliver-to */}
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => setActiveRole('customer')} className="text-left focus:outline-none">
              <Logo size="md" showSubtitle={true} />
            </button>

            {/* Deliver to Location Picker Button */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-[#D4AF37] hover:bg-[#FAF7EE] transition-colors text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#FAF7EE] border border-amber-200/60 flex items-center justify-center text-[#B48C14] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#B48C14] uppercase tracking-wider">
                  <span>Deliver in {deliveryInfo.estimatedTimeMins} mins</span>
                  <ChevronDown className="w-3 h-3 text-neutral-500 group-hover:text-black transition-colors" />
                </div>
                <span className="text-xs font-bold text-neutral-900 truncate max-w-[150px]">
                  {currentAddress.area || currentAddress.city}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Instant Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-2">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search "Whey Protein", "Chia Seeds", "Makhana", "Dark Chocolate"...'
                className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-neutral-500 hover:text-black bg-neutral-200 px-2 py-0.5 rounded-md font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Order Tracking Quick Button */}
            {activeOrder && activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  setActiveRole('customer');
                  const el = document.getElementById('live-order-tracker');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold animate-pulse"
              >
                <Clock className="w-3.5 h-3.5 text-[#B48C14]" />
                <span>Live Order: {activeOrder.status.replace(/_/g, ' ')}</span>
              </button>
            )}

            {/* Auth / Profile button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-neutral-800 text-xs font-bold transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[#B48C14]" />
              <span className="hidden sm:inline">
                {user ? user.name.split(' ')[0] : 'Login'}
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#111827] text-white font-bold text-xs shadow-md shadow-neutral-900/10 hover:bg-black active:scale-95 transition-all"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] leading-tight text-neutral-400 uppercase tracking-wider font-extrabold">My Cart</span>
                <span className="text-xs leading-none font-black text-white">{cartCount > 0 ? formatINR(cartSubtotal) : 'Empty'}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Location & Search Row */}
        <div className="mt-2.5 flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 text-xs text-neutral-800"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B48C14]" />
              <span className="font-bold text-neutral-900">{currentAddress.area || 'Mysuru'}</span>
              <span className="text-neutral-500">· {deliveryInfo.estimatedTimeMins} mins</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <span className="text-[11px] text-[#B48C14] font-bold">
              Within 20 km of Mysuru
            </span>
          </div>

          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search protein, seeds, dry fruits, snacks..."
              className="w-full bg-neutral-100 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:border-[#D4AF37]"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
