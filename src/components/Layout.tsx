import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import { hasRole, normalizeRoles } from '../utils/roles'
import { showToast } from '../utils/toast'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Events', to: '/events' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Login/Register', to: '/login' },
]

function Layout() {
  const [token, setToken] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isBranchRep, setIsBranchRep] = useState(false)
  const [isOrganiser, setIsOrganiser] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setToken(localStorage.getItem('token'))
    const storedName = localStorage.getItem('userName')
    const storedEmail = localStorage.getItem('userEmail')
    setUserName(storedName ?? storedEmail ?? null)
    setUserRoles([])
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRoles')
    setToken(null)
    setUserName(null)
    setUserRoles([])
    showToast('Logged out successfully', 'info')
    void navigate('/')
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const authToken = localStorage.getItem('token')
      if (!authToken) {
        return
      }
      try {
        const { data } = await apiClient.get<{ user?: { name?: unknown; email?: unknown; roles?: unknown; isBranchRep?: unknown; isOrganiser?: unknown } }>(
          '/auth/me',
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        )
        const user = data?.user
        const name = user && typeof user === 'object'
          ? typeof user.name === 'string'
            ? user.name
            : typeof user.email === 'string'
              ? user.email
              : null
          : null

        const roles = user && typeof user === 'object' ? normalizeRoles((user as { roles?: unknown }).roles) : []
        const branchRep = Boolean(user && (user as { isBranchRep?: unknown }).isBranchRep)
        const organiser = Boolean(user && (user as { isOrganiser?: unknown }).isOrganiser)

        if (name) {
          localStorage.setItem('userName', name)
          setUserName(name)
        }

        setUserRoles(roles)
        setIsBranchRep(branchRep)
        setIsOrganiser(organiser)
        if (user && typeof user === 'object' && typeof (user as { email?: unknown }).email === 'string') {
          localStorage.setItem('userEmail', (user as { email: string }).email)
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userRoles')
        setToken(null)
        setUserName(null)
        setUserRoles([])
        setIsBranchRep(false)
        setIsOrganiser(false)
      }
    }

    void fetchProfile()
  }, [token])

  return (
    <div className={`flex min-h-screen flex-col ${location.pathname.startsWith('/dashboard') ? '' : 'bg-slate-950'} text-slate-50`}>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-sky-300">
            <img
              src="/incridea.png.png"
              alt="Incridea"
              className="h-12 w-auto rounded-xl object-contain"
            />
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-200">
            {navLinks
              .filter((link) => !(link.label === 'Login/Register' && token))
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-sky-200 ${
                      isActive ? 'bg-slate-800 text-sky-300' : ''
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            {hasRole(userRoles, 'ADMIN') || hasRole(userRoles, 'DOCUMENTATION') || isBranchRep || isOrganiser ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition hover:bg-slate-800 hover:text-sky-200 ${
                    isActive ? 'bg-slate-800 text-sky-300' : ''
                  }`
                }
              >
                Dashboard
              </NavLink>
            ) : null}
            {token ? (
              <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100">
                <button
                  type="button"
                  onClick={() => void navigate('/profile')}
                  className="font-semibold hover:text-sky-200"
                >
                  {userName}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded bg-slate-700 px-2 py-1 text-[11px] font-semibold text-sky-200 hover:bg-slate-600"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="w-screen flex justify-center items-center flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-5 text-xs font-semibold text-slate-100 md:flex-row md:flex-wrap md:justify-center md:gap-4">
          <Link className="transition-colors duration-200 hover:text-slate-200" to="/privacy">
            Privacy Policy
          </Link>
          <span className="hidden text-slate-600 md:inline">|</span>
          <Link className="transition-colors duration-200 hover:text-slate-200" to="/rules">
            Terms & Conditions
          </Link>
          <span className="hidden text-slate-600 md:inline">|</span>
          <Link className="transition-colors duration-200 hover:text-slate-200" to="/guidelines">
            Guidelines
          </Link>
          <span className="hidden text-slate-600 md:inline">|</span>
          <Link className="transition-colors duration-200 hover:text-slate-200" to="/refund">
            Refund Policy
          </Link>
          <span className="hidden text-slate-600 md:inline">|</span>
          <Link className="transition-colors duration-200 hover:text-slate-200" to="/contact">
            Contact Us
          </Link>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 pb-5 text-[11px] font-semibold tracking-wide text-slate-200">
          <Link className="inline-flex items-center gap-1 transition-all hover:tracking-wider hover:text-slate-100" to="/team">
            Made with <span className="text-rose-400">❤</span> by Technical Team
          </Link>
          <p>© Incridea {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
