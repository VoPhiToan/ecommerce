import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Warehouse as WarehouseIcon } from 'lucide-react';
import { warehouseApi } from '../../api/warehouse.api';

const schema = z.object({
  name:       z.string().min(1, 'Tên kho là bắt buộc'),
  address:    z.string().min(1, 'Địa chỉ là bắt buộc'),
  country:    z.string().min(1, 'Quốc gia là bắt buộc'),
  city:       z.string().optional(),
  state:      z.string().optional(),
  postalCode: z.string().optional(),
});

const inputClass = (err) =>
  `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition
   ${err ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`;

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function Warehouses() {
  const qc = useQueryClient();
  const [modal, setModal]       = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn:  () => warehouseApi.getAll().then(r => r.data.data),
  });

  const warehouses = Array.isArray(data) ? data : (data?.warehouses ?? []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const openCreate = () => { reset(); setModal('create'); };

  const openEdit = (w) => {
    setEditing(w);
    reset({
      name:       w.name,
      address:    w.address,
      country:    w.country,
      city:       w.city ?? '',
      state:      w.state ?? '',
      postalCode: w.postal_code ?? w.postalCode ?? '',
    });
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const createMutation = useMutation({
    mutationFn: (data) => warehouseApi.create(data),
    onSuccess: () => {
      toast.success('Thêm kho thành công');
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Thêm thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehouseApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => warehouseApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá kho');
      qc.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xoá thất bại'),
  });

  const onSubmit = (values) => {
    if (modal === 'edit') {
      updateMutation.mutate({ id: editing.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">{warehouses.length} kho</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
            px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Thêm kho
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : warehouses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div key={w.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                    <WarehouseIcon size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{w.name}</h3>
                    <p className="text-xs text-gray-400">ID #{w.id}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(w)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(w.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="truncate">{w.address}</p>
                <p className="text-gray-400">
                  {[w.city, w.state, w.country].filter(Boolean).join(', ')}
                  {(w.postal_code ?? w.postalCode) && ` ${w.postal_code ?? w.postalCode}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          Chưa có kho hàng nào
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {modal === 'create' ? 'Thêm kho hàng' : 'Chỉnh sửa kho hàng'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Field label="Tên kho *" error={errors.name?.message}>
                <input {...register('name')} className={inputClass(errors.name)} placeholder="Kho Hà Nội" />
              </Field>
              <Field label="Địa chỉ *" error={errors.address?.message}>
                <input {...register('address')} className={inputClass(errors.address)} placeholder="123 Đường ABC" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thành phố" error={errors.city?.message}>
                  <input {...register('city')} className={inputClass(errors.city)} placeholder="Hà Nội" />
                </Field>
                <Field label="Tỉnh/Vùng" error={errors.state?.message}>
                  <input {...register('state')} className={inputClass(errors.state)} placeholder="Hà Nội" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quốc gia *" error={errors.country?.message}>
                  <input {...register('country')} className={inputClass(errors.country)} placeholder="Vietnam" />
                </Field>
                <Field label="Mã bưu chính" error={errors.postalCode?.message}>
                  <input {...register('postalCode')} className={inputClass(errors.postalCode)} placeholder="100000" />
                </Field>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700
                    disabled:bg-blue-400 text-white text-sm font-medium transition"
                >
                  {isSubmitting ? 'Đang lưu...' : modal === 'create' ? 'Thêm kho' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Xoá kho hàng?</h3>
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
