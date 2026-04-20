const API = import.meta.env.VITE_API_URL || ''

export async function loadDealers(userId) {
  const res = await fetch(`${API}/api/users/${userId}/dealers`)
  const rows = await res.json()
  // { dealerName: { dealer_username, username, enabled } } şeklinde map'e çevir
  return Object.fromEntries(rows.map(r => [r.dealer_name, {
    dealer_username: r.dealer_username,
    username: r.username,
    enabled: true,
  }]))
}

export async function saveDealer(userId, dealerName, { dealer_username, username, password, dealer_id }) {
  await fetch(`${API}/api/users/${userId}/dealers/${dealerName}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dealer_username, username, password, dealer_id }),
  })
}

export async function deleteDealer(userId, dealerName) {
  await fetch(`${API}/api/users/${userId}/dealers/${dealerName}`, { method: 'DELETE' })
}

export async function getSourceCredential(userId, sourceId) {
  const dealers = await loadDealers(userId)
  return dealers[sourceId] || null
}

export async function isSourceConfigured(userId, sourceId) {
  const cred = await getSourceCredential(userId, sourceId)
  return !!(cred?.username?.trim())
}
