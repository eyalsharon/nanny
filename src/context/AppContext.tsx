import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAppData } from '../hooks/useAppData'
import type { Session } from '../types'

type AppDataReturn = ReturnType<typeof useAppData>

interface AppContextValue extends AppDataReturn {
  session: Session | null
  login: (session: Session) => void
  logout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function getInitialSession(): Session | null {
  try {
    const raw = sessionStorage.getItem('nanny-session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const appData = useAppData()
  const [session, setSession] = useState<Session | null>(getInitialSession)

  function login(s: Session) {
    sessionStorage.setItem('nanny-session', JSON.stringify(s))
    setSession(s)
  }

  function logout() {
    sessionStorage.removeItem('nanny-session')
    setSession(null)
  }

  return (
    <AppContext.Provider value={{ ...appData, session, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
