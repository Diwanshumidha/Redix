import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { ipc } from '../../lib/ipc'

const TYPES = ['string', 'hash', 'list', 'set', 'zset'] as const
type RedisType = (typeof TYPES)[number]

const TYPE_COLOR: Record<RedisType, string> = {
  string: 'var(--rv-t-string)',
  hash:   'var(--rv-t-hash)',
  list:   'var(--rv-t-list)',
  set:    'var(--rv-t-set)',
  zset:   'var(--rv-t-zset)',
}

export interface CreateKeyModalProps {
  open:         boolean
  connectionId: string
  onClose:      () => void
  onCreated:    (key: string, type: string) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--rv-text-3)',
        fontFamily: 'var(--rv-mono)',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--rv-mono)',
  fontSize: 12,
}

export default function CreateKeyModal({ open, connectionId, onClose, onCreated }: CreateKeyModalProps) {
  const [keyName,    setKeyName]    = useState('')
  const [keyType,    setKeyType]    = useState<RedisType>('string')
  const [strVal,     setStrVal]     = useState('')
  const [hashField,  setHashField]  = useState('field1')
  const [hashVal,    setHashVal]    = useState('')
  const [listVal,    setListVal]    = useState('')
  const [setMember,  setSetMember]  = useState('')
  const [zsetScore,  setZsetScore]  = useState('0')
  const [zsetMember, setZsetMember] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const keyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setKeyName(''); setKeyType('string'); setStrVal('')
      setHashField('field1'); setHashVal(''); setListVal('')
      setSetMember(''); setZsetScore('0'); setZsetMember('')
      setError('')
      setTimeout(() => keyRef.current?.focus(), 10)
    }
  }, [open])

  const create = async () => {
    const k = keyName.trim()
    if (!k) { setError('Key name is required'); return }
    setSaving(true); setError('')

    let result: { ok: boolean; error?: string }

    if (keyType === 'string') {
      result = await ipc.string.set(connectionId, k, strVal)
    } else if (keyType === 'hash') {
      if (!hashField.trim()) { setError('Field name is required'); setSaving(false); return }
      result = await ipc.hash.set(connectionId, k, hashField, hashVal)
    } else if (keyType === 'list') {
      result = await ipc.list.push(connectionId, k, listVal || ' ', 'right')
    } else if (keyType === 'set') {
      if (!setMember.trim()) { setError('Member is required'); setSaving(false); return }
      result = await ipc.set.add(connectionId, k, setMember)
    } else {
      if (!zsetMember.trim()) { setError('Member is required'); setSaving(false); return }
      result = await ipc.zset.add(connectionId, k, Number.parseFloat(zsetScore) || 0, zsetMember)
    }

    setSaving(false)
    if (!result.ok) { setError(result.error ?? 'Unknown error'); return }
    onCreated(k, keyType)
    onClose()
  }

  if (!open) return null

  const accent = TYPE_COLOR[keyType]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'grid', placeItems: 'start center',
        paddingTop: '12vh',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 480,
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
        <div style={{ height: 2, background: accent, transition: 'background 0.15s' }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid var(--rv-border)',
          background: 'var(--rv-bg-2)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rv-text-0)' }}>
            Create new key
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'grid', placeItems: 'center',
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
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Key name */}
          <Field label="Key name">
            <input
              ref={keyRef}
              className="rv-input"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="my:key:name"
              spellCheck={false}
              style={inputStyle}
            />
          </Field>

          {/* Type selector */}
          <Field label="Type">
            <div style={{ display: 'flex', gap: 4 }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  className={`rv-type-chip${keyType === t ? ' on' : ''}`}
                  data-t={t}
                  onClick={() => setKeyType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Initial value — type-specific */}
          {keyType === 'string' && (
            <Field label="Initial value">
              <textarea
                className="rv-input"
                value={strVal}
                onChange={(e) => setStrVal(e.target.value)}
                placeholder="value (can be empty)"
                spellCheck={false}
                style={{ height: 72, resize: 'vertical', ...inputStyle }}
              />
            </Field>
          )}

          {keyType === 'hash' && (
            <Field label="Initial field">
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="rv-input"
                  value={hashField}
                  onChange={(e) => setHashField(e.target.value)}
                  placeholder="field"
                  style={{ width: '40%', flexShrink: 0, ...inputStyle }}
                />
                <input
                  className="rv-input"
                  value={hashVal}
                  onChange={(e) => setHashVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                  placeholder="value"
                  style={{ flex: 1, ...inputStyle }}
                />
              </div>
            </Field>
          )}

          {keyType === 'list' && (
            <Field label="Initial element">
              <input
                className="rv-input"
                value={listVal}
                onChange={(e) => setListVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder="value"
                style={inputStyle}
              />
            </Field>
          )}

          {keyType === 'set' && (
            <Field label="Initial member">
              <input
                className="rv-input"
                value={setMember}
                onChange={(e) => setSetMember(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder="member"
                style={inputStyle}
              />
            </Field>
          )}

          {keyType === 'zset' && (
            <Field label="Initial member">
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  className="rv-input"
                  value={zsetScore}
                  onChange={(e) => setZsetScore(e.target.value)}
                  placeholder="score"
                  style={{ width: 90, flexShrink: 0, ...inputStyle }}
                />
                <input
                  className="rv-input"
                  value={zsetMember}
                  onChange={(e) => setZsetMember(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                  placeholder="member"
                  style={{ flex: 1, ...inputStyle }}
                />
              </div>
            </Field>
          )}

          {error && (
            <span style={{ fontSize: 11, color: 'var(--rv-accent)', fontFamily: 'var(--rv-mono)' }}>
              {error}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '10px 18px 14px',
          borderTop: '1px solid var(--rv-border)',
          background: 'var(--rv-bg-2)',
        }}>
          <button className="rv-btn ghost" onClick={onClose}>Cancel</button>
          <button className="rv-btn" onClick={create} disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
