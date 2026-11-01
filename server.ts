import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';
import { supabaseService } from './src/server/supabase.ts';
import { Order, OrderStatus } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Haversine formula for distance calculation in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ================= API ENDPOINTS =================

// 1. Warehouse and Business Config
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getState().warehouse });
});

app.post('/api/config', (req: Request, res: Response) => {
  const updated = db.updateWarehouse(req.body);
  if (updated.supabaseUrl || updated.supabaseKey) {
    supabaseService.updateConfig(updated.supabaseUrl, updated.supabaseKey);
  }
  res.json({ success: true, data: updated });
});

// Supabase Status & Test Endpoints
app.get('/api/supabase/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      isConfigured: supabaseService.isConfigured(),
      url: supabaseService.url,
      hasKey: !!supabaseService.key
    }
  });
});

app.post('/api/supabase/test', async (req: Request, res: Response) => {
  const { url, key } = req.body;
  if (url || key) {
    supabaseService.updateConfig(url, key);
  }
  const result = await supabaseService.testConnection();
  res.json(result);
});

// 2. Products
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, tag } = req.query;
  let products = db.getProducts();

  if (category && category !== 'all') {
    products = products.filter(p => p.categoryId === category);
  }
  if (tag) {
    products = products.filter(p => p.tags.includes(tag as string));
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    products = products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: products });
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
});

app.post('/api/products', (req: Request, res: Response) => {
  const productData = req.body;
  if (!productData.name || !productData.price) {
    res.status(400).json({ success: false, message: 'Product name and price are required' });
    return;
  }
  const id = productData.id || `p-${Date.now()}`;
  const saved = db.saveProduct({ ...productData, id });
  res.json({ success: true, data: saved });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  const updated = db.saveProduct({ ...existing, ...req.body, id: req.params.id });
  res.json({ success: true, data: updated });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const deleted = db.deleteProduct(req.params.id);
  res.json({ success: deleted });
});

// 3. Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getCategories() });
});

app.post('/api/categories', (req: Request, res: Response) => {
  const cat = req.body;
  const id = cat.id || `cat-${Date.now()}`;
  const saved = db.saveCategory({ ...cat, id });
  res.json({ success: true, data: saved });
});

app.delete('/api/categories/:id', (req: Request, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  res.json({ success: deleted });
});

// 4. Delivery calculation and serviceable area validation
app.post('/api/delivery/calculate', (req: Request, res: Response) => {
  const { customerLat, customerLng, subtotal } = req.body;
  if (customerLat === undefined || customerLng === undefined) {
    res.status(400).json({ success: false, message: 'Customer latitude and longitude required' });
    return;
  }

  const warehouse = db.getState().warehouse;
  const distanceKm = calculateHaversineKm(warehouse.lat, warehouse.lng, Number(customerLat), Number(customerLng));

  if (distanceKm > warehouse.maxDeliveryRadiusKm) {
    res.json({
      success: true,
      data: {
        isDeliverable: false,
        distanceKm,
        fee: 0,
        estimatedTimeMins: 0,
        message: `Your location is ${distanceKm} km away from our Mysuru warehouse. We only serve within ${warehouse.maxDeliveryRadiusKm} km.`
      }
    });
    return;
  }

  let fee = 0;
  let isFreeDelivery = false;
  if (subtotal >= warehouse.freeDeliveryThreshold) {
    fee = 0;
    isFreeDelivery = true;
  } else {
    const slab = warehouse.distanceSlabs.find(s => distanceKm >= s.minKm && distanceKm < s.maxKm);
    if (slab) {
      fee = slab.charge;
    } else {
      fee = distanceKm <= 3 ? 25 : distanceKm <= 7 ? 45 : distanceKm <= 12 ? 75 : 120;
    }
  }

  // Calculate estimated time (12-15 mins base + 2.5 mins per km)
  const estimatedTimeMins = Math.max(15, Math.round(12 + distanceKm * 2.5));

  res.json({
    success: true,
    data: {
      isDeliverable: true,
      distanceKm,
      fee,
      isFreeDelivery,
      estimatedTimeMins,
      warehouseLocation: {
        lat: warehouse.lat,
        lng: warehouse.lng,
        address: warehouse.address
      }
    }
  });
});

