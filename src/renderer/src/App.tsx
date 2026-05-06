import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useConnectionsStore } from './store/connections'
import MainLayout from './components/layout/MainLayout'
import Welcome from './pages/Welcome'
import ConnectionPage from './pages/Connection'
import ServerInfo from './pages/ServerInfo'
import Cli from './pages/Cli'

export default function App() {
  const load = useConnectionsStore((s) => s.load)

  useEffect(() => { load() }, [load])

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Welcome />} />
        <Route path="connection/:id" element={<ConnectionPage />} />
        <Route path="connection/:id/server" element={<ServerInfo />} />
        <Route path="connection/:id/cli" element={<Cli />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
