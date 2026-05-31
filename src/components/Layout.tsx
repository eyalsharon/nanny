import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, Clock, Users, DollarSign, Settings, LogOut, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

const parentNav = [
  { to: '/', icon: CalendarDays, label: 'Calendar' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hours', icon: Clock, label: 'Hours' },
  { to: '/workers', icon: Users, label: 'Workers' },
  { to: '/payments', icon: DollarSign, label: 'Payments' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const workerNav = [
  { to: '/', icon: CalendarDays, label: 'Calendar' },
  { to: '/hours', icon: Clock, label: 'Hours' },
]

export function Layout() {
  const { session, logout } = useApp()
  const navigate = useNavigate()

  if (!session) return <Navigate to="/login" replace />

  const nav = session.role === 'parent' ? parentNav : workerNav
  const isWorker = session.role === 'worker'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-100 min-h-screen">
        <div className="px-5 py-6 border-b border-gray-100">
          <h1 className="font-semibold text-gray-900">Nanny Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">{session.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {isWorker && (
            <NavLink
              to="/hours/new"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-gray-900 text-white font-medium' : 'bg-gray-900 text-white hover:bg-gray-700'
                }`
              }
            >
              <Plus size={16} />
              Log Hours
            </NavLink>
          )}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-gray-600 border-t border-gray-100"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">Nanny Tracker</h1>
            <p className="text-xs text-gray-400">{session.name}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 p-1">
            <LogOut size={18} />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <Outlet />
        </div>

        {/* Bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* FAB — worker only, mobile */}
        {isWorker && (
          <NavLink
            to="/hours/new"
            className="md:hidden fixed bottom-16 right-4 bg-gray-900 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors z-20"
          >
            <Plus size={24} />
          </NavLink>
        )}
      </main>
    </div>
  )
}