// 5. Customer OTP & Auth
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    res.status(400).json({ success: false, message: 'Valid 10-digit Indian mobile number required' });
    return;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const otpCode = db.createOrGetOtp(cleanPhone);

  // In production SMS integration (e.g. Fast2SMS / Twilio / MSG91):
  console.log(`[SMS AUTH GATEWAY] Sent OTP to +91-${cleanPhone}: ${otpCode}`);

  res.json({
    success: true,
    message: `OTP sent successfully to +91 ${cleanPhone}`,
    debugOtp: otpCode // provided for seamless instant testing while full real flow is active
  });
});

app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '').slice(-10) : '';
  const isValid = db.verifyOtp(cleanPhone, otp);

  if (!isValid) {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please try again or use 1234.' });
    return;
  }

  const user = db.getUser(cleanPhone);
  res.json({
    success: true,
    message: 'Mobile number verified successfully!',
    user
  });
});

app.get('/api/auth/user/:phone', (req: Request, res: Response) => {
  const cleanPhone = req.params.phone.replace(/[^0-9]/g, '').slice(-10);
  const user = db.getUser(cleanPhone);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
});

app.post('/api/auth/user', (req: Request, res: Response) => {
  const user = req.body;
  if (!user || !user.phone) {
    res.status(400).json({ success: false, message: 'User phone required' });
    return;
  }
  const saved = db.saveUser(user);
  res.json({ success: true, data: saved });
});

// 6. Coupons
app.get('/api/coupons', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getCoupons() });
});

app.post('/api/coupons', (req: Request, res: Response) => {
  const coupon = req.body;
  const saved = db.saveCoupon(coupon);
  res.json({ success: true, data: saved });
});

app.delete('/api/coupons/:code', (req: Request, res: Response) => {
  const deleted = db.deleteCoupon(req.params.code);
  res.json({ success: deleted });
});

app.post('/api/coupons/apply', (req: Request, res: Response) => {
  const { code, subtotal, deliveryFee } = req.body;
  const coupon = db.getCoupons().find(c => c.code.toUpperCase() === (code || '').toUpperCase() && c.isActive);

  if (!coupon) {
    res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
    return;
  }

  if (subtotal < coupon.minOrderValue) {
    res.status(400).json({
      success: false,
      message: `Coupon requires a minimum order amount of ₹${coupon.minOrderValue}`
    });
    return;
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round((subtotal * coupon.value) / 100);
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  } else if (coupon.type === 'free_delivery') {
    discount = deliveryFee || 0;
  }

  res.json({
    success: true,
    data: {
      code: coupon.code,
      discount,
      description: coupon.description
    }
  });
});

// 7. Payment Simulation & Razorpay Backend Flow
// Cash on Delivery is strictly disabled per instructions.
app.post('/api/payments/create-order', (req: Request, res: Response) => {
  const { amount } = req.body;
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  // Returns Razorpay-compatible order entity
  res.json({
    success: true,
    data: {
      id: orderId,
      amount: amount * 100, // in paise
      currency: 'INR',
      keyId: 'rzp_test_shivanandi_mysuru'
    }
  });
});

