import { useState, useEffect } from 'react'
import { Search, Zap } from 'lucide-react'
import { loadDealers } from '../lib/credentials'
import { useI18n } from '../i18n/index.jsx'
import UserMenu from './UserMenu'
import styles from './SearchPage.module.css'

export default function SearchPage({ session, onSearch, onOpenSettings, onOpenAdmin, onLogout }) {
  const [query, setQuery] = useState('')
  const [dealerCount, setDealerCount] = useState(0)
  const { t } = useI18n()

  useEffect(() => {
    loadDealers(session.id).then(dealers => setDealerCount(Object.keys(dealers).length))
  }, [session.id])

  const examples = [
    { label: t('search.examples.oem'),   value: '1K0 407 271 E' },
    { label: t('search.examples.brand'), value: 'Bosch 0 451 103 369' },
    { label: t('search.examples.name'),  value: 'fren diski ön BMW E46' },
    { label: t('search.examples.ate'),   value: 'ATE 24.0122-0172.3' },
  ]

  const submit = () => {
    const q = query.trim()
    if (q) onSearch(q)
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 300 }).map((_, i) => <div key={i} className={styles.cell} />)}
      </div>

      <div className={styles.topBar}>
        <UserMenu session={session} onOpenSettings={onOpenSettings} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
      </div>

      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}><Zap size={20} strokeWidth={2.5} /></div>
          <div>
            <div className={styles.logoText}>Parça<span>Radar</span></div>
            <div className={styles.logoSub}>{t('search.subtitle', { count: dealerCount })}</div>
          </div>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className={styles.input}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={t('search.placeholder')}
            autoFocus
          />
          <button className={styles.btn} onClick={submit} disabled={!query.trim()}>
            {t('search.button')}
          </button>
        </div>

        <div className={styles.examples}>
          <span className={styles.exLabel}>{t('search.examples_label')}</span>
          {examples.map(ex => (
            <button key={ex.value} className={styles.exChip} onClick={() => setQuery(ex.value)}>
              <span className={styles.exType}>{ex.label}</span>
              {ex.value}
            </button>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statNum}>{dealerCount}</span><span className={styles.statLabel}>{t('search.stat_sources')}</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>~3sn</span><span className={styles.statLabel}>{t('search.stat_avg_query')}</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>{t('search.stat_realtime')}</span><span className={styles.statLabel}>{t('search.stat_stock')}</span></div>
        </div>
      </div>
    </div>
  )
}
