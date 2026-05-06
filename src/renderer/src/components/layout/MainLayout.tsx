import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import Modal from '../ui/Modal'
import AddConnectionModal from '../modals/AddConnectionModal'
import { useUiStore } from '../../store/ui'

export default function MainLayout() {
  const modal = useUiStore((s) => s.modal)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--rv-bg-0)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {modal === 'add-connection' && (
        <Modal title="New Connection">
          <AddConnectionModal />
        </Modal>
      )}
      {modal === 'edit-connection' && (
        <Modal title="Edit Connection">
          <AddConnectionModal editMode />
        </Modal>
      )}
    </div>
  )
}
