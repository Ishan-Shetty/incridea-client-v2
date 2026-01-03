import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Round, TeamMember } from '../../api/organiser'
import { createRound, deleteRound, addJudge, removeJudge, addCriteria, deleteCriteria, searchUsers, deleteQuiz } from '../../api/organiser'
import QuizEditor from './quiz/QuizEditor'
import QuizQRCode from './quiz/QuizQRCode'
import QuizLeaderboard from './quiz/QuizLeaderboard'
import { showToast } from '../../utils/toast'
import { FiPlus, FiTrash2, FiUserPlus } from 'react-icons/fi'

interface RoundsTabProps {
    eventId: number
    rounds: Round[]
    token: string
}

export default function RoundsTab({ eventId, rounds, token }: RoundsTabProps) {
    const queryClient = useQueryClient()
    const [selectedRoundIndex, setSelectedRoundIndex] = useState(0)

    // Judge Add State
    const [isAddJudgeOpen, setIsAddJudgeOpen] = useState(false)
    const [userSearchTerm, setUserSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<TeamMember['User'][]>([])

    // Quiz Editor State
    const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false)
    const [isQuizQROpen, setIsQuizQROpen] = useState(false)
    const [isQuizLeaderboardOpen, setIsQuizLeaderboardOpen] = useState(false)

    // Criteria Add State
    const [isAddCriteriaOpen, setIsAddCriteriaOpen] = useState(false)
    const [newCriteriaName, setNewCriteriaName] = useState('')
    const [newCriteriaType, setNewCriteriaType] = useState('NUMBER')

    // Derived current round
    const currentRound = rounds[selectedRoundIndex]

    // Mutations
    const createRoundMutation = useMutation({
        mutationFn: () => createRound(eventId, token),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             showToast('Round created', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create round', 'error')
    })

    const deleteRoundMutation = useMutation({
        mutationFn: (roundNo: number) => deleteRound(eventId, roundNo, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            if (selectedRoundIndex > 0) setSelectedRoundIndex(selectedRoundIndex - 1)
            showToast('Round deleted', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete round', 'error')
    })
    
    // Judge Mutations
    const addJudgeMutation = useMutation({
        mutationFn: (userId: number) => addJudge(eventId, currentRound.roundNo, userId, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            setIsAddJudgeOpen(false)
            setSearchResults([])
            setUserSearchTerm('')
            showToast('Judge added', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to add judge', 'error')
    })

    const removeJudgeMutation = useMutation({
        mutationFn: (userId: number) => removeJudge(eventId, currentRound.roundNo, userId, token),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             showToast('Judge removed', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to remove judge', 'error')
    })

    // Criteria Mutations
    const addCriteriaMutation = useMutation({
        mutationFn: () => addCriteria(eventId, currentRound.roundNo, { name: newCriteriaName, type: newCriteriaType }, token),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             setIsAddCriteriaOpen(false)
             setNewCriteriaName('')
             showToast('Criteria added', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to add criteria', 'error')
    })

    const deleteCriteriaMutation = useMutation({
        mutationFn: (id: number) => deleteCriteria(eventId, currentRound.roundNo, id, token),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             showToast('Criteria deleted', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete criteria', 'error')
    })

    const deleteQuizMutation = useMutation({
        mutationFn: (quizId: string) => deleteQuiz(eventId, quizId, token),
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             showToast('Quiz deleted', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete quiz', 'error')
    })


    const handleSearchUsers = async (query: string) => {
        setUserSearchTerm(query)
        if(query.length > 2) {
            try {
                const res = await searchUsers(query, token!)
                setSearchResults(res.users)
            } catch(e) { console.error(e) }
        } else {
              setSearchResults([])
        }
    }

    const handleAddCriteria = (e: React.FormEvent) => {
        e.preventDefault()
        if(newCriteriaName) addCriteriaMutation.mutate()
    }

    if (isQuizEditorOpen) {
        return <QuizEditor eventId={eventId} roundId={currentRound.roundNo} token={token} onClose={() => setIsQuizEditorOpen(false)} />
    }

    return (
        <div className="space-y-6">
            {isQuizQROpen && currentRound.Quiz && (
                <QuizQRCode 
                    quizId={currentRound.Quiz.id} 
                    quizName={currentRound.Quiz.name} 
                    onClose={() => setIsQuizQROpen(false)} 
                />
            )}
            {isQuizLeaderboardOpen && currentRound.Quiz && (
                <QuizLeaderboard
                    eventId={eventId}
                    roundNo={currentRound.roundNo}
                    quizName={currentRound.Quiz.name}
                    onClose={() => setIsQuizLeaderboardOpen(false)}
                />
            )}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                    <h3 className="text-xl font-bold text-white">Rounds Management</h3>
                    <p className="text-slate-400 text-sm">Configure rounds, judges, and criteria.</p>
                </div>
                 <button 
                  onClick={() => createRoundMutation.mutate()}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={createRoundMutation.isPending}
                >
                    <FiPlus className="h-4 w-4" /> Add Round
                </button>
            </div>

            {rounds.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No rounds created yet. Add a round to get started.</div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Round Tabs Sidebar */}
                    <div className="lg:w-64 space-y-2">
                        {rounds.map((round, idx) => (
                            <button
                                key={round.roundNo}
                                onClick={() => setSelectedRoundIndex(idx)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                    idx === selectedRoundIndex 
                                    ? 'bg-blue-600/20 border-blue-500 text-white' 
                                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Round {round.roundNo}</span>
                                    {round.completed && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Done</span>}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-6">
                        {/* Round Header */}
                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                            <h2 className="text-2xl font-bold text-white">Round {currentRound.roundNo}</h2>
                            <button 
                                onClick={() => { if(confirm('Delete round? This cannot be undone.')) deleteRoundMutation.mutate(currentRound.roundNo) }}
                                className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm"
                            >
                                <FiTrash2 /> Delete Round
                            </button>
                        </div>

                        {/* Quiz Management */}
                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Quiz</h3>
                                    <p className="text-sm text-slate-400">Manage quiz for this round.</p>
                                </div>
                             </div>
                             {currentRound.Quiz ? (
                                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg">
                                     <div>
                                        <p className="text-white font-bold">{currentRound.Quiz.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {currentRound.Quiz.completed ? 'Completed' : 'Active'} • {currentRound.Quiz.allowAttempts ? 'Attempts Allowed' : 'No Attempts'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsQuizQROpen(true)} className="text-purple-400 hover:text-purple-300 text-sm">QR Code</button>
                                        <button onClick={() => setIsQuizLeaderboardOpen(true)} className="text-green-400 hover:text-green-300 text-sm">Leaderboard</button>
                                        <button onClick={() => setIsQuizEditorOpen(true)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                                        <button onClick={() => { if(confirm('Delete quiz?')) deleteQuizMutation.mutate(currentRound.Quiz!.id) }} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                    </div>
                                </div>
                             ) : (
                                <button onClick={() => setIsQuizEditorOpen(true)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                                    <FiPlus /> Create Quiz
                                </button>
                             )}
                        </div>

                        {/* Judges Section */}
                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Judges</h3>
                                    <p className="text-sm text-slate-400">Judges assigned to this round.</p>
                                </div>
                                <button onClick={() => setIsAddJudgeOpen(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"><FiPlus /> Add Judge</button>
                             </div>

                             <div className="space-y-2">
                                 {currentRound.Judges?.map(judge => (
                                     <div key={judge.userId} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                         <div>
                                             <p className="text-white font-medium">{judge.User.name}</p>
                                             <p className="text-xs text-slate-500">{judge.User.email}</p>
                                         </div>
                                         <button onClick={() => removeJudgeMutation.mutate(judge.userId)} className="text-slate-500 hover:text-red-400"><FiTrash2 /></button>
                                     </div>
                                 ))}
                                 {(!currentRound.Judges || currentRound.Judges.length === 0) && <p className="text-slate-500 text-sm italic">No judges added.</p>}
                             </div>

                             {isAddJudgeOpen && (
                                 <div className="mt-4 pt-4 border-t border-slate-800">
                                     <h4 className="text-sm font-medium text-slate-300 mb-2">Search User</h4>
                                     <input 
                                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm"
                                          placeholder="Search name/email..."
                                          value={userSearchTerm}
                                          onChange={e => handleSearchUsers(e.target.value)}
                                     />
                                     <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                         {searchResults.map(user => (
                                             <div key={user.id} 
                                                className="flex justify-between items-center p-2 hover:bg-slate-800 rounded cursor-pointer"
                                                onClick={() => addJudgeMutation.mutate(user.id)}
                                             >
                                                 <div className="text-sm">
                                                     <p className="text-white">{user.name}</p>
                                                     <p className="text-xs text-slate-500">{user.email}</p>
                                                 </div>
                                                 <FiUserPlus className="text-blue-400" />
                                             </div>
                                         ))}
                                     </div>
                                      <button onClick={() => { setIsAddJudgeOpen(false); setUserSearchTerm(''); setSearchResults([]) }} className="mt-2 text-xs text-slate-500 underline">Cancel</button>
                                 </div>
                             )}
                        </div>

                        {/* Criteria Section */}
                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800">
                             <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Scoring Criteria</h3>
                                    <p className="text-sm text-slate-400">Parameters for judging.</p>
                                </div>
                                <button onClick={() => setIsAddCriteriaOpen(true)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"><FiPlus /> Add Criteria</button>
                             </div>

                             <div className="space-y-2">
                                 {currentRound.Criteria?.map(crit => (
                                     <div key={crit.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                                         <div>
                                             <p className="text-white font-medium">{crit.name}</p>
                                             <p className="text-xs text-slate-500">{crit.type}</p>
                                         </div>
                                         <button onClick={() => deleteCriteriaMutation.mutate(crit.id)} className="text-slate-500 hover:text-red-400"><FiTrash2 /></button>
                                     </div>
                                 ))}
                                 {(!currentRound.Criteria || currentRound.Criteria.length === 0) && <p className="text-slate-500 text-sm italic">No criteria added.</p>}
                             </div>

                             {isAddCriteriaOpen && (
                                 <form onSubmit={handleAddCriteria} className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                                     <input 
                                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm"
                                          placeholder="Criteria Name"
                                          value={newCriteriaName}
                                          onChange={e => setNewCriteriaName(e.target.value)}
                                          required
                                     />
                                     <select 
                                        className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm"
                                        value={newCriteriaType}
                                        onChange={e => setNewCriteriaType(e.target.value)}
                                     >
                                         <option value="NUMBER">Number (Score)</option>
                                         <option value="TIME">Time</option>
                                         <option value="TEXT">Text</option>
                                     </select>
                                     <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-500">Add</button>
                                     <button type="button" onClick={() => setIsAddCriteriaOpen(false)} className="text-slate-500 px-2 hover:text-white">Cancel</button>
                                 </form>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
