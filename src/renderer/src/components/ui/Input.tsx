import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, style, ...props }: Readonly<InputProps>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label
          style={{
            fontFamily: 'var(--rv-mono)',
            fontSize: '9.5px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: 'var(--rv-text-3)',
            userSelect: 'none',
          }}
        >
          {label}
        </label>
      )}
      <input
        className="selectable"
        style={{
          width: '100%',
          background: 'var(--rv-bg-0)',
          border: `1px solid ${error ? 'rgba(248,81,73,0.5)' : 'var(--rv-border)'}`,
          borderRadius: '5px',
          color: 'var(--rv-text-0)',
          padding: '7px 10px',
          fontFamily: 'var(--rv-mono)',
          fontSize: '12.5px',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box' as const,
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? 'rgba(248,81,73,0.6)' : 'rgba(88,166,255,0.5)'
          e.target.style.boxShadow = error
            ? '0 0 0 3px rgba(248,81,73,0.06)'
            : '0 0 0 3px rgba(88,166,255,0.06)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(248,81,73,0.5)' : 'var(--rv-border)'
          e.target.style.boxShadow = 'none'
        }}
        {...props}
      />
      {error && (
        <span
          style={{
            fontFamily: 'var(--rv-mono)',
            fontSize: '10px',
            color: 'var(--rv-accent)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
