import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Plus, Trash2, Eye, EyeOff, Shield, Pencil, Check, X } from 'lucide-react'
import { useI18n } from '../i18n/index.jsx'
import UserMenu from './UserMenu'
import styles from './AdminPage.module.css'

const API = import.meta.env.VITE_API_URL || ''

export default function AdminPage({ session, onBack, onLogout }) {
  const { t } = useI18n()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // edit state
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ username: '', password: '' })
  const [showEditPass, setShowEditPass] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/users`).then(r => r.json()).then(setUsers)
  }, [])

  const createUser = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) return
    setSaving(true)
    setError('')
    const res = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setUsers(prev => [...prev, data])
    setForm({ username: '', password: '' })
  }

  const deleteUser = async (id) => {
    if (!confirm(t('admin.confirm_delete_user'))) return
    await fetch(`${API}/api/users/${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u.id !== id))
    if (editId === id) setEditId(null)
  }

  const startEdit = (user) => {
    setEditId(user.id)
    setEditForm({ username: user.username, password: '' })
    setEditError('')
    setShowEditPass(false)
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditError('')
  }

  const saveEdit = async (user) => {
    if (!editForm.username.trim()) { setEditError(t('auth.username_empty')); return }
    setEditSaving(true)
    setEditError('')

    // kullanıcı adı değiştiyse — API'de username update endpoint'i yoksa ekleyelim
    // şimdilik sadece şifre güncellemesi yapılabilir, username de güncellenebilir olsun
    try {
      if (editForm.password) {
        const res = await fetch(`${API}/api/users/${user.id}/password`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password: editForm.password }),
        })
        if (!res.ok) { const d = await res.json(); setEditError(d.error); setEditSaving(false); return }
      }

      if (editForm.username.trim() !== user.username) {
        const res = await fetch(`${API}/api/users/${user.id}/username`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: editForm.username.trim() }),
        })
        if (!res.ok) { const d = await res.json(); setEditError(d.error); setEditSaving(false); return }
      }

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, username: editForm.username.trim() } : u))
      setEditId(null)
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> {t('common.back')}
        </button>
        <div className={styles.headerTitle}>
          <Shield size={15} />
          {t('admin.title')}
        </div>
        <UserMenu session={session} onOpenSettings={() => {}} onLogout={onLogout} />
      </header>

      <div className={styles.body}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <Users size={15} />
            <span>{t('admin.users')}</span>
            <span className={styles.badge}>{users.length}</span>
          </div>

          {/* Yeni kullanıcı formu */}
          <form className={styles.newUserForm} onSubmit={createUser}>
            <input
              className={styles.input}
              placeholder={t('auth.username')}
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            />
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder={t('auth.password')}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
            <button className={styles.addBtn} type="submit" disabled={saving || !form.username.trim() || !form.password}>
              <Plus size={14} /> {t('admin.add_user')}
            </button>
          </form>

          {/* Kullanıcı listesi */}
          <div className={styles.userList}>
            {users.map(user => (
              <div key={user.id} className={[styles.userCard, editId === user.id ? styles.userCardOpen : ''].join(' ')}>
                {/* Satır başlığı */}
                <div className={styles.userRow}>
                  <div className={styles.userAvatar}>{user.username[0].toUpperCase()}</div>
                  <span className={styles.userName}>{user.username}</span>
                  <div className={styles.userActions}>
                    {editId !== user.id && (
                      <button className={styles.editBtn} onClick={() => startEdit(user)} title={t('common.edit')}>
                        <Pencil size={13} />
                      </button>
                    )}
                    {user.username !== 'admin' && editId !== user.id && (
                      <button className={styles.deleteBtn} onClick={() => deleteUser(user.id)} title="Sil">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit formu */}
                {editId === user.id && (
                  <div className={styles.editForm}>
                    <input
                      className={styles.input}
                      placeholder="Kullanıcı adı"
                      value={editForm.username}
                      onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                      autoFocus
                    />
                    <div className={styles.passWrap}>
                      <input
                        className={styles.input}
                        type={showEditPass ? 'text' : 'password'}
                        placeholder={t('admin.new_password_placeholder')}
                        value={editForm.password}
                        onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                      />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowEditPass(v => !v)}>
                        {showEditPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {editError && <span className={styles.errorText}>{editError}</span>}
                    <div className={styles.editActions}>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>
                        <X size={13} /> {t('common.cancel')}
                      </button>
                      <button className={styles.saveBtn} onClick={() => saveEdit(user)} disabled={editSaving}>
                        <Check size={13} /> {t('common.save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
