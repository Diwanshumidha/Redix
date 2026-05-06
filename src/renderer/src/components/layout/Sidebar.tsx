import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Server, Pencil, Trash2, Database, Wifi, WifiOff } from 'lucide-react'
import { useConnectionsStore } from '../../store/connections'
import { useUiStore } from '../../store/ui'
import { ipc } from '../../lib/ipc'
import { ConfirmModal } from '../ui/RvModals'

export default function Sidebar() {
  const { id: activeId } = useParams()
  const navigate          = useNavigate()
  const connections       = useConnectionsStore((s) => s.connections)
  const statuses          = useConnectionsStore((s) => s.statuses)
  const removeConnection  = useConnectionsStore((s) => s.removeConnection)
  const { sidebarCollapsed, openModal } = useUiStore()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const handleOpen = async (connId: string) => {
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

  if (sidebarCollapsed) return null

  const connectedCount = connections.filter((c) => statuses[c.id]?.connected).length

  return (
    <aside
      className="shrink-0 flex flex-col animate-slide-in-left"
      style={{
        width: '220px',
        background: 'var(--rv-bg-1)',
        borderRight: '1px solid var(--rv-border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--rv-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--rv-mono)',
            fontSize: '9.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--rv-text-3)',
          }}
        >
          Connections
        </span>
        <button
          onClick={() => openModal('add-connection')}
          title="Add connection"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '5px',
            border: '1px solid var(--rv-border)',
            background: 'transparent',
            color: 'var(--rv-text-2)',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--rv-bg-2)'
            e.currentTarget.style.color = 'var(--rv-text-0)'
            e.currentTarget.style.borderColor = 'var(--rv-border-strong)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--rv-text-2)'
            e.currentTarget.style.borderColor = 'var(--rv-border)'
          }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Connection list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {connections.length === 0 ? (
          <EmptyState onAdd={() => openModal('add-connection')} />
        ) : (
          connections.map((conn) => {
            const status      = statuses[conn.id]
            const isActive    = activeId === conn.id
            const isConnected = status?.connected ?? false

            return (
              <ConnectionItem
                key={conn.id}
                name={conn.name}
                host={conn.host}
                port={conn.port}
                db={conn.db}
                isActive={isActive}
                isConnected={isConnected}
                onClick={() => handleOpen(conn.id)}
                onEdit={() => openModal('edit-connection', { connectionId: conn.id })}
                onDelete={() => setDeleteTarget({ id: conn.id, name: conn.name })}
              />
            )
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '7px 12px',
          borderTop: '1px solid var(--rv-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--rv-mono)',
          fontSize: '9.5px',
          color: 'var(--rv-text-3)',
        }}
      >
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: connectedCount > 0 ? 'var(--rv-ok)' : 'var(--rv-text-3)',
            flexShrink: 0,
          }}
        />
        <span>
          {connectedCount}/{connections.length} connected
        </span>
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
    </aside>
  )
}

function ConnectionItem({
  name, host, port, db,
  isActive, isConnected,
  onClick, onEdit, onDelete,
}: {
  name: string
  host: string
  port: number
  db: number
  isActive: boolean
  isConnected: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="group"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '8px 8px',
        borderRadius: '6px',
        cursor: 'pointer',
        marginBottom: '2px',
        border: `1px solid ${isActive ? 'rgba(248,81,73,0.25)' : 'transparent'}`,
        background: isActive ? 'rgba(248,81,73,0.08)' : 'transparent',
        transition: 'all 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--rv-bg-hover)'
          e.currentTarget.style.borderColor = 'var(--rv-border)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      {/* Icon with status ring */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            background: isActive
              ? 'rgba(248,81,73,0.15)'
              : 'var(--rv-bg-2)',
            border: `1px solid ${isActive ? 'rgba(248,81,73,0.3)' : 'var(--rv-border)'}`,
            display: 'grid',
            placeItems: 'center',
            color: isActive ? 'var(--rv-accent)' : 'var(--rv-text-2)',
          }}
        >
          <Server size={13} />
        </div>
        {/* Connection status dot */}
        <div
          style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? 'var(--rv-ok)' : 'var(--rv-bg-3)',
            border: `1.5px solid var(--rv-bg-1)`,
            boxShadow: isConnected ? '0 0 4px var(--rv-ok)' : 'none',
            transition: 'all 0.3s',
          }}
        />
      </div>

      {/* Name + host */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--rv-sans)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: isActive ? 'var(--rv-text-0)' : 'var(--rv-text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: 'var(--rv-mono)',
            fontSize: '10px',
            color: 'var(--rv-text-3)',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {host}:{port}
          {db !== 0 && (
            <span
              style={{
                marginLeft: '4px',
                color: 'var(--rv-info)',
                opacity: 0.8,
              }}
            >
              /db{db}
            </span>
          )}
        </div>
      </div>

      {/* Connection status icon (shown when not hovering) */}
      <div
        className="group-hover-hide"
        style={{
          flexShrink: 0,
          color: isConnected ? 'var(--rv-ok)' : 'var(--rv-text-3)',
          display: 'flex',
        }}
      >
        {isConnected
          ? <Wifi size={11} />
          : <WifiOff size={11} />
        }
      </div>

      {/* Hover actions */}
      <div
        className="rv-conn-actions"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '2px',
          flexShrink: 0,
        }}
      >
        <ActionIcon
          icon={<Pencil size={10} />}
          title="Edit"
          hoverColor="var(--rv-info)"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        />
        <ActionIcon
          icon={<Trash2 size={10} />}
          title="Delete"
          hoverColor="var(--rv-accent)"
          onClick={async (e) => { e.stopPropagation(); await onDelete() }}
        />
      </div>
    </div>
  )
}

function ActionIcon({
  icon, title, hoverColor, onClick,
}: {
  icon: React.ReactNode
  title: string
  hoverColor: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: 'none',
        background: 'transparent',
        color: 'var(--rv-text-3)',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--rv-bg-3)'
        e.currentTarget.style.color = hoverColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--rv-text-3)'
      }}
    >
      {icon}
    </button>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '32px 16px',
        color: 'var(--rv-text-3)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--rv-bg-2)',
          border: '1px solid var(--rv-border)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Database size={18} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--rv-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--rv-text-2)', marginBottom: '4px' }}>
          No connections
        </div>
        <div style={{ fontFamily: 'var(--rv-mono)', fontSize: '10.5px', color: 'var(--rv-text-3)', lineHeight: 1.5 }}>
          Add a Redis server<br />to get started
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 12px',
          borderRadius: '5px',
          border: '1px solid var(--rv-border)',
          background: 'var(--rv-bg-2)',
          color: 'var(--rv-text-1)',
          fontFamily: 'var(--rv-mono)',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--rv-bg-3)'
          e.currentTarget.style.borderColor = 'var(--rv-border-strong)'
          e.currentTarget.style.color = 'var(--rv-text-0)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--rv-bg-2)'
          e.currentTarget.style.borderColor = 'var(--rv-border)'
          e.currentTarget.style.color = 'var(--rv-text-1)'
        }}
      >
        <Plus size={11} />
        New Connection
      </button>
    </div>
  )
}
