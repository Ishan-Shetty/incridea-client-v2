import { useEffect, useMemo, useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
// ...
import { verifyMasterKey } from '../api/auth'
import { useSocket } from '../hooks/useSocket'
import {
  fetchAdminUsers,
  fetchSettings,
  fetchVariables,
  fetchWebLogs,
  updateSetting,
  updateUserRoles,
  upsertVariable,
  type AdminUser,
  type AdminUsersResponse,
  type Setting,
  type SettingsResponse,
  type Variable,
  type VariablesResponse,
  type WebLogsResponse,
} from '../api/admin'
import {
  addOrganiserToEvent,
  fetchBranchRepEvents,
  removeOrganiserFromEvent,
  searchBranchRepUsers,
  type BranchRepEvent,
  type BranchRepEventsResponse,
  type BranchRepUser, // Restore this as it is used
} from '../api/branchRep'
import apiClient from '../api/client'
import { hasRole, normalizeRoles } from '../utils/roles'
import { showToast } from '../utils/toast'
import BranchEventsTab from './dashboard/BranchEventsTab'
import LogsTab from './dashboard/LogsTab'
import SettingsTab from './dashboard/SettingsTab'
import UsersTab from './dashboard/UsersTab'
import VariablesTab from './dashboard/VariablesTab'
import DocEventsTab from './dashboard/DocEventsTab'
import DocAssignRepTab from './dashboard/DocAssignRepTab'
import OrganiserTab from './dashboard/OrganiserTab'
import JudgingTab from './dashboard/JudgingTab'
import {
  fetchDocumentationEvents,
  createDocumentationEvent,
  updateDocumentationEvent,
  fetchDocumentationEventDetails,
  fetchBranches,
  type DocumentationEvent,
  type DocumentationEventDetails,
  type CreateDocumentationEventPayload,
  type UpdateDocumentationEventPayload,
  type Branch,
} from '../api/documentation'

const ADMIN_TABS = ['Settings', 'Variables', 'Users', 'Logs'] as const
const BRANCHREP_TABS = ['Branch Rep'] as const
const DOCUMENTATION_TABS = ['Doc Access', 'Assign Branch Rep'] as const
const ORGANISER_TABS = ['Organiser'] as const
const JUDGING_TABS = ['Judging'] as const

type TabKey =
  | (typeof ADMIN_TABS)[number]
  | (typeof BRANCHREP_TABS)[number]
  | (typeof DOCUMENTATION_TABS)[number]
  | (typeof ORGANISER_TABS)[number]
  | (typeof JUDGING_TABS)[number]

const truthyStrings = new Set(['true', '1', 'yes', 'y', 'on'])

function isTruthyVariable(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    return truthyStrings.has(value.trim().toLowerCase())
  }

  return false
}

