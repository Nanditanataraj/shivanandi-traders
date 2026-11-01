/**
 * Audio Chime & Notification Alert Utility for Shivanandi Traders
 * Uses Web Audio API for zero-dependency store chime & push notifications
 */

export function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Friendly 3-tone notification chord (C5 -> E5 -> G5)
    const tones = [
      { freq: 523.25, time: 0.0, dur: 0.18 }, // C5
      { freq: 659.25, time: 0.14, dur: 0.18 }, // E5
      { freq: 783.99, time: 0.28, dur: 0.35 }  // G5
    ];

    tones.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.35, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (e) {
    console.warn('Audio playback not permitted or supported yet:', e);
  }
}

export function playCancellationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Downward alert tone for cancellation
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

/**
 * Creates direct WhatsApp link to owner phone (7892566419) with formatted order summary
 */
export function createOwnerWhatsAppLink(order: any, ownerPhone: string = '7892566419'): string {
  const cleanPhone = ownerPhone.replace(/[^0-9]/g, '').slice(-10);
  const itemsText = (order.items || [])
    .map((item: any) => `• ${item.quantity}x ${item.product?.name || 'Item'} (₹${item.totalPrice || item.unitPrice * item.quantity})`)
    .join('%0A');

  const text = `🔔 *NEW ORDER RECEIVED - SHIVANANDI TRADERS*%0A%0A` +
    `📦 *Order Number:* ${order.orderNumber}%0A` +
    `👤 *Customer:* ${order.customerName} (${order.customerPhone})%0A` +
    `📍 *Delivery Area:* ${order.deliveryAddress?.area || 'Mysuru'}, ${order.deliveryAddress?.houseNumber || ''}%0A` +
    `📏 *Distance:* ${order.deliveryDistanceKm} km (${order.estimatedDeliveryMins || 20} mins delivery)%0A%0A` +
    `🛒 *Items Ordered:*%0A${itemsText}%0A%0A` +
    `💰 *Total Paid:* ₹${order.totalAmount} (via ${order.paymentMethod?.toUpperCase() || 'UPI'})%0A` +
    `💳 *Payment Ref:* ${order.razorpayPaymentId || 'UPI Verified'}%0A%0A` +
    `✅ *Database Status:* Synced to Supabase PostgreSQL orders table.`;

  return `https://wa.me/91${cleanPhone}?text=${text}`;
}

/**
 * Trigger desktop push notification if browser permissions allow
 */
export async function triggerDesktopNotification(title: string, body: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg'
    });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/aistudio/WhatsApp_Image_2026-10-31_at_6.16.19_AM_35de1c8d.jpeg'
      });
    }
  }
}
