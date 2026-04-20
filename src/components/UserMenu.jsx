import { useState, useRef, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import styles from './UserMenu.module.css'

export default function UserMenu({ session, onOpenSettings, onOpenAdmin, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={[styles.trigger, open ? styles.triggerOpen : ''].join(' ')} onClick={() => setOpen(v => !v)}>
        <div className={styles.avatar}>
          <User size={13} />
        </div>
        <span className={styles.username}>{session.username}</span>
        {session.role === 'admin' && <Shield size={11} className={styles.roleIcon} />}
        <ChevronDown size={13} className={[styles.chevron, open ? styles.chevronOpen : ''].join(' ')} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <div className={styles.dropAvatar}><User size={16} /></div>
            <div>
              <div className={styles.dropName}>{session.username}</div>
              <div className={styles.dropRole}>{session.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</div>
            </div>
          </div>
          <div className={styles.divider} />
          <button className={styles.dropItem} onClick={() => { setOpen(false); onOpenSettings() }}>
            <Settings size={14} />
            B2B Bağlantı Ayarları
          </button>
          {onOpenAdmin && (
            <button className={styles.dropItem} onClick={() => { setOpen(false); onOpenAdmin() }}>
              <Shield size={14} />
              Admin Paneli
            </button>
          )}
          <div className={styles.divider} />
          <button className={[styles.dropItem, styles.dropItemLogout].join(' ')} onClick={onLogout}>
            <LogOut size={14} />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}
