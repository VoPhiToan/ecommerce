import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronDown, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';
import { orderApi } from '../../api/order.api';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_STYLE = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  pending:    'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipped:    'Đang giao',
  delivered:  'Đã giao',
  cancelled:  'Đã huỷ',
};

const PAYMENT_LABEL = {
  pending:  { label: 'Chưa thanh toán', cls: 'text-yellow-600' },
  paid:     { label: 'Đã thanh toán',   cls: 'text-green-600' },
  failed:   { label: 'Thất bại',        cls: 'text-red-600' },
  refunded: { label: 'Đã hoàn tiền',    cls: 'text-purple-600' },
};

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const statusStyle = STATUS_STYLE[order.order_status] ?? 'bg-gray-100 text-gray-600';
  const statusLabel = STATUS_LABEL[order.order_status] ?? order.order_status;
  const pay = PAYMENT_LABEL[order.payment_status] ?? { label: order.payment_status, cls: 'text-gray-600' };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="shrink-0 bg-blue-50 p-2.5 rounded-xl">
            <Package size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Đơn hàng #{order.id}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(order.placed_at ?? order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total_amount)}</p>
            <p className={`text-xs ${pay.cls}`}>{pay.label}</p>
          </div>
          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Mobile row */}
      <div className="sm:hidden flex items-center justify-between px-4 pb-3 gap-3">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
          {statusLabel}
        </span>
        <div className="text-right">
          <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total_amount)}</p>
          <p className={`text-xs ${pay.cls}`}>{pay.label}</p>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50">
          {/* Meta info */}
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400 text-xs">Địa chỉ giao:</span>
              <p className="text-gray-700 text-xs mt-0.5">
                {order.shipping_address ?? order.shippingAddress ?? '—'}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">Mã đơn:</span>
              <p className="text-gray-700 text-xs mt-0.5 font-mono">
                {order.order_number ?? order.orderNumber ?? `#${order.id}`}
              </p>
            </div>
          </div>

          {/* Items */}
          {(order.items ?? []).length > 0 && (
            <div className="px-4 pb-3 space-y-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-3 mb-2">
                Sản phẩm
              </p>
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImagePlus size={12} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {item.productName ?? `Sản phẩm #${item.productId}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn:  () => orderApi.getMyOrders().then(r => r.data.data),
  });

  const orders     = data?.orders ?? [];
  const pagination = data?.pagination ?? {};
  const totalPages = pagination.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/5" />
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <p className="text-gray-500 text-sm mt-0.5">{pagination.total ?? orders.length} đơn hàng</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map(o => <OrderRow key={o.id} order={o} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Chưa có đơn hàng nào</p>
          <p className="text-gray-400 text-sm mt-1">Hãy mua sắm và đặt hàng đầu tiên!</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
