/**
 * Dinamik Oto auth adapter.
 * Tüm istekler CORS sorununu aşmak için localhost:3001 proxy'si üzerinden geçer.
 * osm1/2/3 header'ları server tarafında üretilir (Angular bundle'dan reverse-engineered).
 */

const PROXY_BASE = 'http://localhost:3001'
const TOKEN_KEY  = 'parcadar_token_dinamik_oto'

function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function getInstallationGuid() {
  const key = 'parcadar_installation_guid'
  let guid = localStorage.getItem(key)
  if (!guid) { guid = generateGUID(); localStorage.setItem(key, guid) }
  return guid
}

export function getStoredToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.storedAt > 8 * 60 * 60 * 1000) {
      sessionStorage.removeItem(TOKEN_KEY)
      return null
    }
    return data
  } catch { return null }
}

function storeToken({ data, username, customerCode, installationGuid }) {
  const tokenData = {
    raw: data,
    token: data?.Token || data?.SessionToken || data?.AccessToken || data?.Data?.Token || null,
    storedAt: Date.now(),
    customerCode,
    username,
    installationGuid,
  }
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData))
  return tokenData
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

/** OTP gerekip gerekmediğini response'tan tespit et. */
function detectOtpRequired(data) {
  return (
    data?.RequireOtp === true ||
    data?.OtpRequired === true ||
    data?.NeedOtp === true ||
    data?.ResultCode === 'OTP_REQUIRED' ||
    (typeof data?.Message === 'string' && /otp|doğrulama kodu/i.test(data.Message))
  )
}

function extractOtpReference(data) {
  return data?.OtpToken || data?.OtpSessionId || data?.SessionToken || data?.Token || data?.ReferenceId || null
}

/**
 * İlk login adımı.
 * Dönüş: { ok: true, tokenData }
 *      | { ok: false, requiresOtp: true, otpReference, message, _ctx }
 * Hata: throw Error
 */
export async function authenticate({ customerCode, username, password }) {
  const installationGuid = getInstallationGuid()

  const res = await fetch(`${PROXY_BASE}/proxy/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ customerCode, username, password, installationGuid }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Proxy hatası: HTTP ${res.status}`)
  }

  const data = await res.json()

  if (detectOtpRequired(data)) {
    return {
      ok: false,
      requiresOtp: true,
      otpReference: extractOtpReference(data),
      message: data?.Message || 'Telefon numaranıza doğrulama kodu gönderildi.',
      _ctx: { customerCode, username, password, installationGuid },
    }
  }

  if (data?.Result === false || data?.IsSuccess === false || data?.Success === false) {
    throw new Error(data?.Message || data?.ErrorMessage || 'Kimlik doğrulama başarısız.')
  }

  return {
    ok: true,
    tokenData: storeToken({ data, username, customerCode, installationGuid }),
  }
}

/**
 * OTP doğrulama adımı.
 */
export async function verifyOtp({ otpCode, otpReference, ctx }) {
  const { customerCode, username, installationGuid } = ctx

  const res = await fetch(`${PROXY_BASE}/proxy/otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ otpCode, otpReference, customerCode, username, installationGuid }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Proxy hatası: HTTP ${res.status}`)
  }

  const data = await res.json()

  if (data?.Result === false || data?.IsSuccess === false || data?.Success === false) {
    throw new Error(data?.Message || data?.ErrorMessage || 'OTP doğrulama başarısız.')
  }

  return {
    ok: true,
    tokenData: storeToken({ data, username, customerCode, installationGuid }),
  }
}
