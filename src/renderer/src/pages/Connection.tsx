import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, Terminal, Copy, Trash2, Clock, Server, Pencil } from 'lucide-react'
import { useConnectionsStore } from '../store/connections'
import {
  useKeyScan, useKeyInfo, useKeyValue, useDbSize,
  useInvalidateKey, useInvalidateScan, flattenScanPages,
} from '../hooks/useRedisQueries'
import { useLiveTtl, formatTtl } from '../hooks/useLiveTtl'
import { useRecentKeys } from '../hooks/useRecentKeys'
import { ipc } from '../lib/ipc'
import ValueRenderer, { valueToJson, sizeLabel } from '../components/redis/ValueRenderer'
import PrefixTree from '../components/redis/PrefixTree'
import CommandPalette from '../components/ui/CommandPalette'
import CliDrawer from '../components/ui/CliDrawer'
import { ConfirmModal, PromptModal } from '../components/ui/RvModals'
import EditKeyModal from '../components/redis/EditKeyModal'
import CreateKeyModal from '../components/redis/CreateKeyModal'

const ALL_TYPES = ['string', 'hash', 'list', 'set', 'zset'] as const

interface TabEntry { key: string; type: string; pinned: boolean }

/* ── Tab close button — dot for preview, × for pinned ── */
function TabCloseBtn({
  pinned,
  onClick,
}: {
  pinned: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  const showX = pinned || hovered
  return (
    <button
      className="rv-tab-close"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ fontSize: showX ? 14 : 8, color: hovered ? 'var(--rv-text-0)' : 'var(--rv-text-3)' }}
    >
      {showX ? '×' : '●'}
    </button>
  )
}

interface ModalState {
  kind:    'confirm' | 'expire' | 'rename'
  key:     string
}

/* ── Static TTL badge for key list rows (no live countdown — avoids N intervals) ── */
const TtlBadge = memo(function TtlBadge({ ttl }: { ttl: number }) {
  if (ttl < 0) return null
  const info = formatTtl(ttl)
  return (
    <span className={`rv-kttl${info.state === 'expiring' ? ' expiring' : info.state === 'expired' ? ' expired' : ''}`}>
      {info.label}
    </span>
  )
})

/* ── Key name with colored prefix segments ── */
const KeyName = memo(function KeyName({ name }: { name: string }) {
  const parts = name.split(':')
  return (
    <span className="rv-kname">
      {parts.map((p, i) => (
        <span key={i}>
          <span className={i === parts.length - 1 ? '' : 'kpart-prefix'}>{p}</span>
          {i < parts.length - 1 && <span className="kpart-sep">:</span>}
        </span>
      ))}
    </span>
  )
})

