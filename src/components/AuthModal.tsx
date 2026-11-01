import React, { useState } from 'react';
import { X, Phone, ShieldCheck, ArrowRight, CheckCircle2, User, MapPin, Package, LogOut, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    user,
    loginUser,
    logoutUser,
    orders,
    setActiveOrder,
    setActiveRole
  } = useApp();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setStep('otp');
        setDebugOtp(data.debugOtp);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Network error');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 4) {
      setError('Please enter the 4-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success && data.user) {
        loginUser(data.user);
        setIsAuthModalOpen(false);
      } else {
        setError(data.message || 'Invalid OTP. Please check code or try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Verification error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-neutral-900">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF7EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#B48C14]">
              {user ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900">
                {user ? 'Customer Account' : 'Customer Login'}
              </h3>
              <p className="text-xs text-neutral-600">
                {user ? `+91 ${user.phone}` : 'Fast SMS OTP Login for Mysuru Delivery'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged in state */}
        {user ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-neutral-900 text-sm">{user.name}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">+91 {user.phone}</p>
              </div>
              <button
                onClick={logoutUser}
                className="p-2 rounded-xl bg-neutral-200/70 hover:bg-red-100 hover:text-red-700 text-neutral-700 transition-colors text-xs flex items-center gap-1 font-semibold"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Features</h5>

              <div className="bg-neutral-50 rounded-2xl divide-y divide-neutral-200 border border-neutral-200">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-800 font-semibold">
                    <MapPin className="w-4 h-4 text-[#B48C14]" />
                    <span>Saved Delivery Addresses</span>
                  </div>
                  <span className="text-xs font-bold text-neutral-900">
                    {user.addresses?.length || 1} Addresses
                  </span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-800 font-semibold">
                    <Package className="w-4 h-4 text-[#B48C14]" />
                    <span>Order History</span>
                  </div>
                  <span className="text-xs font-bold text-[#B48C14]">
                    {orders.length} Orders
                  </span>
                </div>

                <a
                  href="https://wa.me/917892566419?text=Hello%20Shivanandi%20Traders%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 flex items-center justify-between hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5 text-xs text-neutral-800 font-semibold">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Customer Support</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">7892566419</span>
                </a>
              </div>
            </div>

            {/* Recent Orders Preview */}
            {orders.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Recent Orders</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setActiveOrder(ord);
                        setIsAuthModalOpen(false);
                        const el = document.getElementById('live-order-tracker');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-[#D4AF37] cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-neutral-900">{ord.orderNumber}</p>
                        <p className="text-[11px] text-neutral-500">
                          {new Date(ord.createdAt).toLocaleDateString()} · ₹{ord.totalAmount}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#9A7B1C] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Login flow */
          <div className="p-5">
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black text-neutral-900">Enter Mobile Number</h4>
                  <p className="text-xs text-neutral-500">
                    We will send a 4-digit verification code to your Indian phone number
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 text-xs font-bold text-neutral-600 border-r border-neutral-300 pr-2">
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl pl-20 pr-4 py-2.5 text-sm font-bold text-neutral-900 tracking-wider focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-3" />
                </div>

                {error && (
                  <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full py-2.5 bg-[#111827] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending SMS OTP...' : 'Send Verification OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick-fill business number */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setPhone('7892566419')}
                    className="text-[11px] text-[#B48C14] font-bold hover:underline"
                  >
                    Quick fill business number: 7892566419
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black text-neutral-900">Enter 4-Digit Code</h4>
                  <p className="text-xs text-neutral-500">
                    Sent to <span className="text-neutral-900 font-bold">+91 {phone}</span>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-[#B48C14] ml-2 font-bold hover:underline"
                    >
                      Change
                    </button>
                  </p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={4}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="• • • •"
                    autoFocus
                    required
                    className="w-48 bg-neutral-50 border border-neutral-300 rounded-2xl py-3 text-center text-2xl font-black text-[#B48C14] tracking-[0.5em] focus:outline-none focus:bg-white focus:border-[#D4AF37]"
                  />
                </div>

                {debugOtp && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-center">
                    <p className="text-xs text-neutral-800">
                      Testing OTP Generated: <strong className="text-[#B48C14] text-sm tracking-wider">{debugOtp}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtp(debugOtp)}
                      className="text-[11px] text-[#B48C14] hover:underline mt-1 font-bold"
                    >
                      Click to auto-fill ({debugOtp})
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full py-2.5 bg-[#111827] text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-black disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setOtp('1234')}
                    className="text-[11px] text-neutral-500 hover:text-black font-semibold"
                  >
                    Use default test bypass code (1234)
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
