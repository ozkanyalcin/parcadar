import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import https from 'https'
import crypto from 'crypto'
import { generateOsmHeaders } from './osmHeaders.js'
import pool from './db.js'

const app  = express()
const PORT = 3001
const BASE_URL = 'https://bayi.adaoto.com.tr/Service/JsonService.svc'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://37.247.101.202'] }))
app.use(express.json())

// ─── DB init ────────────────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealers (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dealer_name     VARCHAR(100) NOT NULL,
      dealer_username VARCHAR(100) NOT NULL,
      username        VARCHAR(100) NOT NULL,
      password        VARCHAR(255) NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, dealer_name)
    )
  `)

  // Varsayılan admin kullanıcısı
  const hash = crypto.createHash('sha256').update('admin123').digest('hex')
  await pool.query(
    `INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING`,
    ['admin', hash]
  )

  console.log('DB ready')
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPw(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex')
}

// ─── Auth endpoints ─────────────────────────────────────────────────────────

/** POST /api/auth/login  – { username, password } */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username ve password zorunlu.' })

  const { rows } = await pool.query(
    'SELECT id, username FROM users WHERE username = $1 AND password = $2',
    [username, hashPw(password)]
  )
  if (!rows.length) return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' })

  res.json({ ok: true, user: rows[0] })
})

/** GET /api/users – tüm kullanıcılar */
app.get('/api/users', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, username, created_at FROM users ORDER BY id')
  res.json(rows)
})

/** POST /api/users – { username, password } */
app.post('/api/users', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username ve password zorunlu.' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hashPw(password)]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış.' })
    throw e
  }
})

/** PUT /api/users/:id/username – { username } */
app.put('/api/users/:id/username', async (req, res) => {
  const { username } = req.body
  if (!username?.trim()) return res.status(400).json({ error: 'username zorunlu.' })
  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [username.trim(), req.params.id]
    )
    if (!rowCount) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
    res.json({ ok: true })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Bu kullanıcı adı zaten alınmış.' })
    throw e
  }
})

/** PUT /api/users/:id/password – { password } */
app.put('/api/users/:id/password', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'password zorunlu.' })
  const { rowCount } = await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [hashPw(password), req.params.id]
  )
  if (!rowCount) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' })
  res.json({ ok: true })
})

/** DELETE /api/users/:id */
app.delete('/api/users/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// ─── Dealer endpoints ────────────────────────────────────────────────────────

/** GET /api/users/:userId/dealers */
app.get('/api/users/:userId/dealers', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, dealer_name, dealer_username, username, password FROM dealers WHERE user_id = $1 ORDER BY dealer_name',
    [req.params.userId]
  )
  res.json(rows)
})

/** PUT /api/users/:userId/dealers/:dealerName – upsert */
app.put('/api/users/:userId/dealers/:dealerName', async (req, res) => {
  const { dealer_username, username, password, dealer_id } = req.body
  const { userId, dealerName } = req.params
  if (!username || !password) return res.status(400).json({ error: 'username ve password zorunlu.' })

  const { rows } = await pool.query(
    `INSERT INTO dealers (user_id, dealer_name, dealer_username, username, password, dealer_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, dealer_name)
     DO UPDATE SET dealer_username = $3, username = $4, password = $5, dealer_id = $6
     RETURNING id, dealer_name, dealer_username, username, dealer_id`,
    [userId, dealerName, dealer_username || '', username, password, dealer_id || null]
  )
  res.json(rows[0])
})

/** DELETE /api/users/:userId/dealers/:dealerName */
app.delete('/api/users/:userId/dealers/:dealerName', async (req, res) => {
  await pool.query(
    'DELETE FROM dealers WHERE user_id = $1 AND dealer_name = $2',
    [req.params.userId, req.params.dealerName]
  )
  res.json({ ok: true })
})

// ─── Dealer list endpoints ───────────────────────────────────────────────────

/** GET /api/dealer-list */
app.get('/api/dealer-list', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name FROM dealer_list ORDER BY name')
  res.json(rows)
})

/** POST /api/dealer-list – { name } */
app.post('/api/dealer-list', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name zorunlu.' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO dealer_list (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Bu bayi zaten mevcut.' })
    throw e
  }
})

/** DELETE /api/dealer-list/:id */
app.delete('/api/dealer-list/:id', async (req, res) => {
  await pool.query('DELETE FROM dealer_list WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// ─── Proxy endpoints ─────────────────────────────────────────────────────────

/** POST /proxy/login */
app.post('/proxy/login', async (req, res) => {
  const { customerCode, username, password, installationGuid } = req.body

  if (!customerCode || !username || !password) {
    return res.status(400).json({ error: 'customerCode, username, password zorunlu.' })
  }

  const urlPath = 'Session'
  const { osm1, osm2, osm3 } = generateOsmHeaders({
    customerCode, username, installationGuid, companyCode: '', urlPath
  })

  const body = {
    auth: {
      CustomerCode: customerCode,
      Username: username,
      Password: password,
      IsRepresentative: false,
      InstallationGUID: installationGuid,
      GoogleRecaptchaV3Token: null,
    }
  }

  try {
    const response = await fetch(`${BASE_URL}/${urlPath}`, {
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en',
        'content-type': 'application/json',
        'osm1': osm1,
        'osm2': osm2,
        'osm3': osm3,
        'ig': installationGuid || '',
        'origin': 'https://bayi.adaoto.com.tr',
        'referer': 'https://bayi.adaoto.com.tr/web/login',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    const setCookie = response.headers.raw()['set-cookie']
    if (setCookie) res.setHeader('Set-Cookie', setCookie)

    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /proxy/otp */
app.post('/proxy/otp', async (req, res) => {
  const { otpCode, otpReference, customerCode, username, installationGuid, token } = req.body

  const urlPath = 'Session/Otp'
  const { osm1, osm2, osm3 } = generateOsmHeaders({
    customerCode, username, installationGuid, companyCode: '', urlPath
  })

  const body = {
    OtpCode: otpCode,
    OtpToken: otpReference,
    ReferenceId: otpReference,
    CustomerCode: customerCode,
    Username: username,
    InstallationGUID: installationGuid,
  }

  try {
    const response = await fetch(`${BASE_URL}/${urlPath}`, {
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'osm1': osm1,
        'osm2': osm2,
        'osm3': osm3,
        'ig': installationGuid || '',
        'origin': 'https://bayi.adaoto.com.tr',
        'referer': 'https://bayi.adaoto.com.tr/web/login',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
        ...(token ? { 'Authorization': token } : {}),
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_, res) => res.json({ ok: true }))

initDb().then(() => {
  app.listen(PORT, () => console.log(`Parcadar proxy server: http://localhost:${PORT}`))
}).catch(err => { console.error('DB init failed:', err); process.exit(1) })
