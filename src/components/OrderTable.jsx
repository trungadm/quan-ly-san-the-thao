import React, { useState } from 'react';
import { Eye, Check, X, Trash2 } from 'lucide-react';

const OrderTable = ({ orders, onSelectOrder, onUpdateStatus, showToast }) => {
  const [list, setList] = useState(orders);

  React.useEffect(() => {
    setList(orders);
  }, [orders]);

  if (!list || list.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a0aec0', fontSize: '14px' }}>
        Không tìm thấy đơn đặt sân nào phù hợp.
      </div>
    );
  }

  const handleAction = (id, newStatus) => {
    try {
      const localOrders = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      const updated = localOrders.map(o => o.id === id ? { ...o, status: newStatus } : o);
      localStorage.setItem('local_bookings', JSON.stringify(updated));
      
      setList(list.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (onUpdateStatus) onUpdateStatus(id, newStatus);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn đặt sân này không?')) {
      try {
        const localOrders = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updated = localOrders.filter(o => o.id !== id);
        localStorage.setItem('local_bookings', JSON.stringify(updated));
        
        setList(list.filter(o => o.id !== id));
        if (showToast) showToast(`Đã xóa đơn #${id} thành công!`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #edf2f7', textAlign: 'left', color: '#4a5568', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ padding: '14px 16px', fontWeight: '700' }}>Mã đơn</th>
            <th style={{ padding: '14px 16px', fontWeight: '700' }}>Khách hàng</th>
            <th style={{ padding: '14px 16px', fontWeight: '700' }}>Ngày đặt</th>
            <th style={{ padding: '14px 16px', fontWeight: '700' }}>Tổng tiền</th>
            <th style={{ padding: '14px 16px', fontWeight: '700' }}>Trạng thái (Đổi nhanh)</th>
            <th style={{ padding: '14px 16px', fontWeight: '700', textAlign: 'center', width: '280px' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {list.map((order) => {
            const statusMap = {
              PENDING: { label: 'Chờ xác nhận', bg: '#feebc8', color: '#c05621' },
              CONFIRMED: { label: 'Đã xác nhận', bg: '#ebf8ff', color: '#2b6cb0' },
              PAID: { label: 'Đã thanh toán', bg: '#c6f6d5', color: '#22543d' },
              CANCELLED: { label: 'Đã hủy', bg: '#fed7d7', color: '#9b2c2c' }
            };
            const currentStatus = statusMap[order.status] || { label: order.status || 'Chờ xác nhận', bg: '#feebc8', color: '#c05621' };

            const isPending = order.status === 'PENDING';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'Đã hủy';
            const isPaid = order.status === 'PAID';

            return (
              <tr 
                key={order.id} 
                style={{ 
                  borderBottom: '1px solid #edf2f7', 
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 'bold', color: '#4a5568' }}>
                  #{order.id}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#2d3748' }}>
                  {order.customerName || order.customer_name}
                </td>
                <td style={{ padding: '14px 16px', color: '#718096' }}>
                  {order.bookingDate || order.booking_date}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#e53e3e' }}>
                  {Number(order.totalAmount || order.total_amount || 0).toLocaleString('vi-VN')} VNĐ
                </td>

                {/* Đổi nhanh trạng thái trực tiếp bằng Dropdown */}
                <td style={{ padding: '14px 16px' }}>
                  <select
                    value={order.status || 'PENDING'}
                    onChange={(e) => handleAction(order.id, e.target.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: currentStatus.bg,
                      color: currentStatus.color,
                      fontSize: '11px',
                      fontWeight: '700',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="PENDING" style={{ background: '#fff', color: '#333' }}>Chờ xác nhận</option>
                    <option value="CONFIRMED" style={{ background: '#fff', color: '#333' }}>Đã xác nhận</option>
                    <option value="PAID" style={{ background: '#fff', color: '#333' }}>Đã thanh toán</option>
                    <option value="CANCELLED" style={{ background: '#fff', color: '#333' }}>Đã hủy</option>
                  </select>
                </td>

                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                    
                    {/* Nút Chi tiết */}
                    <button 
                      type="button"
                      onClick={() => onSelectOrder && onSelectOrder(order.id)}
                      style={{ 
                        padding: '5px 8px', backgroundColor: '#edf2f7', color: '#4a5568', 
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
                        display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600'
                      }}
                    >
                      <Eye size={12} /> Chi tiết
                    </button>

                    {/* Nút Xác nhận */}
                    {isPending ? (
                      <button 
                        type="button"
                        onClick={() => handleAction(order.id, 'CONFIRMED')}
                        style={{ 
                          padding: '5px 8px', backgroundColor: '#ebf8ff', color: '#3182ce', 
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
                          display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600'
                        }}
                      >
                        <Check size={12} /> Xác nhận
                      </button>
                    ) : (
                      <div style={{ width: '70px' }} />
                    )}

                    {/* Nút Hủy */}
                    {!isCancelled && !isPaid ? (
                      <button 
                        type="button"
                        onClick={() => handleAction(order.id, 'CANCELLED')}
                        style={{ 
                          padding: '5px 8px', backgroundColor: '#fffaf0', color: '#dd6b20', 
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
                          display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600'
                        }}
                      >
                        <X size={12} /> Hủy
                      </button>
                    ) : (
                      <div style={{ width: '45px' }} />
                    )}

                    {/* Nút Xóa */}
                    <button 
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      style={{ 
                        padding: '5px 8px', backgroundColor: '#fff5f5', color: '#e53e3e', 
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
                        display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600'
                      }}
                    >
                      <Trash2 size={12} /> Xóa
                    </button>

                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

OrderTable.displayName = 'OrderTable';
export default OrderTable;