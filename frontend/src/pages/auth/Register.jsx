import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShoppingBag, User, Mail, Lock, Phone } from 'lucide-react';
import { authApi } from '../../api/auth.api';

const schema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName:  z.string().min(1, 'Vui lòng nhập tên'),
  email:     z.string().email('Email không hợp lệ'),
  phone:     z.string().optional(),
  password:  z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path:    ['confirmPassword'],
});

export default function Register() {
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]                         = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;
      await authApi.register(submitData);

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
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
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng ký để bắt đầu mua sắm</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Họ và Tên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nguyen"
                  {...register('firstName')}
                  className={`w-full pl-9 pr-3 py-3 rounded-lg border text-sm outline-none transition
                    ${errors.firstName
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Van A"
                  {...register('lastName')}
                  className={`w-full pl-9 pr-3 py-3 rounded-lg border text-sm outline-none transition
                    ${errors.lastName
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
              </div>
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="example@email.com"
                {...register('email')}
                className={`w-full pl-9 pr-3 py-3 rounded-lg border text-sm outline-none transition
                  ${errors.email
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                placeholder="0901234567"
                {...register('phone')}
                className="w-full pl-9 pr-3 py-3 rounded-lg border border-gray-300
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                {...register('password')}
                className={`w-full pl-9 pr-11 py-3 rounded-lg border text-sm outline-none transition
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                {...register('confirmPassword')}
                className={`w-full pl-9 pr-11 py-3 rounded-lg border text-sm outline-none transition
                  ${errors.confirmPassword
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-semibold py-3 rounded-lg transition text-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang đăng ký...
              </span>
            ) : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-gray-200" />
          <span className="text-gray-400 text-xs">hoặc</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}