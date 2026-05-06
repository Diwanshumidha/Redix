import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { formatUptime } from '../lib/utils'
import { ipc } from '../lib/ipc'
import type { ServerInfo } from '@shared/types'

function InfoSection({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontFamily: 'var(--rv-mono)',
        fontSize: 10.5,
        color: 'var(--rv-text-3)',
        letterSpacing: '0.06em',
        marginBottom: 4,
        paddingBottom: 4,
        borderBottom: '1px solid var(--rv-border)',
      }}>
        # {title}
      </div>
      <div style={{ paddingTop: 2 }}>{children}</div>
    </div>
  )
}

function InfoRow({ k, v, highlight }: Readonly<{ k: string; v: string | number; highlight?: string }>) {
  return (
    <div style={{
      display: 'flex',
      fontFamily: 'var(--rv-mono)',
      fontSize: 11.5,
      lineHeight: 1.85,
    }}>
      <span style={{ color: 'var(--rv-text-3)', width: 240, flexShrink: 0 }}>{k}</span>
      <span style={{ color: highlight ?? 'var(--rv-text-1)' }}>{v}</span>
    </div>
  )
}

export default function ServerInfoPage() {
  const { id } = useParams<{ id: string }>()
  const [info,       setInfo]       = useState<ServerInfo | null>(null)
  const [dbSize,     setDbSize]     = useState<number | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const load = useCallback(async () => {
    if (!id) return
    const [infoRes, sizeRes] = await Promise.all([
      ipc.server.info(id),
      ipc.server.dbSize(id),
    ])
    if (infoRes.ok) setInfo(infoRes.data)
    if (sizeRes.ok) setDbSize(sizeRes.data)
    setLastUpdate(new Date().toLocaleTimeString())
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  }, [load])

  if (loading && !info) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%',
        fontFamily: 'var(--rv-mono)', fontSize: 12, color: 'var(--rv-text-3)',
        gap: 8,
      }}>
        <span className="rv-spinner" />
        loading server info...
      </div>
    )
  }

  if (!info) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%',
        fontFamily: 'var(--rv-mono)', fontSize: 12, color: 'var(--rv-accent)',
      }}>
        ERR failed to load server info
      </div>
    )
  }

  const totalAccesses = info.keyspaceHits + info.keyspaceMisses
  const hitRate = totalAccesses > 0
    ? ((info.keyspaceHits / totalAccesses) * 100).toFixed(1)
    : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--rv-bg-0)' }}>

      {/* Header — mirrors rv-cli-header */}
      <div className="rv-cli-header">
        <span style={{ color: 'var(--rv-ok)' }}>●</span>
        <span>server-info</span>
        <span style={{ color: 'var(--rv-text-3)', fontSize: 10 }}>
          Redis {info.version} · {info.mode} · {info.os}
        </span>
        <span style={{ flex: 1 }} />
        {lastUpdate && (
          <span style={{ color: 'var(--rv-text-3)', fontSize: 10 }}>
            {'updated '}{lastUpdate}
          </span>
        )}
        <button
          className="rv-btn ghost"
          onClick={load}
          style={{ width: 22, height: 22, padding: 0, display: 'grid', placeItems: 'center' }}
          title="Refresh"
        >
          <RefreshCw size={10} />
        </button>
      </div>

      {/* Body — mirrors rv-cli-body */}
      <div className="rv-cli-body" style={{ padding: '14px 18px' }}>

        <InfoSection title="server">
          <InfoRow k="redis_version"      v={info.version}                       highlight="var(--rv-ok)" />
          <InfoRow k="redis_mode"         v={info.mode} />
          <InfoRow k="os"                 v={info.os} />
          <InfoRow k="uptime_in_seconds"  v={info.uptimeSeconds.toLocaleString()} />
          <InfoRow k="uptime_human"       v={formatUptime(info.uptimeSeconds)}    highlight="var(--rv-info)" />
        </InfoSection>

        <InfoSection title="clients">
          <InfoRow k="connected_clients"  v={info.connectedClients}               highlight="var(--rv-ok)" />
        </InfoSection>

        <InfoSection title="memory">
          <InfoRow k="used_memory_human"          v={info.usedMemoryHuman}          highlight="var(--rv-info)" />
          <InfoRow k="total_system_memory_human"  v={info.totalSystemMemoryHuman} />
        </InfoSection>

        <InfoSection title="stats">
          <InfoRow
            k="instantaneous_ops_per_sec"
            v={info.opsPerSec}
            highlight={info.opsPerSec > 0 ? 'var(--rv-ok)' : undefined}
          />
          <InfoRow k="total_commands_processed"  v={info.totalCommandsProcessed.toLocaleString()} />
          <InfoRow k="keyspace_hits"             v={info.keyspaceHits.toLocaleString()}            highlight="var(--rv-ok)" />
          <InfoRow
            k="keyspace_misses"
            v={info.keyspaceMisses.toLocaleString()}
            highlight={info.keyspaceMisses > 0 ? 'var(--rv-accent)' : 'var(--rv-text-3)'}
          />
          <InfoRow
            k="keyspace_hit_rate"
            v={hitRate === '—' ? '—' : `${hitRate}%`}
            highlight={hitRate !== '—' && Number(hitRate) > 90 ? 'var(--rv-ok)' : 'var(--rv-accent)'}
          />
        </InfoSection>

        {dbSize !== null && (
          <InfoSection title="keyspace">
            <InfoRow k="db0:keys"  v={dbSize.toLocaleString()}  highlight="var(--rv-info)" />
          </InfoSection>
        )}

      </div>
    </div>
  )
}
