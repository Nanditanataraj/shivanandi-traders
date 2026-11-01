import React, { useEffect, useRef } from 'react';
import { Clock, Phone, MessageSquare, CheckCircle2, FileText } from 'lucide-react';
import L from 'leaflet';
import { useApp } from '../context/AppContext.tsx';
import { Order, OrderStatus } from '../types/index.ts';
import { formatINR } from '../utils/mysuruLocations.ts';

const STATUS_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'ORDER_PLACED', label: 'Order Placed', desc: 'Order received at Shivanandi Traders' },
  { status: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed', desc: 'Verified online payment' },
  { status: 'ORDER_ACCEPTED', label: 'Order Accepted', desc: 'Mysuru warehouse confirmed order' },
  { status: 'PREPARING_ORDER', label: 'Preparing Order', desc: 'Picking fitness nutrition & dry fruits' },
  { status: 'ORDER_PACKED', label: 'Order Packed', desc: 'Securely tamper-proof sealed' },
  { status: 'DELIVERY_PARTNER_ASSIGNED', label: 'Partner Assigned', desc: 'Delivery partner allocated' },
  { status: 'PICKED_UP', label: 'Picked Up', desc: 'Partner loaded your package' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Partner en route to your location' },
  { status: 'APPROACHING', label: 'Approaching', desc: 'Partner nearing your address' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Package handed over successfully' }
];

export const LiveTrackingView: React.FC = () => {
  const {
    activeOrder,
    setActiveOrder,
    warehouse,
    setSelectedOrderForInvoice
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{
    warehouseMarker?: L.Marker;
    customerMarker?: L.Marker;
    riderMarker?: L.Marker;
    routeLine?: L.Polyline;
  }>({});

  // Poll active order status every 4 seconds
  useEffect(() => {
    if (!activeOrder?.id) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrder.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setActiveOrder(data.data);
        }
      } catch (err) {
        console.error('Failed to sync active order:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeOrder?.id]);

  // Leaflet Map Initialization & Markers
  useEffect(() => {
    if (!mapContainerRef.current || !activeOrder) return;

    const warehouseLat = warehouse.lat || 12.3015;
    const warehouseLng = warehouse.lng || 76.6380;
    const customerLat = activeOrder.deliveryAddress.lat || 12.2895;
    const customerLng = activeOrder.deliveryAddress.lng || 76.6265;
    const riderLat = activeOrder.deliveryPartner?.currentLat || warehouseLat + 0.003;
    const riderLng = activeOrder.deliveryPartner?.currentLng || warehouseLng + 0.002;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([warehouseLat, warehouseLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Custom Icons using DivIcon
    const warehouseIcon = L.divIcon({
      className: 'custom-warehouse-pin',
      html: `
        <div style="background:#D4AF37; color:#000; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px; border:3px solid #FFF; box-shadow:0 4px 12px rgba(212,175,55,0.6);">
          SNT
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const customerIcon = L.divIcon({
      className: 'custom-customer-pin',
      html: `
        <div style="background:#10B981; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; border:3px solid #FFF; box-shadow:0 4px 12px rgba(16,185,129,0.5);">
          🏠
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const riderIcon = L.divIcon({
      className: 'custom-rider-pin',
      html: `
        <div style="background:#F59E0B; color:#000; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; border:3px solid #FFF; box-shadow:0 0 15px #F59E0B; animation:pulse 1.5s infinite;">
          🛵
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // Remove old layers
    if (markersRef.current.warehouseMarker) map.removeLayer(markersRef.current.warehouseMarker);
    if (markersRef.current.customerMarker) map.removeLayer(markersRef.current.customerMarker);
    if (markersRef.current.riderMarker) map.removeLayer(markersRef.current.riderMarker);
    if (markersRef.current.routeLine) map.removeLayer(markersRef.current.routeLine);

    // Add new markers
    const wMarker = L.marker([warehouseLat, warehouseLng], { icon: warehouseIcon })
      .bindPopup(`<b>SHIVANANDI TRADERS Warehouse</b><br>${warehouse.address}`)
      .addTo(map);

    const cMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
      .bindPopup(`<b>Your Delivery Location</b><br>${activeOrder.deliveryAddress.area}, Mysuru`)
      .addTo(map);

    const rMarker = L.marker([riderLat, riderLng], { icon: riderIcon })
      .bindPopup(`<b>Delivery Partner: ${activeOrder.deliveryPartner?.name || 'Rider Assigned'}</b><br>Live GPS Location`)
      .addTo(map);

    // Draw route polyline
    const route = L.polyline(
      [
        [warehouseLat, warehouseLng],
        [riderLat, riderLng],
        [customerLat, customerLng]
      ],
      {
        color: '#D4AF37',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8'
      }
    ).addTo(map);

    markersRef.current = {
      warehouseMarker: wMarker,
      customerMarker: cMarker,
      riderMarker: rMarker,
      routeLine: route
    };

    // Fit bounds smoothly
    const bounds = L.latLngBounds([
      [warehouseLat, warehouseLng],
      [customerLat, customerLng],
      [riderLat, riderLng]
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });

  }, [activeOrder, warehouse]);

  if (!activeOrder) return null;

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.status === activeOrder.status);

  return (
    <section id="live-order-tracker" className="py-8 px-4 bg-[#F8F6F0] rounded-3xl border border-neutral-200/90 scroll-mt-20 my-6 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
              <h2 className="text-lg font-black text-neutral-900">Live Delivery Tracking</h2>
              <span className="text-xs bg-[#FAF7EE] text-[#9A7B1C] px-2.5 py-0.5 rounded-full font-black border border-amber-300">
                {activeOrder.orderNumber}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 font-medium">
              Delivering to {activeOrder.deliveryAddress.area}, Mysuru · {activeOrder.deliveryDistanceKm} km
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedOrderForInvoice(activeOrder)}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold border border-neutral-200 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#B48C14]" />
              <span>GST Invoice</span>
            </button>

            <a
              href="tel:7892566419"
              className="px-3.5 py-1.5 rounded-xl bg-[#111827] text-white text-xs font-bold hover:bg-black flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>

        {/* Grid: Map on Left, Delivery Pipeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Live Map */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 overflow-hidden flex flex-col shadow-sm">
            {/* Map Top Bar */}
            <div className="p-3.5 bg-[#FAF7EE] border-b border-amber-200/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B48C14]" />
                <span className="text-neutral-900 font-bold">Estimated Arrival: </span>
                <span className="text-[#B48C14] font-black text-sm">
                  {activeOrder.status === 'DELIVERED' ? 'Delivered!' : `~${activeOrder.estimatedDeliveryMins} Minutes`}
                </span>
              </div>
              <span className="text-neutral-600 text-[11px] font-semibold">
                Live GPS Active · Mysuru City
              </span>
            </div>

            {/* Leaflet Map Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full h-80 sm:h-96 bg-neutral-100 z-10"
              style={{ minHeight: '340px' }}
            />

            {/* Delivery Partner Details Strip */}
            <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF7EE] border border-amber-300 flex items-center justify-center text-lg shadow-2xs">
                  🛵
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-900">
                    {activeOrder.deliveryPartner?.name || 'Assigning Shivanandi Rider...'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    {activeOrder.deliveryPartner ? 'Authorized Mysuru Fast Delivery Rider' : 'Nearest partner being notified'}
                  </p>
                </div>
              </div>

              {activeOrder.deliveryPartner && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeOrder.deliveryPartner.phone}`}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-[#111827] hover:text-white text-neutral-800 transition-colors border border-neutral-200"
                    title="Call Delivery Partner"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`https://wa.me/91${activeOrder.deliveryPartner.phone}?text=Hello%20regarding%20Order%20${activeOrder.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition-colors border border-emerald-200"
                    title="WhatsApp Partner"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: 10-Stage Pipeline Steps */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-neutral-200 p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="font-black text-neutral-900 text-sm">Delivery Pipeline</h3>
                <span className="text-xs text-[#B48C14] font-extrabold">
                  Stage {currentStepIdx + 1} of 10
                </span>
              </div>

              {/* Steps vertical progress list */}
              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div
                      key={step.status}
                      className={`flex items-start gap-3 p-2.5 rounded-2xl transition-colors ${
                        isCurrent
                          ? 'bg-[#FAF7EE] border border-amber-300 shadow-2xs'
                          : 'opacity-75'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black mt-0.5 ${
                          isDone
                            ? 'bg-[#111827] text-white shadow-2xs'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4 text-[#D4AF37] stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isCurrent ? 'text-neutral-900 font-black' : isDone ? 'text-neutral-800' : 'text-neutral-400'}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary footer */}
            <div className="pt-4 border-t border-neutral-100 mt-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500">Total Paid: </span>
                <span className="font-black text-neutral-900">{formatINR(activeOrder.totalAmount)}</span>
                <span className="text-neutral-400"> ({activeOrder.items.length} items)</span>
              </div>

              <span className="text-neutral-500 font-semibold text-[11px]">
                Paid via {activeOrder.paymentMethod.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
