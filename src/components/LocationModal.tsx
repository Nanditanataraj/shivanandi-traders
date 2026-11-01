import React, { useState } from 'react';
import { X, MapPin, Navigation, AlertCircle, CheckCircle2, ChevronRight, Building } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { MYSURU_POPULAR_LOCATIONS, calculateDistanceKm, MysuruLocation } from '../utils/mysuruLocations.ts';

export const LocationModal: React.FC = () => {
  const {
    isLocationModalOpen,
    setIsLocationModalOpen,
    currentAddress,
    setCurrentAddress,
    warehouse,
    user
  } = useApp();

  const [isDetecting, setIsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState(false);
  const [houseNumber, setHouseNumber] = useState(currentAddress.houseNumber || '');
  const [landmark, setLandmark] = useState(currentAddress.landmark || '');
  const [recipientName, setRecipientName] = useState(currentAddress.recipientName || (user?.name || 'Valued Customer'));
  const [phone, setPhone] = useState(currentAddress.phone || (user?.phone || '7892566419'));

  if (!isLocationModalOpen) return null;

  const handleSelectLocation = (loc: MysuruLocation) => {
    const dist = calculateDistanceKm(warehouse.lat, warehouse.lng, loc.lat, loc.lng);
    setCurrentAddress({
      ...currentAddress,
      area: loc.name,
      landmark: loc.area,
      pincode: loc.pincode,
      lat: loc.lat,
      lng: loc.lng
    });
    if (dist <= warehouse.maxDeliveryRadiusKm) {
      setIsLocationModalOpen(false);
    }
  };

  const handleDetectGPS = () => {
    setIsDetecting(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const { latitude, longitude } = pos.coords;
        const dist = calculateDistanceKm(warehouse.lat, warehouse.lng, latitude, longitude);

        setCurrentAddress({
          ...currentAddress,
          area: 'Detected GPS Location',
          landmark: `GPS Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          lat: latitude,
          lng: longitude
        });

        if (dist <= warehouse.maxDeliveryRadiusKm) {
          setIsLocationModalOpen(false);
        } else {
          setGpsError(`Your current GPS position is ${dist} km away. Our delivery limit is 20 km from our Mysuru warehouse.`);
        }
      },
      (err) => {
        setIsDetecting(false);
        setGpsError(`GPS permission or detection failed: ${err.message}. Please select a Mysuru neighborhood below.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentAddress({
      ...currentAddress,
      recipientName,
      phone,
      houseNumber,
      landmark
    });
    setIsLocationModalOpen(false);
  };

  const currentDistance = calculateDistanceKm(
    warehouse.lat,
    warehouse.lng,
    currentAddress.lat,
    currentAddress.lng
  );
  const isOutOfRange = currentDistance > warehouse.maxDeliveryRadiusKm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-neutral-900">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#B48C14]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">Select Delivery Location</h3>
              <p className="text-xs text-neutral-600">Warehouse: Saraswathipuram, Mysuru (20 km delivery radius)</p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Status banner */}
          {isOutOfRange ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700">Out of Serviceable Area ({currentDistance} km)</p>
                <p className="mt-0.5 text-neutral-600">
                  We only deliver within 20 km of our Mysuru central warehouse. Please select an address within Mysuru city.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>Within Service Area:</strong> {currentDistance} km from warehouse (~{Math.max(14, Math.round(12 + currentDistance * 2.5))} mins delivery)
                </span>
              </div>
            </div>
          )}

          {/* GPS Auto-detect Button */}
          <button
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="w-full py-3 px-4 rounded-2xl bg-neutral-50 border border-neutral-200 hover:border-[#D4AF37] hover:bg-[#FAF7EE] text-neutral-900 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#B48C14] group-hover:scale-105 transition-transform">
                <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-neutral-900">
                  {isDetecting ? 'Detecting Mysuru Location...' : 'Use My Current GPS Location'}
                </p>
                <p className="text-[11px] text-neutral-500">High accuracy GPS positioning</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black" />
          </button>

          {gpsError && (
            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              {gpsError}
            </p>
          )}

          {/* Popular Mysuru Neighborhoods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Popular Delivery Hubs in Mysuru
              </h4>
              <span className="text-[10px] text-[#B48C14] font-bold">Within 20 km</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MYSURU_POPULAR_LOCATIONS.map((loc) => {
                const dist = calculateDistanceKm(warehouse.lat, warehouse.lng, loc.lat, loc.lng);
                const isSelected = currentAddress.area === loc.name;

                return (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectLocation(loc)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-[#FAF7EE] border-[#D4AF37] text-neutral-900 shadow-xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-neutral-900">{loc.name}</span>
                      <span className="text-[10px] font-bold text-[#B48C14]">{dist} km</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-0.5 truncate w-full">
                      {loc.area} · PIN {loc.pincode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Address Form Toggle */}
          <div className="pt-2 border-t border-neutral-100">
            <button
              onClick={() => setManualForm(!manualForm)}
              className="text-xs font-bold text-[#B48C14] hover:underline flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{manualForm ? 'Hide specific flat/house details' : '+ Add Flat / Door Number & Specific Instructions'}</span>
            </button>

            {manualForm && (
              <form onSubmit={handleSaveManual} className="mt-3 space-y-2.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">House / Flat / Gym Name</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="e.g. Flat 302, Green View Apts / Gold's Gym"
                    required
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Landmark</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder="e.g. Near Kamakshi Hospital / Opposite Badminton Court"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      required
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[#111827] text-white font-extrabold text-xs rounded-xl hover:bg-black mt-2"
                >
                  Save & Confirm Address
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-neutral-200 bg-[#FAF7EE] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-neutral-500 font-medium">Selected: </span>
            <span className="text-neutral-900 font-extrabold">{currentAddress.area || currentAddress.city}</span>
            <span className="text-[#B48C14] ml-1.5 font-bold">({currentDistance} km)</span>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            disabled={isOutOfRange}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isOutOfRange
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-[#111827] text-white hover:bg-black'
            }`}
          >
            {isOutOfRange ? 'Out of Range' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
};
