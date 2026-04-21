import { useState } from 'react'
import { Zap, Eye, EyeOff, LogIn, Globe } from 'lucide-react'
import { login } from '../lib/auth'
import { useI18n, LANGUAGE_LABELS } from '../i18n/index.jsx'
import styles from './LoginPage.module.css'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t, lang, setLang } = useI18n()

  const submit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const user = await login(username.trim(), password)
      onLogin(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 300 }).map((_, i) => <div key={i} className={styles.cell} />)}
      </div>

      {/* Dil seçici */}
      <div className={styles.langSwitch}>
        <Globe size={13} />
        {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
          <button
            key={code}
            className={[styles.langBtn, lang === code ? styles.langBtnActive : ''].join(' ')}
            onClick={() => setLang(code)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className={styles.logoText}>Parça<span>Radar</span></div>
            <div className={styles.logoSub}>B2B Fiyat &amp; Stok Karşılaştırma</div>
          </div>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <div className={styles.field}>
            <label className={styles.label}>{t('auth.username')}</label>
            <input
              className={styles.input}
              type="text"
              placeholder={t('auth.username_placeholder')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('auth.password')}</label>
            <div className={styles.passWrap}>
              <input
                className={[styles.input, styles.passInput].join(' ')}
                type={showPass ? 'text' : 'password'}
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.loginBtn} type="submit" disabled={!username.trim() || !password || loading}>
            {loading ? <span className={styles.spinner} /> : <><LogIn size={15} /> {t('auth.login')}</>}
          </button>
        </form>

        <div className={styles.hint}>
          {t('auth.default_hint')} <code>admin</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  )
}
