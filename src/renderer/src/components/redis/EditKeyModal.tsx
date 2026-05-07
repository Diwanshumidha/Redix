import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import type { ZSetEntry } from '@shared/types'

interface BaseProps { connectionId: string; keyName: string; onSaved: () => void }

/* ── Type accent colors ─────────────────────────────────────── */
const TYPE_COLOR: Record<string, string> = {
  string: 'var(--rv-t-string)',
  hash:   'var(--rv-t-hash)',
  list:   'var(--rv-t-list)',
  set:    'var(--rv-t-set)',
  zset:   'var(--rv-t-zset)',
}

const TYPE_LABEL: Record<string, string> = {
  string: 'STRING',
  hash:   'HASH',
  list:   'LIST',
  set:    'SET',
  zset:   'ZSET',
}

/* ── Shared row primitives ──────────────────────────────────── */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, flexShrink: 0, opacity: 0, transition: 'opacity 0.12s' }} className="row-actions">
      <button style={actionBtn} onClick={onEdit}   title="Edit"><Pencil size={10} /></button>
      <button style={{ ...actionBtn, color: 'var(--rv-accent)' }} onClick={onDelete} title="Remove"><Trash2 size={10} /></button>
    </div>
  )
}

function RowSaveCancel({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      <button style={{ ...actionBtn, color: 'var(--rv-ok)' }}     onClick={onSave}   title="Save"><Check size={11} /></button>
      <button style={{ ...actionBtn, color: 'var(--rv-text-2)' }} onClick={onCancel} title="Cancel"><X    size={11} /></button>
    </div>
  )
}

