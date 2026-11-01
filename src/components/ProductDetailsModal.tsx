import React, { useState } from 'react';
import { X, Star, Truck, Film, Calendar, Flame, Plus, Minus, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';

export const ProductDetailsModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    cart,
    addToCart,
    updateQuantity,
    setIsCheckoutModalOpen,
    wishlist,
    toggleWishlist,
    deliveryInfo
  } = useApp();

  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      name: 'Ravi Teja (Kuvempunagar, Mysuru)',
      rating: 5,
      date: '2 days ago',
      comment: 'Authentic quality product delivered within 18 minutes! Impressed by the packaging and fresh taste.',
      verified: true
    },
    {
      id: 'rev-2',
      name: 'Kavitha S. (Gokulam)',
      rating: 5,
      date: 'Last week',
      comment: 'Very fresh seeds and nuts, great texture and high protein content. Best fitness delivery in Mysuru.',
      verified: true
    }
  ]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!selectedProduct) return null;

  const cartItem = cart.find(item => item.product.id === selectedProduct.id);
  const isWishlisted = wishlist.includes(selectedProduct.id);
  const discountPercent = Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setReviews([
      {
        id: `rev-${Date.now()}`,
        name: 'You (Mysuru)',
        rating: newReviewRating,
        date: 'Just now',
        comment: newReviewText.trim(),
        verified: true
      },
      ...reviews
    ]);
    setNewReviewText('');
    setShowReviewForm(false);
  };

  const handleBuyNow = () => {
    if (!cartItem) {
      addToCart(selectedProduct, 1);
    }
    setSelectedProduct(null);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white border border-neutral-200 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col md:flex-row overflow-hidden shadow-2xl my-auto text-neutral-900">
        {/* Close button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors shadow-md border border-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Media Gallery & Demonstration Video */}
        <div className="w-full md:w-1/2 bg-[#F8F6F0] flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200">
          <div className="relative aspect-[4/3] sm:aspect-square bg-[#F8F6F0] overflow-hidden flex items-center justify-center">
            {activeMedia === 'video' && selectedProduct.videoUrl ? (
              <video
                src={selectedProduct.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
                poster={selectedProduct.images[0]}
              />
            ) : (
              <img
                src={selectedProduct.images[selectedImageIdx] || selectedProduct.images[0]}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}

            {/* Wishlist button */}
            <button
              onClick={() => toggleWishlist(selectedProduct.id)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-neutral-700 hover:text-red-500 transition-colors z-10 border border-neutral-200"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Media Switcher: Multi-images + Video Preview button */}
          <div className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2 overflow-x-auto">
            {selectedProduct.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImageIdx(idx);
                  setActiveMedia('image');
                }}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  activeMedia === 'image' && selectedImageIdx === idx
                    ? 'border-[#D4AF37] scale-105 shadow-xs'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}

            {selectedProduct.videoUrl && (
              <button
                onClick={() => setActiveMedia('video')}
                className={`h-14 px-3 rounded-xl border-2 flex items-center gap-2 text-xs font-bold shrink-0 transition-all ${
                  activeMedia === 'video'
                    ? 'border-[#D4AF37] bg-[#FAF7EE] text-[#B48C14]'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-black'
                }`}
              >
                <Film className="w-4 h-4 text-[#B48C14]" />
                <span>Watch Video</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Product Specs & Sticky Buy Module */}
        <div className="w-full md:w-1/2 flex flex-col justify-between max-h-[85vh] md:max-h-[94vh] bg-white">
          <div className="p-5 md:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Category and Product ID */}
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="uppercase tracking-widest font-extrabold text-[#B48C14]">
                {selectedProduct.categoryName}
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">ID: {selectedProduct.id}</span>
            </div>

            {/* Title & Weight */}
            <div>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight">
                {selectedProduct.name}
              </h2>
              <p className="text-sm text-neutral-600 mt-1 font-semibold">Pack size: {selectedProduct.weight}</p>
            </div>

            {/* Pricing & Discount */}
            <div className="flex items-baseline gap-3 p-3.5 rounded-2xl bg-[#FBF9F5] border border-neutral-200">
              <span className="text-2xl font-black text-neutral-900 tabular-nums">
                {formatINR(selectedProduct.discountPrice)}
              </span>
              {selectedProduct.price > selectedProduct.discountPrice && (
                <>
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    {formatINR(selectedProduct.price)}
                  </span>
                  <span className="text-xs font-black text-black bg-[#D4AF37] px-2 py-0.5 rounded-md">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Delivery Guarantee Strip */}
            <div className="flex items-center gap-2.5 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <Truck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Delivering in <strong>~{deliveryInfo.estimatedTimeMins} mins</strong> across Mysuru from Saraswathipuram
              </span>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Product Description</h4>
              <p className="text-xs text-neutral-700 leading-relaxed">{selectedProduct.description}</p>
            </div>

            {/* Nutritional Breakdown Table */}
            {selectedProduct.nutritionalInfo && (
              <div className="bg-[#FAF7EE] rounded-2xl p-3.5 border border-amber-200/60">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#9A7B1C] mb-2.5">
                  <Flame className="w-3.5 h-3.5 text-[#B48C14]" />
                  <span>NUTRITIONAL INFORMATION (Per Serving)</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-amber-200/50 shadow-2xs">
                    <p className="text-[10px] text-neutral-500 font-bold">PROTEIN</p>
                    <p className="font-extrabold text-neutral-900 mt-0.5">{selectedProduct.nutritionalInfo.protein}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200/50 shadow-2xs">
                    <p className="text-[10px] text-neutral-500 font-bold">CALORIES</p>
                    <p className="font-extrabold text-neutral-900 mt-0.5">{selectedProduct.nutritionalInfo.calories}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200/50 shadow-2xs">
                    <p className="text-[10px] text-neutral-500 font-bold">CARBS</p>
                    <p className="font-extrabold text-neutral-900 mt-0.5">{selectedProduct.nutritionalInfo.carbs}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-amber-200/50 shadow-2xs">
                    <p className="text-[10px] text-neutral-500 font-bold">FATS</p>
                    <p className="font-extrabold text-neutral-900 mt-0.5">{selectedProduct.nutritionalInfo.fats}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients & Expiry */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-neutral-700">Ingredients: </span>
                <span className="text-neutral-600">{selectedProduct.ingredients}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#B48C14]" />
                <span className="font-bold text-neutral-700">Expiry Date: </span>
                <span className="text-neutral-900 font-bold">{selectedProduct.expiryDate}</span>
                <span className="text-neutral-300">·</span>
                <span className="text-emerald-700 font-bold">In Stock ({selectedProduct.stock} units)</span>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-neutral-900 text-xs">{selectedProduct.rating} / 5</span>
                  <span className="text-neutral-500 text-xs">({reviews.length} Verified Reviews)</span>
                </div>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-xs text-[#B48C14] font-bold hover:underline"
                >
                  {showReviewForm ? 'Cancel' : '+ Write Review'}
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} className="mb-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-700 font-semibold">Rating:</label>
                    <select
                      value={newReviewRating}
                      onChange={e => setNewReviewRating(Number(e.target.value))}
                      className="bg-white text-neutral-900 text-xs p-1 rounded border border-neutral-300"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                    </select>
                  </div>
                  <textarea
                    value={newReviewText}
                    onChange={e => setNewReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={2}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#111827] text-white text-xs font-bold rounded hover:bg-black"
                  >
                    Submit Review
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900">{rev.name}</span>
                      <span className="text-[10px] text-neutral-400">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 my-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-neutral-700 mt-1">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Purchase Bar */}
          <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {cartItem ? (
                <div className="flex items-center bg-[#111827] text-white rounded-xl p-1 font-bold text-xs shadow-xs">
                  <button
                    onClick={() => updateQuantity(selectedProduct.id, cartItem.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="w-8 text-center text-sm font-black tabular-nums text-[#D4AF37]">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateQuantity(selectedProduct.id, cartItem.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(selectedProduct, 1)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-extrabold text-xs border border-neutral-300 transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5B842] text-black font-black text-xs shadow-md shadow-[#D4AF37]/20 hover:brightness-105 active:scale-95 transition-all text-center uppercase tracking-wider"
            >
              Buy Now · {formatINR(selectedProduct.discountPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
