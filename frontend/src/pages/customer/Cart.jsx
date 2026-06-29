import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi } from '../../api/cart.api';
import { formatCurrency } from '../../utils/format';

export default function Cart() {
  const qc       = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => cartApi.get().then(r => r.data.data),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const refetch = () => qc.invalidateQueries({ queryKey: ['cart'] });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartApi.update({ productId, quantity }),
    onSuccess: (res) => { qc.setQueryData(['cart'], res.data.data); },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => cartApi.remove(productId),
    onSuccess: (res) => { qc.setQueryData(['cart'], res.data.data); },
    onError: () => toast.error('Xoá thất bại'),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => { refetch(); toast.success('Đã xoá giỏ hàng'); },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex gap-4 animate-pulse">
            <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <ShoppingCart size={56} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-400 text-sm mb-6">Hãy thêm sản phẩm vào giỏ để tiếp tục</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
        >
          Mua sắm ngay <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="text-sm text-red-500 hover:text-red-700 transition"
        >
          Xoá tất cả
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-gray-100">
            {/* Image */}
            <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImagePlus size={20} className="text-gray-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm truncate">{item.name ?? `Sản phẩm #${item.productId}`}</h3>
              <p className="text-blue-600 font-bold mt-1">{formatCurrency(item.unitPrice)}</p>

              <div className="flex items-center justify-between mt-3">
                {/* Qty controls */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      if (item.quantity <= 1) {
                        removeMutation.mutate(item.productId);
                      } else {
                        updateMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 });
                      }
                    }}
                    className="px-2.5 py-1.5 hover:bg-gray-100 transition text-gray-600"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium min-w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                    className="px-2.5 py-1.5 hover:bg-gray-100 transition text-gray-600"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeMutation.mutate(item.productId)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tạm tính ({items.length} sản phẩm)</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Phí giao hàng</span>
          <span className="text-green-600">Miễn phí</span>
        </div>
        <hr className="border-gray-100" />
        <div className="flex justify-between font-bold text-gray-900">
          <span>Tổng cộng</span>
          <span className="text-blue-600 text-lg">{formatCurrency(total)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white font-semibold py-3.5 rounded-xl transition text-sm mt-2"
        >
          Tiến hành thanh toán <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
