import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  MapPin, Warehouse, ShoppingBag, CreditCard,
  Loader2, QrCode, Copy, CheckCircle,
} from 'lucide-react';
import { orderApi }    from '../../api/order.api';
import { paymentApi }  from '../../api/payment.api';
import { warehouseApi } from '../../api/warehouse.api';
import { cartApi }     from '../../api/cart.api';
import useCartStore    from '../../store/cartStore';
import { formatCurrency } from '../../utils/format';

/* ── VietQR config ─────────────────────────────────────── */
const BANK = {
  id:   'VCB',
  acc:  '1024813771',
  name: 'VO PHI TOAN',
};

function vietQrUrl(amount, orderNumber) {
  return [
    `https://img.vietqr.io/image/${BANK.id}-${BANK.acc}-compact2.png`,
    `?amount=${Math.round(amount)}`,
    `&addInfo=${encodeURIComponent(`Thanh toan ${orderNumber}`)}`,
    `&accountName=${encodeURIComponent(BANK.name)}`,
  ].join('');
}
/* ─────────────────────────────────────────────────────── */

const schema = z.object({
  shippingAddress: z.string().min(10, 'Địa chỉ cần tối thiểu 10 ký tự'),
  warehouseId:     z.coerce.number().min(1, 'Vui lòng chọn kho giao hàng'),
});