/* ── Memoized key row — only re-renders when this row's data changes ── */
const KeyRow = memo(function KeyRow({
  keyInfo,
  isSelected,
  onSelect,
  onDoubleClick,
}: {
  keyInfo: import('@shared/types').KeyInfo
  isSelected: boolean
  onSelect:    (key: string) => void
  onDoubleClick: (key: string) => void
}) {
  return (
    <div
      className={`rv-key-row${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(keyInfo.key)}
      onDoubleClick={() => onDoubleClick(keyInfo.key)}
    >
      <span className="rv-ktype" data-t={keyInfo.type}>{keyInfo.type}</span>
      <KeyName name={keyInfo.key} />
      <TtlBadge ttl={keyInfo.ttl} />
    </div>
  )
})

/* ── Detail header (type badge, key name, stats, actions) ── */
const DetailHeader = memo(function DetailHeader({
  connectionId, keyName,
  onAction, onCopy,
}: {
  connectionId: string
  keyName:      string
  onAction:     (action: 'delete' | 'expire' | 'rename' | 'refresh' | 'edit') => void
  onCopy:       (text: string) => void
}) {
  const infoQ  = useKeyInfo(connectionId, keyName)
  const valueQ = useKeyValue(connectionId, keyName, infoQ.data?.type)
  const info   = infoQ.data
  const liveTtl = useLiveTtl(info?.ttl ?? -1)
  const ttlInfo = formatTtl(liveTtl)
  const initialTtl = info?.ttl ?? -1

  const ttlPct = initialTtl > 0 && liveTtl > 0
    ? Math.min(100, (liveTtl / initialTtl) * 100)
    : 0

  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!info || valueQ.data === undefined) return
    const text = valueToJson(info.type, valueQ.data)
    navigator.clipboard.writeText(text)
    setCopied(true)
    onCopy(text)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!info) return null

  return (
    <div className="rv-detail-header">
      <div className="rv-detail-row1">
        <span className="rv-type-badge" data-t={info.type}>{info.type}</span>
        <span className="rv-key-name" title={keyName}>{keyName}</span>
        <div className="rv-actions">
          <button className="rv-btn icon-btn" title="Refresh" onClick={() => onAction('refresh')}>
            <RefreshCw size={12} />
          </button>
          <button className={`rv-btn icon-btn${copied ? ' copied' : ''}`} title="Copy as JSON" onClick={handleCopy}>
            <Copy size={12} />
          </button>
          {['string', 'hash', 'list', 'set', 'zset'].includes(info.type) && (
            <button className="rv-btn icon-btn" title="Edit value" onClick={() => onAction('edit')}>
              <Pencil size={12} />
            </button>
          )}
          <button className="rv-btn icon-btn" title="Set TTL / Expire" onClick={() => onAction('expire')}>
            <Clock size={12} />
          </button>
          <button className="rv-btn icon-btn danger" title="Delete key" onClick={() => onAction('delete')}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="rv-stats">
        <div className="rv-stat">
          <div className="rv-stat-label">Type</div>
          <div className="rv-stat-value">{info.type}</div>
        </div>
        <div className="rv-stat">
          <div className="rv-stat-label">Size</div>
          <div className="rv-stat-value">{valueQ.data !== undefined ? sizeLabel(info.type, valueQ.data) : '…'}</div>
        </div>
        <div className="rv-stat">
          <div className="rv-stat-label">Encoding</div>
          <div className="rv-stat-value" style={{ color: 'var(--rv-text-2)' }}>—</div>
        </div>
        <div className="rv-stat">
          <div className="rv-stat-label">TTL</div>
          <div className={`rv-stat-value ${ttlInfo.state}`}>{ttlInfo.label}</div>
          {liveTtl > 0 && (
            <div className="rv-ttl-bar">
              <span style={{ width: `${ttlPct}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

/* ── Detail body (value renderer) ── */
const DetailBody = memo(function DetailBody({ connectionId, keyName }: { connectionId: string; keyName: string }) {
  const infoQ  = useKeyInfo(connectionId, keyName)
  const valueQ = useKeyValue(connectionId, keyName, infoQ.data?.type)

  if (infoQ.isLoading || valueQ.isLoading) {
    return (
      <div className="rv-detail-body" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--rv-text-2)', fontFamily: 'var(--rv-mono)', fontSize: 12 }}>
        <span className="rv-spinner" />
        Loading…
      </div>
    )
  }

  if (infoQ.isError || !infoQ.data) {
    return (
      <div className="rv-detail-body" style={{ color: 'var(--rv-accent)', fontFamily: 'var(--rv-mono)', fontSize: 12 }}>
        Failed to load key info
      </div>
    )
  }

  return (
    <div className="rv-detail-body">
      <ValueRenderer type={infoQ.data.type} value={valueQ.data} />
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   Main Connection Page
   ══════════════════════════════════════════════════════════════ */
export default function ConnectionPage() {
  const { id = '' }  = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const conn         = useConnectionsStore((s) => s.connections.find((c) => c.id === id))

  /* Scan state */
  const [pattern,    setPattern]    = useState('*')
  const [draftPat,   setDraftPat]   = useState('*')
  const [scanCount]                  = useState(200)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [view,       setView]       = useState<'flat' | 'tree'>('flat')

  /* Tabs */
  const [openTabs,    setOpenTabs]    = useState<TabEntry[]>([])
  const [activeTabKey, setActiveTabKey] = useState<string | null>(null)

  /* UI overlays */
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [cliOpen,     setCliOpen]     = useState(false)
  const [modal,       setModal]       = useState<ModalState | null>(null)
  const [editOpen,    setEditOpen]    = useState(false)
  const [createOpen,  setCreateOpen]  = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)

  /* Recent keys */
  const { recentKeys, addRecent } = useRecentKeys()

  /* Data */
  const scanQ   = useKeyScan(id, pattern, scanCount)
  const dbSizeQ = useDbSize(id)
  const allKeys  = useMemo(() => flattenScanPages(scanQ.data), [scanQ.data])
  const visibleKeys = useMemo(
    () => (typeFilter ? allKeys.filter((k) => k.type === typeFilter) : allKeys),
    [allKeys, typeFilter],
  )

  const invalidateKey  = useInvalidateKey()
  const invalidateScan = useInvalidateScan()

  /* Show toast */
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  /* Pin a tab (make it permanent) */
  const pinTab = useCallback((key: string) => {
    setOpenTabs((prev) => prev.map((t) => t.key === key ? { ...t, pinned: true } : t))
  }, [])

  /* Single-click: open as preview tab, replacing any existing preview tab */
  const handleSelectKey = useCallback((key: string) => {
    const info = allKeys.find((k) => k.key === key)
    const type = info?.type ?? 'string'
    setOpenTabs((prev) => {
      if (prev.some((t) => t.key === key)) return prev
      const tempIdx = prev.findIndex((t) => !t.pinned)
      if (tempIdx !== -1) {
        const next = [...prev]
        next[tempIdx] = { key, type, pinned: false }
        return next
      }
      return [...prev, { key, type, pinned: false }]
    })
    setActiveTabKey(key)
    if (info) addRecent(key, info.type)
  }, [allKeys, addRecent])

  /* Double-click: open/promote to permanent tab */
  const handleDoubleClickKey = useCallback((key: string) => {
    const info = allKeys.find((k) => k.key === key)
    const type = info?.type ?? 'string'
    setOpenTabs((prev) => {
      const existing = prev.find((t) => t.key === key)
      if (existing) return prev.map((t) => t.key === key ? { ...t, pinned: true } : t)
      return [...prev, { key, type, pinned: true }]
    })
    setActiveTabKey(key)
    if (info) addRecent(key, info.type)
  }, [allKeys, addRecent])

  /* Keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as Element).tagName
      if (['INPUT', 'TEXTAREA'].includes(tag)) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setPaletteOpen(true); return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault(); setCliOpen((v) => !v); return
      }

      const cur = visibleKeys.findIndex((k) => k.key === activeTabKey)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = visibleKeys[cur + 1] ?? visibleKeys[0]
        if (next) handleSelectKey(next.key)
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = visibleKeys[cur - 1] ?? visibleKeys[visibleKeys.length - 1]
        if (prev) handleSelectKey(prev.key)
      } else if (e.key === 'g') {
        if (visibleKeys[0]) handleSelectKey(visibleKeys[0].key)
      } else if (e.key === 'G') {
        const last = visibleKeys.at(-1)
        if (last) handleSelectKey(last.key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visibleKeys, activeTabKey, handleSelectKey])

  /* Key actions — any action pins the active tab */
  const handleKeyAction = useCallback(async (action: 'delete' | 'expire' | 'rename' | 'refresh' | 'edit') => {
    if (!activeTabKey) return
    pinTab(activeTabKey)
    if (action === 'delete') {
      setModal({ kind: 'confirm', key: activeTabKey })
    } else if (action === 'expire') {
      setModal({ kind: 'expire', key: activeTabKey })
    } else if (action === 'rename') {
      setModal({ kind: 'rename', key: activeTabKey })
    } else if (action === 'refresh') {
      invalidateKey(id, activeTabKey)
    } else if (action === 'edit') {
      setEditOpen(true)
    }
  }, [activeTabKey, id, invalidateKey])

  const confirmDelete = async () => {
    if (!modal) return
    await ipc.keys.delete(id, [modal.key])
    setOpenTabs((prev) => prev.filter((t) => t.key !== modal.key))
    if (activeTabKey === modal.key) setActiveTabKey(openTabs.find((t) => t.key !== modal.key)?.key ?? null)
    invalidateScan(id)
    setModal(null)
    showToast(`Deleted ${modal.key}`)
  }

  const confirmExpire = async (seconds: string) => {
    if (!modal) return
    const n = Number.parseInt(seconds, 10)
    if (Number.isNaN(n) || n < 0) return
    if (n === 0) await ipc.keys.persist(id, modal.key)
    else         await ipc.keys.expire(id, modal.key, n)
    invalidateKey(id, modal.key)
    setModal(null)
    showToast(n === 0 ? 'TTL cleared' : `TTL set to ${n}s`)
  }

  const confirmRename = async (newName: string) => {
    if (!modal) return
    const trimmed = newName.trim()
    if (!trimmed || trimmed === modal.key) { setModal(null); return }
    const r = await ipc.keys.rename(id, modal.key, trimmed)
    if (!r.ok) { showToast(`Rename failed: ${r.error}`); setModal(null); return }
    setOpenTabs((prev) => prev.map((t) => t.key === modal.key ? { ...t, key: trimmed } : t))
    if (activeTabKey === modal.key) setActiveTabKey(trimmed)
    invalidateScan(id)
    setModal(null)
    showToast(`Renamed to ${trimmed}`)
  }

  const handlePaletteAction = (action: string) => {
    if (action === 'refresh')   { scanQ.refetch(); invalidateScan(id) }
    else if (action === 'cli')  setCliOpen((v) => !v)
    else if (action === 'tree') setView((v) => v === 'tree' ? 'flat' : 'tree')
    else if (action === 'server') navigate(`/connection/${id}/server`)
  }

  if (!conn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--rv-text-3)', fontFamily: 'var(--rv-mono)', fontSize: 12 }}>
        Connection not found
      </div>
    )
  }

  return (
    <div className="rv-container">
      {/* ── Key list pane ── */}
      <div className="rv-keylist">
        {/* Scan controls */}
        <div className="rv-scan-bar">
          <div className="rv-scan-row">
            <span className="rv-scan-cmd">SCAN</span>
            <input
              className="rv-input cursor"
              value="0"
              readOnly
              title="cursor"
            />
            <span className="rv-scan-label">MATCH</span>
            <input
              className="rv-input"
              value={draftPat}
              onChange={(e) => setDraftPat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPattern(draftPat); scanQ.refetch() } }}
              placeholder="*"
              spellCheck={false}
            />
            <input
              className="rv-input count"
              type="number"
              defaultValue={scanCount}
              readOnly
              title="COUNT"
            />
            <button
              className="rv-btn"
              onClick={() => { setPattern(draftPat); scanQ.refetch() }}
            >
              Scan
            </button>
          </div>

          {/* Type filter chips */}
          <div className="rv-type-filter">
            {ALL_TYPES.map((t) => (
              <button
                key={t}
                data-t={t}
                className={`rv-type-chip${typeFilter === t ? ' on' : ''}`}
                onClick={() => setTypeFilter((f) => f === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Meta bar */}
        <div className="rv-keylist-meta">
          {scanQ.isLoading ? (
            <span><span className="rv-spinner" style={{ width: 10, height: 10, marginRight: 6 }} />Scanning…</span>
          ) : (
            <span><b>{visibleKeys.length}</b> shown</span>
          )}
          {dbSizeQ.data !== undefined && (
            <span><b>{dbSizeQ.data.toLocaleString()}</b> total</span>
          )}
          {scanQ.hasNextPage && (
            <button className="rv-btn ghost" style={{ padding: '0 6px', height: 18, fontSize: 10 }} onClick={() => scanQ.fetchNextPage()}>
              + more
            </button>
          )}
          <button
            className="rv-btn ghost"
            style={{ height: 20, padding: '0 8px', fontSize: 10, marginLeft: 'auto' }}
            onClick={() => setCreateOpen(true)}
            title="Create new key"
          >
            + New
          </button>
          <div className="rv-view-toggle" style={{ marginLeft: 0 }}>
            <button className={view === 'flat' ? 'on' : ''} onClick={() => setView('flat')}>List</button>
            <button className={view === 'tree' ? 'on' : ''} onClick={() => setView('tree')}>Tree</button>
          </div>
        </div>

        {/* Key list / tree */}
        {view === 'flat' ? (
          <div className="rv-key-list">
            {visibleKeys.length === 0 && !scanQ.isLoading && (
              <div className="rv-empty">
                <span style={{ fontSize: 22, opacity: 0.3 }}>{scanQ.isError ? '✗' : '∅'}</span>
                <span>{scanQ.isError ? 'Failed to scan keys' : 'No keys found'}</span>
                {scanQ.isError && (
                  <span style={{ fontSize: 10, color: 'var(--rv-text-3)', marginTop: 2 }}>
                    Check your connection settings
                  </span>
                )}
              </div>
            )}
            {visibleKeys.map((k) => (
              <KeyRow
                key={k.key}
                keyInfo={k}
                isSelected={activeTabKey === k.key}
                onSelect={handleSelectKey}
                onDoubleClick={handleDoubleClickKey}
              />
            ))}
            {scanQ.hasNextPage && (
              <button
                className="rv-load-more"
                onClick={() => scanQ.fetchNextPage()}
                disabled={scanQ.isFetchingNextPage}
              >
                {scanQ.isFetchingNextPage ? '…' : 'Load more'}
              </button>
            )}
          </div>
        ) : (
          <PrefixTree keys={visibleKeys} selected={activeTabKey} onSelect={handleSelectKey} />
        )}
      </div>

      {/* ── Detail pane ── */}
      <div className="rv-detail">
        {/* Tabs */}
        {openTabs.length > 0 && (
          <div className="rv-tabs">
            {openTabs.map((tab) => (
              <button
                key={tab.key}
                className={`rv-tab${activeTabKey === tab.key ? ' active' : ''}${!tab.pinned ? ' preview' : ''}`}
                onClick={() => setActiveTabKey(tab.key)}
                onDoubleClick={() => pinTab(tab.key)}
                title={tab.pinned ? tab.key : `${tab.key} (preview — double-click to keep)`}
              >
                <span className="rv-ktype" data-t={tab.type} style={{ fontSize: 9, padding: '1px 4px' }}>{tab.type}</span>
                <span className={`rv-tab-name${!tab.pinned ? ' preview' : ''}`}>
                  {tab.key.split(':').at(-1) ?? tab.key}
                </span>
                <TabCloseBtn
                  pinned={tab.pinned}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenTabs((prev) => prev.filter((t) => t.key !== tab.key))
                    if (activeTabKey === tab.key) {
                      const remaining = openTabs.filter((t) => t.key !== tab.key)
                      setActiveTabKey(remaining.at(-1)?.key ?? null)
                    }
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Content — any click inside the detail view pins the preview tab */}
        {activeTabKey ? (
          // biome-ignore lint/a11y/useKeyWithClickEvents: intentional activity detector
          <div
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
            onClick={() => pinTab(activeTabKey)}
          >
            <DetailHeader
              connectionId={id}
              keyName={activeTabKey}
              onAction={handleKeyAction}
              onCopy={() => showToast('Copied to clipboard')}
            />
            <DetailBody connectionId={id} keyName={activeTabKey} />
          </div>
        ) : (
          <div
            className="rv-detail-empty"
            style={recentKeys.length > 0
              ? { justifyContent: 'flex-start', paddingTop: '8vh', paddingBottom: 24, overflowY: 'auto' }
              : undefined}
          >
            <div className="glyph">⌘</div>
            <div style={{ color: 'var(--rv-text-2)', fontWeight: 500, fontSize: 13 }}>Select a key to inspect</div>
            <div style={{ fontSize: 11, color: 'var(--rv-text-3)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span><kbd>j</kbd><kbd>k</kbd> navigate</span>
              <span style={{ color: 'var(--rv-border-strong)' }}>·</span>
              <span><kbd>↵</kbd> open</span>
              <span style={{ color: 'var(--rv-border-strong)' }}>·</span>
              <span><kbd>⌘K</kbd> search</span>
              <span style={{ color: 'var(--rv-border-strong)' }}>·</span>
              <span><kbd>⌘`</kbd> CLI</span>
            </div>

            {recentKeys.length > 0 && (
              <div style={{ marginTop: 32, width: '100%', maxWidth: 400, textAlign: 'left' }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--rv-text-3)',
                  fontFamily: 'var(--rv-mono)', marginBottom: 8, paddingLeft: 2,
                }}>
                  Recently opened
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {recentKeys.map(({ key, type }) => (
                    <button
                      key={key}
                      onClick={() => handleDoubleClickKey(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 12px', borderRadius: 6, textAlign: 'left',
                        background: 'var(--rv-bg-1)', border: '1px solid var(--rv-border)',
                        color: 'var(--rv-text-1)', cursor: 'pointer',
                        fontFamily: 'var(--rv-mono)', fontSize: 11.5,
                        transition: 'all 0.1s', width: '100%',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rv-bg-2)'; e.currentTarget.style.borderColor = 'var(--rv-border-strong)'; e.currentTarget.style.color = 'var(--rv-text-0)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--rv-bg-1)'; e.currentTarget.style.borderColor = 'var(--rv-border)'; e.currentTarget.style.color = 'var(--rv-text-1)' }}
                    >
                      <span className="rv-ktype" data-t={type} style={{ flexShrink: 0 }}>{type}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {key}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status bar at bottom of detail pane */}
        <div className="rv-statusbar">
          <span className="rv-status-ok">●</span>
          <span style={{ color: 'var(--rv-text-2)', fontWeight: 500 }}>{conn.name}</span>
          <span className="rv-status-sep" />
          <span style={{ fontFamily: 'var(--rv-mono)', color: 'var(--rv-text-3)' }}>{conn.host}:{conn.port}</span>
          {conn.db !== 0 && (
            <>
              <span className="rv-status-sep" />
              <span style={{ color: 'var(--rv-info)' }}>db{conn.db}</span>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button
            className="rv-btn ghost"
            style={{ height: 20, padding: '0 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setCliOpen((v) => !v)}
          >
            <Terminal size={10} />
            CLI
          </button>
          <button
            className="rv-btn ghost"
            style={{ height: 20, padding: '0 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => navigate(`/connection/${id}/server`)}
          >
            <Server size={10} />
            Info
          </button>
        </div>
      </div>

      {/* ── Overlays ── */}
      <CommandPalette
        open={paletteOpen}
        keys={visibleKeys}
        onClose={() => setPaletteOpen(false)}
        onSelectKey={(key) => { handleSelectKey(key); setPaletteOpen(false) }}
        onAction={handlePaletteAction}
      />

      <CliDrawer open={cliOpen} onClose={() => setCliOpen(false)} connectionId={id} />

      <ConfirmModal
        open={modal?.kind === 'confirm'}
        title="Delete key"
        body={<>Are you sure you want to delete <code>{modal?.key.length && modal?.key.length > 10 ? modal?.key.substring(0, 10) + '...' : modal?.key}</code>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setModal(null)}
      />

      <PromptModal
        open={modal?.kind === 'expire'}
        title="Set TTL"
        label="Seconds (0 = remove expiry)"
        placeholder="3600"
        onSubmit={confirmExpire}
        onCancel={() => setModal(null)}
      />

      <PromptModal
        open={modal?.kind === 'rename'}
        title="Rename key"
        label="New key name"
        defaultValue={modal?.key ?? ''}
        onSubmit={confirmRename}
        onCancel={() => setModal(null)}
      />

      <CreateKeyModal
        open={createOpen}
        connectionId={id}
        onClose={() => setCreateOpen(false)}
        onCreated={(key, type) => {
          invalidateScan(id)
          handleDoubleClickKey(key)
          showToast(`Created ${type} key`)
        }}
      />

      <EditKeyModal
        open={editOpen}
        connectionId={id}
        keyName={activeTabKey ?? ''}
        keyType={openTabs.find((t) => t.key === activeTabKey)?.type ?? ''}
        onClose={() => setEditOpen(false)}
        onSaved={() => { if (activeTabKey) invalidateKey(id, activeTabKey) }}
      />

      {toast && <div className="rv-toast">{toast}</div>}
    </div>
  )
}
