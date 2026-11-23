const API_BASE_URL = 'http://localhost:5000/api';
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

async function request(endpoint, options = {}) {
  let response;
  try {
    const session = getSession();
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(`Không kết nối được backend tại ${API_BASE_URL}: ${error.message}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(payload?.error || `Máy chủ trả về lỗi HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export const api = {
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
