import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Terminal as TermIcon, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { ipc } from '../lib/ipc'

interface CliEntry {
  type: 'input' | 'output' | 'error'
  text: string
}

export default function Cli() {
  const { id } = useParams<{ id: string }>()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CliEntry[]>([
    { type: 'output', text: 'Redis CLI — type commands and press Enter' }
  ])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const run = async () => {
    const cmd = input.trim()
    if (!cmd || !id) return

    setHistory((h) => [...h, { type: 'input', text: cmd }])
    setCmdHistory((h) => [cmd, ...h])
    setHistoryIdx(-1)
    setInput('')
    setLoading(true)

    const result = await ipc.cli.execute(id, cmd)
    setHistory((h) => [
      ...h,
      {
        type: result.ok ? 'output' : 'error',
        text: result.ok ? (result.data ?? '(empty)') : (result.error ?? 'Error')
      }
    ])
    setLoading(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIdx + 1, cmdHistory.length - 1)
      setHistoryIdx(next)
      setInput(cmdHistory[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(historyIdx - 1, -1)
      setHistoryIdx(next)
      setInput(next === -1 ? '' : cmdHistory[next])
    }
  }

  return (
    <div
      className="flex flex-col h-full bg-[var(--color-crust)] font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-surface-0)] bg-[var(--color-mantle)]">
        <TermIcon size={14} className="text-[var(--color-green)]" />
        <span className="text-xs font-semibold text-[var(--color-text)]">Redis CLI</span>
        <span className="text-[10px] text-[var(--color-overlay-0)]">↑↓ history</span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {history.map((entry, i) => (
          <div key={i} className={cn(
            'text-xs leading-relaxed selectable',
            entry.type === 'input'  && 'text-[var(--color-blue)] flex items-start gap-1',
            entry.type === 'output' && 'text-[var(--color-text)] whitespace-pre-wrap pl-4',
            entry.type === 'error'  && 'text-[var(--color-red)] whitespace-pre-wrap pl-4',
          )}>
            {entry.type === 'input' && <ChevronRight size={12} className="mt-0.5 shrink-0" />}
            {entry.text}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-[var(--color-overlay-0)] pl-4 animate-pulse">...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-surface-0)]">
        <ChevronRight size={12} className="text-[var(--color-blue)] shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="PING"
          disabled={loading}
          autoFocus
          className="selectable flex-1 bg-transparent text-xs text-[var(--color-text)] placeholder:text-[var(--color-overlay-0)] outline-none"
        />
      </div>
    </div>
  )
}
