import { useState, useRef, useEffect } from 'react'
import { ipc } from '../../lib/ipc'

interface LogEntry {
  kind: 'in' | 'out' | 'err'
  text: string
}

interface Props {
  open:         boolean
  onClose:      () => void
  connectionId: string
}

export default function CliDrawer({ open, onClose, connectionId }: Props) {
  const [log, setLog]         = useState<LogEntry[]>([
    { kind: 'out', text: 'Redis CLI — type commands and press Enter' },
  ])
  const [input, setInput]     = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx]       = useState(-1)
  const bodyRef               = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [log])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const submit = async (cmd: string) => {
    setLog((l) => [...l, { kind: 'in', text: cmd }])
    setHistory((h) => [cmd, ...h].slice(0, 50))
    setHIdx(-1)
    setInput('')
    const r = await ipc.cli.execute(connectionId, cmd)
    setLog((l) => [
      ...l,
      r.ok
        ? { kind: 'out', text: r.data ?? '(empty)' }
        : { kind: 'err', text: r.error },
    ])
  }

  if (!open) return null

  return (
    <div className="rv-cli-drawer">
      <div className="rv-cli-header">
        <span style={{ color: 'var(--rv-ok)' }}>●</span>
        <span>redis-cli</span>
        <span style={{ color: 'var(--rv-text-3)', fontSize: 10 }}>interactive mode</span>
        <span style={{ flex: 1 }} />
        <button
          className="rv-btn ghost"
          onClick={onClose}
          style={{ width: 22, height: 22, padding: 0, display: 'grid', placeItems: 'center', fontSize: 14 }}
        >
          ×
        </button>
      </div>

      <div className="rv-cli-body" ref={bodyRef}>
        {log.map((entry, i) => (
          <div key={i}>
            {entry.kind === 'in' ? (
              <div>
                <span className="rv-cli-prompt">127.0.0.1:6379{'>'}</span>
                {entry.text}
              </div>
            ) : (
              <div className={`rv-cli-out${entry.kind === 'err' ? ' err' : ''}`}>
                {entry.text}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rv-cli-input-row">
        <span className="rv-cli-prompt">127.0.0.1:6379{'>'}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="PING"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              submit(input.trim())
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              const ni = Math.min(hIdx + 1, history.length - 1)
              setHIdx(ni)
              if (history[ni]) setInput(history[ni])
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              const ni = Math.max(hIdx - 1, -1)
              setHIdx(ni)
              setInput(ni === -1 ? '' : history[ni])
            } else if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
      </div>
    </div>
  )
}
