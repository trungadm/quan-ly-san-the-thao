import React, { useState, useEffect } from 'react';
import OrderTable from './OrderTable';
import { api } from '../api';
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, Search, Download, Calendar } from 'lucide-react';

const OrderList = ({ onSelectOrder, onCreateNew }) => {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Trạng thái thông báo nổi (Toast Notification)
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const serverData = await api.getAll('bookings').catch(() => []);
      const localData = JSON.parse(localStorage.getItem('local_bookings') || '[]');

      const combined = [...localData, ...(Array.isArray(serverData) ? serverData : [])];
      const uniqueOrders = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setOrders(uniqueOrders);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn đặt sân:", error);
      const localData = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      setOrders(localData);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateBookingStatus(id, newStatus);
      fetchOrders();
      showToast(`Đã cập nhật trạng thái đơn #${id} thành công!`);
    } catch (error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      showToast(`Đã cập nhật trạng thái đơn #${id}!`);
    }
  };

  // Lọc theo Trạng thái, Từ khóa tìm kiếm & Khoảng ngày đặt
  const filteredOrders = orders.filter(o => {
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus;
    const searchClean = searchTerm.toLowerCase().replace('#', '').trim();
    const name = String(o.customerName || o.customer_name || '').toLowerCase();
    const phone = String(o.customerPhone || o.customer_phone || '').toLowerCase();
    const idStr = String(o.id).toLowerCase();
    
    const matchSearch = !searchClean || name.includes(searchClean) || phone.includes(searchClean) || idStr.includes(searchClean);
    
    // Lọc theo ngày đặt
    const orderDate = o.bookingDate || o.booking_date;
    let matchDate = true;
    if (startDate && orderDate) {
      matchDate = matchDate && new Date(orderDate) >= new Date(startDate);
    }
    if (endDate && orderDate) {
      matchDate = matchDate && new Date(orderDate) <= new Date(endDate);
    }

    return matchStatus && matchSearch && matchDate;
  });

  // Tính năng Xuất file danh sách đơn đặt sân dạng CSV/Excel
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('Không có dữ liệu để xuất file!');
      return;
    }

    const headers = ['Ma Don', 'Khach Hang', 'So Dien Thoai', 'Ngay Dat', 'Tong Tien (VND)', 'Trang Thai'];
    const rows = filteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.customerName || o.customer_name || ''}"`,
      `"${o.customerPhone || o.customer_phone || ''}"`,
      `"${o.bookingDate || o.booking_date || ''}"`,
      o.totalAmount || o.total_amount || 0,
      `"${o.status || 'PENDING'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_don_dat_san_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Xuất danh sách đơn đặt sân thành công!');
  };

  // Thống kê số liệu
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED' || o.status === 'Đã hủy').length;
  
  const totalRevenue = orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);

  return (
    <div style={{ padding: '5px 0', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Toast Notification Nổi Góc Màn Hình */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999,
          background: '#2b6cb0', color: '#fff', padding: '12px 20px', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontWeight: 'bold', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* Thống kê dạng Card Dashboard chia 4 cột cân đối */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderTop: '4px solid #3182ce' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>Tổng số đơn</span>
            <ShoppingCart size={16} color="#3182ce" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#1a202c' }}>{totalCount}</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b46c1' }} title="Doanh thu đã thu">({totalRevenue.toLocaleString('vi-VN')}đ)</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderTop: '4px solid #d69e2e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>Chờ xác nhận</span>
            <Clock size={16} color="#d69e2e" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#dd6b20' }}>{pendingCount}</div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderTop: '4px solid #38a169' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>Đã thanh toán</span>
            <CheckCircle size={16} color="#38a169" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#38a169' }}>{paidCount}</div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', borderTop: '4px solid #e53e3e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>Đã hủy</span>
            <XCircle size={16} color="#e53e3e" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#e53e3e' }}>{cancelledCount}</div>
        </div>
      </div>

      {/* Thanh công cụ Tìm kiếm, Khoảng ngày, Lọc & Nút thao tác */}
      <div style={{ 
        background: '#fff', padding: '14px 20px', borderRadius: '12px', 
        border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
        marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        {/* Ô tìm kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f7fafc', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '7px 12px', minWidth: '220px', flex: 1 }}>
          <Search size={16} color="#a0aec0" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn, tên khách..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#2d3748' }}
          />
        </div>

        {/* Lọc theo khoảng ngày đặt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f7fafc', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '5px 10px' }}>
          <Calendar size={14} color="#718096" />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none', color: '#4a5568' }} 
          />
          <span style={{ fontSize: '12px', color: '#a0aec0' }}>→</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: '12px', outline: 'none', color: '#4a5568' }} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Lọc trạng thái */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f7fafc', border: '1px solid #cbd5e0', borderRadius: '8px', padding: '7px 12px' }}>
            <span style={{ fontSize: '12px', color: '#4a5568', fontWeight: 'bold', marginRight: '6px' }}>Trạng thái:</span>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: '#2d3748', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Nút Xuất Excel */}
          <button 
            type="button"
            onClick={handleExportCSV}
            style={{ 
              padding: '8px 14px', backgroundColor: '#ebf8ff', color: '#2b6cb0', 
              border: '1px solid #bee3f8', borderRadius: '8px', cursor: 'pointer', 
              fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' 
            }}
          >
            <Download size={14} /> Xuất Excel
          </button>

          {/* Nút tạo đơn mới */}
          <button 
            type="button"
            onClick={onCreateNew} 
            style={{ 
              padding: '9px 18px', 
              background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)', 
              color: '#fff', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(56, 161, 105, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} /> Tạo đơn mới
          </button>
        </div>
      </div>

      {/* Hiển thị bảng dữ liệu đơn hàng */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Đang tải dữ liệu đơn hàng...</div>
        ) : (
          <OrderTable 
            orders={filteredOrders} 
            onSelectOrder={onSelectOrder}
            onUpdateStatus={handleStatusChange}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};

OrderList.displayName = 'OrderList';
export default OrderList;