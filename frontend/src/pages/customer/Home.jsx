import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, ArrowRight, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi } from '../../api/product.api';
import { categoryApi } from '../../api/category.api';
import { cartApi } from '../../api/cart.api';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../utils/format';

function ProductCard({ product }) {
  const { isLoggedIn } = useAuthStore();
  const qc             = useQueryClient();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Vui lòng đăng nhập để thêm vào giỏ'); return; }
    try {
      const res = await cartApi.add({ productId: product.id, quantity: 1 });
      qc.setQueryData(['cart'], res.data.data);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm thất bại');
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md
        transition overflow-hidden group flex flex-col"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden">
        {product.image_url ?? product.imageUrl ? (
          <img
            src={product.image_url ?? product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlus size={32} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{product.category_name ?? ''}</p>
        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="font-bold text-blue-600">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAdd}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600
              hover:text-white transition shrink-0"
          >
            <ShoppingCart size={15} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { data: prodData } = useQuery({
    queryKey: ['products-home'],
    queryFn:  () => productApi.getAll({ page: 1, limit: 8 }).then(r => r.data.data),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.getAll().then(r => r.data.data),
  });

  const products   = prodData?.products ?? [];
  const categories = Array.isArray(catData) ? catData : (catData?.categories ?? []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
            Mua sắm dễ dàng,<br />giao hàng nhanh chóng
          </h1>
          <p className="text-blue-100 mb-6 text-sm md:text-base">
            Khám phá hàng nghìn sản phẩm chất lượng với giá tốt nhất.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold
              px-6 py-3 rounded-xl hover:bg-blue-50 transition text-sm"
          >
            Mua ngay <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Danh mục</h2>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/products"
              className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm
                font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
            >
              Tất cả
            </Link>
            {categories.map(c => (
              <Link
                key={c.id}
                to={`/products?categoryId=${c.id}`}
                className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm
                  font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
          <Link
            to="/products"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <ImagePlus size={40} className="mx-auto mb-3 opacity-50" />
            <p>Chưa có sản phẩm</p>
          </div>
        )}
      </section>
    </div>
  );
}
