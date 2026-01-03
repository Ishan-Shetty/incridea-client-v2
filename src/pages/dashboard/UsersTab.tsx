import { useState, type Dispatch, type SetStateAction } from 'react'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { AdminUser, AdminUsersResponse } from '../../api/admin'

export interface UsersTabProps {
  adminUsersQuery: UseQueryResult<AdminUsersResponse, Error>
  adminAccessUsersQuery: UseQueryResult<AdminUsersResponse, Error>
  availableRoles: string[]
  users: AdminUser[]
  accessUsers: AdminUser[]
  userSearchDraft: string
  setUserSearchDraft: Dispatch<SetStateAction<string>>
  setUserSearchTerm: Dispatch<SetStateAction<string>>
  userRolesDraft: Record<number, string[]>
  setUserRolesDraft: Dispatch<SetStateAction<Record<number, string[]>>>
  selectedUser: AdminUser | null
  setSelectedUser: Dispatch<SetStateAction<AdminUser | null>>
  editingUserId: number | null
  setEditingUserId: Dispatch<SetStateAction<number | null>>
  updateUserRolesMutation: UseMutationResult<
    { user: { id: number; roles: string[] }; message: string },
    Error,
    { userId: number; roles: string[] }
  >
}

function UsersTab({
  adminUsersQuery,
  adminAccessUsersQuery,
  availableRoles,
  users,
  accessUsers,
  userSearchDraft,
  setUserSearchDraft,
  setUserSearchTerm,
  userRolesDraft,
  setUserRolesDraft,
  selectedUser,
  setSelectedUser,
  editingUserId,
  setEditingUserId,
  updateUserRolesMutation,
}: UsersTabProps) {
  const isSearching = adminUsersQuery.fetchStatus === 'fetching'
  const shouldShowResults = userSearchDraft.trim().length > 0
  const [isConfirming, setIsConfirming] = useState(false)

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user)
    setEditingUserId(user.id)
    setUserRolesDraft((prev) => ({ ...prev, [user.id]: [...new Set(user.roles)] }))
    setIsConfirming(false)
  }

  const closeRoleModal = () => {
    setSelectedUser(null)
    setEditingUserId(null)
  }

  const toggleRole = (userId: number, role: string) => {
    if (editingUserId !== userId) {
      return
    }
    setUserRolesDraft((prev) => {
      const current = new Set(prev[userId] ?? [])
      if (role !== 'USER') {
        if (current.has(role)) {
          current.delete(role)
        } else {
          current.add(role)
        }
      }
      current.add('USER')
      return { ...prev, [userId]: Array.from(current) }
    })
  }

  const handleSaveRoles = () => {
    if (!editingUserId) return
    const roles = userRolesDraft[editingUserId] ?? ['USER']
    updateUserRolesMutation.mutate({ userId: editingUserId, roles })
    setIsConfirming(false)
    closeRoleModal()
  }

  const renderUserCard = (user: AdminUser) => (
    <button
      key={user.id}
      type="button"
      className="w-full rounded-xl border border-slate-800  p-4 text-left text-slate-100 transition hover:border-sky-400/60"
      onClick={() => openRoleModal(user)}
      disabled={updateUserRolesMutation.isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-slate-100 leading-tight">{user.name ?? 'User'}</p>
          <p className="text-xs text-slate-400 leading-tight">{user.email}</p>
          {user.phoneNumber ? <p className="text-xs text-slate-500 leading-tight">{user.phoneNumber}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(userRolesDraft[user.id] ?? user.roles).map((role: string) => (
            <span
              key={role}
              className="rounded-full border border-slate-700 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200"
            >
              {role}
            </span>
          ))}
          <span className="text-xs font-semibold text-sky-200">Manage roles</span>
        </div>
      </div>
    </button>
  )

  return (
    <div className="space-y-4  text-slate-100">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="userSearch">
          Search users
        </label>
        <input
          id="userSearch"
          className="input"
          placeholder="Type an email to find a user"
          value={userSearchDraft}
          onChange={(event) => setUserSearchDraft(event.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setUserSearchDraft('')
              setUserSearchTerm('')
              setSelectedUser(null)
              setEditingUserId(null)
            }}
            disabled={isSearching}
          >
            Clear
          </button>
          {isSearching && shouldShowResults ? <p className="text-sm text-slate-400">Searching…</p> : null}
        </div>
      </div>

      {adminUsersQuery.isError ? (
        <p className="text-sm text-rose-300">
          {adminUsersQuery.error instanceof Error ? adminUsersQuery.error.message : 'Failed to load users.'}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">Users with access</p>
        {adminAccessUsersQuery.isError ? (
          <p className="text-sm text-rose-300">
            {adminAccessUsersQuery.error instanceof Error
              ? adminAccessUsersQuery.error.message
              : 'Failed to load access users.'}
          </p>
        ) : null}
        {adminAccessUsersQuery.isLoading ? <p className="text-sm text-slate-400">Loading access users…</p> : null}
        {!adminAccessUsersQuery.isLoading && accessUsers.length === 0 ? (
          <p className="text-sm text-slate-300">No elevated users yet.</p>
        ) : null}
        <div className="space-y-3">{accessUsers.map((user) => renderUserCard(user))}</div>
      </div>

      {!shouldShowResults ? <p className="text-sm text-slate-400">Type to search users.</p> : null}

      {adminUsersQuery.isSuccess && shouldShowResults && users.length === 0 ? (
        <p className="text-sm text-slate-300">No users found.</p>
      ) : null}

      <div className="space-y-3">{users.map((user) => renderUserCard(user))}</div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 /90 backdrop-blur-sm"
            onClick={closeRoleModal}
            aria-label="Close role modal"
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800  p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Manage Roles</p>
                <h3 className="text-lg font-semibold text-slate-50">{selectedUser.name ?? 'User'}</h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
                {selectedUser.phoneNumber ? <p className="text-xs text-slate-500">{selectedUser.phoneNumber}</p> : null}
              </div>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                onClick={closeRoleModal}
                disabled={updateUserRolesMutation.isPending}
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              {isConfirming ? (
                 <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
                    <p className="text-yellow-200 font-semibold mb-2">Confirm Role Changes?</p>
                    <p className="text-slate-300 text-sm">
                        Are you sure you want to update the roles for <span className="text-white font-bold">{selectedUser.name}</span>?
                        This will modify their access permissions.
                    </p>
                 </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                 {availableRoles.filter(r => r !== 'PARTICIPANT').map((role: string) => (
                    <label
                    key={`${selectedUser.id}-${role}`}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        (userRolesDraft[selectedUser.id] ?? []).includes(role)
                        ? 'border-sky-400/60 bg-sky-500/10 text-sky-100'
                        : 'border-slate-800 bg-slate-950/40 text-slate-200'
                    } ${role === 'USER' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-sky-400/80'}`}
                    >
                    <input
                        type="checkbox"
                        checked={(userRolesDraft[selectedUser.id] ?? []).includes(role)}
                        onChange={() => toggleRole(selectedUser.id, role)}
                        disabled={role === 'USER' || updateUserRolesMutation.isPending}
                    />
                    <span className="uppercase tracking-wide text-xs font-semibold">{role}</span>
                    {role === 'USER' ? <span className="text-[11px] text-slate-400">Required</span> : null}
                    </label>
                ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="button"
                onClick={() => {
                    if (isConfirming) {
                        handleSaveRoles()
                    } else {
                        setIsConfirming(true)
                    }
                }}
                disabled={updateUserRolesMutation.isPending}
              >
                {updateUserRolesMutation.isPending ? 'Saving…' : isConfirming ? 'Confirm & Save' : 'Save Roles'}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  if (isConfirming) {
                      setIsConfirming(false)
                  } else {
                    setUserRolesDraft((prev) => ({
                        ...prev,
                        [selectedUser.id]: [...new Set(selectedUser.roles)],
                    }))
                    closeRoleModal()
                  }
                }}
                disabled={updateUserRolesMutation.isPending}
              >
                {isConfirming ? 'Back' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default UsersTab
