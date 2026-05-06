import { create } from 'zustand'

type ModalType = 'add-connection' | 'edit-connection' | 'delete-connection' | 'add-key' | null

interface UiState {
  modal: ModalType
  modalData: Record<string, unknown>
  sidebarCollapsed: boolean
  keySearchPattern: string
  selectedKey: string | null

  openModal: (modal: NonNullable<ModalType>, data?: Record<string, unknown>) => void
  closeModal: () => void
  toggleSidebar: () => void
  setKeySearchPattern: (pattern: string) => void
  setSelectedKey: (key: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  modal: null,
  modalData: {},
  sidebarCollapsed: false,
  keySearchPattern: '*',
  selectedKey: null,

  openModal: (modal, data = {}) => set({ modal, modalData: data }),
  closeModal: () => set({ modal: null, modalData: {} }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setKeySearchPattern: (pattern) => set({ keySearchPattern: pattern }),
  setSelectedKey: (key) => set({ selectedKey: key })
}))
