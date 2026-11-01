import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types/index.ts';

export const DEFAULT_SUPABASE_PROJECT_ID = 'aswuluewjyvdzynfcsbg';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

class SupabaseService {
  private client: SupabaseClient | null = null;
  public url: string = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  public key: string = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_8h2i9nqlwCDolPerd5jzXA_Fo7FaG-C';

  constructor() {
    this.initClient();
  }

  public updateConfig(url?: string, key?: string) {
    if (url) this.url = url;
    if (key !== undefined) this.key = key;
    this.initClient();
  }

  private initClient() {
    if (this.url && this.key) {
      try {
        this.client = createClient(this.url, this.key, {
          auth: { persistSession: false }
        });
        console.log(`[Supabase] Client initialized for project ${this.url}`);
      } catch (err) {
        console.error('[Supabase] Failed to initialize client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isConfigured(): boolean {
    return !!(this.url && this.key);
  }

  /**
   * Automatically saves an order to Supabase whenever a customer books
   */
  public async syncOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      const msg = !this.key
        ? 'Supabase key is not yet set. Add your Supabase anon/service key in Admin Dashboard or SUPABASE_KEY env.'
        : 'Supabase client not connected.';
      console.warn(`[Supabase Sync Skipped]: ${msg}`);
      return { success: false, error: msg };
    }

    try {
      // 1. Insert into orders table
      const { data, error } = await this.client.from('orders').upsert({
        id: order.id,
        order_number: order.orderNumber,
        customer_id: order.customerId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        delivery_address: order.deliveryAddress,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        discount_amount: order.discountAmount,
        coupon_code: order.couponCode || null,
        total_amount: order.totalAmount,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        razorpay_payment_id: order.razorpayPaymentId || null,
        status: order.status,
        delivery_distance_km: order.deliveryDistanceKm,
        estimated_delivery_mins: order.estimatedDeliveryMins,
        created_at: order.createdAt
      });

      if (error) {
        console.error('[Supabase Order Insert Error]:', error);
        return { success: false, error: error.message };
      }

      console.log(`[Supabase Order Synced Successfully]: ${order.orderNumber}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Supabase Sync Exception]:', err);
      return { success: false, error: err.message || 'Unknown Supabase sync error' };
    }
  }

  /**
   * Fetches all orders directly from Supabase PostgreSQL orders table
   */
  public async fetchOrdersFromSupabase(): Promise<{ success: boolean; data?: Order[]; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase client is not connected' };
    }

    try {
      const { data, error } = await this.client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform snake_case columns back into Order interface
      const orders: Order[] = (data || []).map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        customerId: row.customer_id || 'usr-guest',
        customerName: row.customer_name || 'Customer',
        customerPhone: row.customer_phone || '',
        deliveryAddress: row.delivery_address || {},
        items: row.items || [],
        subtotal: Number(row.subtotal || 0),
        deliveryFee: Number(row.delivery_fee || 0),
        discountAmount: Number(row.discount_amount || 0),
        couponCode: row.coupon_code,
        totalAmount: Number(row.total_amount || 0),
        paymentStatus: row.payment_status || 'paid',
        paymentMethod: row.payment_method || 'upi',
        razorpayPaymentId: row.razorpay_payment_id,
        status: row.status || 'ORDER_PLACED',
        deliveryDistanceKm: Number(row.delivery_distance_km || 0),
        estimatedDeliveryMins: Number(row.estimated_delivery_mins || 20),
        statusHistory: [
          {
            status: row.status || 'ORDER_PLACED',
            timestamp: row.created_at || new Date().toISOString(),
            note: 'Fetched from Supabase database'
          }
        ],
        createdAt: row.created_at,
        updatedAt: row.created_at
      }));

      return { success: true, data: orders };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch from Supabase' };
    }
  }

  /**
   * Tests connection to Supabase database
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return {
        success: false,
        message: 'Supabase key is missing. Please provide your Supabase anon public or service_role key.'
      };
    }

    try {
      // Try querying or pinging
      const { error } = await this.client.from('orders').select('id').limit(1);
      if (error) {
        // Table might not exist yet, but authentication was verified if error says relation doesn't exist
        if (error.code === '42P01') {
          return {
            success: true,
            message: 'Connected to Supabase! (Note: The "orders" table has not been created yet. Please execute the SQL schema below in your Supabase SQL Editor).'
          };
        }
        return {
          success: false,
          message: `Supabase returned: ${error.message}`
        };
      }
      return {
        success: true,
        message: 'Successfully connected and verified with Supabase database!'
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Could not reach Supabase endpoint'
      };
    }
  }
}

export const supabaseService = new SupabaseService();
