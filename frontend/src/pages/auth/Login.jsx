import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';

const schema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const { setAuth } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { accessToken, user } = res.data;

      setAuth(user, accessToken);
      toast.success(`Chào mừng ${user.email}!`);

      // Redirect theo role
      if (['admin', 'staff'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-xl mb-3">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">E-Commerce</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập vào tài khoản của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition
                ${errors.email
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`w-full px-4 py-3 pr-11 rounded-lg border text-sm outline-none transition
                  ${errors.password
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-semibold py-3 rounded-lg transition text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang đăng nhập...
              </span>
            ) : 'Đăng nhập'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-gray-200" />
          <span className="text-gray-400 text-xs">hoặc</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>

        {/* Test accounts */}
        {import.meta.env.DEV && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-xs font-semibold text-gray-500 mb-2">🧪 Tài khoản test:</p>
            <p className="text-xs text-gray-500">Admin: admin@test.com / password123</p>
            <p className="text-xs text-gray-500">Customer: customer@test.com / password123</p>
          </div>
        )}
      </div>
    </div>
  );
} 