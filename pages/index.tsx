import { useState, useEffect, useCallback } from 'react'
import styles from '../styles/Home.module.css'

// ── Types ────────────────────────────────────────────────────────────────────
type Status = '' | 'oppfattet' | 'blir_gjort' | 'fullfort' | 'ikke_viktig'

interface Issue {
  id: number
  title: string
  description: string
  status: Status
  solution: string
  created_by: string
  created_at: string
}

interface User {
  id: number
  hash: string
  is_admin: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function genHash() {
  return 'usr_' + Math.random().toString(36).substr(2, 8).toUpperCase()
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('no-NO', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

const STATUS_LABELS: Record<Status, string> = {
  '': 'Ikke behandlet',
  oppfattet: 'Oppfattet',
  blir_gjort: 'Blir gjort',
  fullfort: 'Fullført',
  ikke_viktig: 'Ikke viktig',
}

const DOT_COLORS: Record<Status, string> = {
  '': '#3a3a3a',
  oppfattet: '#eab308',
  blir_gjort: '#3b82f6',
  fullfort: '#22c55e',
  ikke_viktig: '#555',
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState<'all' | Status | 'open'>('all')
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adminCodeInput, setAdminCodeInput] = useState('')
  const [showAdminInput, setShowAdminInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [solutionDrafts, setSolutionDrafts] = useState<Record<number, string>>({})

  // ── Init user ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      let hash = localStorage.getItem('hms_hash')
      if (!hash) {
        hash = genHash()
        localStorage.setItem('hms_hash', hash)
      }
      const res = await fetch(`/api/users?hash=${hash}`)
      const u = await res.json()
      setUser(u)
      await loadIssues()
      setLoading(false)
    }
    init()
  }, [])

  // ── Load issues ────────────────────────────────────────────────────────────
  const loadIssues = useCallback(async () => {
    const res = await fetch('/api/issues')
    const data = await res.json()
    setIssues(data)
    // prime solution drafts
    const drafts: Record<number, string> = {}
    for (const i of data) drafts[i.id] = i.solution
    setSolutionDrafts(drafts)
  }, [])

