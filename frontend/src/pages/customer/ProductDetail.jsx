import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, ArrowLeft, Plus, Minus, ImagePlus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi } from '../../api/product.api';
import { cartApi } from '../../api/cart.api';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { isLoggedIn } = useAuthStore();
  const qc             = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => productApi.getById(id).then(r => r.data.data),
  });

  const product = data;

  const handleAdd = async () => {
    if (!isLoggedIn) { toast.error('Vui lòng đăng nhập để thêm vào giỏ'); return; }
    setAdding(true);
    try {
      const res = await cartApi.add({ productId: product.id, quantity: qty });
      qc.setQueryData(['cart'], res.data.data);
      toast.success(`Đã thêm ${qty} sản phẩm vào giỏ`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm thất bại');
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl" />
          <div className="space-y-4 py-4">
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft size={15} /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          {product.image_url ?? product.imageUrl ? (
            <img
              src={product.image_url ?? product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImagePlus size={48} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col py-2">
          <p className="text-sm text-gray-400 mb-2">
            {product.category_name ?? product.categoryName ?? ''} · SKU: {product.sku}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">{formatCurrency(product.price)}</p>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-medium text-gray-700">Số lượng:</span>
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition text-gray-600"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 py-2 text-sm font-semibold min-w-10 text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="px-3 py-2 hover:bg-gray-100 transition text-gray-600"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={adding || !(product.is_active ?? product.isActive)}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700
              disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition text-sm"
          >
            {adding ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang thêm...
              </span>
            ) : (
              <>
                <ShoppingCart size={18} />
                {(product.is_active ?? product.isActive) ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
