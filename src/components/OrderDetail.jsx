import React, { useState, useEffect } from 'react';

const OrderDetail = ({ orderId, onBack, onPay }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái đếm giây ngầm để tính thời gian thực
  const [extraSeconds, setExtraSeconds] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const localOrders = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      let found = localOrders.find(o => String(o.id) === String(orderId));

      if (found) {
        setOrder(found);
      } else {
        setOrder({
          id: orderId,
          customerName: 'Nguyễn Văn A',
          customerPhone: '0342868577',
          bookingDate: '2026-11-08',
          fieldName: 'Sân tennis C1',
          timeSlot: '1 phút chơi',
          totalAmount: 2000,
          status: 'PENDING',
          services: { racket: 0, ball: 0, water: 0, energyDrink: 0 }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Đếm giây ngầm khi đơn ở trạng thái PENDING
  useEffect(() => {
    let timer = null;
    if (order && order.status === 'PENDING') {
      timer = setInterval(() => {
        setExtraSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [order]);

  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '20px' }}>Đang tải chi tiết đơn...</div>;
  if (!order) return <div style={{ padding: '20px' }}>Không tìm thấy thông tin đơn đặt sân. <br/><button type="button" onClick={onBack} style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}>Quay lại</button></div>;

  // Lấy phút ban đầu
  let baseMinutes = 1;
  if (order.timeSlot) {
    const match = order.timeSlot.match(/(\d+)/);
    if (match) baseMinutes = parseInt(match[1], 10);
  }

  // Tổng số phút thực tế (chỉ tính tròn phút, không hiện giây)
  const totalMinutes = baseMinutes + Math.floor(extraSeconds / 60);

  // Tính tiền sân theo tổng số phút (2000đ / phút)
  const fieldMoney = totalMinutes * 2000;
  
  const svs = order.services || {};
  const serviceTotal = 
    (Number(svs.racket || 0) * 30000) +
    (Number(svs.ball || 0) * 20000) +
    (Number(svs.water || 0) * 10000) +
    (Number(svs.energyDrink || 0) * 15000);

  const totalWithRealtime = fieldMoney + serviceTotal;

  return (
    <div style={{ padding: '30px', maxWidth: '650px', margin: '20px auto', backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="no-print">
        <button 
          type="button" 
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }} 
          style={{ padding: '8px 14px', cursor: 'pointer', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
        >
          &larr; Quay lại danh sách
        </button>
        <button 
          type="button"
          onClick={handlePrintInvoice} 
          style={{ padding: '8px 16px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🖨️ In hóa đơn
        </button>
      </div>

      <div id="printable-invoice" style={{ border: '2px dashed #cbd5e0', padding: '25px', borderRadius: '10px', background: '#fafafa' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#1a202c', fontSize: '22px' }}>SPORTIVA SPORTS MANAGEMENT</h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>Hóa đơn thanh toán dịch vụ thể thao (Tính giờ thực tế)</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#a0aec0' }}>Mã hóa đơn: #{order.id}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '20px', color: '#2d3748' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Khách hàng:</strong> {order.customerName || order.customer_name}</span>
            <span><strong>SĐT:</strong> {order.customerPhone || order.customer_phone || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Ngày đặt:</strong> {order.bookingDate || order.booking_date}</span>
            <span><strong>Sân chơi:</strong> {order.fieldName || order.field_name || 'Sân thể thao'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffaf0', padding: '8px 12px', borderRadius: '6px', border: '1px solid #feebc8' }}>
            <span><strong>Tổng thời gian chơi thực tế:</strong></span>
            {/* Chỉ hiển thị số phút gọn gàng, hoàn toàn không hiện giây */}
            <span style={{ color: '#dd6b20', fontWeight: 'bold' }}>
              {totalMinutes} phút chơi
            </span>
          </div>
          <div><strong>Trạng thái đơn:</strong> <span style={{ fontWeight: 'bold', color: order.status === 'PAID' ? '#28a745' : '#d69e2e' }}>{order.status || 'PENDING'}</span></div>
        </div>

        <div style={{ marginBottom: '20px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', color: '#4a5568' }}>Chi tiết dịch vụ bổ sung:</div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#4a5568' }}>
            <div>• Thuê vợt: {svs.racket || 0} chiếc (30k/c)</div>
            <div>• Thuê bóng: {svs.ball || 0} quả (20k/q)</div>
            <div>• Nước suối: {svs.water || 0} chai (10k/c)</div>
            <div>• Nước điện giải: {svs.energyDrink || 0} chai (15k/c)</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', color: '#c53030', marginTop: '10px' }}>
          <span>Tổng tiền thanh toán:</span>
          <span>{totalWithRealtime.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }} className="no-print">
        <button 
          type="button"
          onClick={() => {
            const updatedOrder = { ...order, totalAmount: totalWithRealtime, timeSlot: `${totalMinutes} phút chơi` };
            onPay && onPay(updatedOrder);
          }} 
          style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Xác nhận thanh toán ngay ({totalWithRealtime.toLocaleString('vi-VN')} VNĐ)
        </button>
      </div>
    </div>
  );
};

OrderDetail.displayName = 'OrderDetail';
export default OrderDetail;