  // ── Submit issue ───────────────────────────────────────────────────────────
  async function submitIssue() {
    if (!newTitle.trim() || !user) return
    setSaving(true)
    await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim(), created_by: user.hash }),
    })
    await loadIssues()
    setNewTitle(''); setNewDesc(''); setShowModal(false)
    setSaving(false)
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(id: number, status: Status) {
    if (!user) return
    await fetch('/api/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, hash: user.hash }),
    })
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  // ── Update solution ────────────────────────────────────────────────────────
  async function saveSolution(id: number) {
    if (!user) return
    const solution = solutionDrafts[id] ?? ''
    await fetch('/api/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, solution, hash: user.hash }),
    })
    setIssues(prev => prev.map(i => i.id === id ? { ...i, solution } : i))
  }

  // ── Become admin ───────────────────────────────────────────────────────────
  async function tryAdminCode() {
    if (!user) return
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: user.hash, code: adminCodeInput }),
    })
    if (res.ok) {
      const u = await res.json()
      setUser(u)
      setShowAdminInput(false)
      setAdminCodeInput('')
    } else {
      alert('Feil kode.')
    }
  }

  async function demoteAdmin() {
    // Simply remove locally — a real app would have a revoke endpoint
    if (!user) return
    setUser({ ...user, is_admin: false })
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = issues.filter(i => {
    if (filter === 'all') return true
    if (filter === 'open') return !i.status || i.status === 'oppfattet' || i.status === 'blir_gjort'
    return i.status === filter
  })

  const counts = {
    total: issues.length,
    open: issues.filter(i => !i.status || i.status === 'oppfattet' || i.status === 'blir_gjort').length,
    done: issues.filter(i => i.status === 'fullfort').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'IBM Plex Mono, monospace', color: '#555', fontSize: 13 }}>
      LASTER...
    </div>
  )

  return (
    <div className={styles.app}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          HMS<span>/</span>AVVIK
          <span className={styles.logoSub}>Drømtorp vgs</span>
        </div>
        <div className={styles.headerRight}>
          {user?.is_admin && <span className={styles.adminBadge}>ADMIN</span>}
          <span
            className={styles.userBadge}
            onClick={() => user?.is_admin ? demoteAdmin() : setShowAdminInput(v => !v)}
            title={user?.is_admin ? 'Klikk for å logge ut admin' : 'Klikk for admin-tilgang'}
          >
            {user?.hash}
          </span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowModal(true)}>
            + Ny sak
          </button>
        </div>
      </header>

      {/* ── Admin code bar ── */}
      {showAdminInput && (
        <div className={styles.adminBar}>
          <span>Admin-kode:</span>
          <input
            className={styles.adminInput}
            type="password"
            placeholder="Skriv inn kode..."
            value={adminCodeInput}
            onChange={e => setAdminCodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryAdminCode()}
            autoFocus
          />
          <button className={`${styles.btn} ${styles.btnSmall}`} onClick={tryAdminCode}>Logg inn</button>
          <button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => setShowAdminInput(false)}>Avbryt</button>
          <span className={styles.hint}>Hint: ADMIN123</span>
        </div>
      )}

      <main className={styles.main}>
        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {([
              ['all', `ALLE (${counts.total})`],
              ['open', `ÅPNE (${counts.open})`],
              ['oppfattet', 'OPPFATTET'],
              ['blir_gjort', 'BLIR GJORT'],
              ['fullfort', `FULLFØRT (${counts.done})`],
              ['ikke_viktig', 'IKKE VIKTIG'],
            ] as [string, string][]).map(([val, label]) => (
              <button
                key={val}
                className={`${styles.filterBtn} ${filter === val ? styles.active : ''}`}
                onClick={() => setFilter(val as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colIssue}>Saker</th>
                <th className={styles.colStatus}>Oppfattet</th>
                <th className={styles.colStatus}>Status</th>
                <th className={styles.colSolution}>Løsning</th>
                <th className={styles.colStatus}>Blir gjort</th>
                <th className={styles.colStatus}>Fullført</th>
                <th className={styles.colStatus}>Ikke viktig</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.empty}>
                      <div className={styles.emptyIcon}>◻</div>
                      <div>Ingen saker</div>
                      <div className={styles.emptySub}>Klikk «+ Ny sak» for å registrere et avvik</div>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(issue => {
                const isOppfattet = !!issue.status && issue.status !== 'ikke_viktig'
                const isBliGjort = issue.status === 'blir_gjort' || issue.status === 'fullfort'
                const isFullfort = issue.status === 'fullfort'
                const isIkkeViktig = issue.status === 'ikke_viktig'

                return (
                  <tr key={issue.id} className={styles.row}>
                    {/* Saker */}
                    <td>
                      <div className={styles.issueTitle}>{issue.title}</div>
                      {issue.description && (
                        <div className={styles.issueDesc}>{issue.description}</div>
                      )}
                      <div className={styles.issueMeta}>
                        {issue.created_by === user?.hash ? '(deg)' : issue.created_by}
                        {' · '}{formatDate(issue.created_at)}
                      </div>
                    </td>

                    {/* Oppfattet */}
                    <td>
                      <Dot on={isOppfattet} color={DOT_COLORS.oppfattet} />
                    </td>

                    {/* Status */}
                    <td>
                      {user?.is_admin ? (
                        <select
                          className={styles.statusSelect}
                          value={issue.status}
                          onChange={e => updateStatus(issue.id, e.target.value as Status)}
                        >
                          <option value="">Ikke behandlet</option>
                          <option value="oppfattet">Oppfattet</option>
                          <option value="blir_gjort">Blir gjort</option>
                          <option value="fullfort">Fullført</option>
                          <option value="ikke_viktig">Ikke viktig</option>
                        </select>
                      ) : (
                        <StatusBadge status={issue.status} />
                      )}
                    </td>

                    {/* Løsning */}
                    <td>
                      {user?.is_admin ? (
                        <textarea
                          className={styles.solutionInput}
                          value={solutionDrafts[issue.id] ?? issue.solution}
                          onChange={e => setSolutionDrafts(d => ({ ...d, [issue.id]: e.target.value }))}
                          onBlur={() => saveSolution(issue.id)}
                          placeholder="Skriv løsning / svar..."
                          rows={3}
                        />
                      ) : (
                        <div className={styles.solutionText}>
                          {issue.solution || <span className={styles.dash}>—</span>}
                        </div>
                      )}
                    </td>

                    {/* Blir gjort */}
                    <td><Dot on={isBliGjort && !isFullfort} color={DOT_COLORS.blir_gjort} /></td>

                    {/* Fullført */}
                    <td><Dot on={isFullfort} color={DOT_COLORS.fullfort} /></td>

                    {/* Ikke viktig */}
                    <td><Dot on={isIkkeViktig} color={DOT_COLORS.ikke_viktig} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── New issue modal ── */}
      {showModal && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>// NY HMS-SAK</div>

            <div className={styles.field}>
              <label>Tittel / problem *</label>
              <input
                type="text"
                placeholder="Kort beskrivelse av problemet"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && submitIssue()}
              />
            </div>

            <div className={styles.field}>
              <label>Beskrivelse</label>
              <textarea
                rows={4}
                placeholder="Forklar problemet mer detaljert — hva skjedde, hvor, osv."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>

            <div className={styles.modalMeta}>
              Registreres som: <span>{user?.hash}</span>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btn} onClick={() => setShowModal(false)}>Avbryt</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={submitIssue}
                disabled={!newTitle.trim() || saving}
              >
                {saving ? 'Sender...' : 'Send inn sak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Dot({ on, color }: { on: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: on ? color : '#2a2a2a',
        display: 'inline-block', flexShrink: 0,
      }} />
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#888' }}>
        {on ? 'JA' : '—'}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: DOT_COLORS[status],
        display: 'inline-block',
      }} />
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#888' }}>
        {STATUS_LABELS[status]}
      </span>
    </div>
  )
}
