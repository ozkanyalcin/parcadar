import { useState } from 'react'
import LoginPage from './components/LoginPage'
import SearchPage from './components/SearchPage'
import ResultsPage from './components/ResultsPage'
import SettingsPage from './components/SettingsPage'
import AdminPage from './components/AdminPage'
import { getSession, logout } from './lib/auth'
import './App.css'

export default function App() {
  const [session, setSession] = useState(() => getSession())
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState('search')

  const handleLogin = (user) => setSession(user)

  const handleLogout = () => {
    logout()
    setSession(null)
    setQuery('')
    setSearching(false)
    setPage('search')
  }

  const handleSearch = (q) => {
    setQuery(q)
    setPage('results')
    setSearching(true)
  }

  const handleNewSearch = () => {
    setQuery('')
    setSearching(false)
    setPage('search')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (page === 'settings') {
    return (
      <SettingsPage
        session={session}
        onBack={() => setPage(searching ? 'results' : 'search')}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'admin') {
    if (session.username !== 'admin') {
      setPage('search')
      return null
    }
    return (
      <AdminPage
        session={session}
        onBack={() => setPage(searching ? 'results' : 'search')}
        onLogout={handleLogout}
        onOpenSettings={() => setPage('settings')}
      />
    )
  }

  if (page === 'results') {
    return (
      <ResultsPage
        key={query}
        query={query}
        isSearching={searching}
        session={session}
        onSearchComplete={() => setSearching(false)}
        onNewSearch={handleNewSearch}
        onOpenSettings={() => setPage('settings')}
        onOpenAdmin={() => setPage('admin')}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <SearchPage
      session={session}
      onSearch={handleSearch}
      onOpenSettings={() => setPage('settings')}
      onOpenAdmin={() => setPage('admin')}
      onLogout={handleLogout}
    />
  )
}
