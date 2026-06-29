import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layouts
import AdminLayout  from './components/layout/AdminLayout';
import CustomerLayout from './components/layout/CustomerLayout';

// Auth pages
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin pages
import Dashboard   from './pages/admin/Dashboard';
import Products    from './pages/admin/Products';
import Orders      from './pages/admin/Orders';
import Users       from './pages/admin/Users';
import Warehouses  from './pages/admin/Warehouses';
import Inventory   from './pages/admin/Inventory';

// Customer pages
import Home          from './pages/customer/Home';
import ProductList   from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Cart          from './pages/customer/Cart';
import Checkout      from './pages/customer/Checkout';
import MyOrders      from './pages/customer/MyOrders';
import PaymentResult from './pages/customer/PaymentResult';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      staleTime:          5 * 60 * 1000, // 5 phút
      refetchOnWindowFocus: false,
    },
  },
});

// Route guard cho admin
const AdminRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!['admin', 'staff'].includes(user?.role)) return <Navigate to="/" />;
  return children;
};

// Route guard cho customer đã login
const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useAuthStore();
  if (!isLoggedIn) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute><AdminLayout /></AdminRoute>
          }>
            <Route index             element={<Dashboard />} />
            <Route path="products"   element={<Products />} />
            <Route path="orders"     element={<Orders />} />
            <Route path="users"      element={<Users />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="inventory"  element={<Inventory />} />
          </Route>

          {/* Customer routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index                element={<Home />} />
            <Route path="products"      element={<ProductList />} />
            <Route path="products/:id"  element={<ProductDetail />} />
            <Route path="cart"          element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="checkout"      element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="my-orders"      element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          </Route>

          {/* Payment result — outside CustomerLayout, full-screen */}
          <Route path="/payment-result" element={<PaymentResult />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#363636', color: '#fff' },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}