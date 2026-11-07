const API_BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
    throw new Error(payload?.error || `Máy chủ trả về lỗi HTTP ${response.status}.`);
  }

  return payload;
}

export const api = {
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