function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { eventId } = useParams<{ eventId: string }>()

  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  )
  const [roles, setRoles] = useState<string[]>([])
  const [isBranchRep, setIsBranchRep] = useState(false)
  const [isDocumentation, setIsDocumentation] = useState(false)
  const [isOrganiser, setIsOrganiser] = useState(false)
  const [isJudge, setIsJudge] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const isAdmin = hasRole(roles, 'ADMIN')
  const { socket } = useSocket()
  
  const [tabLoadState, setTabLoadState] = useState<Record<TabKey, boolean>>({
    Settings: true,
    Variables: false,
    Users: false,
    Logs: false,
    'Branch Rep': false,
    'Doc Access': false,
    'Assign Branch Rep': false,
    'Organiser': false,
    'Judging': false,
  })

  // Initialize activeTab safely
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_active_tab')
      // Validate if stored tab is a valid TabKey
      if (stored && [
        ...ADMIN_TABS, 
        ...BRANCHREP_TABS, 
        ...DOCUMENTATION_TABS, 
        ...ORGANISER_TABS, 
        ...JUDGING_TABS
      ].includes(stored as any)) {
        return stored as TabKey
      }
    }
    return 'Settings'
  })

  useEffect(() => {
    if (eventId) {
      setActiveTab('Organiser')
    }
  }, [eventId])

  const [variableDrafts, setVariableDrafts] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)


  const [userSearchDraft, setUserSearchDraft] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRolesDraft, setUserRolesDraft] = useState<Record<number, string[]>>({})
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [logsPage, setLogsPage] = useState(1)

  // Branch Rep State

  const [organiserSearchTerms, setOrganiserSearchTerms] = useState<Record<number, string>>({})
  const [organiserSearchResults, setOrganiserSearchResults] = useState<Record<number, BranchRepUser[]>>({})
  const [organiserSearchLoading, setOrganiserSearchLoading] = useState<Record<number, boolean>>({})
  const [pendingOrganiser, setPendingOrganiser] = useState<{ eventId: number; user: BranchRepUser } | null>(null)

  // Documentation Role State
  const [activeDocEventId, setActiveDocEventId] = useState<number | null>(null)
  const [docEventDrafts, setDocEventDrafts] = useState<Record<number, Partial<DocumentationEventDetails>>>({})
  const [isDocAddEventOpen, setIsDocAddEventOpen] = useState(false)

  // Master Key State
  const [isMasterKeyOpen, setIsMasterKeyOpen] = useState(false)
  const [masterKeyInput, setMasterKeyInput] = useState('')
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
  const [verifyingMasterKey, setVerifyingMasterKey] = useState(false)

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
  }

  useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab)
    setTabLoadState((prev) => ({ ...prev, [activeTab]: true }))
  }, [activeTab])

  // ...

  const fetchRoles = useCallback(async () => {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setToken(authToken)

    if (!authToken) {
      void navigate('/login')
      return
    }

    try {
      const { data } = await apiClient.get<{
        user?: { id: number; roles?: unknown; isBranchRep?: unknown; isOrganiser?: unknown; isJudge?: unknown }
      }>('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const fetchedRoles = data?.user ? normalizeRoles(data.user.roles) : []
      const branchRepFlag = Boolean(data?.user && (data.user as { isBranchRep?: unknown }).isBranchRep)
      const organiserFlag = Boolean(data?.user && (data.user as { isOrganiser?: unknown }).isOrganiser)
      const judgeFlag = Boolean(data?.user && (data.user as { isJudge?: unknown }).isJudge)
      const documentationFlag = hasRole(fetchedRoles, 'DOCUMENTATION')

      if (data?.user?.id) setUserId(data.user.id)
      setRoles(fetchedRoles)
      setIsBranchRep(branchRepFlag)
      setIsOrganiser(organiserFlag)
      setIsJudge(judgeFlag)
      setIsDocumentation(documentationFlag)

      // ... (Rest of logic)
      
      const hasAnyAccess = hasRole(fetchedRoles, 'ADMIN') || branchRepFlag || documentationFlag || organiserFlag || judgeFlag
        if (!hasAnyAccess) {
          showToast('Access required.', 'error')
          void navigate('/')
          return
        }

        const availableTabs: TabKey[] = [
          ...(hasRole(fetchedRoles, 'ADMIN') ? [...ADMIN_TABS] : []),
          ...(branchRepFlag ? [...BRANCHREP_TABS] : []),
          ...(documentationFlag ? [...DOCUMENTATION_TABS] : []),
          ...(organiserFlag ? [...ORGANISER_TABS] : []),
          ...(judgeFlag ? [...JUDGING_TABS] : []),
        ]
        
        setActiveTab((prev) => (availableTabs.includes(prev) ? prev : availableTabs[0]))

    } catch {
      showToast('Session expired. Please log in again.', 'error')
      void navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    void fetchRoles()
  }, [fetchRoles])

  useEffect(() => {
    if (!userId || !socket) return

    const room = `user-${userId}`
    socket.emit('join-room', room)

    const handleRoleUpdate = () => {
        showToast('Your roles have been updated', 'info')
        void fetchRoles()
    }

    socket.on('ROLE_UPDATED', handleRoleUpdate)

    return () => {
        socket.emit('leave-room', room)
        socket.off('ROLE_UPDATED', handleRoleUpdate)
    }
  }, [userId, socket, fetchRoles])

  useEffect(() => {
    const handle = window.setTimeout(() => setUserSearchTerm(userSearchDraft.trim()), 250)
    return () => window.clearTimeout(handle)
  }, [userSearchDraft])

  const settingsQuery = useQuery<SettingsResponse, Error, SettingsResponse, ['admin-settings']>({
    queryKey: ['admin-settings'],
    queryFn: () => fetchSettings(token ?? ''),
    enabled: isAdmin && Boolean(token) && tabLoadState.Settings,
  })

  const variablesQuery = useQuery<VariablesResponse, Error, VariablesResponse, ['admin-variables']>({
    queryKey: ['admin-variables'],
    queryFn: () => fetchVariables(token ?? ''),
    enabled: isAdmin && Boolean(token) && tabLoadState.Variables,
  })

  const adminUsersQuery = useQuery<AdminUsersResponse, Error, AdminUsersResponse, ['admin-users', string]>({
    queryKey: ['admin-users', userSearchTerm],
    queryFn: () => fetchAdminUsers(userSearchTerm, token ?? ''),
    enabled: isAdmin && Boolean(token) && tabLoadState.Users,
  })

  const adminAccessUsersQuery = useQuery<AdminUsersResponse, Error, AdminUsersResponse, ['admin-access-users']>({
    queryKey: ['admin-access-users'],
    queryFn: () => fetchAdminUsers('', token ?? ''),
    enabled: isAdmin && Boolean(token) && tabLoadState.Users,
  })

  const webLogsQuery = useQuery<WebLogsResponse, Error, WebLogsResponse, ['web-logs', number]>({
    queryKey: ['web-logs', logsPage],
    queryFn: () => fetchWebLogs(token ?? '', logsPage, 50),
    enabled: isAdmin && Boolean(token) && tabLoadState.Logs,
  })

  const branchEventsQuery = useQuery<BranchRepEventsResponse, Error, BranchRepEventsResponse, ['branch-rep-events']>({
    queryKey: ['branch-rep-events'],
    queryFn: () => fetchBranchRepEvents(token ?? ''),
    enabled: isBranchRep && Boolean(token) && tabLoadState['Branch Rep'],
  })

  useEffect(() => {
    if (!variablesQuery.data?.variables) {
      return
    }
    const drafts: Record<string, string> = {}
    variablesQuery.data.variables.forEach((variable) => {
      drafts[variable.key] = variable.value
    })
    setVariableDrafts(drafts)
  }, [variablesQuery.data])

  const updateSettingMutation = useMutation({
    mutationFn: (payload: { key: string; value: boolean }) => {
      if (!token) {
        throw new Error('Unauthorized')
      }
      return updateSetting(payload.key, payload.value, token)
    },
    onSuccess: () => {
      void settingsQuery.refetch()
      showToast('Setting updated', 'success')
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to update setting', 'error')
    },
  })

  const upsertVariableMutation = useMutation({
    mutationFn: (payload: { key: string; value: string }) => {
      if (!token) {
        throw new Error('Unauthorized')
      }
      return upsertVariable(payload.key, payload.value, token)
    },
    onSuccess: () => {
      void variablesQuery.refetch()
      showToast('Variable saved', 'success')
      setEditingKey(null)
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to save variable', 'error')
    },
  })

  const updateUserRolesMutation = useMutation<
    { user: { id: number; roles: string[] }; message: string },
    Error,
    { userId: number; roles: string[] }
  >({
    mutationFn: (payload) => {
      if (!token) {
        throw new Error('Unauthorized')
      }
      return updateUserRoles(payload.userId, payload.roles, token)
    },
    onSuccess: (data) => {
      showToast('Roles updated', 'success')
      setUserRolesDraft((prev) => ({ ...prev, [data.user.id]: data.user.roles }))
      setEditingUserId(null)
      setSelectedUser(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void adminAccessUsersQuery.refetch()
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to update roles', 'error')
    },
  })


  const addOrganiserMutation = useMutation<{ organiser: { userId: number } }, Error, { eventId: number; email: string }>({
    mutationFn: (payload) => {
      if (!token) {
        throw new Error('Unauthorized')
      }
      return addOrganiserToEvent(payload.eventId, payload.email, token)
    },
    onSuccess: (_data, variables) => {
      setOrganiserSearchTerms((prev) => ({ ...prev, [variables.eventId]: '' }))
      setOrganiserSearchResults((prev) => ({ ...prev, [variables.eventId]: [] }))
      setPendingOrganiser(null)
      void branchEventsQuery.refetch()
      showToast('Organiser added', 'success')
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to add organiser', 'error')
    },
  })

  const removeOrganiserMutation = useMutation({
    mutationFn: (payload: { eventId: number; userId: number }) => {
      if (!token) {
        throw new Error('Unauthorized')
      }
      return removeOrganiserFromEvent(payload.eventId, payload.userId, token)
    },
    onSuccess: () => {
      void branchEventsQuery.refetch()
      showToast('Organiser removed', 'success')
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : 'Failed to remove organiser', 'error')
    },
  })




  const handleOrganiserSearch = async (eventId: number, term: string) => {
    setOrganiserSearchTerms((prev) => ({ ...prev, [eventId]: term }))
    if (!token) {
      return
    }
    if (term.trim().length < 2) {
      setOrganiserSearchResults((prev) => ({ ...prev, [eventId]: [] }))
      return
    }
    setOrganiserSearchLoading((prev) => ({ ...prev, [eventId]: true }))
    try {
      const { users } = await searchBranchRepUsers(term.trim(), token)
      setOrganiserSearchResults((prev) => ({ ...prev, [eventId]: users }))
    } catch (error) {
      console.error(error)
    } finally {
      setOrganiserSearchLoading((prev) => ({ ...prev, [eventId]: false }))
    }
  }



  // Documentation Queries & Mutations
  const docEventsQuery = useQuery<{ events: DocumentationEvent[] }, Error, { events: DocumentationEvent[] }, ['documentation-events']>({
    queryKey: ['documentation-events'],
    queryFn: () => fetchDocumentationEvents(token ?? ''),
    enabled: isDocumentation && Boolean(token) && tabLoadState['Doc Access'],
  })

  const branchesQuery = useQuery<{ branches: Branch[] }, Error, { branches: Branch[] }, ['branches']>({
    queryKey: ['branches'],
    queryFn: () => fetchBranches(token ?? ''),
    enabled: isDocumentation && Boolean(token) && tabLoadState['Doc Access'],
  })

  const docEventDetailsQuery = useQuery<DocumentationEventDetails, Error, DocumentationEventDetails, ['doc-event', number | null]>({
    queryKey: ['doc-event', activeDocEventId],
    queryFn: async () => {
      if (!token || !activeDocEventId) throw new Error('No event selected')
      const { event } = await fetchDocumentationEventDetails(activeDocEventId, token)
      return event
    },
    enabled: tabLoadState['Doc Access'] && Boolean(token && activeDocEventId && isDocumentation),
  })

  useEffect(() => {
    const event = docEventDetailsQuery.data
    if (!event) return
    setDocEventDrafts((prev) => ({
      ...prev,
      [event.id]: {
        ...event, // Copy all fields
      },
    }))
  }, [docEventDetailsQuery.data])

  const createDocEventMutation = useMutation({
    mutationFn: (payload: CreateDocumentationEventPayload) => {
      if (!token) throw new Error('Unauthorized')
      return createDocumentationEvent(payload, token)
    },
    onSuccess: () => {
      void docEventsQuery.refetch()
      showToast('Event created', 'success')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Failed to create event', 'error'),
  })

  const updateDocEventMutation = useMutation({
    mutationFn: (payload: { eventId: number; data: UpdateDocumentationEventPayload }) => {
      if (!token) throw new Error('Unauthorized')
      return updateDocumentationEvent(payload.eventId, payload.data, token)
    },
    onSuccess: ({ event }) => {
      void docEventsQuery.refetch()
      void docEventDetailsQuery.refetch()
      setDocEventDrafts((prev) => ({ ...prev, [event.id]: event }))
      showToast('Event updated', 'success')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Failed to update event', 'error'),
  })

  const setActiveDocEventDraft = (eventId: number, data: Partial<DocumentationEventDetails>) => {
    setDocEventDrafts((prev) => ({ ...prev, [eventId]: { ...prev[eventId], ...data } }))
  }



  const handleMasterKeySubmit = async () => {
    if (!token) return
    setVerifyingMasterKey(true)
    try {
      const { success, message } = await verifyMasterKey(masterKeyInput, token)
      if (success) {
        pendingAction?.()
        setIsMasterKeyOpen(false)
        setMasterKeyInput('')
        setPendingAction(null)
      } else {
        showToast(message || 'Invalid Master Key', 'error')
      }
    } catch (error) {
      showToast('Failed to verify Master Key', 'error')
    } finally {
      setVerifyingMasterKey(false)
    }
  }

  const interceptedUpdateSettingMutation = {
    ...updateSettingMutation,
    mutate: (payload: { key: string; value: boolean }) => {
      setPendingAction(() => () => updateSettingMutation.mutate(payload))
      setIsMasterKeyOpen(true)
    },
  }

  const interceptedUpsertVariableMutation = {
    ...upsertVariableMutation,
    mutate: (payload: { key: string; value: string }) => {
      setPendingAction(() => () => upsertVariableMutation.mutate(payload))
      setIsMasterKeyOpen(true)
    },
  }

  const settings = useMemo<Setting[]>(() => settingsQuery.data?.settings ?? [], [settingsQuery.data])
  const variables = useMemo<Variable[]>(() => variablesQuery.data?.variables ?? [], [variablesQuery.data])
  const settingsLookup = useMemo<Record<string, boolean>>(
    () => settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {} as Record<string, boolean>),
    [settings],
  )
  const variableLookup = useMemo<Record<string, string>>(
    () => variables.reduce((acc, variable) => ({ ...acc, [variable.key]: variable.value }), {} as Record<string, string>),
    [variables],
  )

  const adminUsers = adminUsersQuery.data?.users ?? []
  const adminUsersData = adminUsersQuery.data ?? { availableRoles: [] as string[] }
  const accessUsers = adminAccessUsersQuery.data?.users ?? []

  const branchName = branchEventsQuery.data?.branchName
  const branchEvents: BranchRepEvent[] = branchEventsQuery.data?.events ?? []

  if (!token) {
    return null
  }

  const hasAnyAccess = isAdmin || isBranchRep || isDocumentation || isOrganiser || isJudge
  if (!hasAnyAccess) {
    return (
      <section className="min-h-screen space-y-4  px-2 pb-8 pt-4 text-slate-100 lg:px-3">
        <div className="card p-6 border border-slate-800 ">
          <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-400">You do not have access to dashboard tools.</p>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen w-full max-w-full space-y-3  px-2 pb-8 pt-4 text-slate-100 lg:px-3">

      {isMasterKeyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMasterKeyOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-center text-lg font-semibold text-slate-100">Authentication Required</h3>
            <p className="mb-4 text-center text-sm text-slate-400">Enter the Master Key to proceed.</p>
            <input
              type="password"
              className="input mb-4 text-center tracking-widest"
              autoFocus
              value={masterKeyInput}
              onChange={(e) => setMasterKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleMasterKeySubmit()
              }}
              placeholder="••••"
            />
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
                onClick={() => setIsMasterKeyOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button bg-indigo-600 hover:bg-indigo-500"
                onClick={() => void handleMasterKeySubmit()}
                disabled={verifyingMasterKey || !masterKeyInput}
              >
                {verifyingMasterKey ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card space-y-3 border border-slate-800  p-5">
        <div className="flex items-center justify-center text-center">
          <div>
            <p className="muted">Dashboard</p>
            <h1 className="text-3xl font-semibold text-slate-50">
              {isAdmin ? 'Admin Dashboard' : isBranchRep ? 'Branch Rep Dashboard' : isDocumentation ? 'Documentation Dashboard' : isOrganiser ? 'Organiser Dashboard' : 'Dashboard'}
            </h1>
          </div>
        </div>

        {isAdmin ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800  p-3">
              <p className="mb-2 text-xs font-semibold text-slate-100">Statuses</p>
              {[{ label: 'Registrations', key: 'isRegistrationOpen' }, { label: 'Spot Registration', key: 'isSpotRegistration' }, { label: 'Committee Registration', key: 'isCommitteeRegOpen' }].map((item) => {
                const rawValue = variableLookup[item.key] ?? settingsLookup[item.key]
                const value = isTruthyVariable(rawValue)
                return (
                  <li key={item.key} className="flex items-center justify-between  px-3 py-2">
                    <span className="text-xs text-slate-200">{item.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${value
                      ? 'border border-emerald-400/70 bg-emerald-500/10 text-emerald-100'
                      : 'border border-rose-400/70 bg-rose-500/10 text-rose-100'
                      }`}>
                      <span className={`h-2 w-2 rounded-full ${value ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {value ? 'Open' : 'Closed'}
                    </span>
                  </li>
                )
              })}
            </div>

            <div className="rounded-xl border border-slate-800  p-3">
              <p className="mb-2 text-xs font-semibold text-slate-100">Fees</p>
              {[
                {
                  label: 'Alumni Registration Fee',
                  key: 'alumniRegistrationFee',
                },
                {
                  label: 'External Students Fee',
                  key: 'externalRegistrationFee',
                },
                {
                  label: 'External Students OnSpot Fee',
                  key: 'externalRegistrationFeeOnSpot',
                },
                {
                  label: 'Internal Students Fee',
                  key: 'internalRegistrationFeeGen',
                },
                {
                  label: 'Internal Students Merch Inclusive',
                  key: 'internalRegistrationFeeInclusiveMerch',
                },
                {
                  label: 'Internal Students OnSpot',
                  key: 'internalRegistrationOnSpot',
                },
              ].map((item) => (
                <li key={item.key} className="flex items-center justify-between  px-3 py-2">
                  <span className="text-xs text-slate-200">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-100">{variableLookup[item.key] ?? (settingsLookup[item.key] ?? '—')}</span>
                </li>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <section className="grid w-full gap-3 lg:grid-cols-[220px_1fr]">
        <aside className="card h-full border border-slate-800  p-3 sm:p-4">
          <div className="flex h-full flex-col gap-5">
            {isAdmin ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Admin</p>
                {ADMIN_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab ? 'bg-sky-500/20 text-sky-200' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            ) : null}

            {isBranchRep ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Branch Rep</p>
                {BRANCHREP_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-200' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            ) : null}

            {isDocumentation ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documentation</p>
                {DOCUMENTATION_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab ? 'bg-purple-500/20 text-purple-200' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            ) : null}

            {isOrganiser ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organiser</p>
                {ORGANISER_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-500/20 text-blue-200' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        <main className="card min-h-[500px] border border-slate-800  p-4 sm:p-6">
          {activeTab === 'Settings' && isAdmin ? (
            <SettingsTab
              settings={settings}
              settingsQuery={settingsQuery}
              updateSettingMutation={interceptedUpdateSettingMutation as any}
            />
          ) : null}

          {activeTab === 'Variables' && isAdmin ? (
            <VariablesTab
              variableDrafts={variableDrafts}
              setVariableDrafts={setVariableDrafts}
              editingKey={editingKey}
              setEditingKey={setEditingKey}
              upsertVariableMutation={interceptedUpsertVariableMutation as any}
              variables={variables}
              variablesQuery={variablesQuery}
            />
          ) : null}

          {activeTab === 'Users' && isAdmin ? (
            <UsersTab
              userSearchDraft={userSearchDraft}
              setUserSearchDraft={setUserSearchDraft}
              setUserSearchTerm={setUserSearchTerm}
              users={adminUsers}
              availableRoles={adminUsersData.availableRoles}
              accessUsers={accessUsers}
              adminUsersQuery={adminUsersQuery}
              adminAccessUsersQuery={adminAccessUsersQuery}
              updateUserRolesMutation={updateUserRolesMutation}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              userRolesDraft={userRolesDraft}
              setUserRolesDraft={setUserRolesDraft}
              editingUserId={editingUserId}
              setEditingUserId={setEditingUserId}
            />
          ) : null}

          {activeTab === 'Logs' && isAdmin ? (
            <LogsTab
              webLogsQuery={webLogsQuery}
              logsPage={logsPage}
              setLogsPage={setLogsPage}
            />
          ) : null}
          {activeTab === 'Branch Rep' && isBranchRep ? (
            <div className="space-y-4">
               {/* Sub-tab Navigation */}
               <div className="border-b border-slate-800 flex gap-4">
                  <button className="px-4 py-2 border-b-2 border-emerald-500 text-emerald-400 font-medium text-sm">
                      Branch Rep Access
                  </button>
               </div>

               <BranchEventsTab
                  branchName={branchName ?? undefined}
                  branchEvents={branchEvents}
                  branchEventsLoading={branchEventsQuery.isLoading}
                  branchEventsError={branchEventsQuery.error?.message}
                  organiserSearchTerms={organiserSearchTerms}
                  organiserSearchResults={organiserSearchResults}
                  organiserSearchLoading={organiserSearchLoading}
                  handleOrganiserSearch={handleOrganiserSearch}
                  pendingOrganiser={pendingOrganiser}
                  setPendingOrganiser={setPendingOrganiser}
                  addOrganiserMutation={addOrganiserMutation}
                  removeOrganiserMutation={removeOrganiserMutation}
                />
            </div>
          ) : null}

          {activeTab === 'Doc Access' && isDocumentation ? (
            <DocEventsTab
              events={docEventsQuery.data?.events ?? []}
              eventsLoading={docEventsQuery.isLoading}
              eventsError={docEventsQuery.error?.message}
              branches={branchesQuery.data?.branches ?? []}
              activeEventId={activeDocEventId}
              setActiveEventId={setActiveDocEventId}
              eventDetailsQuery={docEventDetailsQuery}
              eventDrafts={docEventDrafts}
              setActiveEventDraft={setActiveDocEventDraft}
              createEventMutation={createDocEventMutation}
              updateEventMutation={updateDocEventMutation}
              setIsAddEventOpen={setIsDocAddEventOpen}
              isAddEventOpen={isDocAddEventOpen}
            />
          ) : null}

          {activeTab === 'Assign Branch Rep' && isDocumentation ? (
              <DocAssignRepTab />
          ) : null}

          {activeTab === 'Organiser' && isOrganiser && token ? (
             <OrganiserTab token={token} activeEventId={eventId ? Number(eventId) : undefined} />
          ) : null}

          {activeTab === 'Judging' && isJudge ? (
            <JudgingTab />
          ) : null}

        </main>
      </section>
    </div>
  )
}

export default DashboardPage