/* ── String editor ──────────────────────────────────────────── */
function StringEditor({ connectionId, keyName, onSaved }: BaseProps) {
  const [value,    setValue]    = useState('')
  const [original, setOriginal] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    ipc.string.get(connectionId, keyName).then((r) => {
      const v = r.ok ? r.data : ''
      setValue(v); setOriginal(v); setLoading(false)
      setTimeout(() => ref.current?.focus(), 10)
    })
  }, [connectionId, keyName])

  const save = async () => {
    setSaving(true)
    await ipc.string.set(connectionId, keyName, value)
    setOriginal(value); setSaving(false); onSaved()
  }

  const jsonParsed = useMemo(() => {
    if (!value.trim().startsWith('{') && !value.trim().startsWith('[')) return null
    try { return JSON.parse(value) } catch { return null }
  }, [value])

  const formatJson  = () => jsonParsed !== null && setValue(JSON.stringify(jsonParsed, null, 2))
  const minifyJson  = () => jsonParsed !== null && setValue(JSON.stringify(jsonParsed))
  const isPretty    = jsonParsed !== null && value.includes('\n')

  if (loading) return <div style={loadingStyle}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {jsonParsed !== null && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--rv-ok)', fontFamily: 'var(--rv-mono)' }}>
            JSON
          </span>
          <button
            onClick={isPretty ? minifyJson : formatJson}
            style={{
              fontSize: 10, fontFamily: 'var(--rv-mono)', fontWeight: 600,
              padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
              background: 'var(--rv-bg-3)', border: '1px solid var(--rv-border)',
              color: 'var(--rv-text-2)', transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--rv-text-0)'; e.currentTarget.style.borderColor = 'var(--rv-border-strong)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--rv-text-2)'; e.currentTarget.style.borderColor = 'var(--rv-border)' }}
          >
            {isPretty ? 'Minify' : 'Format'}
          </button>
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%', height: 200, resize: 'vertical',
          background: 'var(--rv-bg-0)', border: '1px solid var(--rv-border)',
          borderRadius: 6, padding: '10px 12px',
          color: 'var(--rv-text-0)', fontFamily: 'var(--rv-mono)', fontSize: 12,
          lineHeight: 1.7, outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--rv-t-string)' }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--rv-border)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="rv-btn"
          onClick={save}
          disabled={saving || value === original}
          style={{ opacity: value === original ? 0.4 : 1, transition: 'opacity 0.15s' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

/* ── Hash editor ────────────────────────────────────────────── */
function HashEditor({ connectionId, keyName, onSaved }: BaseProps) {
  const [fields,   setFields]   = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState<Record<string, { field: string; value: string }>>({})
  const [newField, setNewField] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    setLoading(true)
    ipc.hash.getAll(connectionId, keyName).then((r) => {
      if (r.ok) setFields(r.data)
      setLoading(false)
    })
  }, [connectionId, keyName])

  const startEdit  = (f: string) => setEditing((e) => ({ ...e, [f]: { field: f, value: fields[f] } }))
  const cancelEdit = (f: string) => setEditing((e) => { const n = { ...e }; delete n[f]; return n })

  const saveEdit = async (orig: string) => {
    const { field: nf, value: nv } = editing[orig]
    if (nf !== orig) await ipc.hash.del(connectionId, keyName, orig)
    await ipc.hash.set(connectionId, keyName, nf, nv)
    setFields((prev) => { const n = { ...prev }; delete n[orig]; n[nf] = nv; return n })
    cancelEdit(orig); onSaved()
  }

  const del = async (f: string) => {
    await ipc.hash.del(connectionId, keyName, f)
    setFields((prev) => { const n = { ...prev }; delete n[f]; return n })
    onSaved()
  }

  const add = async () => {
    if (!newField.trim()) return
    await ipc.hash.set(connectionId, keyName, newField, newValue)
    setFields((prev) => ({ ...prev, [newField]: newValue }))
    setNewField(''); setNewValue(''); onSaved()
  }

  if (loading) return <div style={loadingStyle}>Loading…</div>

  return (
    <DataTable
      colHeaders={['Field', 'Value']}
      colWidths={['36%', '1fr']}
      empty={Object.keys(fields).length === 0}
      emptyLabel="No fields"
      addRow={
        <AddRow>
          <AddInput value={newField} onChange={setNewField} placeholder="field" style={{ width: '36%', flexShrink: 0 }} />
          <AddInput value={newValue} onChange={setNewValue} onEnter={add} placeholder="value" style={{ flex: 1 }} />
          <AddButton onClick={add} />
        </AddRow>
      }
    >
      {Object.entries(fields).map(([field, val]) => (
        <DataRow key={field}>
          {editing[field] ? (
            <>
              <EditInput autoFocus value={editing[field].field} placeholder="field"
                onChange={(v) => setEditing((ed) => ({ ...ed, [field]: { ...ed[field], field: v } }))}
                onEnter={() => saveEdit(field)} onEscape={() => cancelEdit(field)}
                style={{ width: '36%', flexShrink: 0 }} />
              <EditInput value={editing[field].value} placeholder="value"
                onChange={(v) => setEditing((ed) => ({ ...ed, [field]: { ...ed[field], value: v } }))}
                onEnter={() => saveEdit(field)} onEscape={() => cancelEdit(field)}
                style={{ flex: 1 }} />
              <RowSaveCancel onSave={() => saveEdit(field)} onCancel={() => cancelEdit(field)} />
            </>
          ) : (
            <>
              <Cell muted style={{ width: '36%', flexShrink: 0 }}>{field}</Cell>
              <Cell style={{ flex: 1 }}>{val}</Cell>
              <RowActions onEdit={() => startEdit(field)} onDelete={() => del(field)} />
            </>
          )}
        </DataRow>
      ))}
    </DataTable>
  )
}

