import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ArrowDown, ArrowUp, History, X, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../api/inventory.api';
import { warehouseApi } from '../../api/warehouse.api';
import { productApi } from '../../api/product.api';

const TX_STYLE = {
  in:      'bg-blue-100 text-blue-700',
  out:     'bg-orange-100 text-orange-700',
  reserve: 'bg-amber-100 text-amber-700',
  release: 'bg-green-100 text-green-700',
};

const TX_LABEL = {
  in:      'Nhập',
  out:     'Xuất',
  reserve: 'Đặt trước',
  release: 'Giải phóng',
};

export default function Inventory() {
  const qc = useQueryClient();
  const [warehouseId, setWarehouseId] = useState('');
  const [modal,       setModal]       = useState(null); // null | 'in' | 'out' | 'history'
  const [historyItem, setHistoryItem] = useState(null); // { productId, name }
  const [form,        setForm]        = useState({ productId: '', quantity: '', notes: '' });

  // Warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn:  () => warehouseApi.getAll().then(r => r.data.data),
  });
  const warehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData?.warehouses ?? []);

  // Stock in selected warehouse
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['inventory', warehouseId],
    queryFn:  () => inventoryApi.getByWarehouse(warehouseId).then(r => r.data.data),
    enabled:  !!warehouseId,
  });
  const stocks = Array.isArray(stockData) ? stockData : [];

  // Products for name lookup + dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn:  () => productApi.getAll({ limit: 1000 }).then(r => r.data.data),
  });
  const products   = productsData?.products ?? [];
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

  // History for a product in selected warehouse
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-history', warehouseId, historyItem?.productId],
    queryFn:  () => inventoryApi.getHistory(warehouseId, historyItem.productId).then(r => r.data.data),
    enabled:  !!warehouseId && !!historyItem,
  });
  const history = Array.isArray(historyData) ? historyData : [];

  const stockInMutation = useMutation({
    mutationFn: (data) => inventoryApi.stockIn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', warehouseId] });
      setModal(null);
      toast.success('Nhập kho thành công');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Nhập kho thất bại'),
  });

  const stockOutMutation = useMutation({
    mutationFn: (data) => inventoryApi.stockOut(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', warehouseId] });
      setModal(null);
      toast.success('Xuất kho thành công');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xuất kho thất bại'),
  });

  const openTransactionModal = (type, item) => {
    setForm({ productId: item?.productId?.toString() ?? '', quantity: '', notes: '' });
    setModal(type);
  };

  const openHistory = (item) => {
    setHistoryItem({ productId: item.productId, name: productMap[item.productId] ?? `#${item.productId}` });
    setModal('history');
  };

  const handleSubmit = () => {
    const qty = parseInt(form.quantity);
    if (!form.productId || !qty || qty <= 0) {
      toast.error('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ');
      return;
    }
    const payload = {
      warehouseId: parseInt(warehouseId),
      productId:   parseInt(form.productId),
      quantity:    qty,
      notes:       form.notes || undefined,
    };
    if (modal === 'in') {
      stockInMutation.mutate(payload);
    } else {
      stockOutMutation.mutate(payload);
    }
  };

  const isPending = stockInMutation.isPending || stockOutMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tồn kho</h1>
          <p className="text-gray-500 text-sm mt-0.5">Quản lý nhập/xuất kho hàng</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openTransactionModal('in', null)}
            disabled={!warehouseId}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
          >
            <ArrowDown size={15} /> Nhập kho
          </button>
          <button
            onClick={() => openTransactionModal('out', null)}
            disabled={!warehouseId}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
              disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
          >
            <ArrowUp size={15} /> Xuất kho
          </button>
        </div>
      </div>

      {/* Warehouse selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Chọn kho:</label>
        <select
          value={warehouseId}
          onChange={e => setWarehouseId(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white min-w-48"
        >
          <option value="">-- Chọn kho --</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Stock table */}
      {!warehouseId ? (
        <div className="text-center py-24 text-gray-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>Chọn kho để xem tồn kho</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Tổng tồn</th>
                  <th className="px-4 py-3 text-right">Đã đặt</th>
                  <th className="px-4 py-3 text-right">Khả dụng</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stockLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : stocks.length > 0 ? stocks.map(s => {
                  const available = s.availableQuantity ?? (s.quantity - s.reservedQuantity);
                  return (
                    <tr key={s.id ?? `${s.warehouseId}-${s.productId}`} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {productMap[s.productId] ?? `Sản phẩm #${s.productId}`}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{s.quantity ?? 0}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-600">{s.reservedQuantity ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold font-mono ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openTransactionModal('in', s)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            title="Nhập kho"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => openTransactionModal('out', s)}
                            className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition"
                            title="Xuất kho"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => openHistory(s)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            title="Lịch sử"
                          >
                            <History size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                      <Package size={36} className="mx-auto mb-3 opacity-30" />
                      Kho này chưa có hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock In / Out Modal */}
      {(modal === 'in' || modal === 'out') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'in' ? 'Nhập kho' : 'Xuất kho'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sản phẩm</label>
                <select
                  value={form.productId}
                  onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Nhập số lượng..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ghi chú..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium
                  text-gray-700 hover:bg-gray-50 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition
                  ${modal === 'in'
                    ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                    : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'}`}
              >
                {isPending ? 'Đang xử lý...' : modal === 'in' ? 'Xác nhận nhập' : 'Xác nhận xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {modal === 'history' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lịch sử giao dịch</h2>
                <p className="text-sm text-gray-500">{historyItem?.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="p-8 text-center text-gray-400">Đang tải...</div>
              ) : history.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="text-gray-500 text-xs uppercase">
                      <th className="px-4 py-3 text-left">Loại</th>
                      <th className="px-4 py-3 text-right">Số lượng</th>
                      <th className="px-4 py-3 text-left">Ghi chú</th>
                      <th className="px-4 py-3 text-left">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {history.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                            ${TX_STYLE[h.transactionType] ?? 'bg-gray-100 text-gray-600'}`}>
                            {TX_LABEL[h.transactionType] ?? h.transactionType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{h.quantity}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{h.notes || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {h.createdAt ? new Date(h.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
