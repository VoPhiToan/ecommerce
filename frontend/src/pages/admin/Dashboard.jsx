import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ShoppingCart, DollarSign, Package, Users, TrendingUp, AlertCircle,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard.api';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_LABELS = {
  pending:    'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipped:    'Đang giao',
  delivered:  'Đã giao',
  cancelled:  'Đã huỷ',
};

const STATUS_STYLE = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

const ORDER_STATUS_COLORS = {
  pending:    '#F59E0B',
  processing: '#3B82F6',
  shipped:    '#8B5CF6',
  delivered:  '#10B981',
  cancelled:  '#EF4444',
};

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn:  () => dashboardApi.overview().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-xl">
        <AlertCircle size={20} />
        <span>Không thể tải dữ liệu dashboard</span>
      </div>
    );
  }

  const { metrics, topProducts = [], recentOrders = [] } = data || {};
  const { sales, users, products, orderStatus = [] } = metrics || {};

  const chartData = orderStatus.map(s => ({
    name:  STATUS_LABELS[s.order_status] || s.order_status,
    count: s.count,
    fill:  ORDER_STATUS_COLORS[s.order_status] || '#6B7280',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Tổng đơn hàng"
          value={sales?.total_orders ?? 0}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Doanh thu"
          value={formatCurrency(sales?.total_revenue ?? 0)}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Sản phẩm"
          value={products?.total_products ?? 0}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Người dùng"
          value={users?.total_users ?? 0}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Order status chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Trạng thái đơn hàng
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Đơn hàng']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top sản phẩm bán chạy</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">{p.total_sold} bán</p>
                    <p className="text-xs text-green-600">{formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-6 py-3 text-left">Mã đơn</th>
                <th className="px-6 py-3 text-left">Khách hàng</th>
                <th className="px-6 py-3 text-left">Tổng tiền</th>
                <th className="px-6 py-3 text-left">Trạng thái</th>
                <th className="px-6 py-3 text-left">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length > 0 ? recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {order.user_email ?? `#${order.user_id}`}
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                        ${STATUS_STYLE[order.order_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.order_status] ?? order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.placed_at)}</td>
                  </tr>
                )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Chưa có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
