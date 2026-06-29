// Format tiền VND
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style:    'currency',
    currency: 'VND',
  }).format(amount);
};

// Format ngày tháng
export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
    hour:  '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// Format trạng thái đơn hàng
export const formatOrderStatus = (status) => {
  const map = {
    pending:    { label: 'Chờ xác nhận', color: 'yellow' },
    confirmed:  { label: 'Đã xác nhận',  color: 'blue' },
    processing: { label: 'Đang xử lý',   color: 'orange' },
    shipping:   { label: 'Đang giao',    color: 'purple' },
    delivered:  { label: 'Đã giao',      color: 'green' },
    cancelled:  { label: 'Đã huỷ',       color: 'red' },
  };
  return map[status] || { label: status, color: 'gray' };
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};