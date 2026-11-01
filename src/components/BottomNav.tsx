import React from 'react';
import { Home, Grid, Search, ShoppingBag, User } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface BottomNavProps {
  activeTab: 'home' | 'categories' | 'search' | 'cart' | 'profile';
  setActiveTab: (tab: 'home' | 'categories' | 'search' | 'cart' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { cartCount, setIsCartOpen, setIsAuthModalOpen, setSelectedCategory, setActiveRole } = useApp();

  const handleTabClick = (tab: 'home' | 'categories' | 'search' | 'cart' | 'profile') => {
    setActiveRole('customer');
    setActiveTab(tab);
    if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'profile') {
      setIsAuthModalOpen(true);
    } else if (tab === 'categories') {
      const el = document.getElementById('categories-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'home') {
      setSelectedCategory('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-1.5 md:hidden shadow-lg">
      <div className="flex items-center justify-around">
        {/* HOME */}
        <button
          onClick={() => handleTabClick('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'home' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-black tracking-tight">HOME</span>
        </button>

        {/* CATEGORIES */}
        <button
          onClick={() => handleTabClick('categories')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'categories' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-black tracking-tight">CATEGORIES</span>
        </button>

        {/* SEARCH */}
        <button
          onClick={() => handleTabClick('search')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'search' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-black tracking-tight">SEARCH</span>
        </button>

        {/* CART */}
        <button
          onClick={() => handleTabClick('cart')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'cart' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#D4AF37] text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black tracking-tight">CART</span>
        </button>

        {/* PROFILE */}
        <button
          onClick={() => handleTabClick('profile')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'profile' ? 'text-[#B48C14]' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-black tracking-tight">PROFILE</span>
        </button>
      </div>
    </nav>
  );
};