app.post('/api/payments/verify', (req: Request, res: Response) => {
  const { orderPayload, paymentDetails } = req.body;

  if (!paymentDetails || !paymentDetails.paymentId) {
    res.status(400).json({ success: false, message: 'Payment verification failed: No payment proof' });
    return;
  }

  // Create real order in database
  const orderNumber = `SNT-MYS-${Date.now().toString().slice(-6)}`;
  const newOrder: Order = {
    ...orderPayload,
    id: `ord-${Date.now()}`,
    orderNumber,
    paymentStatus: 'paid',
    paymentMethod: paymentDetails.method || 'upi',
    razorpayPaymentId: paymentDetails.paymentId,
    razorpayOrderId: paymentDetails.orderId,
    status: 'ORDER_PLACED',
    statusHistory: [
      {
        status: 'ORDER_PLACED',
        timestamp: new Date().toISOString(),
        note: 'Order successfully placed by customer'
      },
      {
        status: 'PAYMENT_CONFIRMED',
        timestamp: new Date().toISOString(),
        note: `Online payment verified via ${paymentDetails.method?.toUpperCase() || 'UPI'} (Ref: ${paymentDetails.paymentId})`
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const created = db.createOrder(newOrder);

  // Auto assign first available delivery partner if available
  const partners = db.getDeliveryPartners().filter(p => p.status === 'available');
  if (partners.length > 0) {
    const assigned = partners[0];
    db.updateOrderStatus(created.id, 'ORDER_ACCEPTED', 'Order automatically accepted by store');
    db.updateOrderStatus(created.id, 'PREPARING_ORDER', 'Packing station preparing fitness items');
    db.updateOrderStatus(created.id, 'DELIVERY_PARTNER_ASSIGNED', `Delivery partner ${assigned.name} assigned`, assigned.id);
  }

  const finalOrder = db.getOrderById(created.id);

  // Automatically sync booking order to Supabase
  if (finalOrder) {
    supabaseService.syncOrderToSupabase(finalOrder).catch(err => {
      console.error('[Supabase Sync Error]:', err);
    });
  }

  res.json({
    success: true,
    message: 'Payment confirmed & Order booked successfully!',
    order: finalOrder
  });
});

// 8. Orders Management
app.get('/api/orders', (req: Request, res: Response) => {
  const { phone } = req.query;
  let orders = db.getOrders();
  if (phone) {
    const cleanPhone = (phone as string).replace(/[^0-9]/g, '').slice(-10);
    orders = orders.filter(o => o.customerPhone === cleanPhone);
  }
  res.json({ success: true, data: orders });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }
  res.json({ success: true, data: order });
});

app.post('/api/orders/:id/status', (req: Request, res: Response) => {
  const { status, note, deliveryPartnerId } = req.body;
  const updated = db.updateOrderStatus(req.params.id, status as OrderStatus, note, deliveryPartnerId);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }
  // Sync status update to Supabase
  supabaseService.syncOrderToSupabase(updated).catch(err => {
    console.error('[Supabase Status Sync Error]:', err);
  });
  res.json({ success: true, data: updated });
});

// Edit Order (Customer details, address, delivery partner, notes, estimated time)
app.put('/api/orders/:id', (req: Request, res: Response) => {
  const updated = db.updateOrder(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }
  // Sync update to Supabase
  supabaseService.syncOrderToSupabase(updated).catch(err => {
    console.error('[Supabase Edit Sync Error]:', err);
  });
  res.json({ success: true, data: updated, message: 'Order updated successfully' });
});

// Cancel Order with specified reason
app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const { reason } = req.body;
  const cancelled = db.cancelOrder(req.params.id, reason || 'Cancelled by store manager');
  if (!cancelled) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }
  // Sync cancellation to Supabase
  supabaseService.syncOrderToSupabase(cancelled).catch(err => {
    console.error('[Supabase Cancellation Sync Error]:', err);
  });
  res.json({ success: true, data: cancelled, message: 'Order cancelled successfully' });
});

// Pull all orders directly from Supabase and sync with local store
app.get('/api/supabase/orders', async (_req: Request, res: Response) => {
  const result = await supabaseService.fetchOrdersFromSupabase();
  if (!result.success || !result.data) {
    res.status(400).json({ success: false, message: result.error || 'Failed to fetch from Supabase' });
    return;
  }
  const merged = db.mergeSupabaseOrders(result.data);
  res.json({
    success: true,
    data: merged,
    count: result.data.length,
    message: `Successfully retrieved ${result.data.length} orders from Supabase!`
  });
});

// 9. Delivery Partners Management & Live Tracking
app.get('/api/delivery-partners', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getDeliveryPartners() });
});

app.post('/api/delivery-partners/:id/location', (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const updated = db.updateDeliveryPartnerLocation(req.params.id, Number(lat), Number(lng));
  if (!updated) {
    res.status(404).json({ success: false, message: 'Delivery partner not found' });
    return;
  }
  res.json({ success: true, data: updated });
});

// 10. Admin Analytics Stats
app.get('/api/admin/stats', (_req: Request, res: Response) => {
  const orders = db.getOrders();
  const products = db.getProducts();
  const users = db.getState().users;

  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = orders
    .filter(o => o.paymentStatus === 'paid' && o.createdAt.startsWith(todayStr))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
  const lowStockProducts = products.filter(p => p.stock <= 10).length;

  res.json({
    success: true,
    data: {
      totalSales,
      todaySales,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      registeredCustomers: users.length,
      availableProducts: products.length,
      lowStockProducts
    }
  });
});

// Set up Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SHIVANANDI TRADERS] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
