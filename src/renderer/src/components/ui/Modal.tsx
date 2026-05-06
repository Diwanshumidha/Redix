import type { CSSProperties } from 'react'
import { X, Database } from 'lucide-react'
import { useUiStore } from '../../store/ui'

interface ModalProps {
  title: string
  children: React.ReactNode
}

export default function Modal({ title, children }: ModalProps) {
  const closeModal = useUiStore((s) => s.closeModal)

  return (
    <div
      style={backdropStyle}
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div style={containerStyle} className="animate-fade-in">
        {/* Accent top stripe */}
        <div style={{ height: '3px', background: 'var(--rv-accent)', borderRadius: '10px 10px 0 0' }} />

        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '5px',
                background: 'rgba(248,81,73,0.12)',
                border: '1px solid rgba(248,81,73,0.25)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={11} color="var(--rv-accent)" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: 'var(--rv-sans)',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--rv-text-0)',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
          </div>

          <button
            onClick={closeModal}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--rv-text-3)',
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--rv-bg-2)'
              e.currentTarget.style.color = 'var(--rv-text-0)'
              e.currentTarget.style.borderColor = 'var(--rv-border)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--rv-text-3)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>{children}</div>
      </div>
    </div>
  )
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(4px)',
}

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '460px',
  margin: '0 16px',
  background: 'var(--rv-bg-1)',
  border: '1px solid var(--rv-border-strong)',
  borderRadius: '10px',
  boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px 12px 20px',
  borderBottom: '1px solid var(--rv-border)',
  background: 'var(--rv-bg-2)',
}
