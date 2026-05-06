import type { ZSetEntry } from '@shared/types'

interface Props {
  type:  string
  value: unknown
}

/* ── JSON syntax tree ── */
function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null)             return <span className="rv-json-null">null</span>
  if (typeof value === 'boolean') return <span className="rv-json-bool">{String(value)}</span>
  if (typeof value === 'number')  return <span className="rv-json-num">{value}</span>
  if (typeof value === 'string')  return <span className="rv-json-str">"{value}"</span>

  if (Array.isArray(value)) {
    if (!value.length) return <span className="rv-json-punct">[]</span>
    return (
      <>
        <span className="rv-json-punct">[</span>
        {value.map((v, i) => (
          <div key={i} style={{ paddingLeft: 16 }}>
            <JsonNode value={v} depth={depth + 1} />
            {i < value.length - 1 && <span className="rv-json-punct">,</span>}
          </div>
        ))}
        <span className="rv-json-punct">]</span>
      </>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (!entries.length) return <span className="rv-json-punct">{'{}'}</span>
    return (
      <>
        <span className="rv-json-punct">{'{'}</span>
        {entries.map(([k, v], i) => (
          <div key={k} style={{ paddingLeft: 16 }}>
            <span className="rv-json-key">"{k}"</span>
            <span className="rv-json-punct">: </span>
            <JsonNode value={v} depth={depth + 1} />
            {i < entries.length - 1 && <span className="rv-json-punct">,</span>}
          </div>
        ))}
        <span className="rv-json-punct">{'}'}</span>
      </>
    )
  }
  return null
}

/* ── String ── */
function StringRenderer({ value }: { value: string }) {
  const isNumeric = /^-?\d+(\.\d+)?$/.test(value.trim())

  let parsed: unknown = null
  let isJson = false
  try {
    if (value.trimStart().startsWith('{') || value.trimStart().startsWith('[')) {
      parsed = JSON.parse(value)
      isJson = true
    }
  } catch { /* not json */ }

  if (isJson && parsed !== null) {
    return (
      <div className="rv-json">
        <JsonNode value={parsed} />
      </div>
    )
  }

  return (
    <div className={`rv-val-string${isNumeric ? ' numeric' : ''}`}>
      {value}
    </div>
  )
}

/* ── Hash ── */
function HashRenderer({ value }: { value: Record<string, string> }) {
  const entries = Object.entries(value)
  return (
    <table className="rv-table">
      <thead>
        <tr>
          <th className="col-idx">#</th>
          <th className="col-field">Field</th>
          <th className="col-val">Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([k, v], i) => (
          <tr key={k}>
            <td className="col-idx">{i}</td>
            <td className="col-field">{k}</td>
            <td className="col-val">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── List ── */
function ListRenderer({ value }: { value: string[] }) {
  return (
    <div className="rv-list">
      {value.map((v, i) => (
        <div className="rv-list-row" key={i}>
          <div className="rv-list-idx">{i}</div>
          <div className="rv-list-val">{v}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Set ── */
function SetRenderer({ value }: { value: string[] }) {
  return (
    <div className="rv-list">
      {value.map((v, i) => (
        <div className="rv-list-row" key={i}>
          <div className="rv-list-idx" style={{ color: 'var(--rv-t-set)' }}>·</div>
          <div className="rv-list-val" style={{ color: 'var(--rv-t-set)' }}>{v}</div>
        </div>
      ))}
    </div>
  )
}

/* ── ZSet ── */
function ZSetRenderer({ value }: { value: ZSetEntry[] }) {
  return (
    <table className="rv-table">
      <thead>
        <tr>
          <th className="col-idx">#</th>
          <th className="col-val">Member</th>
          <th className="col-score">Score</th>
        </tr>
      </thead>
      <tbody>
        {value.map((m, i) => (
          <tr key={m.member}>
            <td className="col-idx">{i + 1}</td>
            <td className="col-val">{m.member}</td>
            <td className="col-score">{m.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ── Main dispatcher ── */
export default function ValueRenderer({ type, value }: Props) {
  if (value === undefined || value === null) return null

  switch (type) {
    case 'string': return <StringRenderer value={value as string} />
    case 'hash':   return <HashRenderer   value={value as Record<string, string>} />
    case 'list':   return <ListRenderer   value={value as string[]} />
    case 'set':    return <SetRenderer    value={value as string[]} />
    case 'zset':   return <ZSetRenderer   value={value as ZSetEntry[]} />
    default:
      return (
        <div className="rv-val-string">
          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </div>
      )
  }
}

/* ── Utility: value → clipboard JSON ── */
export function valueToJson(type: string, value: unknown): string {
  if (type === 'string') return JSON.stringify(value)
  return JSON.stringify(value, null, 2)
}

/* ── Utility: entry size label ── */
export function sizeLabel(type: string, value: unknown): string {
  if (!value) return '—'
  switch (type) {
    case 'string': return `${(value as string).length} chars`
    case 'hash':   return `${Object.keys(value as object).length} fields`
    case 'list':   return `${(value as unknown[]).length} items`
    case 'set':    return `${(value as unknown[]).length} members`
    case 'zset':   return `${(value as unknown[]).length} members`
    default:       return '—'
  }
}
