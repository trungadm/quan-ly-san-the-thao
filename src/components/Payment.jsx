import React, { useState } from 'react';
import { CheckCircle2, QrCode, CreditCard, Banknote } from 'lucide-react';

const Payment = ({ order, onBack, onSuccess }) => {
  const [method, setMethod] = useState('cash'); // 'cash', 'qr', 'transfer'
  const [isSuccess, setIsSuccess] = useState(false);

  if (!order) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <p>Không tìm thấy thông tin đơn hàng thanh toán.</p>
        <button type="button" onClick={onBack} style={{ padding: '8px 16px', cursor: 'pointer' }}>Quay lại</button>
      </div>
    );
  }

  const amount = Number(order.totalAmount || order.total_amount || 0);

  // Link tạo QR code tự động VietQR theo số tiền và mã hóa đơn của khách
  const qrCodeUrl = `https://img.vietqr.io/image/VCB-0971234567-compact2.png?amount=${amount}&addInfo=TT%20Don%20${order.id}&accountName=VU%20KHAC%20QUYEN`;

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    setIsSuccess(true);

    // Cập nhật trạng thái đơn hàng thành PAID trong localStorage
    try {
      const localOrders = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      const updated = localOrders.map(o => {
        if (String(o.id) === String(order.id)) {
          return { ...o, status: 'PAID', paymentMethod: method };
        }
        return o;
      });
      localStorage.setItem('local_bookings', JSON.stringify(updated));

      // Đồng bộ về backend nếu có
      fetch(`http://localhost:5000/api/bookings/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paymentMethod: method })
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    }

    // Sau 1.8 giây hiển thị hiệu ứng thành công thì tự động quay về danh sách
    setTimeout(() => {
      onSuccess();
    }, 1800);
  };

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '650px', 
      margin: '20px auto', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)', 
      borderRadius: '16px', 
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Hiệu ứng overlay thành công sinh động */}
      {isSuccess && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 10, animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <CheckCircle2 size={70} color="#38a169" style={{ animation: 'bounce 0.5s infinite alternate' }} />
          <h2 style={{ color: '#22543d', margin: '15px 0 5px 0', fontSize: '24px' }}>Thanh toán thành công!</h2>
          <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>Hệ thống đã ghi nhận giao dịch của đơn #{order.id}</p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '12px' }}>
        <div>
          <span style={{ backgroundColor: '#ebf8ff', color: '#3182ce', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Cổng thanh toán</span>
          <h2 style={{ margin: '6px 0 2px 0', color: '#1a202c', fontSize: '22px' }}>Thanh Toán Hóa Đơn</h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>Xác nhận khoản thu cho đơn đặt sân và dịch vụ.</p>
        </div>
        <button 
          type="button"
          onClick={onBack} 
          style={{ padding: '8px 14px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          &larr; Hủy bỏ
        </button>
      </div>

      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: '#718096' }}>Mã hóa đơn:</span>
          <strong style={{ color: '#2d3748' }}>#{order.id}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
          <span style={{ color: '#718096' }}>Khách hàng:</span>
          <strong style={{ color: '#2d3748' }}>{order.customerName || order.customer_name}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '12px', borderTop: '1px dashed #cbd5e0' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2b6cb0' }}>Tổng tiền cần thu:</span>
          <span style={{ fontSize: '22px', fontWeight: '900', color: '#e53e3e' }}>
            {amount.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
      </div>

      <form onSubmit={handleConfirmPayment}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2d3748', marginBottom: '10px' }}>
          Chọn phương thức thanh toán:
        </label>

        {/* Các thẻ chọn phương thức sinh động */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div 
            onClick={() => setMethod('cash')}
            style={{
              padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
              border: method === 'cash' ? '2px solid #3182ce' : '2px solid #e2e8f0',
              backgroundColor: method === 'cash' ? '#ebf8ff' : '#fff',
              transition: 'all 0.2s'
            }}
          >
            <Banknote size={24} color={method === 'cash' ? '#3182ce' : '#718096'} style={{ margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: method === 'cash' ? '#2b6cb0' : '#4a5568' }}>Tiền mặt</div>
          </div>

          <div 
            onClick={() => setMethod('qr')}
            style={{
              padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
              border: method === 'qr' ? '2px solid #3182ce' : '2px solid #e2e8f0',
              backgroundColor: method === 'qr' ? '#ebf8ff' : '#fff',
              transition: 'all 0.2s'
            }}
          >
            <QrCode size={24} color={method === 'qr' ? '#3182ce' : '#718096'} style={{ margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: method === 'qr' ? '#2b6cb0' : '#4a5568' }}>Quét mã QR</div>
          </div>

          <div 
            onClick={() => setMethod('transfer')}
            style={{
              padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
              border: method === 'transfer' ? '2px solid #3182ce' : '2px solid #e2e8f0',
              backgroundColor: method === 'transfer' ? '#ebf8ff' : '#fff',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={24} color={method === 'transfer' ? '#3182ce' : '#718096'} style={{ margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: method === 'transfer' ? '#2b6cb0' : '#4a5568' }}>Chuyển khoản</div>
          </div>
        </div>

        {/* Hiển thị mã QR và thông tin chuyển khoản khi chọn Quét mã QR hoặc Chuyển khoản */}
        {(method === 'qr' || method === 'transfer') && (
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '18px', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '12px' }}>
              <img 
                src={qrCodeUrl} 
                alt="VietQR Code" 
                style={{ width: '160px', height: '160px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '4px' }} 
              />
            </div>
            <div style={{ fontSize: '13px', color: '#2d3748', lineHeight: '1.6' }}>
              <div>Ngân hàng: <strong>Vietcombank (VCB)</strong></div>
              <div>Số tài khoản: <strong style={{ color: '#3182ce' }}>0971234567</strong></div>
              <div>Chủ tài khoản: <strong>VU KHAC QUYEN</strong></div>
              <div>Nội dung CK: <strong style={{ color: '#e53e3e' }}>TT Don {order.id}</strong></div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          style={{ 
            width: '100%', padding: '14px', 
            background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)', 
            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', 
            fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(56, 161, 105, 0.4)' 
          }}
        >
          ✓ Xác nhận hoàn tất thanh toán ({amount.toLocaleString('vi-VN')} VNĐ)
        </button>
      </form>
    </div>
  );
};

Payment.displayName = 'Payment';
export default Payment;