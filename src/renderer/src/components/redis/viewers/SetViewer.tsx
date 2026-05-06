import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ipc } from '../../../lib/ipc'
import Button from '../../ui/Button'

interface Props { connectionId: string; keyName: string }

export default function SetViewer({ connectionId, keyName }: Props) {
  const [members, setMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    setLoading(true)
    ipc.set.members(connectionId, keyName).then((r) => {
      if (r.ok) setMembers(r.data.sort())
      setLoading(false)
    })
  }, [connectionId, keyName])

  const add = async () => {
    if (!newMember.trim()) return
    await ipc.set.add(connectionId, keyName, newMember)
    setMembers((m) => [...m, newMember].sort())
    setNewMember('')
  }

  const remove = async (member: string) => {
    await ipc.set.remove(connectionId, keyName, member)
    setMembers((m) => m.filter((x) => x !== member))
  }

  if (loading) return <div className="p-4 text-[var(--color-overlay-0)] text-sm">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {members.map((m) => (
          <div key={m} className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-surface-0)]/50 hover:bg-[var(--color-surface-0)]/30 group">
            <span className="selectable flex-1 text-xs text-[var(--color-text)] font-mono">{m}</span>
            <button onClick={() => remove(m)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--color-red)] text-[var(--color-overlay-1)] transition-opacity">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-surface-0)]">
        <input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="member"
          className="selectable flex-1 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <Button variant="primary" size="sm" onClick={add}><Plus size={12} /></Button>
      </div>
    </div>
  )
}
