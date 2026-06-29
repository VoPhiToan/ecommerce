import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, ShoppingCart, ImagePlus, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { productApi } from '../../api/product.api';
import { categoryApi } from '../../api/category.api';
import { cartApi } from '../../api/cart.api';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../utils/format';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,     setSearch]     = useState(searchParams.get('search') || '');
  const [page,       setPage]        = useState(1);
  const [categoryId, setCategoryId]  = useState(searchParams.get('categoryId') || '');

  const { isLoggedIn } = useAuthStore();
  const qc             = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryId],
    queryFn:  () => productApi.getAll({
      page, limit: 12, search: search || undefined, categoryId: categoryId || undefined,
    }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.getAll().then(r => r.data.data),
  });

  const products   = data?.products ?? [];
  const pagination = data?.pagination ?? {};
  const totalPages = pagination.totalPages ?? 1;
  const categories = Array.isArray(catData) ? catData : (catData?.categories ?? []);

  const handleAdd = async (e, product) => {
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
        <p className="text-gray-500 text-sm mt-0.5">{pagination.total ?? 0} sản phẩm</p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-gray-400 shrink-0" />
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-gray-300 text-sm outline-none
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md
                transition overflow-hidden group flex flex-col"
            >
              <div className="aspect-square bg-gray-50 overflow-hidden">
                {p.image_url ?? p.imageUrl ? (
                  <img
                    src={p.image_url ?? p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImagePlus size={32} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{p.category_name ?? ''}</p>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{p.name}</h3>
                <div className="flex items-center justify-between mt-3 gap-2">
                  <span className="font-bold text-blue-600 text-sm">{formatCurrency(p.price)}</span>
                  <button
                    onClick={e => handleAdd(e, p)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600
                      hover:text-white transition shrink-0"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <ImagePlus size={40} className="mx-auto mb-3 opacity-50" />
          <p>Không tìm thấy sản phẩm nào</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => Math.abs(n - page) <= 2)
            .map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition
                  ${page === n
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-100 text-gray-700'}`}
              >
                {n}
              </button>
            ))}
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
