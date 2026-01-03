import { useEffect, useMemo, type ReactElement } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AiOutlineArrowLeft, AiOutlineMail, AiOutlinePhone } from 'react-icons/ai'
import { BiTimeFive } from 'react-icons/bi'
import { BsCalendarDate } from 'react-icons/bs'
import { FiMapPin } from 'react-icons/fi'
import { IoCashOutline, IoInformationOutline, IoPeopleOutline } from 'react-icons/io5'
import {
  fetchPublishedEvent,
  type PublicEventDetail,
  type PublicEventType,
  type PublishedEventResponse,
} from '../api/public'
import { showToast } from '../utils/toast'
import EventRegistration from '../components/events/EventRegistration'
import EventDetails from '../components/events/EventDetails'
import { formatDate as formatDateIST, formatTime } from '../utils/date'

function parseIdFromSlug(slug: string | undefined) {
  if (!slug) {
    return null
  }
  const parts = slug.split('-')
  const maybeId = parts[parts.length - 1]
  const id = Number(maybeId)
  return Number.isFinite(id) ? id : null
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
  return eventType.toLowerCase().startsWith('team') ? 'Team' : 'Individual'
}

function EventDetailPage() {
  const { slug } = useParams()
  const eventId = useMemo(() => parseIdFromSlug(slug), [slug])

  const { data, isLoading, isError, error } = useQuery<PublishedEventResponse, Error>({
    queryKey: ['public-event', eventId],
    queryFn: () => fetchPublishedEvent(eventId ?? 0),
    enabled: eventId !== null,
    staleTime: 5 * 60 * 1000,
  })

  // Toast for error
  useEffect(() => {
    if (error) {
      const message = error instanceof Error ? error.message : 'Unable to load event'
      showToast(message, 'error')
    }
  }, [error])

  // Handle invalid slug or error
  if (eventId === null || (isError && !isLoading)) {
    return (
      <section className="space-y-4 max-w-5xl mx-auto p-4">
        <RouterLink to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200 transition-colors">
          <AiOutlineArrowLeft /> Back to events
        </RouterLink>
        <div className="rounded-lg border border-red-900/50 bg-red-900/20 p-6 text-red-200">
          <h2 className="text-lg font-semibold mb-2">Event Not Found</h2>
          <p>We couldn't find the event you're looking for. It might have been removed or the link is incorrect.</p>
        </div>
      </section>
    )
  }

  // Loading state
  if (isLoading || !data) {
    return (
      <section className="space-y-4 max-w-5xl mx-auto p-4">
         <div className="h-8 w-32 animate-pulse rounded-md bg-slate-800"></div>
         <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 h-64 animate-pulse"></div>
      </section>
    )
  }

  const event: PublicEventDetail = data.event

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 space-y-6 no-scrollbar overflow-y-scroll h-full">
      <RouterLink to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200 transition-colors">
        <AiOutlineArrowLeft /> Back to events
      </RouterLink>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image & Description */}
        <div className="lg:col-span-2 space-y-6">
           <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
             {event.image && (
               <img
                 src={event.image}
                 alt={event.name}
                 className="w-full h-64 sm:h-80 object-cover"
               />
             )}
              <div className="p-6 space-y-4">
                 <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{event.category.replace('_', ' ')}</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">{event.name}</h1>
                 </div>
                 
                 <div className="prose prose-invert prose-slate max-w-none">
                    <EventDetails details={event.description ?? ""} />
                 </div>
              </div>
           </div>

           {/* Schedule Section */}
           <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-50">Schedule</h2>
              {event.rounds.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-slate-400">
                  Round details will be announced soon.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                   {event.rounds.map((round) => (
                    <div key={round.roundNo} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-sm font-semibold text-sky-300 bg-sky-950/30 px-2 py-0.5 rounded">Round {round.roundNo}</span>
                      </div>
                      <div className="space-y-1.5 text-sm text-slate-300">
                        <div className="flex items-center gap-2">
                          <BsCalendarDate className="text-slate-400" />
                          <span>{formatDateIST(round.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BiTimeFive className="text-slate-400" />
                          <span>{round.date ? formatTime(round.date) : 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
           
           {/* Organisers Section */}
           {event.organisers.length > 0 && (
             <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-50">Organisers</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {event.organisers.map((org, idx) => (
                    <div key={`${org.name}-${idx}`} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-2 hover:border-slate-700 transition-colors">
                      <p className="font-semibold text-slate-100">{org.name}</p>
                      <div className="text-sm text-slate-400 space-y-1">
                        {org.email && (
                          <a className="flex items-center gap-2 hover:text-sky-300 transition-colors" href={`mailto:${org.email}`}>
                            <AiOutlineMail /> {org.email}
                          </a>
                        )}
                        {org.phoneNumber && (
                          <a className="flex items-center gap-2 hover:text-sky-300 transition-colors" href={`tel:${org.phoneNumber}`}>
                            <AiOutlinePhone /> {org.phoneNumber}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>

        {/* Right Column: Key Details & Registration */}
        <div className="lg:col-span-1 space-y-6">
           <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-semibold text-slate-50">Key Details</h2>
              
              <div className="space-y-4">
                 <InfoRow 
                    label="Type" 
                    value={`${formatEventType(event.eventType)}`} 
                    subValue={`${formatTeamSize(event.minTeamSize, event.maxTeamSize)}`}
                    icon={<IoPeopleOutline className="text-xl text-sky-400" />} 
                 />
                 <InfoRow 
                    label="Venue" 
                    value={event.venue ?? 'To be announced'} 
                    icon={<FiMapPin className="text-xl text-emerald-400" />} 
                 />
                 <InfoRow 
                    label="Registration Fee" 
                    value={event.fees ? `₹${event.fees}` : 'Free'} 
                    icon={<IoCashOutline className="text-xl text-amber-400" />} 
                 />
                 <InfoRow 
                    label="Capacity" 
                    value={event.maxTeams ? `${event.maxTeams} ${event.eventType.includes('TEAM') ? 'Teams' : 'Participants'}` : 'Unlimited'} 
                    icon={<IoInformationOutline className="text-xl text-purple-400" />} 
                 />
              </div>

              <div className="pt-4 border-t border-slate-800">
                 <EventRegistration 
                    fees={event.fees ?? 0}
                    eventId={event.id}
                    type={event.eventType}
                 />
              </div>
           </div>
        </div>
      </div>
    </section>
  )
}

function InfoRow({
  label,
  value,
  subValue,
  icon,
}: {
  label: string
  value: string | number
  subValue?: string
  icon: ReactElement
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-slate-800/50 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="font-medium text-slate-200">{value}</p>
        {subValue && <p className="text-sm text-slate-400">{subValue}</p>}
      </div>
    </div>
  )
}

export default EventDetailPage
