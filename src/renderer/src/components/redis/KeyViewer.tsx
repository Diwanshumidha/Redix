import { useEffect, useState } from 'react'
import { Clock, Trash2, RefreshCw } from 'lucide-react'
import { cn, keyTypeColor, keyTypeBadge } from '../../lib/utils'
import { ipc } from '../../lib/ipc'
import type { KeyInfo } from '@shared/types'
import StringViewer from './viewers/StringViewer'
import HashViewer   from './viewers/HashViewer'
import ListViewer   from './viewers/ListViewer'
import SetViewer    from './viewers/SetViewer'
import ZSetViewer   from './viewers/ZSetViewer'

interface KeyViewerProps {
  connectionId: string
  keyName:      string
}

function ttlLabel(ttl: number): string {
  if (ttl === -1) return 'No expiry'
  if (ttl === -2) return 'Expired'
  if (ttl < 60)   return `${ttl}s`
  if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`
  return `${Math.floor(ttl / 3600)}h`
}

export default function KeyViewer({ connectionId, keyName }: KeyViewerProps) {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await ipc.keys.type(connectionId, keyName)
    if (result.ok) setKeyInfo(result.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [connectionId, keyName])

  const handleDelete = async () => {
    if (!confirm(`Delete "${keyName}"?`)) return
    await ipc.keys.delete(connectionId, [keyName])
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[var(--color-overlay-0)] text-sm">Loading…</div>
  }
  if (!keyInfo) {
    return <div className="flex items-center justify-center h-full text-[var(--color-red)] text-sm">Key not found</div>
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-surface-0)] bg-[var(--color-mantle)] shrink-0">
        <span className={cn('text-[10px] font-bold', keyTypeColor(keyInfo.type))}>
          {keyTypeBadge(keyInfo.type)}
        </span>
        <span className="selectable flex-1 truncate text-sm font-medium text-[var(--color-text)]">
          {keyName}
        </span>
        <div className="flex items-center gap-2 text-[var(--color-overlay-0)] text-xs shrink-0">
          <Clock size={11} />
          <span>{ttlLabel(keyInfo.ttl)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={load}
            className="p-1.5 rounded hover:bg-[var(--color-surface-0)] text-[var(--color-overlay-1)] hover:text-[var(--color-text)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-[var(--color-surface-0)] text-[var(--color-overlay-1)] hover:text-[var(--color-red)] transition-colors"
            title="Delete key"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {keyInfo.type === 'string' && <StringViewer connectionId={connectionId} keyName={keyName} />}
        {keyInfo.type === 'hash'   && <HashViewer   connectionId={connectionId} keyName={keyName} />}
        {keyInfo.type === 'list'   && <ListViewer   connectionId={connectionId} keyName={keyName} />}
        {keyInfo.type === 'set'    && <SetViewer    connectionId={connectionId} keyName={keyName} />}
        {keyInfo.type === 'zset'   && <ZSetViewer   connectionId={connectionId} keyName={keyName} />}
        {!['string','hash','list','set','zset'].includes(keyInfo.type) && (
          <div className="flex items-center justify-center h-full text-[var(--color-overlay-0)] text-sm">
            Viewer for {keyInfo.type} coming soon
          </div>
        )}
      </div>
    </div>
  )
}
