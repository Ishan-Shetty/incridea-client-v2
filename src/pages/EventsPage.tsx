import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AiOutlineSearch } from 'react-icons/ai'
import { BiCategoryAlt } from 'react-icons/bi'
import { IoCalendarOutline, IoPeopleOutline } from 'react-icons/io5'
import { FiMapPin } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import {
  fetchPublishedEvents,
  type EventDayConfig,
  type PublicEvent,
  type PublicEventCategory,
  type PublicEventType,
  type PublishedEventsResponse,
} from '../api/public'
import { showToast } from '../utils/toast'
import { formatDate } from '../utils/date'

const CATEGORY_FILTERS: (PublicEventCategory | 'ALL')[] = [
  'ALL',
  'TECHNICAL',
  'NON_TECHNICAL',
  'CORE',
  'SPECIAL',
]

const DAY_FILTERS = [
  { label: 'Day 1', key: 'day1' },
  { label: 'Day 2', key: 'day2' },
  { label: 'Day 3', key: 'day3' },
  { label: 'Day 4', key: 'day4' },
] as const

type DayFilterLabel = (typeof DAY_FILTERS)[number]['label'] | 'All'
type EventDayKey = keyof EventDayConfig

function isSameUtcDay(left: Date, right: Date) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  )
}


function formatTeamSize(min: number, max: number) {
  if (min === max) {
    if (min === 1) {
      return 'Solo'
    }
    if (min === 0) {
      return 'Open'
    }
    return `${min} per team`
  }
  return `${min}-${max} per team`
}

function formatEventType(eventType: PublicEventType) {
  if (eventType.includes('MULTIPLE')) {
    return 'Multi-entry'
  }
  return eventType.split('_')[0]?.toLowerCase() === 'team' ? 'Team' : 'Individual'
}

function toSlug(event: PublicEvent) {
  const base = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${base}-${event.id}`
}

function EventCard({ event }: { event: PublicEvent }) {
  const firstRoundWithDate = event.rounds.find((round) => round.date)
  const slug = toSlug(event)

  return (
    <RouterLink
      to={`/events/${slug}`}
      className="card flex flex-col gap-4 p-5 transition hover:border-sky-500/70 hover:shadow-lg hover:shadow-sky-900/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            {event.category.replace('_', ' ')}
          </p>
          <h3 className="text-lg font-semibold text-slate-50">{event.name}</h3>
          {event.description ? (
            <p className="text-sm text-slate-300 line-clamp-2">{event.description}</p>
          ) : null}
        </div>
        {event.image ? (
          <img
            src={event.image}
            alt={event.name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
          <IoCalendarOutline className="text-sky-300" />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Date</p>
            <p className="font-semibold">{formatDate(firstRoundWithDate?.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
          <FiMapPin className="text-emerald-300" size={18} />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Venue</p>
            <p className="font-semibold">{event.venue ?? 'Will be announced'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
          <IoPeopleOutline className="text-amber-300" />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Team</p>
            <p className="font-semibold">
              {formatEventType(event.eventType)} · {formatTeamSize(event.minTeamSize, event.maxTeamSize)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
          <BiCategoryAlt className="text-fuchsia-300" />
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Rounds</p>
            <p className="font-semibold">{event.rounds.length > 0 ? `${event.rounds.length} planned` : 'TBD'}</p>
          </div>
        </div>
      </div>
    </RouterLink>
  )
}

function EventsPage() {
  const [categoryFilter, setCategoryFilter] = useState<(PublicEventCategory | 'ALL')>('ALL')
  const [dayFilter, setDayFilter] = useState<DayFilterLabel>('All')
  const [query, setQuery] = useState('')

  const eventsQuery = useQuery<PublishedEventsResponse, Error>({
    queryKey: ['public-events'],
    queryFn: fetchPublishedEvents,
    staleTime: 5 * 60 * 1000,
  })

  const dayConfig = useMemo<EventDayConfig | undefined>(
    () => eventsQuery.data?.days,
    [eventsQuery.data?.days],
  )
  const events = useMemo<PublicEvent[]>(
    () => eventsQuery.data?.events ?? [],
    [eventsQuery.data?.events],
  )

  useEffect(() => {
    if (eventsQuery.error) {
      const message = eventsQuery.error instanceof Error ? eventsQuery.error.message : 'Unable to load events'
      showToast(message, 'error')
    }
  }, [eventsQuery.error])

  const availableDayFilters = useMemo<DayFilterLabel[]>(() => {
    const labels: DayFilterLabel[] = ['All']
    DAY_FILTERS.forEach(({ label, key }) => {
      if (dayConfig?.[key as EventDayKey]) {
        labels.push(label)
      }
    })
    return labels
  }, [dayConfig])

  useEffect(() => {
    if (!availableDayFilters.includes(dayFilter)) {
      setDayFilter('All')
    }
  }, [availableDayFilters, dayFilter])

  const activeDayKey = useMemo<EventDayKey | null>(() => {
    if (dayFilter === 'All') {
      return null
    }
    const mapping = DAY_FILTERS.find((item) => item.label === dayFilter)
    return mapping ? (mapping.key as EventDayKey) : null
  }, [dayFilter])

  const filteredEvents = useMemo<PublicEvent[]>(() => {
    const searchTerm = query.trim().toLowerCase()

    return events.filter((event) => {
      const matchesQuery = event.name.toLowerCase().includes(searchTerm)
      const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter

      const selectedDayIso = activeDayKey ? dayConfig?.[activeDayKey] ?? null : null
      const matchesDay = !selectedDayIso
        ? true
        : event.rounds.some((round) => {
            if (!round.date) {
              return false
            }
            return isSameUtcDay(new Date(round.date), new Date(selectedDayIso))
          })

      return matchesQuery && matchesCategory && matchesDay
    })
  }, [dayConfig, events, categoryFilter, activeDayKey, query])

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="muted uppercase text-xs">Discover</p>
        <h1 className="text-3xl font-bold text-slate-50">Events</h1>
        <p className="muted">
          Browse published events. Day filters come from the variable table so updates from admin will appear here automatically.
        </p>
      </header>

      <div className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <AiOutlineSearch className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input pl-9"
              placeholder="Search events by name"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  categoryFilter === category
                    ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                    : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600'
                }`}
              >
                {category === 'ALL' ? 'All categories' : category.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableDayFilters.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setDayFilter(label)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                dayFilter === label
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                  : 'border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600'
              }`}
            >
              {label === 'All' ? 'All days' : label}
            </button>
          ))}
          {availableDayFilters.length === 1 ? (
            <p className="text-sm text-slate-400">Day filters will appear when admin sets day variables.</p>
          ) : null}
        </div>
      </div>

      {eventsQuery.isLoading ? (
        <div className="card p-8 text-center text-slate-300">Loading events…</div>
      ) : null}

      {eventsQuery.isError ? (
        <div className="card p-8 text-center text-rose-200">Unable to load events right now.</div>
      ) : null}

      {!eventsQuery.isLoading && filteredEvents.length === 0 ? (
        <div className="card p-8 text-center text-slate-300">No events match the selected filters.</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}

export default EventsPage
