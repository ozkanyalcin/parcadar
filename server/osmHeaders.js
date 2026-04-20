/**
 * Dinamik Oto (bayi.adaoto.com.tr) osm header generator.
 * Reverse-engineered from Angular bundle chunk-PTMDXOYX.js.
 *
 * osm1 = HmacSHA256(message, HMAC_KEY)        → hex
 * osm2 = sg(scramble(timestamp))               → 30-char encoded string
 * osm3 = AES-256-CBC(message, AES_KEY, AES_IV) → base64
 */

import crypto from 'crypto'

// Keys extracted from Angular bundle (string array index 0x299, 0x32a, 0x345, 0x752)
const SECRET_SUFFIX = Buffer.from('SDdzOGkyMmtJOWo=', 'base64').toString() // H7s8i22kI9j
const HMAC_KEY      = Buffer.from('SDZiajMyMw==',     'base64').toString() // H6bj323
const AES_KEY       = Buffer.from('03569faa5a6fb423d647a6abb814408aeb68001cbd3396ccbb3a8b572e1a3f7e', 'hex')
const AES_IV        = Buffer.from('63157dccd20613d7c2ac08fcd873f249', 'hex')

// Digit → letter mapping used in osm2
const DIGIT_LETTERS = { 0:'K', 1:'T', 2:'B', 3:'Y', 4:'R', 5:'Z', 6:'W', 7:'F', 8:'H', 9:'N' }
const OSM2_CHARSET  = 'ACDEGJLMOPSUVX0123456789'

// Scramble timestamp character order: indices [3,7,2,11,4,12,9,0,8,1,10,13,6,5]
const SCRAMBLE_IDX = [3, 7, 2, 11, 4, 12, 9, 0, 8, 1, 10, 13, 6, 5]

/** Replace digits with letters, then pad to 30 chars with random charset chars. */
function sg(ts) {
  let s = ts.replace(/[0-9]/g, d => DIGIT_LETTERS[d])
  while (s.length < 30) {
    const ch  = OSM2_CHARSET[Math.floor(Math.random() * OSM2_CHARSET.length)]
    const pos = Math.floor(Math.random() * (s.length + 1))
    s = s.slice(0, pos) + ch + s.slice(pos)
  }
  return s
}

/**
 * Normalize username: remove combining dot above (U+0307),
 * lowercase, normalise Turkish İ/I/ı → i.
 */
function lg(username) {
  const chars = []
  for (let i = 0; i < username.length; i++) {
    if (username.charCodeAt(i) !== 0x307) chars.push(username[i])
  }
  return chars.join('')
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/̇/g, '')
    .replace(/ı/g, 'i')
}

/**
 * Generate osm1/2/3 headers for a request.
 *
 * @param {object} params
 * @param {string} params.customerCode   - e.g. "DA345400"
 * @param {string} params.username       - e.g. "asım"
 * @param {string} params.installationGuid
 * @param {string} params.companyCode    - from session (empty before login)
 * @param {string} params.urlPath        - path segment after base URL, e.g. "Session"
 */
export function generateOsmHeaders({ customerCode, username, installationGuid, companyCode, urlPath }) {
  // Bundle kodu: if length === 13, prepend '0' (mevcut epoch ms daima 13 haneli)
  let timestamp = Date.now().toString()
  if (timestamp.length === 13) timestamp = '0' + timestamp

  // Scramble timestamp characters
  const scrambled = SCRAMBLE_IDX.map(i => timestamp[i]).join('')
  const osm2 = sg(scrambled)

  const cc = (customerCode  || '').trim().toUpperCase() || 'NULL'
  const un = lg(username || '')
  const ig = installationGuid || 'NULL'
  const co = companyCode || 'NULL'

  // Build message
  const message = cc + un + ig + co + urlPath + timestamp + SECRET_SUFFIX

  // osm3: AES-256-CBC, PKCS7 padding (Node default), base64 output
  const cipher  = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV)
  const osm3    = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]).toString('base64')

  // osm1: HMAC-SHA256, hex output
  const osm1 = crypto.createHmac('sha256', HMAC_KEY).update(message, 'utf8').digest('hex')

  return { osm1, osm2, osm3 }
}
