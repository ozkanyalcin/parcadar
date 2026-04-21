import { useState, useEffect } from 'react'
import { Search, Zap } from 'lucide-react'
import { loadDealers } from '../lib/credentials'
import UserMenu from './UserMenu'
import styles from './SearchPage.module.css'

const EXAMPLES = [
  { label: 'OEM kodu', value: '1K0 407 271 E' },
  { label: 'Marka kodu', value: 'Bosch 0 451 103 369' },
  { label: 'Parça adı', value: 'fren diski ön BMW E46' },
  { label: 'ATE kodu', value: 'ATE 24.0122-0172.3' },
]

export default function SearchPage({ session, onSearch, onOpenSettings, onOpenAdmin, onLogout }) {
  const [query, setQuery] = useState('')
  const [dealerCount, setDealerCount] = useState(0)

  useEffect(() => {
    loadDealers(session.id).then(dealers => setDealerCount(Object.keys(dealers).length))
  }, [session.id])

  const submit = () => {
    const q = query.trim()
    if (q) onSearch(q)
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 300 }).map((_, i) => (
          <div key={i} className={styles.cell} />
        ))}
      </div>

      <div className={styles.topBar}>
        <UserMenu session={session} onOpenSettings={onOpenSettings} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
      </div>

      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className={styles.logoText}>Parça<span>Radar</span></div>
            <div className={styles.logoSub}>{dealerCount} B2B kaynaktan anlık fiyat ve stok karşılaştırma</div>
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
            placeholder="Parça kodu, OEM numarası veya ürün adı..."
            autoFocus
          />
          <button className={styles.btn} onClick={submit} disabled={!query.trim()}>
            Sorgula
          </button>
        </div>

        <div className={styles.examples}>
          <span className={styles.exLabel}>Örnek aramalar:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.value}
              className={styles.exChip}
              onClick={() => setQuery(ex.value)}
            >
              <span className={styles.exType}>{ex.label}</span>
              {ex.value}
            </button>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><span className={styles.statNum}>2</span><span className={styles.statLabel}>B2B kaynak</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>~3sn</span><span className={styles.statLabel}>ortalama sorgu</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>anlık</span><span className={styles.statLabel}>stok bilgisi</span></div>
        </div>
      </div>
    </div>
  )
}
