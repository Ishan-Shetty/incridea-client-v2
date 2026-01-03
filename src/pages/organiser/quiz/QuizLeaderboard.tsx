import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiCheck, FiX, FiUsers, FiAward } from 'react-icons/fi'
import { getQuizLeaderboard, promoteParticipants } from '../../../api/organiser'
import { showToast } from '../../../utils/toast'
import { useSocket } from '../../../hooks/useSocket'

interface QuizLeaderboardProps {
    eventId: number
    roundNo: number
    quizName: string
    onClose: () => void
}

export default function QuizLeaderboard({ eventId, roundNo, quizName, onClose }: QuizLeaderboardProps) {
    const queryClient = useQueryClient()
    const { socket } = useSocket()

    useEffect(() => {
        if (!socket || !eventId) return
        
        const room = `event-${eventId}`
        socket.emit('join-room', room)

        const handleRefresh = () => {
            queryClient.invalidateQueries({ queryKey: ['quiz-leaderboard', eventId, roundNo] })
        }

        socket.on('REFRESH_LEADERBOARD', handleRefresh)

        return () => {
             socket.emit('leave-room', room)
             socket.off('REFRESH_LEADERBOARD', handleRefresh)
        }
    }, [socket, eventId, roundNo, queryClient])

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set())

    const { data, isLoading } = useQuery({
        queryKey: ['quiz-leaderboard', eventId, roundNo],
        queryFn: () => getQuizLeaderboard(eventId, roundNo, localStorage.getItem('token') || '')
    })

    const promoteMutation = useMutation({
        mutationFn: (teamIds: number[]) => promoteParticipants(eventId, roundNo, teamIds, localStorage.getItem('token') || ''),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['quiz-leaderboard', eventId, roundNo] })
            showToast('Participants promoted successfully', 'success')
            // Don't close immediately? Or refresh?
            // Usually we want to keep it open to see updated state?
            // But here we are promoting to NEXT round.
            // Maybe just clear selection.
            setSelectedTeams(new Set())
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message || 'Failed to promote', 'error')
        }
    })

    const leaderboard = data?.leaderboard || []
    
    // Filter logic
    const filteredLeaderboard = leaderboard.filter(entry => 
        entry.Team.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelect = (teamId: number) => {
        const newSelected = new Set(selectedTeams)
        if (newSelected.has(teamId)) {
            newSelected.delete(teamId)
        } else {
            newSelected.add(teamId)
        }
        setSelectedTeams(newSelected)
    }

    const selectTop = (count: number) => {
        const newSelected = new Set(selectedTeams)
        // Select top N from filtered or all? usually all.
        // The leaderboard is already sorted by backend?
        // Yes, `orderBy: [{ score: 'desc' }, { timeTaken: 'asc' }]`
        leaderboard.slice(0, count).forEach(entry => newSelected.add(entry.Team.id))
        setSelectedTeams(newSelected)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                         <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FiAward className="text-yellow-500" /> Leaderboard
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{quizName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
                        <FiX className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-wrap gap-4 items-center justify-between">
                     <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search teams..." 
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:border-blue-500 outline-none transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => selectTop(5)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700"
                        >
                            Select Top 5
                        </button>
                         <button 
                            onClick={() => selectTop(10)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700"
                        >
                            Select Top 10
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                    {isLoading ? (
                        <div className="flex justify-center py-12 text-slate-500">Loading scores...</div>
                    ) : filteredLeaderboard.length === 0 ? (
                        <div className="space-y-4 text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <FiUsers className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-slate-400">No participants found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 sticky top-0 z-10 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                <tr>
                                    <th className="p-3 w-16">Rank</th>
                                    <th className="p-3">Team</th>
                                    <th className="p-3 text-right">Score</th>
                                    <th className="p-3 text-right">Time</th>
                                    <th className="p-3 text-center w-24">Select</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredLeaderboard.map((entry, index) => (
                                    <tr key={entry.id} className="hover:bg-slate-800/50 transition font-mono">
                                        <td className="p-3 text-slate-400">#{index + 1}</td>
                                        <td className="p-3 font-semibold text-white">{entry.Team.name}</td>
                                        <td className="p-3 text-right text-blue-400">{entry.score}</td>
                                        <td className="p-3 text-right text-slate-400">{entry.timeTaken.toFixed(1)}s</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => handleSelect(entry.Team.id)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                                                    selectedTeams.has(entry.Team.id)
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-slate-600 hover:border-slate-400'
                                                }`}
                                            >
                                                {selectedTeams.has(entry.Team.id) && <FiCheck className="w-3.5 h-3.5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
                    <div className="text-sm text-slate-400">
                        {selectedTeams.size} teams selected
                    </div>
                    <button 
                        onClick={() => promoteMutation.mutate(Array.from(selectedTeams))}
                        disabled={selectedTeams.size === 0 || promoteMutation.isPending}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-lg transition flex items-center gap-2"
                    >
                        {promoteMutation.isPending ? 'Promoting...' : 'Promote Selected'}
                    </button>
                </div>
            </div>
        </div>
    )
}