/* ── List editor ────────────────────────────────────────────── */
function ListEditor({ connectionId, keyName, onSaved }: BaseProps) {
  const [items,   setItems]   = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<number, string>>({})
  const [newVal,  setNewVal]  = useState('')
  const [side,    setSide]    = useState<'left' | 'right'>('right')

  useEffect(() => {
    setLoading(true)
    ipc.list.range(connectionId, keyName, 0, -1).then((r) => {
      if (r.ok) setItems(r.data)
      setLoading(false)
    })
  }, [connectionId, keyName])

  const startEdit  = (i: number) => setEditing((e) => ({ ...e, [i]: items[i] }))
  const cancelEdit = (i: number) => setEditing((e) => { const n = { ...e }; delete n[i]; return n })

  const saveEdit = async (i: number) => {
    await ipc.list.set(connectionId, keyName, i, editing[i])
    setItems((prev) => { const n = [...prev]; n[i] = editing[i]; return n })
    cancelEdit(i); onSaved()
  }

  const del = async (i: number) => {
    await ipc.list.rem(connectionId, keyName, i)
    setItems((prev) => prev.filter((_, idx) => idx !== i))
    onSaved()
  }

  const push = async () => {
    if (!newVal.trim()) return
    await ipc.list.push(connectionId, keyName, newVal, side)
    setItems((prev) => side === 'left' ? [newVal, ...prev] : [...prev, newVal])
    setNewVal(''); onSaved()
  }

  if (loading) return <div style={loadingStyle}>Loading…</div>

  return (
    <DataTable
      colHeaders={['#', 'Value']}
      colWidths={['40px', '1fr']}
      empty={items.length === 0}
      emptyLabel="Empty list"
      addRow={
        <AddRow>
          <select value={side} onChange={(e) => setSide(e.target.value as 'left' | 'right')} style={selectStyle}>
            <option value="right">R</option>
            <option value="left">L</option>
          </select>
          <AddInput value={newVal} onChange={setNewVal} onEnter={push} placeholder="value" style={{ flex: 1 }} />
          <AddButton onClick={push} />
        </AddRow>
      }
    >
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list items are index-keyed by definition
        <DataRow key={i}>
          {editing[i] !== undefined ? (
            <>
              <Cell muted style={{ width: 40, flexShrink: 0, textAlign: 'right' }}>{i}</Cell>
              <EditInput autoFocus value={editing[i]}
                onChange={(v) => setEditing((ed) => ({ ...ed, [i]: v }))}
                onEnter={() => saveEdit(i)} onEscape={() => cancelEdit(i)}
                style={{ flex: 1 }} />
              <RowSaveCancel onSave={() => saveEdit(i)} onCancel={() => cancelEdit(i)} />
            </>
          ) : (
            <>
              <Cell muted style={{ width: 40, flexShrink: 0, textAlign: 'right' }}>{i}</Cell>
              <Cell style={{ flex: 1 }}>{item}</Cell>
              <RowActions onEdit={() => startEdit(i)} onDelete={() => del(i)} />
            </>
          )}
        </DataRow>
      ))}
    </DataTable>
  )
}

/* ── Set editor ─────────────────────────────────────────────── */
function SetEditor({ connectionId, keyName, onSaved }: BaseProps) {
  const [members,   setMembers]   = useState<string[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<Record<string, string>>({})
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    setLoading(true)
    ipc.set.members(connectionId, keyName).then((r) => {
      if (r.ok) setMembers(r.data.sort())
      setLoading(false)
    })
  }, [connectionId, keyName])

  const startEdit  = (m: string) => setEditing((e) => ({ ...e, [m]: m }))
  const cancelEdit = (m: string) => setEditing((e) => { const n = { ...e }; delete n[m]; return n })

  const saveEdit = async (orig: string) => {
    const next = editing[orig]
    if (next !== orig) {
      await ipc.set.remove(connectionId, keyName, orig)
      await ipc.set.add(connectionId, keyName, next)
      setMembers((prev) => prev.map((x) => x === orig ? next : x).sort())
      onSaved()
    }
    cancelEdit(orig)
  }

  const remove = async (m: string) => {
    await ipc.set.remove(connectionId, keyName, m)
    setMembers((prev) => prev.filter((x) => x !== m))
    onSaved()
  }

  const add = async () => {
    if (!newMember.trim()) return
    await ipc.set.add(connectionId, keyName, newMember)
    setMembers((m) => [...m, newMember].sort())
    setNewMember(''); onSaved()
  }

  if (loading) return <div style={loadingStyle}>Loading…</div>

  return (
    <DataTable
      colHeaders={['Member']}
      colWidths={['1fr']}
      empty={members.length === 0}
      emptyLabel="No members"
      addRow={
        <AddRow>
          <AddInput value={newMember} onChange={setNewMember} onEnter={add} placeholder="value" style={{ flex: 1 }} />
          <AddButton onClick={add} />
        </AddRow>
      }
    >
      {members.map((m) => (
        <DataRow key={m}>
          {editing[m] !== undefined ? (
            <>
              <EditInput autoFocus value={editing[m]}
                onChange={(v) => setEditing((ed) => ({ ...ed, [m]: v }))}
                onEnter={() => saveEdit(m)} onEscape={() => cancelEdit(m)}
                style={{ flex: 1 }} />
              <RowSaveCancel onSave={() => saveEdit(m)} onCancel={() => cancelEdit(m)} />
            </>
          ) : (
            <>
              <Cell style={{ flex: 1 }}>{m}</Cell>
              <RowActions onEdit={() => startEdit(m)} onDelete={() => remove(m)} />
            </>
          )}
        </DataRow>
      ))}
    </DataTable>
  )
}

