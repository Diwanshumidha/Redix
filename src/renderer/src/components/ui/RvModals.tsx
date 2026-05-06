import { useState, useEffect, useRef } from 'react'

/* ── Confirm modal ── */
interface ConfirmProps {
  open:         boolean
  title:        string
  body:         React.ReactNode
  confirmLabel?: string
  danger?:      boolean
  onConfirm:    () => void
  onCancel:     () => void
}

export function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: ConfirmProps) {
  if (!open) return null
  return (
    <div className="rv-modal-backdrop" onMouseDown={onCancel}>
      <div className="rv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rv-modal-title">{title}</div>
        <div className="rv-modal-body">{body}</div>
        <div className="rv-modal-actions">
          <button className="rv-btn ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`rv-btn${danger ? ' danger-solid' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Prompt modal ── */
interface PromptProps {
  open:         boolean
  title:        string
  label:        string
  defaultValue?: string
  placeholder?: string
  onSubmit:     (value: string) => void
  onCancel:     () => void
}

export function PromptModal({ open, title, label, defaultValue = '', placeholder, onSubmit, onCancel }: PromptProps) {
  const [val, setVal] = useState(defaultValue)
  const inputRef      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setVal(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open, defaultValue])

  if (!open) return null

  return (
    <div className="rv-modal-backdrop" onMouseDown={onCancel}>
      <div className="rv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rv-modal-title">{title}</div>
        <div className="rv-modal-body">
          <label style={{ display: 'block', fontSize: 10, color: 'var(--rv-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {label}
          </label>
          <input
            ref={inputRef}
            className="rv-input"
            value={val}
            placeholder={placeholder}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  onSubmit(val)
              if (e.key === 'Escape') onCancel()
            }}
            style={{ marginTop: 8 }}
          />
        </div>
        <div className="rv-modal-actions">
          <button className="rv-btn ghost" onClick={onCancel}>Cancel</button>
          <button className="rv-btn" onClick={() => onSubmit(val)}>OK</button>
        </div>
      </div>
    </div>
  )
}
