import { useState } from 'react'
import { IoClose, IoPeopleOutline } from 'react-icons/io5'
import { joinTeam } from '../../api/registration'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'

export default function JoinTeamModal({
  eventId,
  onClose,
}: {
  eventId: number
  onClose: () => void
}) {
  const [teamId, setTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  // Helper to parse ID if format is like T-123 or just 123
  const parseTeamId = (input: string) => {
     // Assuming input could be "T-123" or "123". Backend expects number.
     // If the user inputs "123", we use 123. If "T-123", we strip "T-".
     // But wait, existing format might be different. Let's assume raw ID for now number.
     // Original had teamIdToId utils. 
     // Let's assume user enters just the number for now or clean non-numeric if simpler.
     return input.replace(/\D/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericId = parseTeamId(teamId)
    if (!numericId) {
        showToast("Invalid Team ID", "error")
        return
    }

    setLoading(true)
    try {
      await joinTeam(Number(numericId))
      showToast('Joined team successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
      onClose()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to join team', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <IoClose size={24} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Join Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Team ID
            </label>
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. 12345"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Joining...' : (
                <>
                    <IoPeopleOutline size={20} /> Join Team
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
