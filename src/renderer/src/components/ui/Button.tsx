import type { ButtonHTMLAttributes, CSSProperties } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--rv-accent)',
    color: '#fff',
    border: '1px solid transparent',
    fontWeight: 700,
  },
  secondary: {
    background: 'var(--rv-bg-2)',
    color: 'var(--rv-text-0)',
    border: '1px solid var(--rv-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--rv-text-2)',
    border: '1px solid var(--rv-border)',
  },
  danger: {
    background: 'rgba(248,81,73,0.12)',
    color: 'var(--rv-accent)',
    border: '1px solid rgba(248,81,73,0.3)',
    fontWeight: 600,
  },
}

const variantHover: Record<Variant, CSSProperties> = {
  primary:   { background: 'var(--rv-accent-hover)' },
  secondary: { background: 'var(--rv-bg-3)', borderColor: 'var(--rv-border-strong)' },
  ghost:     { background: 'var(--rv-bg-2)', color: 'var(--rv-text-0)', borderColor: 'var(--rv-border-strong)' },
  danger:    { background: 'rgba(248,81,73,0.2)', borderColor: 'rgba(248,81,73,0.5)' },
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '11.5px', borderRadius: '5px', height: '30px' },
  md: { padding: '7px 14px', fontSize: '12.5px', borderRadius: '6px', height: '34px' },
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontFamily: 'var(--rv-mono)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
        outline: 'none',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantHover[variant])
        }
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant], sizeStyles[size])
        }
        onMouseLeave?.(e)
      }}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'rv-spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  )
}
