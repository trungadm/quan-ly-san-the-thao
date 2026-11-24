import React, { useState, useEffect } from 'react';

const CreateOrder = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    bookingDate: new Date().toISOString().split('T')[0],
    fieldName: '',
    racketCount: 0,
    ballCount: 0,
    waterCount: 0,
    energyDrinkCount: 0
  });

  // Trạng thái cho đồng hồ bấm giờ tính tiền sân theo phút
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');

  // Đơn giá
  const PRICE_PER_HOUR = 120000; // Giá sân mặc định: 120.000 VNĐ / giờ (tương đương 2.000 VNĐ / phút)
  const prices = {
    racket: 30000,
    ball: 20000,
    water: 10000,
    energyDrink: 15000
  };

  // Chạy đồng hồ mỗi giây khi được kích hoạt
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);
    setStartTimeStr(timeString);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setEndTimeStr('');
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);
    setEndTimeStr(timeString);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tính tiền sân dựa trên số phút thực tế đồng hồ chạy
  const minutes = Math.ceil(secondsElapsed / 60);
  const fieldPrice = Math.round((minutes / 60) * PRICE_PER_HOUR);

  // Tính tiền dịch vụ đi kèm
  const serviceTotal = 
    (Number(formData.racketCount) * prices.racket) +
    (Number(formData.ballCount) * prices.ball) +
    (Number(formData.waterCount) * prices.water) +
    (Number(formData.energyDrinkCount) * prices.energyDrink);
  
  const totalAmount = fieldPrice + serviceTotal;

  const formatTimeDisplay = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const timeSlotDisplay = startTimeStr && endTimeStr ? `${startTimeStr} - ${endTimeStr}` : `${minutes} phút chơi`;

    const newOrder = {
      id: Date.now(),
      customerName: formData.customerName,
      customer_name: formData.customerName,
      customerPhone: formData.customerPhone,
      customer_phone: formData.customerPhone,
      bookingDate: formData.bookingDate,
      booking_date: formData.bookingDate,
      fieldName: formData.fieldName || 'Sân thể thao linh hoạt',
      timeSlot: timeSlotDisplay,
      totalAmount: totalAmount,
      total_amount: totalAmount,
      status: 'PENDING',
      services: {
        racket: formData.racketCount,
        ball: formData.ballCount,
        water: formData.waterCount,
        energyDrink: formData.energyDrinkCount,
        playingMinutes: minutes
      }
    };

    try {
      const existingOrders = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      localStorage.setItem('local_bookings', JSON.stringify([newOrder, ...existingOrders]));

      fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(() => {});

      alert('Tạo đơn đặt sân tính giờ thành công!');
      onSuccess();
    } catch (error) {
      alert('Tạo đơn thành công!');
      onSuccess();
    }
  };

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '780px', 
      margin: '10px auto', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)', 
      borderRadius: '16px', 
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      fontFamily: 'inherit'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #edf2f7', paddingBottom: '12px' }}>
        <div>
          <span style={{ backgroundColor: '#ebf8ff', color: '#3182ce', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tính giờ trực tiếp</span>
          <h2 style={{ margin: '6px 0 2px 0', color: '#1a202c', fontSize: '22px' }}>Tạo Đơn & Bấm Giờ Đá Sân</h2>
          <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>Bấm bắt đầu khi khách vào sân và kết thúc khi khách nghỉ.</p>
        </div>
        <button 
          onClick={onBack} 
          style={{ padding: '8px 14px', backgroundColor: '#fed7d7', color: '#c53030', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
        >
          &larr; Hủy bỏ
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>
          Tên khách hàng:
          <input type="text" name="customerName" placeholder="Ví dụ: Nguyễn Văn A" value={formData.customerName} onChange={handleChange} required style={inputStyle} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>
          Số điện thoại:
          <input type="text" name="customerPhone" placeholder="Ví dụ: 0342868577" value={formData.customerPhone} onChange={handleChange} required style={inputStyle} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>
          Ngày đặt:
          <input type="date" name="bookingDate" value={formData.bookingDate} onChange={handleChange} required style={inputStyle} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', fontWeight: 'bold', color: '#2d3748' }}>
          Tên sân:
          <input type="text" name="fieldName" placeholder="Ví dụ: Sân bóng đá A1" value={formData.fieldName} onChange={handleChange} required style={inputStyle} />
        </label>

        {/* Khung bấm giờ trực tiếp thay thế cho ô nhập giờ thủ công */}
        <div style={{ gridColumn: 'span 2', background: '#f0fff4', padding: '16px', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#22543d', fontSize: '14px' }}>⏱️ Đồng hồ tính thời gian chơi sân (120k/giờ):</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isTimerRunning ? (
                <button 
                  type="button" 
                  onClick={handleStartTimer}
                  style={{ padding: '6px 14px', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  ▶ Bắt đầu tính giờ
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={handleStopTimer}
                  style={{ padding: '6px 14px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  ⏹ Kết thúc giờ
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#718096' }}>Thời gian: </span>
              <strong style={{ color: '#2d3748' }}>{startTimeStr || '--:--'} đến {endTimeStr || '--:--'}</strong>
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#3182ce' }}>({minutes} phút)</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: isTimerRunning ? '#e53e3e' : '#2b6cb0', fontFamily: 'monospace' }}>
              {formatTimeDisplay(secondsElapsed)}
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#2f855a', fontWeight: 'bold' }}>
            💰 Tiền sân tính theo thời gian: {fieldPrice.toLocaleString('vi-VN')} VNĐ
          </div>
        </div>

        {/* Khung chọn dịch vụ bổ sung */}
        <div style={{ gridColumn: 'span 2', background: '#edf2f7', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e0' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '14px' }}>🏸 Thuê dụng cụ & Nước uống đi kèm:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: '600' }}>
              Thuê vợt (30k/chiếc):
              <input type="number" min="0" name="racketCount" value={formData.racketCount} onChange={handleChange} style={{ ...inputStyle, padding: '8px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: '600' }}>
              Thuê bóng (20k/quả):
              <input type="number" min="0" name="ballCount" value={formData.ballCount} onChange={handleChange} style={{ ...inputStyle, padding: '8px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: '600' }}>
              Nước suối (10k/chai):
              <input type="number" min="0" name="waterCount" value={formData.waterCount} onChange={handleChange} style={{ ...inputStyle, padding: '8px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: '600' }}>
              Nước điện giải (15k/chai):
              <input type="number" min="0" name="energyDrinkCount" value={formData.energyDrinkCount} onChange={handleChange} style={{ ...inputStyle, padding: '8px' }} />
            </label>
          </div>
        </div>

        {/* Hiển thị tổng tiền động */}
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ebf8ff', padding: '12px 18px', borderRadius: '10px', border: '1px solid #bee3f8' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2b6cb0' }}>Tổng cộng thanh toán (Sân + Dịch vụ):</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c53030' }}>
            {totalAmount.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>

        <div style={{ gridColumn: 'span 2', marginTop: '5px' }}>
          <button 
            type="submit" 
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(49, 130, 206, 0.4)' }}
          >
            🚀 Lưu đơn đặt sân tính giờ
          </button>
        </div>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  marginTop: '5px',
  borderRadius: '8px',
  border: '2px solid #e2e8f0',
  fontSize: '13px',
  outline: 'none',
  background: '#fff'
};

CreateOrder.displayName = 'CreateOrder';
export default CreateOrder;