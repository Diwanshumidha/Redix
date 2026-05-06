import { useState } from 'react'
import { CheckCircle2, XCircle, Wifi } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useConnectionsStore } from '../../store/connections'
import { useUiStore } from '../../store/ui'
import { ipc } from '../../lib/ipc'
import type { RedisConnection } from '@shared/types'

interface AddConnectionModalProps {
  editMode?: boolean
}

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail'

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 8px' }}>
      <span
        style={{
          fontFamily: 'var(--rv-mono)',
          fontSize: '9px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--rv-text-3)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--rv-border)' }} />
    </div>
  )
}

export default function AddConnectionModal({ editMode = false }: Readonly<AddConnectionModalProps>) {
  const closeModal = useUiStore((s) => s.closeModal)
  const modalData  = useUiStore((s) => s.modalData)
  const { connections, addConnection, updateConnection } = useConnectionsStore()

  const existing = editMode
    ? connections.find((c) => c.id === modalData.connectionId)
    : undefined

  const [form, setForm] = useState({
    name:     existing?.name     ?? '',
    host:     existing?.host     ?? '127.0.0.1',
    port:     String(existing?.port     ?? 6379),
    password: existing?.password ?? '',
    username: existing?.username ?? '',
    db:       String(existing?.db       ?? 0),
    tls:      existing?.tls      ?? false,
  })
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError,  setTestError]  = useState('')
  const [saving,     setSaving]     = useState(false)

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const buildConn = (): Omit<RedisConnection, 'id' | 'createdAt'> => ({
    name:     form.name || `${form.host}:${form.port}`,
    host:     form.host,
    port:     Number.parseInt(form.port)   || 6379,
    password: form.password || undefined,
    username: form.username || undefined,
    db:       Number.parseInt(form.db)     || 0,
    tls:      form.tls,
    type:     'standalone',
  })

  const handleTest = async () => {
    setTestStatus('testing')
    setTestError('')
    const result = await ipc.connection.test(buildConn())
    if (result.ok) {
      setTestStatus('ok')
    } else {
      setTestStatus('fail')
      setTestError(result.error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    if (editMode && existing) {
      await updateConnection(existing.id, buildConn())
    } else {
      await addConnection(buildConn())
    }
    setSaving(false)
    closeModal()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Connection name */}
      <div style={{ marginBottom: '14px' }}>
        <Input
          label="Connection name"
          placeholder="My Redis"
          value={form.name}
          onChange={field('name')}
        />
      </div>

      {/* Server section */}
      <SectionDivider label="Server" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: '10px', marginBottom: '14px' }}>
        <Input label="Host" placeholder="127.0.0.1" value={form.host} onChange={field('host')} />
        <Input label="Port" type="number" value={form.port} onChange={field('port')} />
      </div>

      {/* Auth section */}
      <SectionDivider label="Authentication" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <Input label="Username" placeholder="default" value={form.username} onChange={field('username')} />
        <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={field('password')} />
      </div>

      {/* Options section */}
      <SectionDivider label="Options" />
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
        <Input label="Database" type="number" value={form.db} onChange={field('db')} />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '5px',
            border: `1px solid ${form.tls ? 'rgba(88,166,255,0.35)' : 'var(--rv-border)'}`,
            background: form.tls ? 'rgba(88,166,255,0.06)' : 'var(--rv-bg-0)',
            cursor: 'pointer',
            transition: 'all 0.12s',
            userSelect: 'none',
          }}
        >
          {/* Custom toggle */}
          <div
            style={{
              width: '30px',
              height: '16px',
              borderRadius: '8px',
              background: form.tls ? 'var(--rv-info)' : 'var(--rv-bg-3)',
              border: `1px solid ${form.tls ? 'rgba(88,166,255,0.5)' : 'var(--rv-border)'}`,
              position: 'relative',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onClick={() => setForm((f) => ({ ...f, tls: !f.tls }))}
          >
            <div
              style={{
                position: 'absolute',
                top: '2px',
                left: form.tls ? '14px' : '2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
            <input
              type="checkbox"
              checked={form.tls}
              onChange={field('tls')}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span
              style={{
                fontFamily: 'var(--rv-mono)',
                fontSize: '11.5px',
                fontWeight: 600,
                color: form.tls ? 'var(--rv-info)' : 'var(--rv-text-2)',
                transition: 'color 0.12s',
              }}
            >
              TLS / SSL
            </span>
            <span style={{ fontFamily: 'var(--rv-mono)', fontSize: '9px', color: 'var(--rv-text-3)' }}>
              Encrypted connection
            </span>
          </div>
        </label>
      </div>

      {/* Test status feedback */}
      {testStatus === 'ok' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '5px',
            background: 'rgba(63,185,80,0.08)',
            border: '1px solid rgba(63,185,80,0.25)',
            marginBottom: '12px',
          }}
        >
          <CheckCircle2 size={13} color="var(--rv-ok)" />
          <span style={{ fontFamily: 'var(--rv-mono)', fontSize: '11.5px', color: 'var(--rv-ok)', fontWeight: 600 }}>
            Connection successful
          </span>
        </div>
      )}
      {testStatus === 'fail' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '5px',
            background: 'rgba(248,81,73,0.08)',
            border: '1px solid rgba(248,81,73,0.25)',
            marginBottom: '12px',
          }}
        >
          <XCircle size={13} color="var(--rv-accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span
            className="selectable"
            style={{ fontFamily: 'var(--rv-mono)', fontSize: '11px', color: 'var(--rv-accent)', lineHeight: 1.5 }}
          >
            {testError}
          </span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '14px',
          borderTop: '1px solid var(--rv-border)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTest}
          loading={testStatus === 'testing'}
          style={{ gap: '6px' }}
        >
          {testStatus !== 'testing' && <Wifi size={11} />}
          Test connection
        </Button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            {editMode ? 'Save changes' : 'Add connection'}
          </Button>
        </div>
      </div>
    </div>
  )
}
