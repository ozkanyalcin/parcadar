import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Search, ExternalLink } from 'lucide-react'
import UserMenu from './UserMenu'
import { searchAllSources, B2B_SOURCES } from '../lib/api'
import styles from './ResultsPage.module.css'

const FLAGS = { TR: '🇹🇷', DE: '🇩🇪', NL: '🇳🇱', PL: '🇵🇱', FR: '🇫🇷' }

export default function ResultsPage({ query, isSearching, onProgressUpdate, onSearchComplete, onNewSearch, onOpenSettings, onOpenAdmin, onLogout, session }) {
  const [results, setResults] = useState([])
  const [sourceStatus, setSourceStatus] = useState({})
  const [doneCount, setDoneCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('best')
  const [searchQuery, setSearchQuery] = useState(query)
  const [newSearch, setNewSearch] = useState('')

  useEffect(() => {
    const statuses = {}
    B2B_SOURCES.forEach(s => { statuses[s.id] = 'loading' })
    setSourceStatus(statuses)
    setResults([])
    setDoneCount(0)

    let done = 0
    searchAllSources(query, (source, items) => {
      done++
      setDoneCount(d => d + 1)
      setSourceStatus(prev => ({ ...prev, [source.id]: items.length > 0 ? 'done' : 'empty' }))
      if (items.length > 0) {
        setResults(prev => [...prev, ...items])
      }
      if (done === B2B_SOURCES.length) {
        onSearchComplete([])
      }
    })
  }, [query])

  const pct = Math.round((doneCount / B2B_SOURCES.length) * 100)

  const filtered = useMemo(() => {
    let data = [...results]
    if (filter === 'in') data = data.filter(r => r.stock === 'in')
    else if (filter === 'low') data = data.filter(r => r.stock === 'low')
    else if (filter === 'out') data = data.filter(r => r.stock === 'out')
    else if (filter === 'stocked') data = data.filter(r => r.stock !== 'out')

    const availPrices = data.filter(r => r.stock !== 'out').map(r => r.price)
    const minPrice = availPrices.length ? Math.min(...availPrices) : null

    if (sort === 'best') {
      data.sort((a, b) => {
        const aOut = a.stock === 'out', bOut = b.stock === 'out'
        if (aOut && !bOut) return 1
        if (!aOut && bOut) return -1
        return a.price - b.price
      })
    } else if (sort === 'price_asc') {
      data.sort((a, b) => a.price - b.price)
    } else if (sort === 'price_desc') {
      data.sort((a, b) => b.price - a.price)
    } else if (sort === 'source') {
      data.sort((a, b) => a.sourceName.localeCompare(b.sourceName))
    }

    return { data, minPrice }
  }, [results, filter, sort])

  const stats = useMemo(() => {
    const stocked = results.filter(r => r.stock !== 'out')
    const prices = stocked.map(r => r.price)
    return {
      total: results.length,
      stocked: stocked.length,
      sources: new Set(results.map(r => r.sourceId)).size,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      saving: prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0,
    }
  }, [results])

  const handleNewSearch = () => {
    if (newSearch.trim()) onNewSearch()
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onNewSearch}>
          <ArrowLeft size={16} />
          Yeni arama
        </button>
        <div className={styles.headerSearch}>
          <Search size={14} className={styles.headerSearchIcon} />
          <span className={styles.headerQuery}>{query}</span>
        </div>
        <div className={styles.headerRight}>
          {isSearching && <span className={styles.liveTag}>canlı</span>}
          <UserMenu session={session} onOpenSettings={onOpenSettings} onOpenAdmin={onOpenAdmin} onLogout={onLogout} />
        </div>
      </header>

      <div className={styles.body}>
        {/* Progress bar */}
        {isSearching && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: pct + '%' }} />
            </div>
            <div className={styles.progressMeta}>
              <span>{doneCount}/{B2B_SOURCES.length} kaynak sorgulandı</span>
              <span className={styles.pct}>{pct}%</span>
            </div>
            <div className={styles.sourcePills}>
              {B2B_SOURCES.map(s => (
                <span
                  key={s.id}
                  className={[
                    styles.sourcePill,
                    sourceStatus[s.id] === 'done' ? styles.pillDone :
                    sourceStatus[s.id] === 'empty' ? styles.pillEmpty :
                    styles.pillLoading
                  ].join(' ')}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {results.length > 0 && (
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Toplam sonuç</div>
              <div className={styles.statVal}>{stats.total}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Stokta var</div>
              <div className={styles.statVal} style={{ color: 'var(--accent)' }}>{stats.stocked}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Aktif kaynak</div>
              <div className={styles.statVal}>{stats.sources}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>En ucuz (stoklu)</div>
              <div className={styles.statVal}>{stats.minPrice ? '₺' + stats.minPrice.toLocaleString('tr-TR') : '—'}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Fiyat farkı</div>
              <div className={styles.statVal} style={{ color: 'var(--amber)' }}>
                {stats.saving > 0 ? '₺' + stats.saving.toLocaleString('tr-TR') : '—'}
              </div>
            </div>
          </div>
        )}

        {/* Filters & Sort */}
        {results.length > 0 && (
          <div className={styles.controlRow}>
            <div className={styles.filterGroup}>
              {[
                { k: 'all', label: 'Tümü' },
                { k: 'stocked', label: 'Stoklu' },
                { k: 'in', label: 'Stokta var' },
                { k: 'low', label: 'Az kaldı' },
                { k: 'out', label: 'Stok yok' },
              ].map(f => (
                <button
                  key={f.k}
                  className={[styles.filterBtn, filter === f.k ? styles.filterActive : ''].join(' ')}
                  onClick={() => setFilter(f.k)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className={styles.sortGroup}>
              <span className={styles.sortLabel}>Sırala:</span>
              <select className={styles.sortSel} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="best">En iyi önce</option>
                <option value="price_asc">En ucuz önce</option>
                <option value="price_desc">En pahalı önce</option>
                <option value="source">Kaynak adı</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Table */}
        {filtered.data.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>B2B Kaynak</th>
                  <th>Parça Kodu</th>
                  <th>OEM No</th>
                  <th>Marka</th>
                  <th>Açıklama</th>
                  <th className={styles.thRight}>Fiyat</th>
                  <th>Stok</th>
                  <th>Miktar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.data.map((r) => {
                  const isBest = r.stock !== 'out' && r.price === filtered.minPrice
                  return (
                    <tr key={r.id} className={isBest ? styles.bestRow : ''}>
                      <td>
                        <div className={styles.sourceCell}>
                          <span className={styles.flag}>{FLAGS[r.sourceCountry] || '🌐'}</span>
                          <span className={styles.sourceName}>{r.sourceName}</span>
                          {isBest && <span className={styles.bestBadge}>EN İYİ</span>}
                        </div>
                      </td>
                      <td>
                        <span className={styles.mono}>{r.partCode}</span>
                      </td>
                      <td>
                        <span className={styles.mono} style={{ color: 'var(--text3)', fontSize: '11px' }}>{r.oemCode}</span>
                      </td>
                      <td>
                        <span className={styles.brandTag}>{r.brand}</span>
                      </td>
                      <td className={styles.descCell}>{r.description}</td>
                      <td className={styles.thRight}>
                        <span className={[styles.price, isBest ? styles.priceAccent : ''].join(' ')}>
                          ₺{r.price.toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td>
                        <StockBadge stock={r.stock} />
                      </td>
                      <td>
                        <span className={styles.qty}>
                          {r.qty > 0 ? r.qty + ' adet' : r.leadDays ? r.leadDays + ' gün' : '—'}
                        </span>
                      </td>
                      <td>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className={[styles.buyBtn, isBest ? styles.buyBtnBest : '', r.stock === 'out' ? styles.buyBtnDisabled : ''].join(' ')}
                        >
                          Satın Al
                          <ExternalLink size={11} />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && !isSearching && (
          <div className={styles.empty}>Sonuç bulunamadı.</div>
        )}

        {isSearching && results.length === 0 && (
          <div className={styles.waiting}>
            <div className={styles.waitingDots}>
              <span /><span /><span />
            </div>
            <span>Kaynaklar sorgulanıyor...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function StockBadge({ stock }) {
  if (stock === 'in') return <span className={styles.stockIn}><span className={styles.dot} />Stokta var</span>
  if (stock === 'low') return <span className={styles.stockLow}><span className={styles.dotLow} />Az kaldı</span>
  return <span className={styles.stockOut}><span className={styles.dotOut} />Stok yok</span>
}
