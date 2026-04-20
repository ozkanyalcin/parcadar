import { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, Check, Settings, Wifi, WifiOff, Loader, ShieldCheck, Plus, Trash2, Building2 } from 'lucide-react'
import { authenticate, verifyOtp, getStoredToken, clearToken } from '../lib/dinamikOtoAuth'
import { loadDealers, saveDealer, deleteDealer } from '../lib/credentials'
import UserMenu from './UserMenu'
import styles from './SettingsPage.module.css'

const API = import.meta.env.VITE_API_URL || ''

const DINAMIK_OTO_ID = 'dinamik_oto' // dealer_list'teki Dinamik Oto için özel auth

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function SettingsPage({ session, onBack, onLogout, onOpenAdmin }) {
  const [dealerList, setDealerList] = useState([])   // tüm bayi tipleri
  const [myDealers, setMyDealers] = useState([])     // kullanıcının kayıtlı bayileri
  const [loading, setLoading] = useState(true)

  // Yeni bayi ekleme formu
  const [form, setForm] = useState({ dealerListId: '', dealer_username: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Auth durumu (Dinamik Oto için)
  const [authStatus, setAuthStatus] = useState({}) // { dealerSlug: { state, message, otpReference, ctx, error } }
  const [otpInputs, setOtpInputs] = useState({})

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/dealer-list`).then(r => r.json()),
      loadDealers(session.id),
    ]).then(([dl, dealers]) => {
      setDealerList(dl)
      // dealers = { slug: { dealer_username, username, enabled } }
      const list = Object.entries(dealers).map(([slug, d]) => ({ slug, ...d }))
      setMyDealers(list)
      setLoading(false)
    })

    const token = getStoredToken()
    if (token) {
      setAuthStatus(prev => ({ ...prev, [DINAMIK_OTO_ID]: { state: 'ok', message: `${token.username} olarak bağlandı` } }))
    }
  }, [session.id])

  const availableDealers = dealerList.filter(
    dl => !myDealers.some(d => d.slug === slugify(dl.name))
  )

  const addDealer = async (e) => {
    e.preventDefault()
    if (!form.dealerListId || !form.dealer_username.trim() || !form.username.trim() || !form.password) {
      setFormError('Tüm alanları doldurun.')
      return
    }
    setSaving(true)
    setFormError('')
    const dl = dealerList.find(d => d.id === Number(form.dealerListId))
    const slug = slugify(dl.name)
    await saveDealer(session.id, slug, {
      dealer_username: form.dealer_username.trim(),
      username: form.username.trim(),
      password: form.password,
      dealer_id: dl.id,
    })
    setMyDealers(prev => [...prev, { slug, dealer_username: form.dealer_username.trim(), username: form.username.trim(), enabled: true }])
    setForm({ dealerListId: '', dealer_username: '', username: '', password: '' })
    setSaving(false)
  }

  const removeDealer = async (slug) => {
    if (slug === DINAMIK_OTO_ID) { clearToken(); setAuthStatus(prev => ({ ...prev, [slug]: { state: 'idle' } })) }
    await deleteDealer(session.id, slug)
    setMyDealers(prev => prev.filter(d => d.slug !== slug))
  }

  // Dinamik Oto bağlan
  const connect = async (dealer) => {
    const slug = dealer.slug
    setAuthStatus(prev => ({ ...prev, [slug]: { state: 'loading' } }))
    try {
      const result = await authenticate({
        customerCode: dealer.dealer_username,
        username: dealer.username,
        password: dealer.password,
      })
      if (result.requiresOtp) {
        setAuthStatus(prev => ({ ...prev, [slug]: { state: 'otp', message: result.message, otpReference: result.otpReference, ctx: result._ctx } }))
        setOtpInputs(prev => ({ ...prev, [slug]: '' }))
        return
      }
      setAuthStatus(prev => ({ ...prev, [slug]: { state: 'ok', message: `${result.tokenData.username} olarak bağlandı` } }))
    } catch (err) {
      setAuthStatus(prev => ({ ...prev, [slug]: { state: 'error', message: err.message } }))
    }
  }

  const submitOtp = async (slug) => {
    const auth = authStatus[slug]
    const otpCode = otpInputs[slug] || ''
    if (otpCode.length < 4) return
    setAuthStatus(prev => ({ ...prev, [slug]: { ...auth, state: 'otp_loading' } }))
    try {
      const result = await verifyOtp({ otpCode, otpReference: auth.otpReference, ctx: auth.ctx })
      setAuthStatus(prev => ({ ...prev, [slug]: { state: 'ok', message: `${result.tokenData.username} olarak bağlandı` } }))
    } catch (err) {
      setAuthStatus(prev => ({ ...prev, [slug]: { ...auth, state: 'otp', error: err.message } }))
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)' }}>
      Yükleniyor...
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Geri
        </button>
        <div className={styles.headerTitle}>
          <Settings size={15} />
          B2B Bağlantı Ayarları
        </div>
        <div className={styles.headerStats}>
          <span className={styles.statPill}>{myDealers.length} bayi</span>
          <UserMenu session={session} onOpenSettings={() => {}} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Mevcut bayiler ── */}
        {myDealers.length > 0 && (
          <div className={styles.sourceList}>
            {myDealers.map(dealer => {
              const auth = authStatus[dealer.slug] || { state: 'idle' }
              const isDinamikOto = dealer.slug === DINAMIK_OTO_ID

              return (
                <div key={dealer.slug} className={[styles.sourceCard, auth.state === 'ok' ? styles.sourceCardActive : ''].join(' ')}>
                  <div className={styles.sourceHeader}>
                    <div className={styles.sourceInfo}>
                      <div className={styles.flagWrap}><Building2 size={16} /></div>
                      <div>
                        <div className={styles.sourceName}>{dealer.dealer_username}</div>
                        <div className={styles.sourceMeta}>
                          <span className={styles.sourceId}>{dealer.username}</span>
                          {isDinamikOto && <span className={styles.authTypeBadge}>JWT Auth</span>}
                        </div>
                      </div>
                    </div>
                    <div className={styles.sourceActions}>
                      {auth.state === 'ok' && <span className={styles.connectedBadge}><Wifi size={10} /> Bağlı</span>}
                      {(auth.state === 'otp' || auth.state === 'otp_loading') && (
                        <span className={styles.otpBadge}><ShieldCheck size={10} /> OTP Bekleniyor</span>
                      )}
                      {auth.state === 'error' && <span className={styles.errorBadge}><WifiOff size={10} /> Hata</span>}
                      {isDinamikOto && auth.state !== 'otp' && auth.state !== 'otp_loading' && (
                        <button
                          className={[styles.connectBtn, auth.state === 'ok' ? styles.connectBtnOk : '', auth.state === 'loading' ? styles.connectBtnLoading : ''].join(' ')}
                          onClick={() => connect(dealer)}
                          disabled={auth.state === 'loading'}
                        >
                          {auth.state === 'loading' ? (
                            <><Loader size={13} className={styles.spin} /> Bağlanıyor...</>
                          ) : auth.state === 'ok' ? (
                            <><Wifi size={13} /> Yeniden Bağlan</>
                          ) : (
                            <><Wifi size={13} /> Bağlan</>
                          )}
                        </button>
                      )}
                      <button className={styles.removeBtn} onClick={() => removeDealer(dealer.slug)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* OTP kutusu */}
                  {(auth.state === 'otp' || auth.state === 'otp_loading') && (
                    <div className={styles.form}>
                      <div className={styles.otpBox}>
                        <div className={styles.otpHeader}>
                          <ShieldCheck size={15} className={styles.otpIcon} />
                          <div>
                            <div className={styles.otpTitle}>Doğrulama Kodu Gerekiyor</div>
                            <div className={styles.otpDesc}>{auth.message}</div>
                          </div>
                        </div>
                        {auth.error && <div className={styles.otpError}>{auth.error}</div>}
                        <div className={styles.otpInputRow}>
                          <input
                            className={styles.otpInput}
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="_ _ _ _ _ _"
                            value={otpInputs[dealer.slug] || ''}
                            onChange={e => setOtpInputs(prev => ({ ...prev, [dealer.slug]: e.target.value.replace(/\D/g, '') }))}
                            onKeyDown={e => e.key === 'Enter' && submitOtp(dealer.slug)}
                            autoFocus
                          />
                          <button
                            className={styles.otpSubmitBtn}
                            onClick={() => submitOtp(dealer.slug)}
                            disabled={auth.state === 'otp_loading' || (otpInputs[dealer.slug] || '').length < 4}
                          >
                            {auth.state === 'otp_loading' ? <Loader size={14} className={styles.spin} /> : 'Doğrula'}
                          </button>
                          <button
                            className={styles.otpCancelBtn}
                            onClick={() => setAuthStatus(prev => ({ ...prev, [dealer.slug]: { state: 'idle' } }))}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auth hata/ok mesajı */}
                  {(auth.state === 'ok' || auth.state === 'error') && (
                    <div className={styles.form}>
                      {auth.state === 'ok' && <div className={styles.authOk}><Wifi size={13} /><span>{auth.message}</span></div>}
                      {auth.state === 'error' && <div className={styles.authError}><WifiOff size={13} /><span>{auth.message}</span></div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bayi ekle formu ── */}
        {availableDealers.length > 0 && (
          <div className={styles.addDealerSection}>
            <div className={styles.addDealerTitle}><Plus size={14} /> Bayi Ekle</div>
            <form className={styles.addDealerForm} onSubmit={addDealer}>
              <select
                className={styles.select}
                value={form.dealerListId}
                onChange={e => setForm(p => ({ ...p, dealerListId: e.target.value }))}
              >
                <option value="">Bayi seçin...</option>
                {availableDealers.map(dl => (
                  <option key={dl.id} value={dl.id}>{dl.name}</option>
                ))}
              </select>
              <input
                className={styles.input}
                placeholder="Bayi kullanıcı adı"
                value={form.dealer_username}
                onChange={e => setForm(p => ({ ...p, dealer_username: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder="Kullanıcı adı"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
              <div className={styles.passWrap}>
                <input
                  className={[styles.input, styles.passInput].join(' ')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Şifre"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {formError && <span className={styles.formError}>{formError}</span>}
              <button className={styles.saveBtn} type="submit" disabled={saving}>
                {saving ? <Loader size={13} className={styles.spin} /> : <><Check size={13} /> Kaydet</>}
              </button>
            </form>
          </div>
        )}

        {myDealers.length === 0 && availableDealers.length === 0 && (
          <div className={styles.empty}>Tanımlı bayi bulunmuyor. Lütfen admin panelinden bayi ekleyin.</div>
        )}

      </div>
    </div>
  )
}
