import { Database, Plus, Zap, Shield, Terminal } from 'lucide-react'
import Button from '../components/ui/Button'
import { useUiStore } from '../store/ui'

const features = [
  { icon: Database, label: 'Key Browser', desc: 'Browse and edit all key types' },
  { icon: Terminal, label: 'CLI', desc: 'Run Redis commands directly' },
  { icon: Zap, label: 'Server Stats', desc: 'Live memory and performance metrics' },
  { icon: Shield, label: 'TLS / ACL', desc: 'Secure connections and user auth' }
]

export default function Welcome() {
  const openModal = useUiStore((s) => s.openModal)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-8 animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-mauve)] flex items-center justify-center shadow-lg">
          <Database size={32} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-text)] tracking-tight">Redix</h1>
          <p className="text-[var(--color-overlay-1)] text-sm mt-1">
            A modern Redis Insights desktop client
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {features.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 p-4 rounded-[var(--radius-md)] bg-[var(--color-mantle)] border border-[var(--color-surface-0)]"
          >
            <Icon size={16} className="text-[var(--color-mauve)]" />
            <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
            <span className="text-[10px] text-[var(--color-overlay-0)] leading-snug">{desc}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button variant="primary" onClick={() => openModal('add-connection')}>
        <Plus size={14} />
        Add your first connection
      </Button>

      <p className="text-[10px] text-[var(--color-overlay-0)]">
        Connections are stored locally on your machine
      </p>
    </div>
  )
}
