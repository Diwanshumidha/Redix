import { useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { RefreshCw, Terminal, GitBranch, BarChart2, Trash2, Clock, Pencil, Copy, Plus } from 'lucide-react'
import type { KeyInfo } from '@shared/types'
import type { RecentKey } from '../../hooks/useRecentKeys'

interface Props {
  open:        boolean
  keys:        KeyInfo[]
  activeKey?:  string | null
  recentKeys?: RecentKey[]
  onClose:     () => void
  onSelectKey: (key: string) => void
  onAction:    (id: string) => void
}

export default function CommandPalette({ open, keys, activeKey, recentKeys = [], onClose, onSelectKey, onAction }: Props) {
  const runAction = useCallback((id: string) => { onAction(id); onClose() }, [onAction, onClose])
  const selectKey = useCallback((key: string) => { onSelectKey(key); onClose() }, [onSelectKey, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="rv-palette-backdrop" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()}>
        <Command className="rv-palette" label="Command palette">
          <div className="rv-palette-header">
            <span className="rv-palette-prompt">›</span>
            <Command.Input autoFocus placeholder="Search keys or run a command…" />
            <kbd>esc</kbd>
          </div>

          <Command.List className="rv-palette-list">
            <Command.Empty className="rv-palette-empty">No results found</Command.Empty>

            {/* ── Key actions (only when a key is open) ── */}
            {activeKey && (
              <Command.Group>
                <div className="rv-palette-group-label">
                  Key actions
                  <span className="rv-palette-group-badge">{truncate(activeKey, 28)}</span>
                </div>
                <CmdItem value={`delete key ${activeKey}`} icon={<Trash2 size={12} />} label="Delete key" hint="del" danger onSelect={() => runAction('delete')} />
                <CmdItem value={`expire ttl ${activeKey}`} icon={<Clock size={12} />} label="Set TTL / Expire" hint="ttl" onSelect={() => runAction('expire')} />
                <CmdItem value={`rename ${activeKey}`} icon={<Pencil size={12} />} label="Rename key" hint="mv" onSelect={() => runAction('rename')} />
                <CmdItem value={`copy name ${activeKey}`} icon={<Copy size={12} />} label="Copy key name" hint="cp" onSelect={() => { navigator.clipboard.writeText(activeKey); onClose() }} />
              </Command.Group>
            )}

            {/* ── Commands ── */}
            <Command.Group>
              <div className="rv-palette-group-label">Commands</div>
              <CmdItem value="refresh rescan keys" icon={<RefreshCw size={12} />} label="Refresh keys" hint="⌘R" onSelect={() => runAction('refresh')} />
              <CmdItem value="cli terminal drawer toggle" icon={<Terminal size={12} />} label="Toggle CLI" hint="⌘`" onSelect={() => runAction('cli')} />
              <CmdItem value="tree list view toggle browse" icon={<GitBranch size={12} />} label="Toggle tree view" hint="view" onSelect={() => runAction('tree')} />
              <CmdItem value="server info stats uptime memory" icon={<BarChart2 size={12} />} label="Server Info" hint="info" onSelect={() => runAction('server')} />
              <CmdItem value="add new connection redis server" icon={<Plus size={12} />} label="Add connection" hint="new" onSelect={() => runAction('add-connection')} />
            </Command.Group>

            {/* ── Recent keys ── */}
            {recentKeys.length > 0 && (
              <Command.Group>
                <div className="rv-palette-group-label">Recent</div>
                {recentKeys.slice(0, 6).map((k) => (
                  <KeyItem key={k.key} keyName={k.key} type={k.type} onSelect={() => selectKey(k.key)} />
                ))}
              </Command.Group>
            )}

            {/* ── Key search ── */}
            {keys.length > 0 && (
              <Command.Group>
                <div className="rv-palette-group-label">
                  Keys
                  <span className="rv-palette-group-badge">{keys.length.toLocaleString()}</span>
                </div>
                {keys.slice(0, 200).map((k) => (
                  <KeyItem key={k.key} keyName={k.key} type={k.type} ttl={k.ttl} onSelect={() => selectKey(k.key)} />
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="rv-palette-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> nav</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function CmdItem({ value, icon, label, hint, danger, onSelect }: {
  value: string; icon: React.ReactNode; label: string
  hint?: string; danger?: boolean; onSelect: () => void
}) {
  return (
    <Command.Item value={value} onSelect={onSelect} className={`rv-palette-item${danger ? ' danger' : ''}`}>
      <span className="rv-palette-icon" style={danger ? { color: 'var(--rv-accent)' } : undefined}>{icon}</span>
      <span className="rv-palette-label">{label}</span>
      {hint && <span className="rv-palette-hint">{hint}</span>}
    </Command.Item>
  )
}

function KeyItem({ keyName, type, ttl, onSelect }: { keyName: string; type: string; ttl?: number; onSelect: () => void }) {
  return (
    <Command.Item value={keyName} onSelect={onSelect} className="rv-palette-item">
      <span className="rv-ktype" data-t={type} style={{ fontSize: 9, padding: '2px 5px', flexShrink: 0 }}>{type}</span>
      <span className="rv-palette-label">{keyName}</span>
      {ttl !== undefined && ttl >= 0 && <span className="rv-palette-hint">{ttl}s</span>}
    </Command.Item>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? `…${s.slice(-(n - 1))}` : s
}
