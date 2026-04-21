import { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, Check, Settings, Wifi, WifiOff, Loader, ShieldCheck, Plus, Trash2, Building2, ChevronDown, Pencil, X } from 'lucide-react'
import { authenticate, verifyOtp, getStoredToken, clearToken } from '../lib/dinamikOtoAuth'
import { loadDealers, saveDealer, deleteDealer, setDealerConnected } from '../lib/credentials'
import { useI18n } from '../i18n/index.jsx'
import UserMenu from './UserMenu'
import styles from './SettingsPage.module.css'

const API = import.meta.env.VITE_API_URL || ''

const DINAMIK_OTO_ID = 'dinamik_oto'

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export default function SettingsPage({ session, onBack, onLogout, onOpenAdmin }) {
  const { t } = useI18n()
  const [dealerList, setDealerList] = useState([])
  const [myDealers, setMyDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [showPassMap, setShowPassMap] = useState({})
  const [editMap, setEditMap] = useState({})   // { slug: { dealer_username, username, password } }
  const [editSaving, setEditSaving] = useState({})

  const [form, setForm] = useState({ dealerListId: '', dealer_username: '', username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [authStatus, setAuthStatus] = useState({})
  const [otpInputs, setOtpInputs] = useState({})

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/dealer-list`).then(r => r.json()),
      loadDealers(session.id),
    ]).then(([dl, dealers]) => {
      setDealerList(dl)
      const list = Object.entries(dealers).map(([slug, d]) => ({ slug, ...d }))
      setMyDealers(list)
      // DB'deki connected değerine göre başlangıç auth durumunu set et
      const initialAuth = {}
      for (const [slug, d] of Object.entries(dealers)) {
        if (d.connected) initialAuth[slug] = { state: 'ok', message: 'Bağlı' }
      }
      // Dinamik Oto için session token varsa mesajı güncelle
      const token = getStoredToken()
      if (token && initialAuth[DINAMIK_OTO_ID]) {
        initialAuth[DINAMIK_OTO_ID].message = `${token.username} olarak bağlandı`
      }
      setAuthStatus(initialAuth)
      setLoading(false)
    })
  }, [session.id])

  const availableDealers = dealerList.filter(
    dl => !myDealers.some(d => d.slug === slugify(dl.name))
  )

  const toggleExpand = (slug) => setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))

  const addDealer = async (e) => {
    e.preventDefault()
    if (!form.dealerListId || !form.dealer_username.trim() || !form.username.trim() || !form.password) {
      setFormError(t('settings.fill_all'))
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

  const connect = async (dealer) => {
    const slug = dealer.slug
    setAuthStatus(prev => ({ ...prev, [slug]: { state: 'loading' } }))

    if (slug === DINAMIK_OTO_ID) {
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
        await setDealerConnected(session.id, slug, true)
        setMyDealers(prev => prev.map(d => d.slug === slug ? { ...d, connected: true } : d))
        setAuthStatus(prev => ({ ...prev, [slug]: { state: 'ok', message: `${result.tokenData.username} olarak bağlandı` } }))
      } catch (err) {
        await setDealerConnected(session.id, slug, false)
        setMyDealers(prev => prev.map(d => d.slug === slug ? { ...d, connected: false } : d))
        setAuthStatus(prev => ({ ...prev, [slug]: { state: 'error', message: err.message } }))
      }
      return
    }

    // Diğer bayiler
    await new Promise(r => setTimeout(r, 600))
    await setDealerConnected(session.id, slug, true)
    setMyDealers(prev => prev.map(d => d.slug === slug ? { ...d, connected: true } : d))
    setAuthStatus(prev => ({ ...prev, [slug]: { state: 'ok', message: `${dealer.dealer_username} olarak yapılandırıldı` } }))
  }

  const startEdit = (dealer) => {
    setEditMap(p => ({ ...p, [dealer.slug]: { dealer_username: dealer.dealer_username, username: dealer.username, password: dealer.password || '' } }))
  }

  const cancelEdit = (slug) => {
    setEditMap(p => { const n = { ...p }; delete n[slug]; return n })
  }

  const saveEdit = async (dealer) => {
    const ef = editMap[dealer.slug]
    if (!ef.dealer_username.trim() || !ef.username.trim() || !ef.password) return
    setEditSaving(p => ({ ...p, [dealer.slug]: true }))
    await saveDealer(session.id, dealer.slug, {
      dealer_username: ef.dealer_username.trim(),
      username: ef.username.trim(),
      password: ef.password,
      dealer_id: dealer.dealer_id,
    })
    setMyDealers(prev => prev.map(d => d.slug === dealer.slug
      ? { ...d, dealer_username: ef.dealer_username.trim(), username: ef.username.trim(), password: ef.password }
      : d
    ))
    cancelEdit(dealer.slug)
    setEditSaving(p => ({ ...p, [dealer.slug]: false }))
  }

  const submitOtp = async (slug) => {
    const auth = authStatus[slug]
    const otpCode = otpInputs[slug] || ''
    if (otpCode.length < 4) return
    setAuthStatus(prev => ({ ...prev, [slug]: { ...auth, state: 'otp_loading' } }))
    try {
      const result = await verifyOtp({ otpCode, otpReference: auth.otpReference, ctx: auth.ctx })
      await setDealerConnected(session.id, slug, true)
      setMyDealers(prev => prev.map(d => d.slug === slug ? { ...d, connected: true } : d))
      setAuthStatus(prev => ({ ...prev, [slug]: { state: 'ok', message: `${result.tokenData.username} olarak bağlandı` } }))
    } catch (err) {
      setAuthStatus(prev => ({ ...prev, [slug]: { ...auth, state: 'otp', error: err.message } }))
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)' }}>
      {t('common.loading')}
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        <div className={styles.headerTitle}>
          <Settings size={15} />
          {t('settings.title')}
        </div>
        <div className={styles.headerStats}>
          <span className={styles.statPill}>{t('settings.dealer_count', { count: myDealers.length })}</span>
          <UserMenu session={session} onOpenSettings={() => {}} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
        </div>
      </header>

      <div className={styles.body}>

        {myDealers.length > 0 && (
          <div className={styles.sourceList}>
            {myDealers.map(dealer => {
              const auth = authStatus[dealer.slug] || { state: 'idle' }
              const isDinamikOto = dealer.slug === DINAMIK_OTO_ID
              const isOpen = !!expanded[dealer.slug]

              return (
                <div key={dealer.slug} className={[styles.sourceCard, auth.state === 'ok' ? styles.sourceCardActive : '', isOpen ? styles.sourceCardOpen : ''].join(' ')}>

                  {/* Kart başlığı — tıklanınca aç/kapa */}
                  <div className={styles.sourceHeader} onClick={() => toggleExpand(dealer.slug)}>
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
                      {auth.state === 'ok' && <span className={styles.connectedBadge}><Wifi size={10} /> {t('settings.connected')}</span>}
                      {(auth.state === 'otp' || auth.state === 'otp_loading') && (
                        <span className={styles.otpBadge}><ShieldCheck size={10} /> {t('settings.otp_waiting')}</span>
                      )}
                      {auth.state === 'error' && <span className={styles.errorBadge}><WifiOff size={10} /> {t('common.error')}</span>}
                      <button className={styles.removeBtn} onClick={e => { e.stopPropagation(); removeDealer(dealer.slug) }}>
                        <Trash2 size={14} />
                      </button>
                      <ChevronDown
                        size={15}
                        style={{ color: 'var(--text3)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                      />
                    </div>
                  </div>

                  {/* Açılır içerik */}
                  {isOpen && (
                    <div className={styles.form}>

                      {/* Kayıtlı kimlik bilgileri / Edit formu */}
                      {editMap[dealer.slug] ? (
                        <div className={styles.addDealerForm}>
                          <input
                            className={styles.input}
                            placeholder={t('settings.dealer_username')}
                            value={editMap[dealer.slug].dealer_username}
                            onChange={e => setEditMap(p => ({ ...p, [dealer.slug]: { ...p[dealer.slug], dealer_username: e.target.value } }))}
                          />
                          <input
                            className={styles.input}
                            placeholder={t('settings.login_username')}
                            value={editMap[dealer.slug].username}
                            onChange={e => setEditMap(p => ({ ...p, [dealer.slug]: { ...p[dealer.slug], username: e.target.value } }))}
                          />
                          <div className={styles.passWrap}>
                            <input
                              className={[styles.input, styles.passInput].join(' ')}
                              type={showPassMap[dealer.slug] ? 'text' : 'password'}
                              placeholder={t('auth.password')}
                              value={editMap[dealer.slug].password}
                              onChange={e => setEditMap(p => ({ ...p, [dealer.slug]: { ...p[dealer.slug], password: e.target.value } }))}
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassMap(p => ({ ...p, [dealer.slug]: !p[dealer.slug] }))}>
                              {showPassMap[dealer.slug] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                          <button className={styles.cancelEditBtn} onClick={() => cancelEdit(dealer.slug)}>
                            <X size={13} /> {t('common.cancel')}
                          </button>
                          <button className={styles.saveBtn} onClick={() => saveEdit(dealer)} disabled={editSaving[dealer.slug]}>
                            {editSaving[dealer.slug] ? <Loader size={13} className={styles.spin} /> : <><Check size={13} /> {t('common.save')}</>}
                          </button>
                        </div>
                      ) : (
                        <div className={styles.credGrid}>
                          <div className={styles.credField}>
                            <span className={styles.credLabel}>{t('settings.dealer_username')}</span>
                            <span className={styles.credValue}>{dealer.dealer_username}</span>
                          </div>
                          <div className={styles.credField}>
                            <span className={styles.credLabel}>{t('settings.login_username')}</span>
                            <span className={styles.credValue}>{dealer.username}</span>
                          </div>
                          <div className={styles.credField}>
                            <span className={styles.credLabel}>{t('auth.password')}</span>
                            <span className={styles.credValuePass}>
                              <span className={styles.credValue}>
                                {showPassMap[dealer.slug] ? (dealer.password || '—') : '••••••••'}
                              </span>
                              <button className={styles.credEyeBtn} onClick={() => setShowPassMap(p => ({ ...p, [dealer.slug]: !p[dealer.slug] }))}>
                                {showPassMap[dealer.slug] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </span>
                          </div>
                          <button className={styles.editCredBtn} onClick={() => startEdit(dealer)}>
                            <Pencil size={13} /> {t('common.edit')}
                          </button>
                        </div>
                      )}

                      {/* Bağlan butonu — tüm bayiler */}
                      {auth.state !== 'otp' && auth.state !== 'otp_loading' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className={[
                              styles.connectBtn,
                              dealer.connected ? styles.connectBtnOk : styles.connectBtnMuted,
                              auth.state === 'loading' ? styles.connectBtnLoading : '',
                            ].join(' ')}
                            onClick={() => connect(dealer)}
                            disabled={auth.state === 'loading'}
                          >
                            {auth.state === 'loading' ? (
                              <><Loader size={13} className={styles.spin} /> {t('settings.connecting')}</>
                            ) : dealer.connected ? (
                              <><Wifi size={13} /> {t('settings.connected')}</>
                            ) : (
                              <><Wifi size={13} /> {t('settings.connect')}</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* OTP kutusu — sadece Dinamik Oto */}
                      {isDinamikOto && (auth.state === 'otp' || auth.state === 'otp_loading') && (
                        <div className={styles.otpBox}>
                          <div className={styles.otpHeader}>
                            <ShieldCheck size={15} className={styles.otpIcon} />
                            <div>
                              <div className={styles.otpTitle}>{t('settings.otp_title')}</div>
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
                              {auth.state === 'otp_loading' ? <Loader size={14} className={styles.spin} /> : t('settings.otp_verify')}
                            </button>
                            <button
                              className={styles.otpCancelBtn}
                              onClick={() => setAuthStatus(prev => ({ ...prev, [dealer.slug]: { state: 'idle' } }))}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Auth sonuç mesajı */}
                      {auth.state === 'ok' && (
                        <div className={styles.authOk}><Wifi size={13} /><span>{auth.message}</span></div>
                      )}
                      {auth.state === 'error' && (
                        <div className={styles.authError}><WifiOff size={13} /><span>{auth.message}</span></div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {availableDealers.length > 0 && (
          <div className={styles.addDealerSection}>
            <div className={styles.addDealerTitle}><Plus size={14} /> {t('settings.add_dealer')}</div>
            <form className={styles.addDealerForm} onSubmit={addDealer}>
              <select
                className={styles.select}
                value={form.dealerListId}
                onChange={e => setForm(p => ({ ...p, dealerListId: e.target.value }))}
              >
                <option value="">{t('settings.select_dealer')}</option>
                {availableDealers.map(dl => (
                  <option key={dl.id} value={dl.id}>{dl.name}</option>
                ))}
              </select>
              <input
                className={styles.input}
                placeholder={t('settings.dealer_username')}
                value={form.dealer_username}
                onChange={e => setForm(p => ({ ...p, dealer_username: e.target.value }))}
              />
              <input
                className={styles.input}
                placeholder={t('settings.login_username')}
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
              <div className={styles.passWrap}>
                <input
                  className={[styles.input, styles.passInput].join(' ')}
                  type={showPass ? 'text' : 'password'}
                  placeholder={t('auth.password')}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {formError && <span className={styles.formError}>{formError}</span>}
              <button className={styles.saveBtn} type="submit" disabled={saving}>
                {saving ? <Loader size={13} className={styles.spin} /> : <><Check size={13} /> {t('common.save')}</>}
              </button>
            </form>
          </div>
        )}

        {myDealers.length === 0 && availableDealers.length === 0 && (
          <div className={styles.empty}>{t('settings.no_dealer')}</div>
        )}

      </div>
    </div>
  )
}
