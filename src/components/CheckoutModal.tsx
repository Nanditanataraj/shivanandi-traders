import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  QrCode,
  ExternalLink,
  MessageCircle,
  Copy,
  ChevronRight,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';
import { playOrderChime, createOwnerWhatsAppLink, triggerDesktopNotification } from '../utils/audioAlert.ts';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartSubtotal,
    deliveryInfo,
    appliedCoupon,
    currentAddress,
    setCurrentAddress,
    user,
    loginUser,
    warehouse,
    clearCart,
    setActiveOrder,
    refreshOrders
  } = useApp();

  // Multi-step checkout:
  // Step 1: Customer Phone & OTP Verification (if not already verified)
  // Step 2: Payment method (Direct PhonePe, Google Pay, Paytm, or Card)
  // Step 3: Confirmation & Order Placed
  const [step, setStep] = useState<'auth' | 'payment' | 'authorizing' | 'success'>('payment');

  // Customer Auth state
  const [phoneInput, setPhoneInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Payment state
  const [paymentApp, setPaymentApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'qr' | 'card'>('phonepe');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const merchantUpi = warehouse.upiId || '7892566419@ybl';
  const ownerPhone = warehouse.notificationPhone || '7892566419';

  useEffect(() => {
    if (isCheckoutModalOpen) {
      // If customer is not logged in / verified, force Phone & OTP step first
      if (!user || !user.isVerified) {
        setStep('auth');
      } else {
        setStep('payment');
      }
    }
  }, [isCheckoutModalOpen, user]);

  if (!isCheckoutModalOpen) return null;

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalAmount = Math.max(0, cartSubtotal + deliveryInfo.fee - discountAmount);

  // Generate dynamic UPI intent link for Indian UPI apps
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('SHIVANANDI TRADERS')}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Order SNT Mysuru Fast Delivery')}`;
  const phonepeIntentUri = `phonepe://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('SHIVANANDI TRADERS')}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Order SNT Mysuru')}`;
  const gpayIntentUri = `tez://upi/pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('SHIVANANDI TRADERS')}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Order SNT Mysuru')}`;
  const paytmIntentUri = `paytmmp://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('SHIVANANDI TRADERS')}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Order SNT Mysuru')}`;

  // QR Code URL generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=111827&bgcolor=FFFFFF&data=${encodeURIComponent(upiIntentUri)}`;

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setSentOtp(data.otp);
      } else {
        setAuthError(data.message || 'Could not send OTP');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Network error sending OTP');
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifyingOtp(true);
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '').slice(-10);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, code: otpInput.trim() })
      });
      const data = await res.json();
      setIsVerifyingOtp(false);

      if (data.success) {
        const verifiedUser = {
          ...data.user,
          name: customerNameInput.trim() || data.user?.name || `Customer (${cleanPhone.slice(-4)})`,
          phone: cleanPhone,
          isVerified: true
        };
        loginUser(verifiedUser);
        setCurrentAddress({
          ...currentAddress,
          recipientName: verifiedUser.name,
          phone: cleanPhone
        });
        setStep('payment');
      } else {
        setAuthError(data.message || 'Invalid OTP code. Please enter the code shown above.');
      }
    } catch (e: any) {
      setIsVerifyingOtp(false);
      setAuthError(e.message || 'Failed to verify OTP');
    }
  };

  // Launch App directly
  const handleLaunchUpiApp = (appName: 'phonepe' | 'gpay' | 'paytm') => {
    let target = upiIntentUri;
    if (appName === 'phonepe') target = phonepeIntentUri;
    if (appName === 'gpay') target = gpayIntentUri;
    if (appName === 'paytm') target = paytmIntentUri;

    // Trigger app intent with graceful fallback
    window.location.href = target;
    setTimeout(() => {
      // In case specific scheme isn't registered, fallback to generic upi://
      window.location.href = upiIntentUri;
    }, 600);
  };

  // Final Order Booking
  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    setStep('authorizing');

    try {
      const fakePaymentId = utrNumber.trim()
        ? `UTR_${utrNumber.trim()}`
        : `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const customerPhone = user?.phone || currentAddress.phone || '7892566419';
      const customerName = user?.name || currentAddress.recipientName || 'Valued Customer';

      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderPayload: {
            customerId: user?.id || 'usr-customer',
            customerName,
            customerPhone,
            deliveryAddress: currentAddress,
            items: cart.map(item => ({
              product: item.product,
              quantity: item.quantity,
              unitPrice: item.product.discountPrice,
              totalPrice: item.product.discountPrice * item.quantity
            })),
            subtotal: cartSubtotal,
            deliveryFee: deliveryInfo.fee,
            discountAmount,
            couponCode: appliedCoupon?.code,
            totalAmount: finalAmount,
            deliveryDistanceKm: deliveryInfo.distanceKm,
            estimatedDeliveryMins: deliveryInfo.estimatedTimeMins
          },
          paymentDetails: {
            paymentId: fakePaymentId,
            orderId: `ord_intent_${Date.now()}`,
            method: paymentApp === 'card' ? 'card' : 'upi'
          }
        })
      });

      const verifyData = await verifyRes.json();
      setIsProcessing(false);

      if (verifyData.success) {
        setConfirmedOrder(verifyData.order);
        setStep('success');
        clearCart();
        refreshOrders();
        setActiveOrder(verifyData.order);

        // Sound chime & desktop notification
        playOrderChime();
        triggerDesktopNotification(
          'SHIVANANDI TRADERS - Order Confirmed!',
          `Order ${verifyData.order.orderNumber} for ₹${finalAmount} is being prepared for fast delivery.`
        );

        // Confetti celebration
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        alert(verifyData.message || 'Payment verification failed');
        setStep('payment');
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setStep('payment');
      alert('Order booking error. Please try again.');
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleGoToTracking = () => {
    setIsCheckoutModalOpen(false);
    const el = document.getElementById('live-order-tracker');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white border border-neutral-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto text-neutral-900">
        
        {/* Header */}
        <div className="p-4 bg-[#FAF7EE] border-b border-amber-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111827] flex items-center justify-center text-[#D4AF37] shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-neutral-900 text-sm sm:text-base">SHIVANANDI TRADERS</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                  Fast Mysuru Delivery
                </span>
              </div>
              <p className="text-[11px] text-neutral-600">
                {step === 'auth' ? 'Step 1 of 2: Customer Phone & OTP Verification' : 'Step 2 of 2: Direct PhonePe & Google Pay UPI Payment'}
              </p>
            </div>
          </div>
          {step !== 'authorizing' && (
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* STEP 1: PHONE NUMBER & OTP FIRST */}
        {step === 'auth' && (
          <div className="p-6 space-y-5">
            <div className="text-center max-w-md mx-auto space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-[#B48C14] mb-2 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-neutral-900">Enter Your Phone Number</h4>
              <p className="text-xs text-neutral-500">
                To receive live GPS delivery updates and verify your order with OTP.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                {authError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={e => setCustomerNameInput(e.target.value)}
                    placeholder="e.g. Nandita Nataraj"
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 font-semibold focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Indian Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-neutral-500">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="98450 12345"
                      maxLength={10}
                      required
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-16 pr-3.5 py-2.5 text-xs text-neutral-900 font-bold tracking-wide focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#111827] text-white font-black text-xs hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Send OTP via SMS</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Instant Verification SMS Display */}
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-900 uppercase block">Instant SMS Code:</span>
                    <span className="font-mono font-black text-base text-neutral-900 tracking-widest">{sentOtp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(sentOtp || '')}
                    className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-[#B48C14] hover:bg-amber-100"
                  >
                    Quick Fill
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Enter 4-Digit Verification OTP</label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                    placeholder="Enter code"
                    maxLength={6}
                    required
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-center text-lg font-black tracking-widest text-neutral-900 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpInput(''); }}
                    className="w-1/3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
                  >
                    Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-2/3 py-2.5 rounded-xl bg-[#111827] text-white font-black text-xs hover:bg-black flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isVerifyingOtp ? 'Verifying...' : 'Verify OTP & Continue'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: DIRECT PHONEPE & GOOGLE PAY UPI PAYMENT */}
        {step === 'payment' && (
          <div className="p-5 space-y-4 text-xs">
            {/* Customer & Address confirmation bar */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-[#B48C14] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-neutral-900 text-xs">
                    {currentAddress.area || 'Saraswathipuram'}, Mysuru ({deliveryInfo.distanceKm} km)
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Recipient: {user?.name || currentAddress.recipientName} · 📞 +91 {user?.phone || currentAddress.phone}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                ~{deliveryInfo.estimatedTimeMins} mins
              </span>
            </div>

            {/* Price breakdown pill */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7EE] border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-neutral-600 font-semibold">Total Payable Amount</p>
                <p className="text-xl font-black text-neutral-900">{formatINR(finalAmount)}</p>
              </div>

              <div className="text-right text-[11px] text-neutral-500 space-y-0.5">
                <p>Items Subtotal: <strong className="text-neutral-800">{formatINR(cartSubtotal)}</strong></p>
                <p>Delivery: <strong className="text-emerald-700">{deliveryInfo.fee === 0 ? 'FREE' : formatINR(deliveryInfo.fee)}</strong></p>
                {discountAmount > 0 && (
                  <p className="text-emerald-700 font-bold">Coupon: -{formatINR(discountAmount)}</p>
                )}
              </div>
            </div>

            {/* Direct PhonePe & Google Pay Selection Tabs */}
            <div className="space-y-2">
              <label className="text-neutral-800 font-black block">Choose Direct UPI Payment Option</label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* PhonePe */}
                <button
                  type="button"
                  onClick={() => setPaymentApp('phonepe')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentApp === 'phonepe'
                      ? 'border-[#5f259f] bg-purple-50 ring-2 ring-[#5f259f]/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#5f259f] text-white flex items-center justify-center text-[10px] font-black">
                      पे
                    </span>
                    {paymentApp === 'phonepe' && <CheckCircle2 className="w-4 h-4 text-[#5f259f]" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-neutral-900 block text-xs">PhonePe</span>
                    <span className="text-[10px] text-neutral-500">Direct App Link</span>
                  </div>
                </button>

                {/* Google Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentApp('gpay')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentApp === 'gpay'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      G
                    </span>
                    {paymentApp === 'gpay' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-neutral-900 block text-xs">Google Pay</span>
                    <span className="text-[10px] text-neutral-500">Direct App Link</span>
                  </div>
                </button>

                {/* Paytm */}
                <button
                  type="button"
                  onClick={() => setPaymentApp('paytm')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentApp === 'paytm'
                      ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[9px] font-black">
                      P
                    </span>
                    {paymentApp === 'paytm' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-neutral-900 block text-xs">Paytm UPI</span>
                    <span className="text-[10px] text-neutral-500">Direct App Link</span>
                  </div>
                </button>

                {/* QR Code Scan */}
                <button
                  type="button"
                  onClick={() => setPaymentApp('qr')}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentApp === 'qr'
                      ? 'border-neutral-900 bg-neutral-100 ring-2 ring-neutral-900/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <QrCode className="w-5 h-5 text-neutral-900" />
                    {paymentApp === 'qr' && <CheckCircle2 className="w-4 h-4 text-neutral-900" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-neutral-900 block text-xs">Scan QR</span>
                    <span className="text-[10px] text-neutral-500">Any Mobile UPI</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Direct App Launch Box */}
            {(paymentApp === 'phonepe' || paymentApp === 'gpay' || paymentApp === 'paytm') && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-neutral-900 text-xs">
                      {paymentApp === 'phonepe' && 'Pay directly with PhonePe'}
                      {paymentApp === 'gpay' && 'Pay directly with Google Pay'}
                      {paymentApp === 'paytm' && 'Pay directly with Paytm'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Tap below to launch {paymentApp === 'phonepe' ? 'PhonePe' : paymentApp === 'gpay' ? 'Google Pay' : 'Paytm'} on your phone with amount {formatINR(finalAmount)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-[11px] font-bold text-[#B48C14] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUpi ? 'Copied VPA!' : 'Copy UPI ID'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchUpiApp(paymentApp as any)}
                    className={`flex-1 py-3 px-4 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 ${
                      paymentApp === 'phonepe'
                        ? 'bg-[#5f259f] hover:bg-[#4b1d7d]'
                        : paymentApp === 'gpay'
                        ? 'bg-[#1a73e8] hover:bg-[#1558b3]'
                        : 'bg-[#002e6e] hover:bg-[#00204d]'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open {paymentApp === 'phonepe' ? 'PhonePe' : paymentApp === 'gpay' ? 'Google Pay' : 'Paytm'} & Pay {formatINR(finalAmount)}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-200">
                  <label className="text-[11px] text-neutral-600 block mb-1 font-semibold">
                    UPI Transaction ID / UTR Number (Optional after payment):
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    placeholder="e.g. 430129384920"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900"
                  />
                </div>
              </div>
            )}

            {/* QR Code display */}
            {paymentApp === 'qr' && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-300 text-center space-y-3">
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border-2 border-neutral-900 shadow-sm flex items-center justify-center">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-extrabold text-neutral-900 text-xs">Scan with PhonePe, Google Pay, or Paytm</p>
                  <p className="text-[11px] text-neutral-500 font-mono">UPI ID: <strong>{merchantUpi}</strong></p>
                </div>
              </div>
            )}

            {/* Submit & Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-[#111827] text-white font-black text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Confirm Payment & Place Order ({formatINR(finalAmount)})</span>
            </button>
          </div>
        )}

        {/* AUTHORIZING STATE */}
        {step === 'authorizing' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin mx-auto" />
            <h4 className="text-base font-black text-neutral-900">Verifying Payment & Syncing Order...</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Confirming your UPI transaction and streaming booking details to the Shivanandi Traders Supabase database.
            </p>
          </div>
        )}

        {/* SUCCESS CONFIRMATION */}
        {step === 'success' && confirmedOrder && (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Booking Confirmed & Synced
              </span>
              <h4 className="text-lg font-black text-neutral-900 mt-2">
                Order #{confirmedOrder.orderNumber} Placed!
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Delivering in <strong>~{confirmedOrder.estimatedDeliveryMins || 20} minutes</strong> to {confirmedOrder.deliveryAddress?.area || 'Mysuru'}.
              </p>
            </div>

            {/* Direct WhatsApp alert to owner phone 7892566419 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-950 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Store Manager Notification Alert</span>
                </span>
                <span className="font-mono font-bold text-neutral-700">7892566419</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                A notification chime was played and your order was logged to the Supabase database.
              </p>
              <a
                href={createOwnerWhatsAppLink(confirmedOrder, ownerPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Notify Store Manager on WhatsApp (7892566419)</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleGoToTracking}
              className="w-full py-3.5 rounded-2xl bg-[#111827] text-white font-black text-xs hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Track Live Delivery on Leaflet Map</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
