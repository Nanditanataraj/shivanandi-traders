import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Phone, CheckCircle, PackageCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Order, DeliveryPartner } from '../types/index.ts';

export const DeliveryPartnerDashboard: React.FC = () => {
  const { warehouse } = useApp();

  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('dp-1');
  const [partnerOrders, setPartnerOrders] = useState<Order[]>([]);
  const [isUpdatingGPS, setIsUpdatingGPS] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/delivery-partners').then(r => r.json()),
        fetch('/api/orders').then(r => r.json())
      ]);

      if (pRes.success) {
        setPartners(pRes.data);
      }
      if (oRes.success) {
        setPartnerOrders(oRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentPartner = partners.find(p => p.id === selectedPartnerId) || partners[0];
  const assignedOrders = partnerOrders.filter(
    o => o.deliveryPartner?.id === selectedPartnerId && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  );
  const completedOrders = partnerOrders.filter(
    o => o.deliveryPartner?.id === selectedPartnerId && o.status === 'DELIVERED'
  );

  const handleUpdateStatus = async (orderId: string, status: Order['status'], note: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, deliveryPartnerId: selectedPartnerId })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Live GPS Update simulation / movement toward customer destination
  const handleSimulateGPSMove = async () => {
    if (!currentPartner) return;
    setIsUpdatingGPS(true);
    setGpsMessage(null);

    let targetLat = 12.2895;
    let targetLng = 76.6265;
    if (assignedOrders.length > 0) {
      targetLat = assignedOrders[0].deliveryAddress.lat;
      targetLng = assignedOrders[0].deliveryAddress.lng;
    }

    const deltaLat = (targetLat - currentPartner.currentLat) * 0.35;
    const deltaLng = (targetLng - currentPartner.currentLng) * 0.35;

    const newLat = Number((currentPartner.currentLat + deltaLat).toFixed(4));
    const newLng = Number((currentPartner.currentLng + deltaLng).toFixed(4));

    try {
      const res = await fetch(`/api/delivery-partners/${selectedPartnerId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: newLat, lng: newLng })
      });
      const data = await res.json();
      setIsUpdatingGPS(false);
      if (data.success) {
        setGpsMessage(`GPS Coordinates broadcasted: (${newLat}, ${newLng})`);
        loadData();
      }
    } catch (e) {
      setIsUpdatingGPS(false);
      setGpsMessage('GPS transmission error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-neutral-900 pb-24">
      {/* Rider Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-2xl shadow-xs">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#111827] text-white text-[10px] font-black uppercase">
                  DELIVERY PARTNER PORTAL
                </span>
                <span className="text-xs text-neutral-500 font-semibold">Mysuru Fleet</span>
              </div>
              <h1 className="text-lg font-black text-neutral-900 mt-0.5">
                {currentPartner ? currentPartner.name : 'Delivery Partner'}
              </h1>
            </div>
          </div>

          {/* Select rider profile */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 font-bold">Active Rider:</span>
            <select
              value={selectedPartnerId}
              onChange={e => setSelectedPartnerId(e.target.value)}
              className="bg-white border border-neutral-300 text-neutral-900 rounded-xl px-3 py-1.5 font-bold shadow-2xs"
            >
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.vehicleNumber.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* GPS Live Telemetry Card */}
        {currentPartner && (
          <div className="p-5 rounded-3xl bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <h3 className="font-black text-neutral-900 text-sm">Real-Time GPS Location Broadcast</h3>
              </div>
              <p className="text-xs text-neutral-600 font-mono mt-1 font-semibold">
                Lat: {currentPartner.currentLat} · Lng: {currentPartner.currentLng} ({currentPartner.vehicleNumber})
              </p>
              {gpsMessage && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1">{gpsMessage}</p>
              )}
            </div>

            <button
              onClick={handleSimulateGPSMove}
              disabled={isUpdatingGPS}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5B842] text-black font-black text-xs flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all shadow-xs shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isUpdatingGPS ? 'animate-spin' : ''}`} />
              <span>Broadcast Real GPS Movement</span>
            </button>
          </div>
        )}

        {/* Assigned Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-[#B48C14]" />
              <span>Active Assigned Orders ({assignedOrders.length})</span>
            </h2>
            <span className="text-xs text-neutral-500">Warehouse: {warehouse.address.split(',')[0]}</span>
          </div>

          {assignedOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center space-y-2 shadow-xs">
              <p className="text-sm font-black text-neutral-900">No active assigned deliveries right now</p>
              <p className="text-xs text-neutral-500">
                You will be automatically allocated new orders placed in Mysuru. Stay in vicinity of Saraswathipuram/Kuvempunagar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedOrders.map(order => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-white border-2 border-[#D4AF37] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 text-xs">
                    <div>
                      <span className="text-xs font-bold text-[#B48C14] tracking-wider uppercase">Order Number</span>
                      <h3 className="text-base font-black text-neutral-900 mt-0.5">{order.orderNumber}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-xs">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer and Delivery point */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                      <p className="text-neutral-500 font-bold uppercase text-[10px]">Customer Details</p>
                      <p className="font-black text-neutral-900 text-sm">{order.customerName}</p>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-[#B48C14] font-bold flex items-center gap-1 mt-1 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>+91 {order.customerPhone}</span>
                      </a>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                      <p className="text-neutral-500 font-bold uppercase text-[10px]">Delivery Address ({order.deliveryDistanceKm} km)</p>
                      <p className="font-bold text-neutral-900">
                        {order.deliveryAddress.houseNumber}, {order.deliveryAddress.landmark}
                      </p>
                      <p className="text-neutral-600">{order.deliveryAddress.area}, Mysuru</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-1 hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Navigate via Google Maps →</span>
                      </a>
                    </div>
                  </div>

                  {/* Package items */}
                  <div className="text-xs space-y-1 text-neutral-700">
                    <p className="font-bold text-neutral-500 text-[10px] uppercase">Package Checklist</p>
                    {order.items.map((it, i) => (
                      <p key={i}>• {it.quantity}x {it.product.name} ({it.product.weight})</p>
                    ))}
                  </div>

                  {/* Rider Action Buttons */}
                  <div className="pt-3 border-t border-neutral-100 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PICKED_UP', 'Rider picked up package at warehouse')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        order.status === 'PICKED_UP'
                          ? 'bg-[#111827] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                      }`}
                    >
                      1. Picked Up
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY', 'Rider is en route to customer')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-[#111827] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                      }`}
                    >
                      2. Out for Delivery
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED', 'Delivered safely and handed over to customer')}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs hover:brightness-105"
                    >
                      3. Delivered ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Deliveries */}
        {completedOrders.length > 0 && (
          <div className="p-5 rounded-3xl bg-white border border-neutral-200 shadow-xs">
            <h3 className="text-sm font-black text-neutral-900 mb-2">Delivery History ({completedOrders.length})</h3>
            <div className="space-y-2">
              {completedOrders.slice(0, 5).map(o => (
                <div key={o.id} className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900">{o.orderNumber}</span>
                    <span className="text-neutral-500 text-[11px] ml-2">{o.deliveryAddress.area}</span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Delivered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
