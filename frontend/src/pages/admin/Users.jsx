import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/user.api';
import { formatDate } from '../../utils/format';

const ROLE_STYLE = {
  admin:    'bg-red-100 text-red-700',
  staff:    'bg-blue-100 text-blue-700',
  manager:  'bg-purple-100 text-purple-700',
  customer: 'bg-gray-100 text-gray-600',
};

const ROLE_LABEL = {
  admin:    'Admin',
  staff:    'Nhân viên',
  manager:  'Quản lý',
  customer: 'Khách hàng',
};

export default function Users() {
  const qc = useQueryClient();
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editing,    setEditing]    = useState(null); // user object being edited
  const [editForm,   setEditForm]   = useState({ role: '', isActive: true });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn:  () => userApi.getAll().then(r => r.data.data),
  });

  const allUsers = Array.isArray(data) ? data : (data?.users ?? []);

  const users = useMemo(() => {
    let result = allUsers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        (u.first_name ?? u.firstName ?? '').toLowerCase().includes(q) ||
        (u.last_name  ?? u.lastName  ?? '').toLowerCase().includes(q)
      );
    }
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    return result;
  }, [allUsers, search, roleFilter]);

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => userApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      toast.success('Đã cập nhật người dùng');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Cập nhật thất bại'),
  });

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({ role: u.role, isActive: !!(u.is_active ?? u.isActive) });
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editing.id, role: editForm.role, isActive: editForm.isActive });
  };

  if (isError) {
    const msg    = error?.response?.data?.message || error?.message || 'Unknown error';
    const status = error?.response?.status;
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm space-y-1">
        <p className="font-medium">Không thể tải danh sách người dùng</p>
        <p className="text-xs opacity-75">{status ? `HTTP ${status}: ` : ''}{msg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {users.length !== allUsers.length
            ? `${users.length} / ${allUsers.length} tài khoản`
            : `${allUsers.length} tài khoản`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm email hoặc tên..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300
              focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700"
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_LABEL).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {(search || roleFilter) && (
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition"
          >
            Xoá bộ lọc
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Người dùng</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Vai trò</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày tạo</th>
                <th className="px-4 py-3 text-center">Hành động</th>
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
              ) : users.length > 0 ? users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
                        text-white text-xs font-bold shrink-0">
                        {u.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">
                        {[u.first_name ?? u.firstName, u.last_name ?? u.lastName].filter(Boolean).join(' ') || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${ROLE_STYLE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${(u.is_active ?? u.isActive)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      {(u.is_active ?? u.isActive) ? 'Hoạt động' : 'Khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {(u.created_at ?? u.createdAt) ? formatDate(u.created_at ?? u.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                        text-gray-600 hover:bg-gray-100 transition"
                    >
                      <Pencil size={13} /> Sửa
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {search || roleFilter ? 'Không tìm thấy tài khoản nào' : 'Không có người dùng nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa người dùng</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-3">{editing.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vai trò</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(ROLE_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-gray-700">Trạng thái tài khoản</span>
                <button
                  onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200
                    ${editForm.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                    transition-transform duration-200
                    ${editForm.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                {editForm.isActive ? 'Đang hoạt động' : 'Đã khoá'}
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                  text-sm font-semibold text-white transition"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
