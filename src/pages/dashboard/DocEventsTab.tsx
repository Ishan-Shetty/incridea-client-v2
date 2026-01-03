import { useState, useEffect, useMemo } from 'react'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { FiEdit2, FiX, FiAlignLeft, FiCalendar, FiDollarSign, FiUsers, FiSearch } from 'react-icons/fi'
import type {
    DocumentationEvent,
    DocumentationEventDetails,
    CreateDocumentationEventPayload,
    UpdateDocumentationEventPayload,
    Branch,
} from '../../api/documentation'
import { EVENT_TYPES } from '../../api/branchRep'

const EVENT_CATEGORIES = ['TECHNICAL', 'NON_TECHNICAL', 'CORE', 'SPECIAL'] as const
const EVENT_TIERS = ['DIAMOND', 'GOLD', 'SILVER', 'BRONZE'] as const

const PLACEHOLDER_IMAGE = "https://96ivv88bg9.ufs.sh/f/0yks13NtToBipu6eKeTvmnEQxj9Ckq6tA4uGeavWLzMV5woY"


export interface DocEventsTabProps {
    events: DocumentationEvent[]
    eventsLoading: boolean
    eventsError?: string
    branches: Branch[]
    activeEventId: number | null
    setActiveEventId: (id: number | null) => void
    eventDetailsQuery: UseQueryResult<DocumentationEventDetails, Error>
    eventDrafts: Record<number, Partial<DocumentationEventDetails>>
    setActiveEventDraft: (eventId: number, data: Partial<DocumentationEventDetails>) => void
    createEventMutation: UseMutationResult<{ event: DocumentationEvent }, Error, CreateDocumentationEventPayload>
    updateEventMutation: UseMutationResult<{ event: DocumentationEventDetails }, Error, { eventId: number; data: UpdateDocumentationEventPayload }>
    setIsAddEventOpen: (isOpen: boolean) => void
    isAddEventOpen: boolean
}