/* ── ZSet editor ────────────────────────────────────────────── */
function ZSetEditor({ connectionId, keyName, onSaved }: BaseProps) {
  const [items,     setItems]     = useState<ZSetEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState<Record<string, { score: string; member: string }>>({})
  const [newScore,  setNewScore]  = useState('0')
  const [newMember, setNewMember] = useState('')

  useEffect(() => {
    setLoading(true)
    ipc.zset.range(connectionId, keyName, 0, -1).then((r) => {
      if (r.ok) setItems(r.data)
      setLoading(false)
    })
  }, [connectionId, keyName])

  const startEdit  = (member: string, score: number) =>
    setEditing((e) => ({ ...e, [member]: { score: String(score), member } }))
  const cancelEdit = (orig: string) =>
    setEditing((e) => { const n = { ...e }; delete n[orig]; return n })

  const saveEdit = async (orig: string) => {
    const { score: ss, member: next } = editing[orig]
    const ns = Number.parseFloat(ss) || 0
    if (orig !== next) await ipc.zset.remove(connectionId, keyName, orig)
    await ipc.zset.add(connectionId, keyName, ns, next)
    setItems((prev) =>
      [...prev.filter((i) => i.member !== orig && i.member !== next), { member: next, score: ns }]
        .sort((a, b) => a.score - b.score),
    )
    cancelEdit(orig); onSaved()
  }

  const remove = async (member: string) => {
    await ipc.zset.remove(connectionId, keyName, member)
    setItems((prev) => prev.filter((i) => i.member !== member))
    onSaved()
  }

  const add = async () => {
    if (!newMember.trim()) return
    const score = Number.parseFloat(newScore) || 0
    await ipc.zset.add(connectionId, keyName, score, newMember)
    setItems((prev) =>
      [...prev.filter((i) => i.member !== newMember), { member: newMember, score }]
        .sort((a, b) => a.score - b.score),
    )
    setNewMember(''); setNewScore('0'); onSaved()
  }

  if (loading) return <div style={loadingStyle}>Loading…</div>

  return (
    <DataTable
      colHeaders={['Score', 'Member']}
      colWidths={['90px', '1fr']}
      empty={items.length === 0}
      emptyLabel="No entries"
      addRow={
        <AddRow>
          <AddInput type="number" value={newScore} onChange={setNewScore} placeholder="score" style={{ width: 90, flexShrink: 0 }} />
          <AddInput value={newMember} onChange={setNewMember} onEnter={add} placeholder="member" style={{ flex: 1 }} />
          <AddButton onClick={add} />
        </AddRow>
      }
    >
      {items.map(({ member, score }) => (
        <DataRow key={member}>
          {editing[member] ? (
            <>
              <EditInput autoFocus type="number" value={editing[member].score}
                onChange={(v) => setEditing((ed) => ({ ...ed, [member]: { ...ed[member], score: v } }))}
                onEnter={() => saveEdit(member)} onEscape={() => cancelEdit(member)}
                style={{ width: 90, flexShrink: 0 }} />
              <EditInput value={editing[member].member}
                onChange={(v) => setEditing((ed) => ({ ...ed, [member]: { ...ed[member], member: v } }))}
                onEnter={() => saveEdit(member)} onEscape={() => cancelEdit(member)}
                style={{ flex: 1 }} />
              <RowSaveCancel onSave={() => saveEdit(member)} onCancel={() => cancelEdit(member)} />
            </>
          ) : (
            <>
              <Cell accent style={{ width: 90, flexShrink: 0 }}>{score}</Cell>
              <Cell style={{ flex: 1 }}>{member}</Cell>
              <RowActions onEdit={() => startEdit(member, score)} onDelete={() => remove(member)} />
            </>
          )}
        </DataRow>
      ))}
    </DataTable>
  )
}

