import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Address, CartItem, Order, WarehouseConfig, User } from '../types/index.ts';
import { calculateDistanceKm } from '../utils/mysuruLocations.ts';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  currentAddress: Address;
  setCurrentAddress: (addr: Address) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartMrpTotal: number;
  cartSavings: number;
  warehouse: WarehouseConfig;
  updateWarehouseConfig: (config: Partial<WarehouseConfig>) => Promise<void>;
  deliveryInfo: {
    isDeliverable: boolean;
    distanceKm: number;
    fee: number;
    isFreeDelivery: boolean;
    estimatedTimeMins: number;
    message?: string;
  };
  appliedCoupon: { code: string; discount: number; description: string } | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  activeRole: 'customer' | 'admin' | 'rider';
  setActiveRole: (role: 'customer' | 'admin' | 'rider') => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  selectedOrderForInvoice: Order | null;
  setSelectedOrderForInvoice: (o: Order | null) => void;
  loginUser: (user: User) => void;
  logoutUser: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: Category[];
  products: Product[];
  refreshProducts: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
}

const DEFAULT_ADDRESS: Address = {
  id: 'addr-default-mysuru',
  type: 'Home',
  recipientName: 'Nandita N.',
  phone: '7892566419',
  houseNumber: '#34, 4th Main, 12th Cross',
  landmark: 'Near Kamakshi Hospital Circle',
  area: 'Kuvempunagar',
  city: 'Mysuru',
  pincode: '570023',
  lat: 12.2895,
  lng: 76.6265,
  isDefault: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('snt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentAddress, setCurrentAddress] = useState<Address>(() => {
    try {
      const saved = localStorage.getItem('snt_address');
      return saved ? JSON.parse(saved) : DEFAULT_ADDRESS;
    } catch {
      return DEFAULT_ADDRESS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('snt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [warehouse, setWarehouse] = useState<WarehouseConfig>({
    name: 'SHIVANANDI TRADERS Central Warehouse',
    address: 'Plot #42, Industrial Area, Saraswathipuram / Kuvempunagar, Mysuru, Karnataka 570009',
    lat: 12.3015,
    lng: 76.6380,
    maxDeliveryRadiusKm: 20,
    freeDeliveryThreshold: 799,
    distanceSlabs: [
      { minKm: 0, maxKm: 3, charge: 25 },
      { minKm: 3, maxKm: 7, charge: 45 },
      { minKm: 7, maxKm: 12, charge: 75 },
      { minKm: 12, maxKm: 20, charge: 120 }
    ],
    contactNumber: '7892566419',
    workingHours: '06:00 AM - 11:30 PM',
    codEnabled: false
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeRole, setActiveRole] = useState<'customer' | 'admin' | 'rider'>('customer');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('snt_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load initial backend state
  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const refreshCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  const refreshConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        setWarehouse(data.data);
      }
    } catch (e) {
      console.error('Failed to load warehouse config:', e);
    }
  };

  const refreshOrders = async () => {
    try {
      const url = user?.phone ? `/api/orders?phone=${user.phone}` : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        if (data.data.length > 0 && !activeOrder) {
          // Find any active delivering order
          const active = data.data.find((o: Order) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
          if (active) setActiveOrder(active);
        }
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshCategories();
    refreshConfig();
    refreshOrders();
  }, []);

  useEffect(() => {
    if (user?.phone) {
      refreshOrders();
    }
  }, [user?.phone]);

  // Save Cart & Address to localStorage
  useEffect(() => {
    localStorage.setItem('snt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('snt_address', JSON.stringify(currentAddress));
  }, [currentAddress]);

  useEffect(() => {
    localStorage.setItem('snt_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Cart totals
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.discountPrice * item.quantity, 0);
  const cartMrpTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartSavings = cartMrpTotal - cartSubtotal;

  // Delivery calculation based on warehouse GPS & current address
  const distanceKm = calculateDistanceKm(
    warehouse.lat,
    warehouse.lng,
    currentAddress.lat,
    currentAddress.lng
  );

  const isDeliverable = distanceKm <= warehouse.maxDeliveryRadiusKm;
  let deliveryFee = 0;
  let isFreeDelivery = false;

  if (isDeliverable) {
    if (cartSubtotal >= warehouse.freeDeliveryThreshold) {
      deliveryFee = 0;
      isFreeDelivery = true;
    } else {
      const slab = warehouse.distanceSlabs.find(s => distanceKm >= s.minKm && distanceKm < s.maxKm);
      deliveryFee = slab ? slab.charge : (distanceKm <= 3 ? 25 : distanceKm <= 7 ? 45 : distanceKm <= 12 ? 75 : 120);
    }
  }

  const estimatedTimeMins = Math.max(14, Math.round(12 + distanceKm * 2.5));

  const deliveryInfo = {
    isDeliverable,
    distanceKm,
    fee: deliveryFee,
    isFreeDelivery,
    estimatedTimeMins,
    message: !isDeliverable
      ? `Address is ${distanceKm} km away. We currently deliver up to ${warehouse.maxDeliveryRadiusKm} km from Mysuru warehouse.`
      : undefined
  };

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon action
  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal: cartSubtotal,
          deliveryFee: deliveryInfo.fee
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        return { success: true, message: `Coupon ${code.toUpperCase()} applied! Saved ₹${data.data.discount}` };
      } else {
        return { success: false, message: data.message || 'Failed to apply coupon' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error applying coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const updateWarehouseConfig = async (config: Partial<WarehouseConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setWarehouse(data.data);
      }
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  };

  const loginUser = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('snt_user', JSON.stringify(loggedInUser));
    if (loggedInUser.addresses && loggedInUser.addresses.length > 0) {
      setCurrentAddress(loggedInUser.addresses[0]);
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('snt_user');
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        currentAddress,
        setCurrentAddress,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartMrpTotal,
        cartSavings,
        warehouse,
        updateWarehouseConfig,
        deliveryInfo,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        activeRole,
        setActiveRole,
        activeOrder,
        setActiveOrder,
        orders,
        refreshOrders,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        selectedProduct,
        setSelectedProduct,
        selectedOrderForInvoice,
        setSelectedOrderForInvoice,
        loginUser,
        logoutUser,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        categories,
        products,
        refreshProducts,
        wishlist,
        toggleWishlist
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
