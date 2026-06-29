import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { orderApi } from '../../api/order.api';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUSES = [
  { value: '',           label: 'Tất cả' },
  { value: 'pending',    label: 'Chờ xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped',    label: 'Đang giao' },
  { value: 'delivered',  label: 'Đã giao' },
  { value: 'cancelled',  label: 'Đã huỷ' },
];

const PAYMENT_LABELS = {
  pending:  { label: 'Chưa TT',    cls: 'bg-yellow-100 text-yellow-700' },
  paid:     { label: 'Đã TT',      cls: 'bg-green-100 text-green-700' },
  failed:   { label: 'Thất bại',   cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'Hoàn tiền',  cls: 'bg-purple-100 text-purple-700' },
};

const STATUS_COLOR = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function Orders() {
  const qc = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage]                 = useState(1);
  const [updating, setUpdating]         = useState(null);

  const { data, isLoading } = useQuery({
    queryKey:        ['orders', activeStatus, page],
    queryFn:         () => orderApi.getAll({
      ...(activeStatus ? { status: activeStatus } : {}),
      page,
      limit: 20,
    }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  const orders     = data?.orders ?? [];
  const pagination = data?.pagination ?? {};
  const totalPages = pagination.totalPages ?? 1;

  const handleTabChange = (val) => { setActiveStatus(val); setPage(1); };

  const updateMutation = useMutation({
    mutationFn: ({ id, orderStatus }) => orderApi.updateStatus(id, { orderStatus }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công');
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdating(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pagination.total != null ? `${pagination.total} đơn hàng` : ''}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => handleTabChange(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeStatus === s.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Địa chỉ</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái đơn</th>
                <th className="px-4 py-3 text-center">Thanh toán</th>
                <th className="px-4 py-3 text-left">Ngày đặt</th>
                <th className="px-4 py-3 text-center">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length > 0 ? orders.map(order => {
                const pay = PAYMENT_LABELS[order.paymentStatus] ||
                  { label: order.paymentStatus, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>
                        <span>#{order.id}</span>
                        <p className="text-xs text-gray-400 font-normal font-mono">
                          {order.orderNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {order.userEmail ?? `User #${order.userId}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-36 truncate text-xs">
                      {order.shippingAddress ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                        ${STATUS_COLOR[order.orderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUSES.find(s => s.value === order.orderStatus)?.label ?? order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${pay.cls}`}>
                        {pay.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(order.placedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {updating === order.id ? (
                        <select
                          autoFocus
                          defaultValue={order.orderStatus}
                          onBlur={() => setUpdating(null)}
                          onChange={e => updateMutation.mutate({ id: order.id, orderStatus: e.target.value })}
                          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                        >
                          {STATUSES.filter(s => s.value).map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setUpdating(order.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200
                            hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition"
                        >
                          Đổi
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Trang {page} / {totalPages} &middot; {pagination.total} đơn
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
