const BASE = '/api'

function getToken() {
  return localStorage.getItem('jb_token')
}

function setTokens(access, refresh) {
  localStorage.setItem('jb_token', access)
  if (refresh) localStorage.setItem('jb_refresh', refresh)
}

function clearTokens() {
  localStorage.removeItem('jb_token')
  localStorage.removeItem('jb_refresh')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); msg = j.error || msg } catch {}
    throw Object.assign(new Error(msg), { status: res.status })
  }

  return res.json()
}

const get  = (path, opts)   => request(path, { method: 'GET',    ...opts })
const post = (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) })
const put  = (path, body)   => request(path, { method: 'PUT',    body: JSON.stringify(body) })
const del  = (path)         => request(path, { method: 'DELETE' })

// ─── Auth ────────────────────────────────────────────────────────
export const auth = {
  login: async (email, password) => {
    const data = await post('/auth/login', { email, password })
    setTokens(data.accessToken, data.refreshToken)
    return data
  },
  logout: async () => {
    try { await post('/auth/logout', {}) } catch {}
    clearTokens()
  },
  me: () => get('/auth/me'),
}

// ─── Public ──────────────────────────────────────────────────────
export const publicApi = {
  getBhojanshalas: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v != null && q.set(k, v))
    const qs = q.toString()
    return get(`/public/bhojanshalas${qs ? `?${qs}` : ''}`)
  },
  getBhojanshala: (id, days = 7) => get(`/public/bhojanshalas/${id}?days=${days}`),
  getCities: () => get('/public/cities'),
}

// ─── Super-Admin ──────────────────────────────────────────────────
export const superAdmin = {
  getDashboard: () => get('/super-admin/dashboard'),

  // Bhojanshalas
  getBhojanshalas: () => get('/super-admin/bhojanshalas'),
  createBhojanshala: (body) => post('/super-admin/bhojanshalas', body),
  updateBhojanshala: (id, body) => put(`/super-admin/bhojanshalas/${id}`, body),
  deleteBhojanshala: (id) => del(`/super-admin/bhojanshalas/${id}`),
  getBhojanshala: (id) => get(`/super-admin/bhojanshalas/${id}`),

  // Admins
  getAdmins: () => get('/super-admin/admins'),
  createAdmin: (body) => post('/super-admin/admins', body),
  updateAdmin: (id, body) => put(`/super-admin/admins/${id}`, body),
  deleteAdmin: (id) => del(`/super-admin/admins/${id}`),

  // Activity
  getActivity: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)))
    const qs = q.toString()
    return get(`/super-admin/activity${qs ? `?${qs}` : ''}`)
  },
}

// ─── Admin (Bhojanshala Admin) ────────────────────────────────────
export const adminApi = {
  getMyBhojanshala: () => get('/admin/my-bhojanshala'),
  updateMyBhojanshala: (body) => put('/admin/my-bhojanshala', body),
  getSchedule: (days = 7) => get(`/admin/schedule?days=${days}`),
  updateSchedule: (body) => put('/admin/schedule', body),
}

export { clearTokens, getToken, setTokens }
