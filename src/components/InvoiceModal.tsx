import React from 'react';
import { X, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatINR } from '../utils/mysuruLocations.ts';
import { Logo } from './Logo.tsx';

export const InvoiceModal: React.FC = () => {
  const { selectedOrderForInvoice, setSelectedOrderForInvoice, warehouse } = useApp();

  if (!selectedOrderForInvoice) return null;

  const order = selectedOrderForInvoice;
  const gstRate = 0.18;
  const taxableValue = Math.round(order.subtotal / (1 + gstRate));
  const gstAmount = order.subtotal - taxableValue;
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:text-black">
      <div className="bg-white border border-neutral-300 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black my-auto text-neutral-900">
        {/* Modal Controls (Hidden in print) */}
        <div className="p-3.5 bg-[#FAF7EE] border-b border-amber-200/50 flex items-center justify-between print:hidden">
          <span className="text-xs font-black text-[#9A7B1C]">Tax Invoice / Cash Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#111827] text-white font-extrabold text-xs rounded-xl hover:bg-black flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setSelectedOrderForInvoice(null)}
              className="p-1 rounded-lg text-neutral-500 hover:text-black hover:bg-neutral-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 md:p-8 space-y-6 text-xs text-neutral-800 print:text-black print:bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-200 print:border-gray-300">
            <div>
              <Logo size="md" showSubtitle={true} />
              <p className="mt-2 text-neutral-600 print:text-gray-600 font-medium">
                {warehouse.address}
              </p>
              <p className="text-neutral-600 print:text-gray-600">
                Mysuru, Karnataka, India · Phone: <strong>{warehouse.contactNumber}</strong>
              </p>
              <p className="text-[11px] font-mono text-[#B48C14] print:text-black font-bold mt-1">
                GSTIN: 29AAMCS7842N1Z4 (Karnataka)
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="px-2.5 py-1 rounded bg-[#FAF7EE] border border-amber-300 text-[#9A7B1C] print:border-black print:text-black font-black uppercase tracking-wider text-[11px]">
                ORIGINAL TAX INVOICE
              </span>
              <p className="font-black text-neutral-900 print:text-black text-sm mt-2">{order.orderNumber}</p>
              <p className="text-neutral-500 print:text-gray-600 mt-0.5 font-medium">
                Date: {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="text-emerald-700 print:text-green-700 font-bold mt-1">
                Payment: PAID ({order.paymentMethod.toUpperCase()})
              </p>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-neutral-200 print:border-gray-300">
            <div>
              <p className="text-[10px] font-bold text-neutral-500 print:text-gray-600 uppercase">Customer Details</p>
              <p className="font-black text-neutral-900 print:text-black text-sm mt-1">{order.customerName}</p>
              <p className="text-neutral-600 print:text-gray-600 font-medium">Phone: +91 {order.customerPhone}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-neutral-500 print:text-gray-600 uppercase">Delivery Location (Mysuru)</p>
              <p className="font-bold text-neutral-900 print:text-black mt-1">
                {order.deliveryAddress.houseNumber}, {order.deliveryAddress.landmark}
              </p>
              <p className="text-neutral-600 print:text-gray-600">
                {order.deliveryAddress.area}, Mysuru - {order.deliveryAddress.pincode}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 print:border-gray-300 text-[10px] font-bold uppercase text-neutral-500 print:text-gray-600">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 print:divide-gray-200">
                {order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5">
                      <p className="font-bold text-neutral-900 print:text-black">{it.product.name}</p>
                      <p className="text-[10px] text-neutral-500 print:text-gray-500">{it.product.weight}</p>
                    </td>
                    <td className="py-2.5 text-center font-bold text-neutral-900">{it.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">{formatINR(it.unitPrice)}</td>
                    <td className="py-2.5 text-right font-black tabular-nums text-neutral-900 print:text-black">
                      {formatINR(it.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Calculations */}
          <div className="pt-3 border-t border-neutral-200 print:border-gray-300 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600 print:text-gray-600">
                <span>Taxable Value:</span>
                <span className="tabular-nums font-semibold">{formatINR(taxableValue)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 print:text-gray-600">
                <span>CGST (9%):</span>
                <span className="tabular-nums font-semibold">{formatINR(cgst)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 print:text-gray-600">
                <span>SGST (9%):</span>
                <span className="tabular-nums font-semibold">{formatINR(sgst)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 print:text-gray-600">
                <span>Delivery Charge:</span>
                <span className="tabular-nums font-bold">
                  {order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#B48C14] print:text-black font-bold">
                  <span>Coupon Discount:</span>
                  <span className="tabular-nums">- {formatINR(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 print:border-gray-300 flex justify-between font-black text-sm text-neutral-900 print:text-black">
                <span>Total Amount:</span>
                <span className="text-[#B48C14] print:text-black text-base">{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Declaration */}
          <div className="pt-4 border-t border-neutral-200 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between text-[10px] text-neutral-500 print:text-gray-500">
            <p>This is a computer generated invoice and requires no physical signature.</p>
            <p className="font-bold text-neutral-700 print:text-black">Authorized for SHIVANANDI TRADERS, Mysuru</p>
          </div>
        </div>
      </div>
    </div>
  );
};
