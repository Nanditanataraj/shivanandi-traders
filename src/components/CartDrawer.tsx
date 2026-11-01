import React, { useState } from 'react';
import { X, Plus, Minus, ArrowRight, Tag, Truck, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    cartSavings,
    deliveryInfo,
    warehouse,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setIsCheckoutModalOpen,
    setIsLocationModalOpen,
    currentAddress
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponMsg(null);
    const res = await applyCoupon(couponInput.trim());
    setApplying(false);
    setCouponMsg({ text: res.message, isError: !res.success });
    if (res.success) {
      setCouponInput('');
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, cartSubtotal + deliveryInfo.fee - discountAmount);
  const freeDeliveryShortfall = Math.max(0, warehouse.freeDeliveryThreshold - cartSubtotal);

  const handleProceedToCheckout = () => {
    if (!deliveryInfo.isDeliverable) {
      setIsLocationModalOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-neutral-200 flex flex-col shadow-2xl text-neutral-900">
          {/* Header */}
          <div className="p-4 bg-[#FAF7EE] border-b border-amber-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B48C14]" />
              <h3 className="font-black text-neutral-900 text-base">Your Cart</h3>
              <span className="text-xs text-neutral-500 font-bold">({cart.length} items)</span>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-500 hover:text-red-600 transition-colors mr-2 font-semibold"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">Your cart is empty</h4>
              <p className="text-xs text-neutral-500 max-w-xs">
                Explore our whey proteins, dry fruits, roasted seeds, and health snacks delivered across Mysuru!
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#111827] text-white font-extrabold text-xs hover:bg-black"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Delivery Address Bar */}
              <div
                onClick={() => setIsLocationModalOpen(true)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                  deliveryInfo.isDeliverable
                    ? 'bg-neutral-50 border-neutral-200 hover:border-[#D4AF37]'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                    <Truck className="w-3.5 h-3.5 text-[#B48C14]" />
                    <span>Delivering to {currentAddress.area || currentAddress.city}</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {deliveryInfo.isDeliverable
                      ? `${deliveryInfo.distanceKm} km from warehouse · Est. ~${deliveryInfo.estimatedTimeMins} mins`
                      : 'Outside 20 km radius · Click to change'}
                  </p>
                </div>
                <span className="text-xs text-[#B48C14] font-black">Change</span>
              </div>

              {/* Free delivery milestone banner */}
              {freeDeliveryShortfall > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                  <div className="flex justify-between font-bold">
                    <span>Add {formatINR(freeDeliveryShortfall)} more for FREE Delivery</span>
                    <span>{formatINR(cartSubtotal)} / {formatINR(warehouse.freeDeliveryThreshold)}</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#D4AF37] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (cartSubtotal / warehouse.freeDeliveryThreshold) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You've unlocked FREE Delivery across Mysuru!</span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex items-center gap-3"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-neutral-100 shrink-0 border border-neutral-100"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-neutral-500 font-medium">{item.product.weight}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-xs font-black text-neutral-900 tabular-nums">
                          {formatINR(item.product.discountPrice * item.quantity)}
                        </span>
                        {item.product.price > item.product.discountPrice && (
                          <span className="text-[10px] text-neutral-400 line-through tabular-nums">
                            {formatINR(item.product.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl p-0.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-black"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-neutral-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-black"
                        aria-label="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="pt-2">
                {appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#D4AF37] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#B48C14]" />
                      <div>
                        <p className="text-xs font-extrabold text-[#9A7B1C]">
                          COUPON {appliedCoupon.code} APPLIED
                        </p>
                        <p className="text-[11px] text-neutral-600">
                          Saved {formatINR(appliedCoupon.discount)} on your bill
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon (e.g. WELCOME50, FITMYSURU)"
                      className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 uppercase tracking-wider focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                    />
                    <button
                      type="submit"
                      disabled={applying || !couponInput.trim()}
                      className="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                    >
                      {applying ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}

                {couponMsg && (
                  <p className={`text-xs mt-1.5 ${couponMsg.isError ? 'text-red-600' : 'text-emerald-700'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Bill Details Breakdown */}
              <div className="p-4 rounded-2xl bg-[#FAF7EE] border border-amber-200/60 space-y-2 text-xs">
                <h5 className="font-extrabold text-neutral-700 uppercase tracking-wider text-[11px] mb-1">
                  Bill Summary (No Hidden Charges)
                </h5>

                <div className="flex justify-between text-neutral-700">
                  <span>Item Subtotal</span>
                  <span className="font-semibold tabular-nums text-neutral-900">{formatINR(cartSubtotal)}</span>
                </div>

                <div className="flex justify-between text-neutral-700">
                  <span>Delivery Charge ({deliveryInfo.distanceKm} km slab)</span>
                  {deliveryInfo.fee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase">FREE</span>
                  ) : (
                    <span className="font-semibold tabular-nums text-neutral-900">{formatINR(deliveryInfo.fee)}</span>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-[#9A7B1C]">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-semibold tabular-nums">- {formatINR(appliedCoupon.discount)}</span>
                  </div>
                )}

                {cartSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 text-[11px]">
                    <span>Total MRP Savings</span>
                    <span className="font-bold tabular-nums">Saved {formatINR(cartSavings)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-amber-200 flex justify-between text-sm font-black text-neutral-900">
                  <span>To Pay</span>
                  <span className="text-[#B48C14] text-base tabular-nums">{formatINR(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-neutral-200 space-y-2">
              {!deliveryInfo.isDeliverable ? (
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Outside 20 km Limit — Select Mysuru Address</span>
                </button>
              ) : (
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5B842] text-black font-extrabold text-xs shadow-lg shadow-[#D4AF37]/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-between"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-neutral-800">Total Amount</span>
                    <span className="text-sm font-black tabular-nums">{formatINR(finalTotal)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-xs">
                    <span>Proceed to Pay</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
              <p className="text-[10px] text-center text-neutral-400">
                100% Genuine Fitness Nutrition · Mysuru Fast Delivery
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