export default function Checkout() {
  const navigate  = useNavigate();
  const clearCart = useCartStore(s => s.clearCart);

  const [payMethod, setPayMethod] = useState('vnpay'); // 'vnpay' | 'qr'
  const [step,      setStep]      = useState('form');  // 'form' | 'pending' | 'redirecting' | 'qr'
  const [qrOrder,   setQrOrder]   = useState(null);    // { id, orderNumber, total }

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => cartApi.get().then(r => r.data.data),
  });

  const { data: whData } = useQuery({
    queryKey: ['warehouses'],
    queryFn:  () => warehouseApi.getAll().then(r => r.data.data),
  });

  const items      = cartData?.items ?? [];
  const total      = cartData?.total ?? 0;
  const warehouses = Array.isArray(whData) ? whData : (whData?.warehouses ?? []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  /* VNPay redirect */
  const paymentMutation = useMutation({
    mutationFn: (orderId) => paymentApi.initiate(orderId).then(r => r.data.data),
    onSuccess: ({ paymentUrl }) => {
      clearCart();
      setStep('redirecting');
      setTimeout(() => { window.location.href = paymentUrl; }, 500);
    },
    onError: (e) => {
      setStep('form');
      toast.error(e.response?.data?.message || 'Không thể khởi tạo thanh toán');
    },
  });

  /* Create order */
  const orderMutation = useMutation({
    mutationFn: (data) => orderApi.create(data).then(r => r.data.data),
    onSuccess: (data) => {
      const order = data.order;
      if (!order?.id) {
        toast.error('Không lấy được mã đơn hàng');
        setStep('form');
        return;
      }
      if (payMethod === 'vnpay') {
        paymentMutation.mutate(order.id);
      } else {
        clearCart();
        setQrOrder({
          id:          order.id,
          orderNumber: order.order_number ?? order.orderNumber ?? `#${order.id}`,
          total,
        });
        setStep('qr');
      }
    },
    onError: (e) => {
      setStep('form');
      toast.error(e.response?.data?.message || 'Đặt hàng thất bại');
    },
  });

  const onSubmit = (data) => {
    setStep('pending');
    orderMutation.mutate(data);
  };

  const isPending = orderMutation.isPending || paymentMutation.isPending || step === 'pending';

  /* ── Empty cart ───────────────────────────────────────── */
  if (items.length === 0 && step === 'form') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Giỏ hàng trống, không thể thanh toán</p>
        <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline text-sm">
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  /* ── VNPay redirecting ────────────────────────────────── */
  if (step === 'redirecting') {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <Loader2 size={40} className="mx-auto text-blue-600 animate-spin mb-4" />
        <p className="text-gray-700 font-medium">Đang chuyển đến VNPay...</p>
        <p className="text-gray-400 text-sm mt-1">Vui lòng không đóng cửa sổ này</p>
      </div>
    );
  }

  /* ── QR payment screen ────────────────────────────────── */
  if (step === 'qr' && qrOrder) {
    const copyText = async (text) => {
      try { await navigator.clipboard.writeText(text); toast.success('Đã sao chép'); }
      catch { toast.error('Không thể sao chép'); }
    };

    return (
      <div className="max-w-md mx-auto py-6 space-y-5">
        <div className="text-center">
          <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
          <h1 className="text-xl font-bold text-gray-900">Đặt hàng thành công!</h1>
          <p className="text-gray-500 text-sm mt-1">Quét QR để hoàn tất thanh toán</p>
        </div>

        {/* QR card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 to-emerald-500 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Chuyển khoản ngân hàng</span>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Vietcombank</span>
          </div>

          {/* QR image */}
          <div className="flex justify-center pt-5 pb-3 px-5">
            <img
              src={vietQrUrl(qrOrder.total, qrOrder.orderNumber)}
              alt="VietQR"
              className="w-56 h-56 object-contain rounded-xl border border-gray-100"
              onError={e => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-56 h-56 hidden items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center px-4">Không tải được QR.<br/>Chuyển khoản thủ công bên dưới.</p>
            </div>
          </div>

          {/* Bank info */}
          <div className="px-5 pb-5 space-y-2.5">
            <InfoRow label="Ngân hàng"   value="Vietcombank (VCB)" />
            <InfoRow label="Số tài khoản" value={BANK.acc} onCopy={() => copyText(BANK.acc)} />
            <InfoRow label="Chủ tài khoản" value={BANK.name} />
            <InfoRow
              label="Số tiền"
              value={formatCurrency(qrOrder.total)}
              highlight
              onCopy={() => copyText(String(Math.round(qrOrder.total)))}
            />
            <InfoRow
              label="Nội dung CK"
              value={`Thanh toan ${qrOrder.orderNumber}`}
              onCopy={() => copyText(`Thanh toan ${qrOrder.orderNumber}`)}
            />
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Nhập đúng nội dung chuyển khoản để đơn hàng được xác nhận tự động.
          Đơn hàng sẽ được xử lý trong vòng 1–2 giờ sau khi nhận thanh toán.
        </p>

        <button
          onClick={() => { toast.success('Cảm ơn! Đơn hàng đang chờ xác nhận.'); navigate('/my-orders'); }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold
            py-3.5 rounded-xl transition text-sm"
        >
          Tôi đã chuyển khoản xong
        </button>

        <button
          onClick={() => navigate('/products')}
          className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50
            font-medium py-3 rounded-xl transition text-sm"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  /* ── Checkout form ────────────────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Shipping address */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" /> Địa chỉ giao hàng
            </h2>
            <div>
              <textarea
                {...register('shippingAddress')}
                rows={3}
                placeholder="Ví dụ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition resize-none
                  ${errors.shippingAddress
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              />
              {errors.shippingAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.shippingAddress.message}</p>
              )}
            </div>
          </div>

          {/* Warehouse */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Warehouse size={16} className="text-blue-600" /> Kho giao hàng
            </h2>
            <div>
              <select
                {...register('warehouseId')}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition bg-white
                  ${errors.warehouseId
                    ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
              >
                <option value="">-- Chọn kho giao --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {[w.city, w.country].filter(Boolean).join(', ')}
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <p className="text-red-500 text-xs mt-1">{errors.warehouseId.message}</p>
              )}
            </div>
          </div>

          {/* Payment method selector */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h2 className="font-semibold text-gray-900">Phương thức thanh toán</h2>

            {/* VNPay option */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition
              ${payMethod === 'vnpay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio" name="payMethod" value="vnpay"
                checked={payMethod === 'vnpay'}
                onChange={() => setPayMethod('vnpay')}
                className="accent-blue-600"
              />
              <CreditCard size={20} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">VNPay</p>
                <p className="text-xs text-gray-400">ATM, Visa, Mastercard, VNPAY QR</p>
              </div>
            </label>

            {/* VietQR option */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition
              ${payMethod === 'qr' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio" name="payMethod" value="qr"
                checked={payMethod === 'qr'}
                onChange={() => setPayMethod('qr')}
                className="accent-green-600"
              />
              <QrCode size={20} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Chuyển khoản QR</p>
                <p className="text-xs text-gray-400">Vietcombank · {BANK.acc} · {BANK.name}</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full flex items-center justify-center gap-2
              text-white font-semibold py-4 rounded-xl transition text-sm
              ${payMethod === 'qr'
                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'}`}
          >
            {isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Đang xử lý...</>
            ) : payMethod === 'qr' ? (
              <><QrCode size={18} /> Đặt hàng & Xem mã QR • {formatCurrency(total)}</>
            ) : (
              <><CreditCard size={18} /> Đặt hàng & Thanh toán VNPay • {formatCurrency(total)}</>
            )}
          </button>
        </form>

        {/* Order summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">
            Đơn hàng ({items.length} sản phẩm)
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={14} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name ?? `Sản phẩm #${item.productId}`}
                  </p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <hr className="my-4 border-gray-100" />
          <div className="flex justify-between font-bold text-gray-900">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper component ──────────────────────────────────── */
function InfoRow({ label, value, highlight, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`text-sm font-medium truncate ${highlight ? 'text-green-600 font-bold' : 'text-gray-900'}`}>
          {value}
        </span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-400 hover:text-gray-700 transition shrink-0">
            <Copy size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
