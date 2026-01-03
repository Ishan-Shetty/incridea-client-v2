import { useState } from 'react'
import { IoAddCircleOutline, IoClose } from 'react-icons/io5'
import { createTeam } from '../../api/registration'
import { showToast } from '../../utils/toast'
import { useQueryClient } from '@tanstack/react-query'

export default function CreateTeamModal({
  eventId,
  onClose,
}: {
  eventId: number
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await createTeam(eventId, name)
      showToast('Team created successfully!', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
      onClose()
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create team', 'error')
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
        <h2 className="text-xl font-bold text-white mb-4">Create Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Enter a cool team name"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : (
                <>
                    <IoAddCircleOutline size={20} /> Create Team
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
