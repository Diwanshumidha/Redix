import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Terminal, BarChart2, Database, Server, Plus, Pencil, Trash2, ChevronDown, Wifi, WifiOff } from 'lucide-react'
import { useUiStore } from '../../store/ui'
import { useConnectionsStore } from '../../store/connections'
import { useServerInfo } from '../../hooks/useRedisQueries'
import { formatUptime } from '../../lib/utils'
import { ipc } from '../../lib/ipc'
import { ConfirmModal } from '../ui/RvModals'

/* ── Sparkline ── */
function Sparkline({
  values,
  width = 56,
  height = 20,
  color = '#3fb950',
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
}) {
  if (values.length < 2) return <svg width={width} height={height} style={{ display: 'block' }} />

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pad = 2

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const last = pts[pts.length - 1].split(',')

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="url(#spark-fade)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} opacity="0.95" />
    </svg>
  )
}

/* ── Connections dropdown ── */
function ConnectionsDropdown() {
  const { id: activeId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openModal } = useUiStore()
  const connections    = useConnectionsStore((s) => s.connections)
  const statuses       = useConnectionsStore((s) => s.statuses)
  const removeConnection = useConnectionsStore((s) => s.removeConnection)

  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const activeConn  = connections.find((c) => c.id === activeId)
  const connectedCount = connections.filter((c) => statuses[c.id]?.connected).length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = async (connId: string) => {
    setOpen(false)
    const result = await ipc.connection.open(connId)
    if (result.ok) useConnectionsStore.getState().setStatus(connId, result.data)
    navigate(`/connection/${connId}`)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await ipc.connection.close(deleteTarget.id)
    removeConnection(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <>
      <div ref={dropRef} style={{ position: 'relative' }} className="no-drag">
        {/* Trigger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: '6px',
            border: `1px solid ${open ? 'var(--rv-border-strong)' : 'transparent'}`,
            background: open ? 'var(--rv-bg-2)' : 'transparent',
            color: 'var(--rv-text-1)',
            cursor: 'pointer',
            transition: 'all 0.1s',
            fontFamily: 'var(--rv-mono)',
            fontSize: '11px',
            fontWeight: 600,
            minWidth: 0,
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'var(--rv-bg-2)'
              e.currentTarget.style.borderColor = 'var(--rv-border)'
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }
          }}
        >
          {/* Status dot */}
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: connectedCount > 0 ? 'var(--rv-ok)' : 'var(--rv-text-3)',
            boxShadow: connectedCount > 0 ? '0 0 5px var(--rv-ok)' : 'none',
          }} />

          <span style={{ color: 'var(--rv-text-0)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeConn ? activeConn.name : 'Connections'}
          </span>

          {connections.length > 0 && (
            <span style={{
              fontFamily: 'var(--rv-mono)', fontSize: '9px', fontWeight: 700,
              color: 'var(--rv-text-3)', background: 'var(--rv-bg-3)',
              border: '1px solid var(--rv-border)', borderRadius: '3px', padding: '1px 4px',
              flexShrink: 0,
            }}>
              {connections.length}
            </span>
          )}

          <ChevronDown size={10} style={{ color: 'var(--rv-text-3)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '240px',
            background: 'var(--rv-bg-1)',
            border: '1px solid var(--rv-border-strong)',
            borderRadius: '8px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            zIndex: 9000,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px 7px',
              borderBottom: '1px solid var(--rv-border)',
            }}>
              <span style={{
                fontFamily: 'var(--rv-mono)', fontSize: '9.5px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--rv-text-3)',
              }}>
                Connections
              </span>
              <button
                onClick={() => { setOpen(false); openModal('add-connection') }}
                title="Add connection"
                style={{
                  display: 'grid', placeItems: 'center',
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: '1px solid var(--rv-border)', background: 'transparent',
                  color: 'var(--rv-text-2)', cursor: 'pointer', transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rv-bg-2)'; e.currentTarget.style.color = 'var(--rv-text-0)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rv-text-2)' }}
              >
                <Plus size={11} />
              </button>
            </div>

            {/* List */}
            <div style={{ padding: '4px', maxHeight: '300px', overflowY: 'auto' }}>
              {connections.length === 0 ? (
                <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--rv-text-3)', fontFamily: 'var(--rv-mono)', fontSize: '11px' }}>
                  No connections yet
                </div>
              ) : (
                connections.map((conn) => {
                  const isActive    = activeId === conn.id
                  const isConnected = statuses[conn.id]?.connected ?? false
                  return (
                    <DropdownConnItem
                      key={conn.id}
                      name={conn.name}
                      host={conn.host}
                      port={conn.port}
                      db={conn.db}
                      isActive={isActive}
                      isConnected={isConnected}
                      onClick={() => handleOpen(conn.id)}
                      onEdit={() => { setOpen(false); openModal('edit-connection', { connectionId: conn.id }) }}
                      onDelete={() => { setOpen(false); setDeleteTarget({ id: conn.id, name: conn.name }) }}
                    />
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '6px 10px',
              borderTop: '1px solid var(--rv-border)',
              fontFamily: 'var(--rv-mono)', fontSize: '9.5px', color: 'var(--rv-text-3)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: connectedCount > 0 ? 'var(--rv-ok)' : 'var(--rv-text-3)', flexShrink: 0 }} />
              {connectedCount}/{connections.length} connected
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete connection"
        body={<>Remove <code>{deleteTarget?.name}</code>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

function DropdownConnItem({
  name, host, port, db,
  isActive, isConnected,
  onClick, onEdit, onDelete,
}: {
  name: string; host: string; port: number; db: number
  isActive: boolean; isConnected: boolean
  onClick: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 8px', borderRadius: '5px', cursor: 'pointer',
        marginBottom: '1px',
        border: `1px solid ${isActive ? 'rgba(248,81,73,0.25)' : 'transparent'}`,
        background: isActive ? 'rgba(248,81,73,0.08)' : hovered ? 'var(--rv-bg-hover)' : 'transparent',
        transition: 'all 0.1s',
      }}
    >
      {/* Server icon with status dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '6px',
          background: isActive ? 'rgba(248,81,73,0.15)' : 'var(--rv-bg-2)',
          border: `1px solid ${isActive ? 'rgba(248,81,73,0.3)' : 'var(--rv-border)'}`,
          display: 'grid', placeItems: 'center',
          color: isActive ? 'var(--rv-accent)' : 'var(--rv-text-2)',
        }}>
          <Server size={11} />
        </div>
        <div style={{
          position: 'absolute', bottom: '-1px', right: '-1px',
          width: '7px', height: '7px', borderRadius: '50%',
          background: isConnected ? 'var(--rv-ok)' : 'var(--rv-bg-3)',
          border: '1.5px solid var(--rv-bg-1)',
          boxShadow: isConnected ? '0 0 4px var(--rv-ok)' : 'none',
        }} />
      </div>

      {/* Name + host */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--rv-sans)', fontSize: '12px', fontWeight: 600,
          color: isActive ? 'var(--rv-text-0)' : 'var(--rv-text-1)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>{name}</div>
        <div style={{
          fontFamily: 'var(--rv-mono)', fontSize: '10px', color: 'var(--rv-text-3)',
          marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {host}:{port}
          {db !== 0 && <span style={{ marginLeft: '3px', color: 'var(--rv-info)', opacity: 0.8 }}>/db{db}</span>}
        </div>
      </div>

      {/* Hover actions */}
      {hovered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <ActionIcon icon={<Pencil size={10} />} title="Edit" hoverColor="var(--rv-info)" onClick={(e) => { e.stopPropagation(); onEdit() }} />
          <ActionIcon icon={<Trash2 size={10} />} title="Delete" hoverColor="var(--rv-accent)" onClick={(e) => { e.stopPropagation(); onDelete() }} />
        </div>
      ) : (
        <div style={{ flexShrink: 0, color: isConnected ? 'var(--rv-ok)' : 'var(--rv-text-3)', display: 'flex' }}>
          {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
        </div>
      )}
    </div>
  )
}

function ActionIcon({ icon, title, hoverColor, onClick }: { icon: React.ReactNode; title: string; hoverColor: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'grid', placeItems: 'center',
        width: '18px', height: '18px', borderRadius: '4px',
        border: 'none', background: 'transparent',
        color: 'var(--rv-text-3)', cursor: 'pointer', transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rv-bg-3)'; e.currentTarget.style.color = hoverColor }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rv-text-3)' }}
    >
      {icon}
    </button>
  )
}

/* ── Main TopBar ── */
export default function TopBar() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const connections = useConnectionsStore((s) => s.connections)
  const statuses    = useConnectionsStore((s) => s.statuses)

  const conn        = connections.find((c) => c.id === id)
  const isConnected = id ? (statuses[id]?.connected ?? false) : false
  const serverInfo  = useServerInfo(id ?? '', !!id && isConnected)
  const info        = serverInfo.data

  /* Accumulate OPS/S readings for sparkline */
  const opsRef = useRef<number[]>([])
  const [opsVals, setOpsVals] = useState<number[]>([])
  useEffect(() => {
    if (info?.opsPerSec !== undefined) {
      opsRef.current = [...opsRef.current, info.opsPerSec].slice(-28)
      setOpsVals([...opsRef.current])
    }
  }, [info?.opsPerSec])

  return (
    <header
      className="drag-region shrink-0 select-none"
      style={{
        height: '40px',
        background: 'var(--rv-bg-1)',
        borderBottom: '1px solid var(--rv-border)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
        gap: 0,
      }}
    >
      {/* REDIX Logo */}
      <div
        className="no-drag"
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 6px 0 2px', flexShrink: 0 }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            background: 'var(--rv-accent)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Database size={10} color="#fff" strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontFamily: 'var(--rv-mono)',
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '0.13em',
            color: 'var(--rv-text-0)',
          }}
        >
          REDIX
        </span>
      </div>

      <Sep />

      {/* Connections dropdown */}
      <ConnectionsDropdown />

      {/* Active connection breadcrumb detail */}
      {conn && (
        <>
          <Sep />
          <div
            className="no-drag"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 6px',
              minWidth: 0,
              maxWidth: '200px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                flexShrink: 0,
                background: isConnected ? 'var(--rv-ok)' : 'var(--rv-text-3)',
                boxShadow: isConnected ? '0 0 6px var(--rv-ok)' : 'none',
                transition: 'all 0.4s',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--rv-mono)',
                fontSize: '10px',
                color: 'var(--rv-text-3)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {conn.host}:{conn.port}
            </span>
            {conn.db !== 0 && (
              <span
                style={{
                  fontFamily: 'var(--rv-mono)',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: 'var(--rv-info)',
                  background: 'rgba(88,166,255,0.1)',
                  border: '1px solid rgba(88,166,255,0.2)',
                  borderRadius: '3px',
                  padding: '1px 4px',
                  flexShrink: 0,
                }}
              >
                db{conn.db}
              </span>
            )}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* ── Live stats panel ── */}
      {info && isConnected && (
        <>
          <div
            className="no-drag"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '28px',
              background: 'var(--rv-bg-0)',
              border: '1px solid var(--rv-border)',
              borderRadius: '6px',
              overflow: 'hidden',
              marginRight: '6px',
              flexShrink: 0,
            }}
          >
            {/* OPS/S with sparkline */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '0 9px 0 8px',
                height: '100%',
                borderRight: '1px solid var(--rv-border)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px' }}>
                <span style={statLabel}>ops/s</span>
                <span
                  style={{
                    fontFamily: 'var(--rv-mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--rv-text-0)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {info.opsPerSec.toLocaleString()}
                </span>
              </div>
              <Sparkline values={opsVals} width={54} height={20} color="var(--rv-ok)" />
            </div>

            {/* Uptime */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 9px',
                height: '100%',
                borderRight: '1px solid var(--rv-border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--rv-mono)',
                  fontSize: '14px',
                  color: 'var(--rv-warn)',
                  opacity: 0.65,
                  lineHeight: 1,
                  transform: 'rotate(-10deg)',
                  display: 'inline-block',
                }}
              >
                ∞
              </span>
              <span style={statLabel}>uptime</span>
              <span style={statValue}>{formatUptime(info.uptimeSeconds)}</span>
            </div>

            {/* Memory */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 9px',
                height: '100%',
              }}
            >
              <span style={statLabel}>mem</span>
              <span style={{ ...statValue, color: 'var(--rv-purple)' }}>
                {info.usedMemoryHuman}
              </span>
              {info.totalSystemMemoryHuman && (
                <>
                  <span style={{ color: 'var(--rv-text-3)', fontSize: '10px', fontFamily: 'var(--rv-mono)' }}>/</span>
                  <span style={{ ...statValue, color: 'var(--rv-text-2)' }}>
                    {info.totalSystemMemoryHuman}
                  </span>
                </>
              )}
            </div>
          </div>
          <Sep />
        </>
      )}

      {/* Navigation buttons */}
      {conn && (
        <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '2px' }}>
          <TopNavBtn icon={<Terminal size={12} />} label="CLI" onClick={() => navigate(`/connection/${id}/cli`)} />
          <TopNavBtn icon={<BarChart2 size={12} />} label="Info" onClick={() => navigate(`/connection/${id}/server`)} />
        </div>
      )}
    </header>
  )
}

/* ── Shared sub-components ── */

function Sep() {
  return (
    <div
      style={{
        width: '1px',
        height: '16px',
        background: 'var(--rv-border)',
        flexShrink: 0,
        margin: '0 3px',
      }}
    />
  )
}

function TopNavBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="no-drag"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '5px',
        border: '1px solid transparent',
        background: 'transparent',
        color: 'var(--rv-text-2)',
        fontFamily: 'var(--rv-mono)',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.1s',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={(e) => {
        const t = e.currentTarget
        t.style.background = 'var(--rv-bg-2)'
        t.style.color = 'var(--rv-text-0)'
        t.style.borderColor = 'var(--rv-border)'
      }}
      onMouseLeave={(e) => {
        const t = e.currentTarget
        t.style.background = 'transparent'
        t.style.color = 'var(--rv-text-2)'
        t.style.borderColor = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

/* ── Style constants ── */

const statLabel: CSSProperties = {
  fontFamily: 'var(--rv-mono)',
  fontSize: '8.5px',
  fontWeight: 700,
  color: 'var(--rv-text-3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

const statValue: CSSProperties = {
  fontFamily: 'var(--rv-mono)',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--rv-text-1)',
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
}
