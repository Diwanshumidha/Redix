import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { ipc } from '../../../lib/ipc'
import Button from '../../ui/Button'

interface Props { connectionId: string; keyName: string }

export default function StringViewer({ connectionId, keyName }: Props) {
  const [value,    setValue]    = useState('')
  const [original, setOriginal] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    setLoading(true)
    ipc.string.get(connectionId, keyName).then((r) => {
      const v = r.ok ? r.data : ''
      setValue(v)
      setOriginal(v)
      setLoading(false)
    })
  }, [connectionId, keyName])

  const handleSave = async () => {
    setSaving(true)
    await ipc.string.set(connectionId, keyName, value)
    setOriginal(value)
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-[var(--color-overlay-0)] text-sm">Loading…</div>

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="selectable flex-1 w-full p-3 rounded-[var(--radius-md)] bg-[var(--color-crust)] border border-[var(--color-surface-0)] focus:border-[var(--color-mauve)] text-[var(--color-text)] text-sm font-mono resize-none outline-none leading-relaxed"
        spellCheck={false}
      />
      {value !== original && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save size={12} /> Save
          </Button>
        </div>
      )}
    </div>
  )
}
