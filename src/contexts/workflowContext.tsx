import { createContext, useContext, useState, ReactNode } from 'react'

export interface WorkflowState {
  brandId?: string
  brandName?: string
  inputText?: string
  imageUrl?: string
  variants?: Array<{ script: string; image: string; video: string }>
  authenticity?: { score: number; feedback: string[] }
}

interface WorkflowContextType {
  state: WorkflowState
  setState: (s: Partial<WorkflowState>) => void
  reset: () => void
}

const WorkflowContext = createContext<WorkflowContextType>({
  state: {},
  setState: () => {},
  reset: () => {},
})

export const useWorkflow = () => useContext(WorkflowContext)

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [state, set] = useState<WorkflowState>({})
  const setState = (s: Partial<WorkflowState>) => set(prev => ({ ...prev, ...s }))
  const reset = () => set({})
  return (
    <WorkflowContext.Provider value={{ state, setState, reset }}>
      {children}
    </WorkflowContext.Provider>
  )
}
