import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ShoppingBag } from 'lucide-react';

export default function PaymentResult() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();

  const success = params.get('success') === 'true';
  const orderId = params.get('orderId');
  const message = params.get('message') || (success ? 'Thanh toán thành công' : 'Thanh toán thất bại');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">

        {success ? (
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <XCircle size={48} className="text-red-500" />
            </div>
          </div>
        )}

        <h1 className={`text-2xl font-bold mb-2 ${success ? 'text-green-700' : 'text-red-700'}`}>
          {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>

        <p className="text-gray-500 text-sm mb-1">{message}</p>

        {orderId && (
          <p className="text-gray-400 text-xs mt-2">
            Mã đơn hàng: <span className="font-mono font-semibold text-gray-600">#{orderId}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {success ? (
            <button
              onClick={() => navigate('/my-orders')}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700
                text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Xem đơn hàng của tôi <ArrowRight size={16} />
            </button>
          ) : (
            <>
              {orderId && (
                <button
                  onClick={() => navigate('/my-orders')}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700
                    text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  Xem đơn hàng của tôi <ArrowRight size={16} />
                </button>
              )}
              <button
                onClick={() => navigate('/products')}
                className="flex items-center justify-center gap-2 w-full border border-gray-300
                  hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition text-sm"
              >
                <ShoppingBag size={16} /> Tiếp tục mua sắm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
