import React from 'react';
import { Plus, Minus, Star, Play, Heart } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    cart,
    addToCart,
    updateQuantity,
    setSelectedProduct,
    wishlist,
    toggleWishlist,
    setIsCheckoutModalOpen
  } = useApp();

  const cartItem = cart.find(item => item.product.id === product.id);
  const isWishlisted = wishlist.includes(product.id);
  const discountPercent = Math.round(((product.price - product.discountPrice) / product.price) * 100);

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-neutral-200/90 hover:border-[#D4AF37] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Media Area */}
      <div className="relative w-full aspect-[4/3] bg-[#FBF9F5] overflow-hidden">
        <img
          src={product.images[0] || '/src/assets/images/hero_shivanandi_delivery_1793517246862.jpg'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Wishlist toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-md shadow-xs flex items-center justify-center text-neutral-700 hover:text-red-500 transition-colors"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Video demonstration teaser badge */}
        {product.videoUrl && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-[#D4AF37]">
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>Video Demo</span>
          </div>
        )}

        {/* Discount badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#D4AF37] text-black text-[10px] font-black uppercase tracking-wider shadow-xs">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Metadata line: weight and clean category */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-semibold">
            <span>{product.weight}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate text-neutral-600">{product.categoryName}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 mt-1 group-hover:text-[#B48C14] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Ratings & Stock info */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-600">
            <div className="flex items-center gap-1 text-amber-700 font-bold text-[11px]">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
              <span className="text-neutral-400 font-normal">({product.reviewCount})</span>
            </div>
            {product.stock <= 10 && product.stock > 0 && (
              <>
                <span aria-hidden="true" className="text-neutral-300">·</span>
                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded text-[10px] font-bold">Only {product.stock} left</span>
              </>
            )}
          </div>
        </div>

        {/* Pricing and Cart Stepper */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-neutral-900 tabular-nums">
                {formatINR(product.discountPrice)}
              </span>
              {product.price > product.discountPrice && (
                <span className="text-xs text-neutral-400 line-through tabular-nums">
                  {formatINR(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Add or Stepper */}
          {cartItem ? (
            <div
              onClick={e => e.stopPropagation()}
              className="flex items-center bg-[#111827] text-white rounded-xl p-0.5 shadow-sm font-black text-xs"
            >
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span className="w-6 text-center tabular-nums text-[#D4AF37] font-extrabold">{cartItem.quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => addToCart(product, 1)}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#111827] text-neutral-900 hover:text-white font-extrabold text-xs border border-neutral-300 hover:border-black transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>ADD</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
