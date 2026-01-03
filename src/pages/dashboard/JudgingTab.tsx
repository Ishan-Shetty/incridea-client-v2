import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getJudgeRounds, getTeamsByRound } from '../../api/judging'
import type { JudgeRound, Team, Winner } from '../../api/judging'
import TeamList from '../../components/dashboard/judge/TeamList'
import SelectedTeamList from '../../components/dashboard/judge/SelectedTeamList'
import CriteriaList from '../../components/dashboard/judge/CriteriaList'
import apiClient from '../../api/client'

// Need to match V1 winner query, but for now assuming we can fetch winners or selected status.

export default function JudgingTab() {
    const { data: roundsData, isLoading: roundsLoading } = useQuery<{ rounds: JudgeRound[] }>({
        queryKey: ['judge-rounds'],
        queryFn: getJudgeRounds
    })

    const [selectedRound, setSelectedRound] = useState<JudgeRound | null>(null)
    useEffect(() => {
        if (roundsData?.rounds?.length && !selectedRound) {
            setSelectedRound(roundsData.rounds[0])
        }
    }, [roundsData, selectedRound])

    const { data: teamsData } = useQuery<{ teams: Team[] }>({
        queryKey: ['judge-teams', selectedRound?.eventId, selectedRound?.roundNo],
        queryFn: () => getTeamsByRound(selectedRound!.eventId, selectedRound!.roundNo),
        enabled: !!selectedRound
    })

    // Determine if final round?
    // V1 logic: check if next round exists?
    // Or check `roundNo` vs total rounds?
    // `roundsData` has all rounds.
    const isFinalRound = selectedRound ? 
        !roundsData?.rounds.some(r => r.eventId === selectedRound.eventId && r.roundNo > selectedRound.roundNo) 
        : false;

    // Selection Mode
    const [selectionMode, setSelectionMode] = useState(false)

    // TODO: Fetch Winners
    // For now passing empty array
    const winners: Winner[] = teamsData?.teams.flatMap(t => t.Winners || []).map(w => ({ ...w, team: teamsData.teams.find(t => t.id === w.teamId)! || { id: w.teamId, name: '', leaderId: null } })) || []

    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    if (roundsLoading) return <div className="p-10 text-center text-slate-400">Loading rounds...</div>
    if (!roundsData || roundsData.rounds.length === 0) return <div className="p-10 text-center text-slate-400">You are not assigned to any rounds.</div>

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
            {/* Header / Round Selector */}
            <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 border-b border-slate-800">
                {roundsData.rounds.map(round => (
                    <button 
                        key={`${round.eventId}-${round.roundNo}`}
                        onClick={() => { setSelectedRound(round); setSelectedTeam(null); setSelectionMode(false); }}
                        className={`px-4 py-2 rounded-lg border whitespace-nowrap transition ${selectedRound?.eventId === round.eventId && selectedRound.roundNo === round.roundNo ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                    >
                        <span className="font-bold">{round.Event.name}</span>
                        <span className="ml-2 text-sm opacity-80">Round {round.roundNo}</span>
                    </button>
                ))}
            </div>

            {selectedRound && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left: Team List */}
                    <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        <TeamList
                            teams={teamsData?.teams || []}
                            roundNo={selectedRound.roundNo}
                            eventId={selectedRound.eventId}
                            eventType={selectedRound.Event.eventType}
                            selectedTeam={selectedTeam}
                            setSelectedTeam={setSelectedTeam}
                            selectionMode={selectionMode}
                            setSelectionMode={setSelectionMode}
                            finalRound={isFinalRound}
                        />
                    </div>

                    {/* Middle: Scoring or Details */}
                    <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden p-4">
                        {selectedTeam ? (
                            <div className="h-full flex flex-col">
                                <h3 className="text-xl font-bold mb-1">{selectedTeam.name}</h3>
                                <p className="text-slate-400 mb-6 text-sm">{selectedTeam.teamId}</p>
                                
                                <div className="space-y-4 overflow-y-auto flex-1">
                                    {selectedRound.Criteria?.map(crit => (
                                         <div key={crit.id} className="space-y-1">
                                             <label className="text-sm font-medium text-slate-300 flex justify-between">
                                                 {crit.name}
                                                 <span className="text-xs text-slate-500 uppercase">{crit.type}</span>
                                             </label>
                                             <input 
                                                 type={crit.type === 'NUMBER' ? 'number' : 'text'}
                                                 className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                 placeholder="Enter score"
                                                 defaultValue={selectedTeam.Score?.find(s => s.criteriaId === crit.id)?.score || ''}
                                                 onBlur={async (e) => {
                                                     const val = e.target.value;
                                                     if (!val) return; // Don't submit empty?
                                                     try {
                                                         await apiClient.post(`/judge/events/${selectedRound.eventId}/rounds/${selectedRound.roundNo}/score`, {
                                                             teamId: selectedTeam.id,
                                                             criteriaId: crit.id,
                                                             score: val
                                                         });
                                                         // Ideally refetch or update local state
                                                     } catch(err) {
                                                         console.error(err);
                                                         // toast error
                                                     }
                                                 }}
                                             />
                                         </div>
                                    ))}
                                    {(!selectedRound.Criteria || selectedRound.Criteria.length === 0) && (
                                        <p className="text-slate-500 text-center italic">No criteria to judge.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <p>Select a team to start grading.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Selected Teams / Criteria List */}
                    <div className="lg:col-span-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        {selectionMode ? (
                            <SelectedTeamList 
                                teams={teamsData?.teams || []}
                                winners={winners}
                                roundNo={selectedRound.roundNo}
                                eventId={selectedRound.eventId}
                                finalRound={isFinalRound}
                            />
                        ) : (
                            <CriteriaList round={selectedRound} />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
