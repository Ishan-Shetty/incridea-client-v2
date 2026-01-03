import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchOrganiserEventDetails } from '../../api/organiser'
import { useState } from 'react'
import TeamsTab from './TeamsTab'
import RoundsTab from './RoundsTab'

export default function OrganiserEventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const [token] = useState<string | null>(() => localStorage.getItem('token'))
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAMS' | 'ROUNDS'>('OVERVIEW')

  const { data, isLoading, error } = useQuery({
    queryKey: ['organiser-event', eventId],
    queryFn: () => fetchOrganiserEventDetails(Number(eventId), token!),
    enabled: !!token && !!eventId,
  })

  if (isLoading) return <div className="p-8 text-white">Loading...</div>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error) return <div className="p-8 text-red-500">Error: {(error as any).message}</div>
  if (!data?.event) return <div className="p-8 text-white">Event not found</div>

  const event = data.event

  return (
    <div className="min-h-screen px-4 py-8 text-slate-100 lg:px-8">
      {/* Header */}
      <div className="mb-6">
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white mb-2 block">&larr; Back to Dashboard</Link>
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white">{event.name}</h1>
                <p className="text-slate-400">{event.category} Event</p>
            </div>
             <div className="flex gap-4 text-sm text-slate-400">
                <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    <span className="block text-xs text-slate-500 uppercase font-bold">Teams</span>
                    <span className="text-white font-bold text-lg">{event.Teams.length}</span>
                </div>
                 <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    <span className="block text-xs text-slate-500 uppercase font-bold">Rounds</span>
                    <span className="text-white font-bold text-lg">{event.Rounds.length}</span>
                </div>
            </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-6">
        <div className="flex gap-6">
            <button 
                onClick={() => setActiveTab('OVERVIEW')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'OVERVIEW' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveTab('TEAMS')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'TEAMS' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                Teams
            </button>
            <button 
                onClick={() => setActiveTab('ROUNDS')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ROUNDS' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
                Rounds
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
          {activeTab === 'OVERVIEW' && (
              <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                          <h3 className="text-xl font-bold text-white mb-4">Event Details</h3>
                          <dl className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                  <dt className="text-slate-400">Category</dt>
                                  <dd className="text-slate-200">{event.category}</dd>
                              </div>
                               <div className="flex justify-between">
                                  <dt className="text-slate-400">Venue</dt>
                                  <dd className="text-slate-200">TBA</dd> 
                              </div>
                               <div className="flex justify-between">
                                  <dt className="text-slate-400">Fees</dt>
                                  <dd className="text-slate-200">Free</dd>
                              </div>
                          </dl>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'TEAMS' && (
              <TeamsTab eventId={Number(eventId)} teams={event.Teams} token={token!} />
          )}

          {activeTab === 'ROUNDS' && (
              <RoundsTab eventId={Number(eventId)} rounds={event.Rounds} token={token!} />
          )}
      </div>
    </div>
  )
}
