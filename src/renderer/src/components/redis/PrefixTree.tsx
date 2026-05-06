import { useState, useMemo, useCallback, memo } from 'react'
import type { KeyInfo } from '@shared/types'
import { formatTtl } from '../../hooks/useLiveTtl'

/* ── Build prefix tree from flat key list ── */
interface TreeNode {
  name:     string
  path:     string
  children: Record<string, TreeNode>
  keys:     KeyInfo[]
}

function buildTree(keys: KeyInfo[]): TreeNode {
  const root: TreeNode = { name: '', path: '', children: {}, keys: [] }
  for (const k of keys) {
    const parts = k.key.split(':')
    let node = root
    let path = ''
    for (let i = 0; i < parts.length - 1; i++) {
      path = path ? `${path}:${parts[i]}` : parts[i]
      if (!node.children[parts[i]]) {
        node.children[parts[i]] = { name: parts[i], path, children: {}, keys: [] }
      }
      node = node.children[parts[i]]
    }
    node.keys.push(k)
  }
  return root
}

function countSubtree(node: TreeNode): { n: number; mem: number } {
  let n   = node.keys.length
  let mem = node.keys.reduce((a, k) => a + ((k as KeyInfo & { memory?: number }).memory ?? 64), 0)
  for (const c of Object.values(node.children)) {
    const r = countSubtree(c)
    n += r.n; mem += r.mem
  }
  return { n, mem }
}

function formatBytes(b: number): string {
  if (b < 1024)          return `${b} B`
  if (b < 1024 * 1024)  return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(2)} MB`
}

/* ── Node component ── */
const NodeRow = memo(function NodeRow({
  node, depth, expanded, toggle, selected, onSelect, totalCount,
}: {
  node:       TreeNode
  depth:      number
  expanded:   Set<string>
  toggle:     (path: string) => void
  selected:   string | null
  onSelect:   (key: string) => void
  totalCount: number
}) {
  const id     = node.path || '__root__'
  const isOpen = expanded.has(id)
  const stats  = useMemo(() => countSubtree(node), [node])
  const pct    = totalCount ? Math.round((stats.n / totalCount) * 100) : 0

  return (
    <div>
      <div
        className="rv-tree-node"
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => toggle(id)}
      >
        <span className={`rv-tree-caret${isOpen ? ' open' : ''}`}>▸</span>
        <span className="rv-tree-name">{node.name || '(root)'}</span>
        <span className="rv-tree-count">{stats.n}</span>
        <span className="rv-tree-bar"><span style={{ width: `${pct}%` }} /></span>
        <span className="rv-tree-mem">{formatBytes(stats.mem)}</span>
      </div>

      {isOpen && (
        <>
          {Object.values(node.children).map((c) => (
            <NodeRow key={c.path} node={c} depth={depth + 1}
              expanded={expanded} toggle={toggle}
              selected={selected} onSelect={onSelect}
              totalCount={totalCount} />
          ))}
          {node.keys.map((k) => {
            const ttlInfo = formatTtl(k.ttl)
            return (
              <div
                key={k.key}
                className={`rv-tree-leaf${selected === k.key ? ' selected' : ''}`}
                style={{ paddingLeft: 8 + (depth + 1) * 14 }}
                onClick={(e) => { e.stopPropagation(); onSelect(k.key) }}
              >
                <span className="rv-ktype" data-t={k.type}>{k.type}</span>
                <span className="rv-tree-leaf-name">{k.key.split(':').at(-1)}</span>
                <span className={`rv-kttl${ttlInfo.state === 'expiring' ? ' expiring' : ttlInfo.state === 'expired' ? ' expired' : ''}`}
                  style={{ fontSize: 10, marginLeft: 'auto', paddingRight: 12 }}>
                  {ttlInfo.state === 'persistent' ? '' : ttlInfo.label}
                </span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
})

/* ── PrefixTree public component ── */
interface Props {
  keys:     KeyInfo[]
  selected: string | null
  onSelect: (key: string) => void
}

export default function PrefixTree({ keys, selected, onSelect }: Readonly<Props>) {
  const tree = useMemo(() => buildTree(keys), [keys])
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set(['__root__'])
    for (const k of Object.keys(tree.children)) s.add(k)
    return s
  })

  const toggle = useCallback((path: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    }), [])

  const totals = countSubtree(tree)

  return (
    <div className="rv-tree">
      {Object.values(tree.children).map((c) => (
        <NodeRow key={c.path} node={c} depth={0}
          expanded={expanded} toggle={toggle}
          selected={selected} onSelect={onSelect}
          totalCount={totals.n} />
      ))}
      {tree.keys.map((k) => (
        <div
          key={k.key}
          className={`rv-tree-leaf${selected === k.key ? ' selected' : ''}`}
          style={{ paddingLeft: 12 }}
          onClick={() => onSelect(k.key)}
        >
          <span className="rv-ktype" data-t={k.type}>{k.type}</span>
          <span className="rv-tree-leaf-name">{k.key}</span>
        </div>
      ))}
    </div>
  )
}
