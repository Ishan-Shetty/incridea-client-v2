import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { OrganiserEvent } from '../../api/organiser'
import { fetchOrganiserEvents } from '../../api/organiser'
import { FiUsers, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import OrganiserEventDetails from '../organiser/OrganiserEventDetails'

interface OrganiserTabProps {
  token: string
  activeEventId?: number
}

export default function OrganiserTab({ token, activeEventId }: OrganiserTabProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['organiser-events'],
    queryFn: () => fetchOrganiserEvents(token),
    enabled: !!token && !activeEventId, // Disable list fetch if viewing details
  })

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  if (activeEventId) {
      return <OrganiserEventDetails />
  }

  if (isLoading) return <div className="text-slate-400">Loading events...</div>
  if (error) return <div className="text-rose-400">Error loading events</div>

  const events: OrganiserEvent[] = data?.events || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">Organiser Dashboard</h2>
          <p className="text-slate-400">Manage your events and teams</p>
        </div>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          My Details
        </button>
      </div>

      <UpdateProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        token={token} 
      />

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-xl text-slate-400">You are not organizing any events yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/dashboard/organiser/events/${event.id}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-blue-500/50 hover:bg-slate-900/80"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      event.category === 'TECHNICAL' ? 'bg-blue-500/10 text-blue-400' :
                      event.category === 'NON_TECHNICAL' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-slate-700 text-slate-300'
                  }`}>
                    {event.category}
                  </span>
                </div>
                {event.published ? (
                  <span className="flex items-center gap-1 text-xs text-green-400"><FiCheckCircle className="h-3 w-3" /> Published</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-400"><FiXCircle className="h-3 w-3" /> Draft</span>
                )}
              </div>

              <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-blue-400">{event.name}</h3>
              
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4" />
                    <span>{event.venue || 'TBA'}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <FiUsers className="h-4 w-4" />
                    <span>{event._count.Teams} Teams</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateOrganiserProfile } from '../../api/organiser'
import { showToast } from '../../utils/toast'

function UpdateProfileModal({ isOpen, onClose, token }: { isOpen: boolean; onClose: () => void; token: string }) {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('+91 ')

  const mutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string }) => updateOrganiserProfile(data, token),
    onSuccess: () => {
      showToast('Profile updated successfully', 'success')
      onClose()
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update profile', 'error')
    }
  })

  // Prefetch or logic to get existing details? 
  // User didn't specify to prefill, but typically "My Details" should show current. 
  // Since we don't have a specific "get organiser profile" (it is embedded in events usually), and user asked to "store their Name", 
  // I'll start blank or I'd need to fetch user/me or list events to find one. 
  // For now I will assume user enters new details or updates.
  // Actually, I should probably pre-fill if I can.
  // I'll skip pre-fill complexity for now unless I query 'me' endpoint and check `Organisers` array if exposed?
  // `authController` login returns `user` which has `Organisers` array but just boolean usually or simplified structure.
  // Let's implement basics first.

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">My Details</h3>
        <form onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate({ name, phoneNumber })
        }} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input 
              type="text" 
              required
              minLength={2}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
            <input 
              type="tel" 
              required
              pattern="^\+91 [0-9]{10}$"
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value
                if (!val.startsWith('+91 ')) {
                  if (val.startsWith('+91')) {
                     setPhoneNumber('+91 ' + val.slice(3))
                  } else {
                     setPhoneNumber('+91 ')
                  }
                } else {
                   const numberPart = val.slice(4)
                   if (/^\d*$/.test(numberPart) && numberPart.length <= 10) {
                       setPhoneNumber(val)
                   }
                }
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="+91 XXXXX XXXXX"
            />
            <p className="text-xs text-slate-500 mt-1">10 digits</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
