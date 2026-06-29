import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Warehouse, Boxes, ChevronLeft, ChevronRight, LogOut,
  Bell, Menu, X, ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../api/auth.api';

const navItems = [
  { path: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { path: '/admin/products',   label: 'Sản phẩm',   icon: Package },
  { path: '/admin/orders',     label: 'Đơn hàng',   icon: ShoppingCart },
  { path: '/admin/users',      label: 'Người dùng', icon: Users },
  { path: '/admin/warehouses', label: 'Kho hàng',   icon: Warehouse },
  { path: '/admin/inventory',  label: 'Tồn kho',    icon: Boxes },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {
      // ignore
    } finally {
      logout();
      toast.success('Đã đăng xuất');
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        flex flex-col bg-gray-900 text-white transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-700 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <ShoppingBag size={18} />
              </div>
              <span className="font-bold text-base">E-Commerce</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto bg-blue-600 p-1.5 rounded-lg">
              <ShoppingBag size={18} />
            </div>
          )}

          {/* Collapse button — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7
              rounded-lg hover:bg-gray-700 transition text-gray-400"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ path, label, icon: Icon, end }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={end}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-150 group
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}

                  {/* Tooltip khi collapsed */}
                  {collapsed && (
                    <div className="
                      absolute left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-xs
                      rounded-md opacity-0 group-hover:opacity-100 pointer-events-none
                      whitespace-nowrap transition-opacity z-50
                    ">
                      {label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-700 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
              text-gray-400 hover:bg-gray-800 hover:text-red-400 transition text-sm"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shrink-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700 leading-none">{user?.email}</p>
                <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}