export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_ACCEPTED'
  | 'PREPARING_ORDER'
  | 'ORDER_PACKED'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'APPROACHING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  discountPrice: number;
  description: string;
  weight: string;
  ingredients: string;
  nutritionalInfo: {
    protein: string;
    calories: string;
    carbs: string;
    fats: string;
    fiber?: string;
  };
  expiryDate: string;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  videoUrl?: string;
  tags: string[];
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  itemCount: number;
}

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Gym' | 'Other';
  recipientName: string;
  phone: string;
  houseNumber: string;
  landmark: string;
  area: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  isVerified: boolean;
  addresses: Address[];
}

export interface DistanceSlab {
  minKm: number;
  maxKm: number;
  charge: number;
}

export interface WarehouseConfig {
  name: string;
  address: string;
  lat: number;
  lng: number;
  maxDeliveryRadiusKm: number;
  freeDeliveryThreshold: number;
  distanceSlabs: DistanceSlab[];
  contactNumber: string;
  workingHours: string;
  codEnabled: boolean;
  logoUrl?: string;
  upiId?: string;
  notificationPhone?: string;
  soundAlertsEnabled?: boolean;
  supabaseProjectId?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  status: 'available' | 'on_delivery' | 'offline';
  currentLat: number;
  currentLng: number;
  assignedOrderId?: string;
  rating: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: Address;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  deliveryDistanceKm: number;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    currentLat: number;
    currentLng: number;
    lastUpdated: string;
  };
  cancellationReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryMins: number;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrderValue: number;
  description: string;
  validUntil: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedBuyer: boolean;
}