export default function DocEventsTab({
    events,
    eventsLoading,
    eventsError,
    branches,
    activeEventId,
    setActiveEventId,
    eventDetailsQuery,
    eventDrafts,
    setActiveEventDraft,
    createEventMutation,
    updateEventMutation,
    setIsAddEventOpen,
    isAddEventOpen,
}: DocEventsTabProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [newEventName, setNewEventName] = useState('')
    const [newEventDescription, setNewEventDescription] = useState('')
    const [newEventVenue, setNewEventVenue] = useState('')
    const [newEventFees, setNewEventFees] = useState(0)
    const [newMinTeamSize, setNewMinTeamSize] = useState(1)
    const [newMaxTeamSize, setNewMaxTeamSize] = useState(1)
    const [newMaxTeams, setNewMaxTeams] = useState<string>('')
    const [newEventType, setNewEventType] = useState<DocumentationEventDetails['eventType']>(EVENT_TYPES[0])
    const [newEventCategory, setNewEventCategory] = useState<DocumentationEventDetails['category']>('TECHNICAL')
    const [newEventTier, setNewEventTier] = useState<DocumentationEventDetails['tier']>('GOLD')
    const [newBranchId, setNewBranchId] = useState<number>(0)
    const [newIsBranch, setNewIsBranch] = useState(true)

    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        if (activeEventId) {
            setIsEditing(false)
        }
    }, [activeEventId])

    const resetAddEventForm = () => {
        setNewEventName('')
        setNewEventDescription('')
        setNewEventVenue('')
        setNewEventFees(0)
        setNewMinTeamSize(1)
        setNewMaxTeamSize(1)
        setNewMaxTeams('')
        setNewEventType(EVENT_TYPES[0])
        setNewEventCategory('TECHNICAL')
        setNewEventTier('GOLD')
        setNewBranchId(0)
        setNewIsBranch(true)
    }

    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events
        const lowerQuery = searchQuery.toLowerCase()
        return events.filter(event => 
            event.name.toLowerCase().includes(lowerQuery) ||
            event.branchName.toLowerCase().includes(lowerQuery) ||
            event.eventType.toLowerCase().includes(lowerQuery) ||
            (event.description ?? '').toLowerCase().includes(lowerQuery) ||
            event.category.toLowerCase().includes(lowerQuery) ||
            event.tier.toLowerCase().includes(lowerQuery)
        )
    }, [events, searchQuery])

    const handleCreateEvent = () => {
        if (newIsBranch && !newBranchId) {
            alert('Please select a branch')
            return
        }

        const payload: CreateDocumentationEventPayload = {
            name: newEventName,
            description: newEventDescription || undefined,
            venue: newEventVenue || undefined,
            fees: newEventFees,
            minTeamSize: newMinTeamSize,
            maxTeamSize: newMaxTeamSize,
            maxTeams: newMaxTeams ? Number(newMaxTeams) : undefined,
            eventType: newEventType,
            category: newEventCategory,
            tier: newEventTier,
            branchId: newIsBranch ? newBranchId : null,
            isBranch: newIsBranch,
        }
        createEventMutation.mutate(payload, {
            onSuccess: () => {
                setIsAddEventOpen(false)
                resetAddEventForm()
            }
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const activeEvent = events.find(e => e.id === activeEventId)
    const details = eventDetailsQuery.data

    return (
        <div className="space-y-4">
            {isAddEventOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        onClick={() => setIsAddEventOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-50">Add Event</h3>
                            <button
                                onClick={() => setIsAddEventOpen(false)}
                                className="text-sm text-slate-400 hover:text-slate-200"
                            >
                                <FiX className="text-lg" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-600 focus:ring-sky-500 bg-slate-800"
                                        checked={newIsBranch}
                                        onChange={(e) => setNewIsBranch(e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-300">Is a Branch Event?</span>
                                </label>
                            </div>

                            {newIsBranch && (
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Branch</label>
                                    <select
                                        className="input"
                                        value={newBranchId}
                                        onChange={(e) => setNewBranchId(Number(e.target.value))}
                                    >
                                        <option value={0}>Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
                                <input
                                    className="input"
                                    value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    placeholder="Event Name"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wide text-slate-400">Description</label>
                                <textarea
                                    className="input min-h-20"
                                    value={newEventDescription}
                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                    placeholder="Description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Venue</label>
                                    <input
                                        className="input"
                                        value={newEventVenue}
                                        onChange={(e) => setNewEventVenue(e.target.value)}
                                        placeholder="Venue"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Fees</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newEventFees}
                                        onChange={(e) => setNewEventFees(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Min Team</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min={1}
                                        value={newMinTeamSize}
                                        onChange={(e) => setNewMinTeamSize(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Max Team</label>
                                    <input
                                        type="number"
                                        className="input"
                                        min={1}
                                        value={newMaxTeamSize}
                                        onChange={(e) => setNewMaxTeamSize(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wide text-slate-400">Max Teams</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Optional"
                                    value={newMaxTeams}
                                    onChange={(e) => setNewMaxTeams(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Type</label>
                                    <select
                                        className="input"
                                        value={newEventType}
                                        onChange={(e) => setNewEventType(e.target.value as any)}
                                    >
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-slate-400">Category</label>
                                    <select
                                        className="input"
                                        value={newEventCategory}
                                        onChange={(e) => setNewEventCategory(e.target.value as any)}
                                    >
                                        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wide text-slate-400">Tier</label>
                                <select
                                    className="input"
                                    value={newEventTier}
                                    onChange={(e) => setNewEventTier(e.target.value as any)}
                                >
                                    {EVENT_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="pt-2">
                                <button
                                    className="button w-full justify-center"
                                    onClick={handleCreateEvent}
                                    disabled={createEventMutation.isPending}
                                >
                                    {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            ) : null}

            {/* Search & Actions */}
            <div className="flex flex-wrap items-center gap-3">
                 <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="input pl-10 py-2 w-full text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="ml-auto">
                    <button type="button" className="button" onClick={() => setIsAddEventOpen(true)}>
                        Add Event
                    </button>
                </div>
            </div>

            {eventsLoading ? <p className="text-sm text-slate-400">Loading events…</p> : null}
            {eventsError ? <p className="text-sm text-rose-300">{eventsError}</p> : null}

            {filteredEvents.length === 0 && !eventsLoading ? (
                <p className="text-sm text-slate-300">No events found.</p>
            ) : null}

            <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-200">
                        <tr>
                            <th className="px-4 py-3">Image</th>
                            <th className="px-4 py-3">Event Name</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Tier</th>
                            <th className="px-4 py-3">Branch</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredEvents.map((event) => (
                            <tr key={event.id} className="hover:bg-slate-900/40 transition">
                                <td className="px-4 py-3">
                                    <div className="h-10 w-10 overflow-hidden rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                                        <img
                                            src={event.image || PLACEHOLDER_IMAGE}
                                            alt={event.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-100">{event.name}</td>
                                <td className="px-4 py-3 max-w-xs">
                                   <span className="line-clamp-2" title={event.description || ''}>
                                        {event.description || <span className="text-slate-600 italic">No description</span>}
                                   </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-300 border border-slate-700">
                                        {event.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                     <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                                        event.tier === 'DIAMOND' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' :
                                        event.tier === 'GOLD' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' :
                                        event.tier === 'SILVER' ? 'border-slate-400/30 bg-slate-400/10 text-slate-300' :
                                        'border-orange-700/30 bg-orange-700/10 text-orange-400'
                                    }`}>
                                        {event.tier}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase font-semibold text-slate-200">
                                        {event.isBranch && event.branchName ? event.branchName : '---'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-semibold ${event.published
                                            ? 'border border-emerald-500/60 text-emerald-200'
                                            : 'border border-amber-400/60 bg-amber-400/10 text-amber-100'
                                            }`}
                                    >
                                        {event.published ? 'Published' : 'Unpublished'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                                        onClick={() => setActiveEventId(event.id)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View/Edit Modal */}
            {activeEventId && activeEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setActiveEventId(null)}
                    />
                    <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-slate-100">{activeEvent.name}</h2>
                                {details && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${details.published ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10' : 'border-amber-500/50 text-amber-300 bg-amber-500/10'}`}>
                                        {details.published ? 'Published' : 'Draft'}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                                        title="Edit Event"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveEventId(null)}
                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Close"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {eventDetailsQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <p className="text-slate-400 animate-pulse">Loading details...</p>
                                </div>
                            ) : details ? (
                                isEditing ? (
                                    // Edit Form
                                    <div className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Name */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
                                                <input
                                                    className="input"
                                                    value={eventDrafts[activeEventId]?.name ?? details.name}
                                                    onChange={(ev) => setActiveEventDraft(activeEventId, { name: ev.target.value })}
                                                />
                                            </div>

                                            {/* Venue */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-slate-400">Venue</label>
                                                <input
                                                    className="input"
                                                    value={eventDrafts[activeEventId]?.venue ?? (details.venue ?? '')}
                                                    onChange={(ev) => setActiveEventDraft(activeEventId, { venue: ev.target.value })}
                                                />
                                            </div>

                                            {/* Description */}
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-slate-400">Description</label>
                                                <textarea
                                                    className="input min-h-32"
                                                    value={eventDrafts[activeEventId]?.description ?? (details.description ?? '')}
                                                    onChange={(ev) => setActiveEventDraft(activeEventId, { description: ev.target.value })}
                                                />
                                            </div>

                                            {/* Fees */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-slate-400">Fees</label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    min={0}
                                                    value={eventDrafts[activeEventId]?.fees ?? details.fees}
                                                    onChange={(ev) => setActiveEventDraft(activeEventId, { fees: Number(ev.target.value) })}
                                                />
                                            </div>

                                            {/* Branch */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Branch Event?</label>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500"
                                                        checked={eventDrafts[activeEventId]?.isBranch ?? details.isBranch}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { isBranch: ev.target.checked })}
                                                    />
                                                </div>
                                                {(eventDrafts[activeEventId]?.isBranch ?? details.isBranch) && (
                                                    <select
                                                        className="input"
                                                        value={eventDrafts[activeEventId]?.branchId ?? (details.branchId || 0)}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { branchId: Number(ev.target.value) })}
                                                    >
                                                        <option value={0}>Select Branch</option>
                                                        {branches.map(b => (
                                                            <option key={b.id} value={b.id}>{b.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            {/* Team Size */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Min Members</label>
                                                    <input
                                                        type="number" className="input" min={1}
                                                        value={eventDrafts[activeEventId]?.minTeamSize ?? details.minTeamSize}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { minTeamSize: Number(ev.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Max Members</label>
                                                    <input
                                                        type="number" className="input" min={1}
                                                        value={eventDrafts[activeEventId]?.maxTeamSize ?? details.maxTeamSize}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { maxTeamSize: Number(ev.target.value) })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Max Teams */}
                                            <div className="space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-slate-400">Max Teams Registration</label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    placeholder="Unlimited"
                                                    value={eventDrafts[activeEventId]?.maxTeams ?? details.maxTeams ?? ''}
                                                    onChange={(ev) => setActiveEventDraft(activeEventId, { maxTeams: ev.target.value ? Number(ev.target.value) : null })}
                                                />
                                            </div>

                                            {/* Classifications */}
                                            <div className="grid grid-cols-3 gap-4 md:col-span-2">
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Type</label>
                                                    <select
                                                        className="input"
                                                        value={eventDrafts[activeEventId]?.eventType ?? details.eventType}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { eventType: ev.target.value as any })}
                                                    >
                                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Category</label>
                                                    <select
                                                        className="input"
                                                        value={eventDrafts[activeEventId]?.category ?? details.category}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { category: ev.target.value as any })}
                                                    >
                                                        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wide text-slate-400">Tier</label>
                                                    <select
                                                        className="input"
                                                        value={eventDrafts[activeEventId]?.tier ?? details.tier}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { tier: ev.target.value as any })}
                                                    >
                                                        {EVENT_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Published Toggle */}
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-3 p-4 rounded-lg border border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                                                        checked={eventDrafts[activeEventId]?.published ?? details.published}
                                                        onChange={(ev) => setActiveEventDraft(activeEventId, { published: ev.target.checked })}
                                                    />
                                                    <div>
                                                        <span className="block text-sm font-medium text-slate-200">Publish Event</span>
                                                        <span className="block text-xs text-slate-400">Visible to all users when published</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Edit Actions */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                                            <button
                                                className="button"
                                                onClick={() => {
                                                    const draft = eventDrafts[activeEventId] ?? {}
                                                    const payload: UpdateDocumentationEventPayload = {
                                                        ...draft,
                                                        description: draft.description === null ? undefined : draft.description,
                                                        venue: draft.venue === null ? undefined : draft.venue,
                                                        image: draft.image === null ? undefined : draft.image,
                                                        branchId: draft.isBranch === false ? null : (draft.branchId ?? (details.branchId || undefined)), // If isBranch is false, send null to disconnect
                                                    }
                                                    updateEventMutation.mutate({ eventId: activeEventId, data: payload }, {
                                                        onSuccess: () => setIsEditing(false)
                                                    })
                                                }}
                                                disabled={updateEventMutation.isPending}
                                            >
                                                {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                className="button secondary"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="space-y-8">
                                        {/* Key Details Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Branch</p>
                                                <p className="text-slate-200 font-medium">{details.branchName}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Fees</p>
                                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                                    <FiDollarSign className="text-emerald-400" />
                                                    {formatCurrency(details.fees)}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Team Size</p>
                                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                                    <FiUsers className="text-sky-400" />
                                                    {details.minTeamSize} - {details.maxTeamSize}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Max Teams</p>
                                                <p className="text-slate-200 font-medium">{details.maxTeams ?? 'Unlimited'}</p>
                                            </div>
                                        </div>

                                        {/* Tags Grid */}
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                                                <span className="inline-block px-2 py-1 rounded bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700">
                                                    {details.eventType}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                                                <span className="inline-block px-2 py-1 rounded bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700">
                                                    {details.category}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase tracking-wide text-slate-500">Tier</p>
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                                                    details.tier === 'DIAMOND' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' :
                                                    details.tier === 'GOLD' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' :
                                                    details.tier === 'SILVER' ? 'border-slate-400/30 bg-slate-400/10 text-slate-300' :
                                                    'border-orange-700/30 bg-orange-700/10 text-orange-400'
                                                }`}>
                                                    {details.tier}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description & Venue */}
                                        <div className="space-y-6 pt-6 border-t border-slate-800/50">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                                                    <FiAlignLeft /> Description
                                                </div>
                                                <div className="prose prose-invert prose-sm max-w-none text-slate-300 bg-slate-900/30 p-4 rounded-lg border border-slate-800/50">
                                                    {details.description || <span className="text-slate-600 italic">No description provided.</span>}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                                                    <FiCalendar /> Venue
                                                </div>
                                                <p className="text-slate-300 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 inline-block min-w-[200px]">
                                                    {details.venue || <span className="text-slate-600 italic">No venue assigned.</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

