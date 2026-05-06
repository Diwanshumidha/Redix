import { useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { ipc } from '../../../lib/ipc'
import Button from '../../ui/Button'

interface Props { connectionId: string; keyName: string }

export default function ListViewer({ connectionId, keyName }: Props) {
  const [items,   setItems]   = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<number, string>>({})
  const [newVal,  setNewVal]  = useState('')
  const [side,    setSide]    = useState<'left' | 'right'>('right')

  const load = async () => {
    setLoading(true)
    const r = await ipc.list.range(connectionId, keyName, 0, -1)
    if (r.ok) setItems(r.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [connectionId, keyName])

  const saveEdit = async (idx: number) => {
    await ipc.list.set(connectionId, keyName, idx, editing[idx])
    setItems((prev) => { const n = [...prev]; n[idx] = editing[idx]; return n })
    setEditing((e) => { const n = { ...e }; delete n[idx]; return n })
  }

  const push = async () => {
    if (!newVal.trim()) return
    await ipc.list.push(connectionId, keyName, newVal, side)
    setItems((prev) => side === 'left' ? [newVal, ...prev] : [...prev, newVal])
    setNewVal('')
  }

  if (loading) return <div className="p-4 text-[var(--color-overlay-0)] text-sm">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-surface-0)]/50 hover:bg-[var(--color-surface-0)]/30">
            <span className="w-8 text-[10px] text-[var(--color-overlay-0)] tabular-nums shrink-0">{i}</span>
            {editing[i] !== undefined ? (
              <>
                <input autoFocus value={editing[i]}
                  onChange={(e) => setEditing((ed) => ({ ...ed, [i]: e.target.value }))}
                  className="selectable flex-1 bg-[var(--color-crust)] border border-[var(--color-mauve)] rounded px-2 py-1 text-xs text-[var(--color-text)] outline-none font-mono" />
                <button onClick={() => saveEdit(i)} className="p-1 hover:text-[var(--color-green)] text-[var(--color-overlay-1)]"><Check size={11} /></button>
                <button onClick={() => setEditing((e) => { const n = { ...e }; delete n[i]; return n })} className="p-1 hover:text-[var(--color-red)] text-[var(--color-overlay-1)]"><X size={11} /></button>
              </>
            ) : (
              <span className="selectable flex-1 text-xs text-[var(--color-text)] font-mono truncate cursor-text" onDoubleClick={() => setEditing((e) => ({ ...e, [i]: item }))}>
                {item}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-surface-0)]">
        <select value={side} onChange={(e) => setSide(e.target.value as 'left' | 'right')}
          className="bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-mauve)]">
          <option value="right">RPUSH</option>
          <option value="left">LPUSH</option>
        </select>
        <input value={newVal} onChange={(e) => setNewVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && push()} placeholder="value"
          className="selectable flex-1 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <Button variant="primary" size="sm" onClick={push}><Plus size={12} /></Button>
      </div>
    </div>
  )
}
