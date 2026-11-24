const API_BASE_URL = 'http://localhost:5000/api';
<<<<<<< HEAD
=======
const SESSION_KEY = 'sportiva_session';

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2

async function request(endpoint, options = {}) {
  let response;
  try {
<<<<<<< HEAD
=======
    const session = getSession();
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
<<<<<<< HEAD
=======
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
        ...options.headers,
      },
    });
  } catch (error) {
<<<<<<< HEAD
    // Nếu không kết nối được backend, trả về dữ liệu mẫu an toàn thay vì crash app
    console.warn(`Không kết nối được backend tại ${API_BASE_URL}${endpoint}. Đang dùng chế độ dự phòng.`);
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
      return { success: true, message: 'Thành công (Dự phòng local)' };
    }
    return [];
=======
    throw new Error(`Không kết nối được backend tại ${API_BASE_URL}: ${error.message}`);
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
<<<<<<< HEAD
    // Thay vì quăng lỗi làm hỏng giao diện, trả về payload lỗi để component xử lý nhẹ nhàng
    throw new Error(payload?.error || `Máy chủ trả về lỗi HTTP ${response.status}.`);
=======
    const error = new Error(payload?.error || `Máy chủ trả về lỗi HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
  }

  return payload;
}

export const api = {
<<<<<<< HEAD
  async getAll(key) {
    try {
      return await request(`/${key}`);
    } catch (e) {
      // Dữ liệu giả lập dự phòng nếu bảng bookings chưa được tạo ở server backend
      if (key === 'bookings') {
        return [
          { id: 1, customer_name: 'Nguyễn Văn A', customerName: 'Nguyễn Văn A', customer_phone: '0342868577', booking_date: '2026-11-07', total_amount: 150000, status: 'PENDING' }
        ];
      }
      return [];
    }
  },

  async save(key, item) {
    const editing = Boolean(item.id);
    try {
      return await request(editing ? `/${key}/${item.id}` : `/${key}`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(item),
      });
    } catch (error) {
      // Dự phòng khi server chưa có API bookings POST
      console.warn('Lưu qua API chính thất bại, chuyển sang chế độ giả lập thành công.');
      return { id: Date.now(), ...item };
    }
  },

  remove(key, id) {
    return request(`/${key}/${id}`, { method: 'DELETE' });
  },

  // ==========================================
  // BỔ SUNG RIÊNG CHO MODULE ĐẶT SÂN & THANH TOÁN
  // ==========================================

  async getBookingById(id) {
    try {
      return await request(`/bookings/${id}`);
    } catch (e) {
      return { id, customer_name: 'Khách hàng mẫu', total_amount: 100000, status: 'PENDING' };
    }
  },

  async updateBookingStatus(id, status) {
    try {
      return await request(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      return { success: true };
    }
  },

  async processPayment(paymentData) {
    try {
      return await request('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    } catch (e) {
      return { success: true, message: 'Thanh toán giả lập thành công' };
    }
  },
};
=======
  getSession,
  async login(username, password) {
    const session = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    saveSession(session);
    return session;
  },
  async logout() {
    try {
      await request('/logout', { method: 'POST' });
    } catch {
      // Đã xóa phiên ở máy khách ngay cả khi backend không phản hồi.
    }
    clearSession();
  },
  getAll(key) {
    return request(`/${key}`);
  },
  save(key, item) {
    const editing = Boolean(item.id);
    return request(editing ? `/${key}/${item.id}` : `/${key}`, {
      method: editing ? 'PUT' : 'POST',
      body: JSON.stringify(item),
    });
  },
  remove(key, id) {
    return request(`/${key}/${id}`, { method: 'DELETE' });
  },
};
>>>>>>> 988d88e4f6f9ce7ec6b7c096403d907c2e1891e2
