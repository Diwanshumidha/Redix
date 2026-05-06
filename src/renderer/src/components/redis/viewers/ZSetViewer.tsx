import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ipc } from '../../../lib/ipc'
import type { ZSetEntry } from '@shared/types'
import Button from '../../ui/Button'

interface Props { connectionId: string; keyName: string }

export default function ZSetViewer({ connectionId, keyName }: Props) {
  const [items,     setItems]     = useState<ZSetEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [newMember, setNewMember] = useState('')
  const [newScore,  setNewScore]  = useState('0')

  useEffect(() => {
    setLoading(true)
    ipc.zset.range(connectionId, keyName, 0, -1).then((r) => {
      if (r.ok) setItems(r.data)
      setLoading(false)
    })
  }, [connectionId, keyName])

  const add = async () => {
    if (!newMember.trim()) return
    const score = Number.parseFloat(newScore) || 0
    await ipc.zset.add(connectionId, keyName, score, newMember)
    setItems((prev) =>
      [...prev.filter((i) => i.member !== newMember), { member: newMember, score }]
        .sort((a, b) => a.score - b.score),
    )
    setNewMember('')
    setNewScore('0')
  }

  const remove = async (member: string) => {
    await ipc.zset.remove(connectionId, keyName, member)
    setItems((prev) => prev.filter((i) => i.member !== member))
  }

  if (loading) return <div className="p-4 text-[var(--color-overlay-0)] text-sm">Loading…</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-[var(--color-mantle)] border-b border-[var(--color-surface-0)]">
            <tr>
              <th className="text-left px-4 py-2 text-xs text-[var(--color-overlay-1)] font-medium w-28">Score</th>
              <th className="text-left px-4 py-2 text-xs text-[var(--color-overlay-1)] font-medium">Member</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map(({ member, score }) => (
              <tr key={member} className="border-b border-[var(--color-surface-0)]/50 hover:bg-[var(--color-surface-0)]/30 group">
                <td className="selectable px-4 py-2 text-xs text-[var(--color-mauve)] font-mono tabular-nums">{score}</td>
                <td className="selectable px-4 py-2 text-xs text-[var(--color-text)] font-mono">{member}</td>
                <td className="px-2 py-2">
                  <button onClick={() => remove(member)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--color-red)] text-[var(--color-overlay-1)] transition-opacity">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-surface-0)]">
        <input type="number" value={newScore} onChange={(e) => setNewScore(e.target.value)} placeholder="score"
          className="selectable w-24 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="member"
          className="selectable flex-1 bg-[var(--color-crust)] border border-[var(--color-surface-0)] rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none focus:border-[var(--color-mauve)] font-mono" />
        <Button variant="primary" size="sm" onClick={add}><Plus size={12} /></Button>
      </div>
    </div>
  )
}
