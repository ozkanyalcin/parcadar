const API = import.meta.env.VITE_API_URL || ''
const SESSION_KEY = 'parcadar_session'

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export async function login(username, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Giriş başarısız.')
  setSession(data.user)
  return data.user
}

export async function listUsers() {
  const res = await fetch(`${API}/api/users`)
  return res.json()
}

export async function createUser(username, password) {
  const res = await fetch(`${API}/api/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Kullanıcı oluşturulamadı.')
  return data
}

export async function changePassword(userId, password) {
  const res = await fetch(`${API}/api/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
}

export async function deleteUser(userId) {
  await fetch(`${API}/api/users/${userId}`, { method: 'DELETE' })
}
