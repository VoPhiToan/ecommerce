import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { productApi } from '../../api/product.api';
import { categoryApi } from '../../api/category.api';
import { formatCurrency } from '../../utils/format';

const schema = z.object({
  name:        z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  sku:         z.string().min(1, 'SKU là bắt buộc'),
  price:       z.coerce.number().min(1, 'Giá phải lớn hơn 0'),
  categoryId:  z.coerce.number().min(1, 'Vui lòng chọn danh mục'),
  description: z.string().optional(),
  stock:       z.coerce.number().min(0).optional(),
});

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass = (err) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition
   ${err ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`;

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [preview, setPreview]   = useState(null);
  const fileRef                 = useRef();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryId],
    queryFn:  () => productApi.getAll({
      page, limit: 10, search,
      ...(categoryId ? { categoryId } : {}),
    }).then(r => r.data.data),
    placeholderData: keepPreviousData,
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => categoryApi.getAll().then(r => r.data.data),
  });

  const categories = Array.isArray(catData) ? catData : (catData?.categories ?? []);
  const products   = data?.products ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const resetFilters = () => { setSearch(''); setCategoryId(''); setPage(1); };

  const openCreate = () => {
    reset(); setPreview(null); setModal('create');
  };

  const openEdit = (p) => {
    setEditing(p);
    reset({
      name: p.name, sku: p.sku, price: p.price,
      categoryId: p.category_id ?? p.categoryId,
      description: p.description ?? '',
      stock: p.stock ?? 0,
    });
    setPreview(p.image_url ?? p.imageUrl ?? null);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); setPreview(null); };

  const createMutation = useMutation({
    mutationFn: (fd) => productApi.create(fd),
    onSuccess: () => {
      toast.success('Thêm sản phẩm thành công');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Thêm thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => productApi.update(id, fd),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      qc.invalidateQueries({ queryKey: ['products'] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá sản phẩm');
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xoá thất bại'),
  });

  const onSubmit = (values) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, v); });
    if (fileRef.current?.files[0]) fd.append('image', fileRef.current.files[0]);

    if (modal === 'edit') {
      updateMutation.mutate({ id: editing.id, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-0.5">{data?.pagination?.total ?? 0} sản phẩm</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
            px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none"
          />
        </div>
        <select
          value={categoryId}
          onChange={e => { setCategoryId(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {(search || categoryId) && (
          <button
            onClick={resetFilters}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Sản phẩm</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Danh mục</th>
                <th className="px-4 py-3 text-right">Giá</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length > 0 ? products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url || p.imageUrl ? (
                        <img
                          src={p.image_url ?? p.imageUrl}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImagePlus size={14} className="text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 max-w-[180px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category_name ?? p.categoryName ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${p.is_active ?? p.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ?? p.isActive ? 'Đang bán' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Trang {page} / {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Thêm sản phẩm' : 'Chỉnh sửa sản phẩm'} onClose={closeModal}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image upload */}
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl
                flex flex-col items-center justify-center p-4 hover:border-blue-400 transition min-h-[120px]"
            >
              {preview ? (
                <img src={preview} alt="preview" className="h-24 object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <ImagePlus size={28} />
                  <span className="text-sm">Chọn ảnh sản phẩm</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên sản phẩm *" error={errors.name?.message}>
                <input {...register('name')} className={inputClass(errors.name)} placeholder="iPhone 15 Pro" />
              </Field>
              <Field label="SKU *" error={errors.sku?.message}>
                <input {...register('sku')} className={inputClass(errors.sku)} placeholder="IP15P-BLK" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá (VND) *" error={errors.price?.message}>
                <input type="number" {...register('price')} className={inputClass(errors.price)} placeholder="29990000" />
              </Field>
              <Field label="Danh mục *" error={errors.categoryId?.message}>
                <select {...register('categoryId')} className={inputClass(errors.categoryId)}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Mô tả" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={inputClass(errors.description)}
                placeholder="Mô tả sản phẩm..."
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300
                  text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700
                  disabled:bg-blue-400 text-white text-sm font-medium transition"
              >
                {isSubmitting ? 'Đang lưu...' : modal === 'create' ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Xoá sản phẩm?</h3>
            <p className="text-sm text-gray-500 mb-5">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700
                  disabled:bg-red-400 text-white text-sm font-medium transition"
              >
                {deleteMutation.isPending ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