/* ── Primitives ─────────────────────────────────────────────── */
function DataTable({ colHeaders, colWidths, empty, emptyLabel, addRow, children }: {
  colHeaders: string[]
  colWidths:  string[]
  empty:      boolean
  emptyLabel: string
  addRow:     React.ReactNode
  children:   React.ReactNode
}) {
  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '0 10px', height: 28,
        background: 'var(--rv-bg-0)',
        borderRadius: '6px 6px 0 0',
        borderBottom: '1px solid var(--rv-border)',
        border: '1px solid var(--rv-border)',
      }}>
        {colHeaders.map((h, i) => (
          <span key={h} style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--rv-text-3)',
            width: colWidths[i] === '1fr' ? undefined : colWidths[i],
            flex: colWidths[i] === '1fr' ? 1 : undefined,
            flexShrink: colWidths[i] === '1fr' ? undefined : 0,
          }}>
            {h}
          </span>
        ))}
        {/* Spacer for action buttons column */}
        <span style={{ width: 52, flexShrink: 0 }} />
      </div>

      {/* Rows */}
      <div style={{
        maxHeight: 256, overflowY: 'auto',
        borderLeft: '1px solid var(--rv-border)',
        borderRight: '1px solid var(--rv-border)',
      }}>
        {empty
          ? <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--rv-text-3)', fontSize: 11, fontFamily: 'var(--rv-mono)' }}>{emptyLabel}</div>
          : children
        }
      </div>

      {/* Add row */}
      <div style={{
        border: '1px solid var(--rv-border)',
        borderTop: '1px solid var(--rv-border-strong)',
        borderRadius: '0 0 6px 6px',
        background: 'var(--rv-bg-0)',
      }}>
        {addRow}
      </div>
    </div>
  )
}

function DataRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 10px', minHeight: 34,
      borderBottom: '1px solid var(--rv-border)',
      transition: 'background 0.1s',
    }}
      className="data-row"
    >
      {children}
    </div>
  )
}

function Cell({ children, muted, accent, style }: {
  children: React.ReactNode
  muted?:   boolean
  accent?:  boolean
  style?:   React.CSSProperties
}) {
  return (
    <span style={{
      fontSize: 11, fontFamily: 'var(--rv-mono)', lineHeight: 1.4,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      paddingRight: 8,
      color: muted ? 'var(--rv-text-3)' : accent ? 'var(--rv-t-zset)' : 'var(--rv-text-0)',
      ...style,
    }}>
      {children}
    </span>
  )
}

function EditInput({ value, onChange, onEnter, onEscape, placeholder, type, autoFocus, style }: {
  value:       string
  onChange:    (v: string) => void
  onEnter?:    () => void
  onEscape?:   () => void
  placeholder?: string
  type?:       string
  autoFocus?:  boolean
  style?:      React.CSSProperties
}) {
  return (
    <input
      autoFocus={autoFocus}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter')  onEnter?.()
        if (e.key === 'Escape') onEscape?.()
      }}
      style={{
        background: 'var(--rv-bg-2)', border: '1px solid var(--rv-info)',
        borderRadius: 4, padding: '3px 7px', marginRight: 6,
        color: 'var(--rv-text-0)', fontFamily: 'var(--rv-mono)',
        fontSize: 11, outline: 'none', minWidth: 0,
        ...style,
      }}
    />
  )
}

function AddInput({ value, onChange, onEnter, placeholder, type, style }: {
  value:        string
  onChange:     (v: string) => void
  onEnter?:     () => void
  placeholder?: string
  type?:        string
  style?:       React.CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      style={{
        background: 'transparent', border: 'none', outline: 'none',
        padding: '8px 0', color: 'var(--rv-text-1)',
        fontFamily: 'var(--rv-mono)', fontSize: 11,
        minWidth: 0,
        ...style,
      }}
    />
  )
}

function AddRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '2px 10px',
    }}>
      {children}
    </div>
  )
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'grid', placeItems: 'center',
      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
      border: '1px solid var(--rv-border-strong)',
      background: 'var(--rv-bg-3)', color: 'var(--rv-text-2)',
      cursor: 'pointer', transition: 'all 0.12s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rv-bg-active)'; e.currentTarget.style.color = 'var(--rv-text-0)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--rv-bg-3)'; e.currentTarget.style.color = 'var(--rv-text-2)' }}
    >
      <Plus size={11} />
    </button>
  )
}

/* ── Main modal ─────────────────────────────────────────────── */
export interface EditKeyModalProps {
  open:         boolean
  connectionId: string
  keyName:      string
  keyType:      string
  onClose:      () => void
  onSaved:      () => void
}

export default function EditKeyModal({ open, connectionId, keyName, keyType, onClose, onSaved }: EditKeyModalProps) {
  if (!open) return null

  const accent = TYPE_COLOR[keyType] ?? 'var(--rv-text-2)'
  const isWide = keyType === 'string'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'grid', placeItems: 'start center',
        paddingTop: '10vh',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: isWide ? 580 : 520,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--rv-bg-1)',
          borderRadius: 10,
          border: '1px solid var(--rv-border-strong)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Accent stripe */}
        <div style={{ height: 2, background: accent }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '12px 16px 12px 18px',
          borderBottom: '1px solid var(--rv-border)',
          background: 'var(--rv-bg-2)',
          gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                padding: '2px 6px', borderRadius: 3,
                background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
                color: accent,
              }}>
                {TYPE_LABEL[keyType] ?? keyType.toUpperCase()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rv-text-0)' }}>
                Edit {keyType}
              </span>
            </div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--rv-mono)', color: 'var(--rv-text-3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: isWide ? 500 : 420,
            }} title={keyName}>
              {keyName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'grid', placeItems: 'center', flexShrink: 0,
              width: 24, height: 24, borderRadius: 5,
              border: '1px solid transparent', background: 'transparent',
              color: 'var(--rv-text-3)', cursor: 'pointer', transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--rv-bg-3)'; e.currentTarget.style.color = 'var(--rv-text-0)'; e.currentTarget.style.borderColor = 'var(--rv-border)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--rv-text-3)'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          {keyType === 'string' && <StringEditor connectionId={connectionId} keyName={keyName} onSaved={onSaved} />}
          {keyType === 'hash'   && <HashEditor   connectionId={connectionId} keyName={keyName} onSaved={onSaved} />}
          {keyType === 'list'   && <ListEditor   connectionId={connectionId} keyName={keyName} onSaved={onSaved} />}
          {keyType === 'set'    && <SetEditor    connectionId={connectionId} keyName={keyName} onSaved={onSaved} />}
          {keyType === 'zset'   && <ZSetEditor   connectionId={connectionId} keyName={keyName} onSaved={onSaved} />}
        </div>
      </div>

      <style>{`
        .data-row:hover { background: var(--rv-bg-hover) !important; }
        .data-row:hover .row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

/* ── Shared constants ───────────────────────────────────────── */
const loadingStyle: React.CSSProperties = {
  padding: '20px 0', color: 'var(--rv-text-3)', fontSize: 12,
  fontFamily: 'var(--rv-mono)', textAlign: 'center',
}

const actionBtn: React.CSSProperties = {
  display: 'grid', placeItems: 'center',
  width: 20, height: 20, borderRadius: 3,
  border: 'none', background: 'transparent',
  color: 'var(--rv-text-2)', cursor: 'pointer', padding: 0,
  transition: 'color 0.1s, background 0.1s',
}

const selectStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none',
  color: 'var(--rv-text-3)', fontFamily: 'var(--rv-mono)',
  fontSize: 10, fontWeight: 700, cursor: 'pointer',
  padding: '0 4px 0 0', flexShrink: 0,
}
