import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, User, LogOut, Package, Home, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { cartApi } from '../../api/cart.api';
import { authApi } from '../../api/auth.api';

export default function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Lấy cart count từ cache query — tự đồng bộ khi giỏ hàng thay đổi
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => cartApi.get().then(r => r.data.data),
    enabled:  isLoggedIn,
    staleTime: 60_000,
  });
  const cartCount = cartData?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (_) {}
    logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  const navLinks = [
    { to: '/',         label: 'Trang chủ', icon: Home,    end: true },
    { to: '/products', label: 'Sản phẩm',  icon: Package, end: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">E-Commerce</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition
                  ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white
                  text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isLoggedIn ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center
                    text-white text-xs font-bold">
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-24 truncate">
                    {user?.email}
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg
                  border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-150 z-30">
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Package size={15} /> Đơn hàng của tôi
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                  text-white rounded-lg text-sm font-medium transition"
              >
                <User size={15} /> Đăng nhập
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-2 space-y-1">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-lg text-sm font-medium
                  ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
