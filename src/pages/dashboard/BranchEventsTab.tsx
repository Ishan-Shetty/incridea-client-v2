import type { Dispatch, SetStateAction } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type {
  BranchRepEvent,
  BranchRepUser,
} from '../../api/branchRep'

export interface BranchEventsTabProps {
  branchName?: string
  branchEvents: BranchRepEvent[]
  branchEventsLoading: boolean
  branchEventsError?: string
  organiserSearchTerms: Record<number, string>
  organiserSearchResults: Record<number, BranchRepUser[]>
  organiserSearchLoading: Record<number, boolean>
  handleOrganiserSearch: (eventId: number, term: string) => Promise<void>
  pendingOrganiser: { eventId: number; user: BranchRepUser } | null
  setPendingOrganiser: Dispatch<SetStateAction<{ eventId: number; user: BranchRepUser } | null>>
  addOrganiserMutation: UseMutationResult<{ organiser: { userId: number } }, Error, { eventId: number; email: string }>
  removeOrganiserMutation: UseMutationResult<unknown, Error, { eventId: number; userId: number }>
}

function BranchEventsTab({
  branchName,
  branchEvents,
  branchEventsLoading,
  branchEventsError,
  organiserSearchTerms,
  organiserSearchResults,
  organiserSearchLoading,
  handleOrganiserSearch,
  pendingOrganiser,
  setPendingOrganiser,
  addOrganiserMutation,
  removeOrganiserMutation,
}: BranchEventsTabProps) {
  const renderOrganiserResults = (eventId: number) => (
    <div className="absolute left-0 right-0 top-full z-10 mt-2 space-y-1 rounded-lg border border-slate-800  p-2 shadow-xl">
      {organiserSearchResults[eventId].map((user) => (
        <button
          key={user.id}
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:"
          onClick={() => setPendingOrganiser({ eventId, user })}
        >
          <div>
            <p className="font-semibold">{user.name ?? 'User'}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-400">Select</span>
        </button>
      ))}
    </div>
  )


  const renderPendingOrganiser = () => {
    if (!pendingOrganiser) {
      return null
    }
    const { user, eventId } = pendingOrganiser
    return (
      <div className="mt-2 flex flex-col gap-2 rounded-lg border border-emerald-700/60  p-3 text-sm text-emerald-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{user.name ?? 'User'}</p>
            <p className="text-xs text-emerald-100">{user.email}</p>
            {user.phoneNumber ? <p className="text-xs text-emerald-200">{user.phoneNumber}</p> : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:"
              onClick={() => addOrganiserMutation.mutate({ eventId, email: user.email })}
              disabled={addOrganiserMutation.isPending}
            >
              {addOrganiserMutation.isPending ? 'Adding…' : 'Confirm'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:"
              onClick={() => setPendingOrganiser(null)}
              disabled={addOrganiserMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-300">Manage the events for your branch.</p>
        {branchName ? (
          <span className="rounded-full border border-emerald-400/50  px-3 py-1 text-xs font-semibold text-emerald-200">
            {branchName}
          </span>
        ) : null}

      </div>

      {branchEventsLoading ? <p className="text-sm text-slate-400">Loading events…</p> : null}
      {branchEventsError ? <p className="text-sm text-rose-300">{branchEventsError}</p> : null}

      {branchEvents.length === 0 ? <p className="text-sm text-slate-300">No events found for your branch.</p> : null}

      <div className="space-y-3">
        {branchEvents.map((event) => (
          <div key={event.id} className="rounded-xl border border-slate-800  p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-100">{event.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200">
                    {event.category}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200">
                    {event.tier}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200">
                     {event.eventType}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      event.published
                        ? 'border border-emerald-500/60  text-emerald-200'
                        : 'border border-amber-400/60 bg-amber-400/10 text-amber-100'
                    }`}
                  >
                    {event.published ? 'Published' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Venue</p>
                    <p className="text-slate-200 font-medium">{event.venue ?? '—'}</p>
                </div>
                <div>
                     <p className="text-xs uppercase tracking-wide text-slate-500">Fees</p>
                     <p className="text-slate-200 font-medium">₹ {event.fees}</p>
                </div>
                <div className="lg:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{event.description ?? '—'}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Team Size</p>
                    <p className="text-slate-200 font-medium">{event.minTeamSize} - {event.maxTeamSize} members</p>
                </div>
                <div>
                     <p className="text-xs uppercase tracking-wide text-slate-500">Max Teams</p>
                     <p className="text-slate-200 font-medium">{event.maxTeams ?? 'Unlimited'}</p>
                </div>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organisers</p>
              {event.organisers.length === 0 ? (
                <p className="text-sm text-slate-300">No organisers yet.</p>
              ) : (
                <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                  {event.organisers.map((organiser) => (
                    <div
                      key={organiser.userId}
                      className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{organiser.name || 'Organiser'}</p>
                        <p className="text-xs text-slate-400">{organiser.email}</p>
                        {organiser.phoneNumber ? (
                          <p className="text-xs text-slate-500">{organiser.phoneNumber}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover: disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => removeOrganiserMutation.mutate({ eventId: event.id, userId: organiser.userId })}
                        disabled={removeOrganiserMutation.isPending}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative mt-2 flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:flex-row sm:items-center">
                <input
                  className="input sm:flex-1"
                  placeholder="Search user by email or name"
                  value={organiserSearchTerms[event.id] ?? ''}
                  onChange={(ev) => {
                    void handleOrganiserSearch(event.id, ev.target.value)
                  }}
                />
                {organiserSearchLoading[event.id] ? (
                  <p className="text-xs text-slate-400">Searching…</p>
                ) : null}

                {organiserSearchResults[event.id]?.length ? renderOrganiserResults(event.id) : null}

                {pendingOrganiser && pendingOrganiser.eventId === event.id ? renderPendingOrganiser() : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BranchEventsTab
