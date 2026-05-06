import { useEffect, useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { ipc } from '../../../lib/ipc'
import Button from '../../ui/Button'

interface Props { connectionId: string; keyName: string }

export default function HashViewer({ connectionId, keyName }: Props) {
  const [fields,  setFields]  = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [newField, setNewField] = useState('')
  const [newValue, setNewValue] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await ipc.hash.getAll(connectionId, keyName)
    if (r.ok) setFields(r.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [connectionId, keyName])

  const startEdit  = (f: string) => setEditing((e) => ({ ...e, [f]: fields[f] }))
  const cancelEdit = (f: string) => setEditing((e) => { const n = { ...e }; delete n[f]; return n })

  const saveEdit = async (f: string) => {
    await ipc.hash.set(connectionId, keyName, f, editing[f])
    setFields((prev) => ({ ...prev, [f]: editing[f] }))
    cancelEdit(f)
  }

  const deleteField = async (f: string) => {
    await ipc.hash.del(connectionId, keyName, f)
    setFields((prev) => { const n = { ...prev }; delete n[f]; return n })
  }

  const addField = async () => {
    if (!newField.trim()) return
    await ipc.hash.set(connectionId, keyName, newField, newValue)
    setFields((prev) => ({ ...prev, [newField]: newValue }))
    setNewField('')
    setNewValue('')
  }

  if (loading) return <div className="p-4 text-[var(--color-overlay-0)] text-sm">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-[var(--color-mantle)] border-b border-[var(--color-surface-0)]">
            <tr>
              <th className="text-left px-4 py-2 text-xs text-[var(--color-overlay-1)] font-medium w-2/5">Field</th>
              <th className="text-left px-4 py-2 text-xs text-[var(--color-overlay-1)] font-medium">Value</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {Object.entries(fields).map(([field, val]) => (
              <tr key={field} className="border-b border-[var(--color-surface-0)]/50 hover:bg-[var(--color-surface-0)]/30 group">
                <td className="selectable px-4 py-2 text-xs text-[var(--color-subtext-0)] font-mono">{field}</td>
                <td className="px-4 py-2">
                  {editing[field] !== undefined ? (
                    <input
                      autoFocus
                      value={editing[field]}
                      onChange={(e) => setEditing((ed) => ({ ...ed, [field]: e.target.value }))}
                      className="selectable w-full bg-[var(--color-crust)] border border-[var(--color-mauve)] rounded px-2 py-1 text-xs text-[var(--color-text)] outline-none font-mono"
                    />
                  ) : (
                    <span className="selectable block truncate text-xs text-[var(--color-text)] font-mono cursor-text" onDoubleClick={() => startEdit(field)}>
                      {val}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    {editing[field] !== undefined ? (
                      <>
                        <button onClick={() => saveEdit(field)}  className="p-1 hover:text-[var(--color-green)] text-[var(--color-overlay-1)]"><Check size={11} /></button>
                        <button onClick={() => cancelEdit(field)} className="p-1 hover:text-[var(--color-red)]   text-[var(--color-overlay-1)]"><X     size={11} /></button>
                      </>
                    ) : (
                      <button onClick={() => deleteField(field)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-[var(--color-red)] text-[var(--color-overlay-1)] transition-opacity"><Trash2 size={11} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-surface-0)]">
        <input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="field"
          className="selectable w-2/5 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value"
          className="selectable flex-1 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <Button variant="primary" size="sm" onClick={addField}><Plus size={12} /></Button>
      </div>
    </div>
  )
}
