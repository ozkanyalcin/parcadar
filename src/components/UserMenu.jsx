import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown, Shield, Globe } from 'lucide-react'
import { useI18n, LANGUAGE_LABELS } from '../i18n/index.jsx'
import styles from './UserMenu.module.css'

export default function UserMenu({ session, onOpenSettings, onOpenAdmin, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { t, lang, setLang } = useI18n()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={[styles.trigger, open ? styles.triggerOpen : ''].join(' ')} onClick={() => setOpen(v => !v)}>
        <div className={styles.avatar}><User size={13} /></div>
        <span className={styles.username}>{session.username}</span>
        <ChevronDown size={13} className={[styles.chevron, open ? styles.chevronOpen : ''].join(' ')} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <div className={styles.dropAvatar}><User size={16} /></div>
            <div>
              <div className={styles.dropName}>{session.username}</div>
              <div className={styles.dropRole}>{session.username === 'admin' ? t('auth.role_admin') : t('auth.role_user')}</div>
            </div>
          </div>
          <div className={styles.divider} />

          {/* Dil seçici */}
          <div className={styles.langRow}>
            <Globe size={14} className={styles.langIcon} />
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
          <div className={styles.divider} />

          <button className={styles.dropItem} onClick={() => { setOpen(false); onOpenSettings() }}>
            <Settings size={14} />
            {t('menu.settings')}
          </button>
          {onOpenAdmin && session.username === 'admin' && (
            <button className={styles.dropItem} onClick={() => { setOpen(false); onOpenAdmin() }}>
              <Shield size={14} />
              {t('menu.admin')}
            </button>
          )}
          <div className={styles.divider} />
          <button className={[styles.dropItem, styles.dropItemLogout].join(' ')} onClick={onLogout}>
            <LogOut size={14} />
            {t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
