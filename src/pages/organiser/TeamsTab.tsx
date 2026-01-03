import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Team, TeamMember } from '../../api/organiser'
import { createTeam, deleteTeam, addTeamMember, removeTeamMember, searchUsers } from '../../api/organiser'
import { useState } from 'react'
import { showToast } from '../../utils/toast'
import { FiTrash2, FiUserPlus, FiPlus } from 'react-icons/fi'

interface TeamsTabProps {
    eventId: number
    teams: Team[]
    token: string
}

export default function TeamsTab({ eventId, teams, token }: TeamsTabProps) {
    const queryClient = useQueryClient()
    const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
    const [newTeamName, setNewTeamName] = useState('')
    
    // Add member state
    const [addingMemberToTeamId, setAddingMemberToTeamId] = useState<number | null>(null)
    const [userSearchTerm, setUserSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<TeamMember['User'][]>([])

    // Mutations copied from parent
    const createTeamMutation = useMutation({
        mutationFn: (name: string) => createTeam(Number(eventId), { name }, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            setIsCreateTeamOpen(false)
            setNewTeamName('')
            showToast('Team created successfully', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create team', 'error')
    })
  
    const deleteTeamMutation = useMutation({
        mutationFn: (teamId: number) => deleteTeam(teamId, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            showToast('Team deleted', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to delete team', 'error')
    })
  
    const addMemberMutation = useMutation({
        mutationFn: ({ teamId, userId }: { teamId: number, userId: number }) => addTeamMember(teamId, userId, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            setAddingMemberToTeamId(null)
            showToast('Member added', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to add member', 'error')
    })
  
    const removeMemberMutation = useMutation({
        mutationFn: ({ teamId, userId }: { teamId: number, userId: number }) => removeTeamMember(teamId, userId, token!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
            showToast('Member removed', 'success')
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to remove member', 'error')
    })

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault()
        if(newTeamName.trim()) createTeamMutation.mutate(newTeamName)
    }

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                   <h3 className="text-xl font-bold text-white">Teams Management</h3>
                   <p className="text-slate-400 text-sm">Manage items and members directly.</p>
                </div>
                <button 
                  onClick={() => setIsCreateTeamOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                    <FiPlus className="h-4 w-4" /> Create Team
                </button>
            </div>

            <div className="grid gap-6">
                {teams.map((team: Team) => (
                    <div key={team.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">{team.name}</h3>
                            <div className="flex items-center gap-2">
                                 <button onClick={() => setAddingMemberToTeamId(team.id)} className="text-blue-400 hover:text-blue-300 p-2"><FiUserPlus className="h-5 w-5" /></button>
                                 <button onClick={() => { if(confirm('Delete team?')) deleteTeamMutation.mutate(team.id) }} className="text-red-400 hover:text-red-300 p-2"><FiTrash2 className="h-5 w-5" /></button>
                            </div>
                        </div>
      
                        <div className="space-y-2">
                            {team.TeamMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                                    <div>
                                        <p className="font-medium text-slate-200">{member.User.name}</p>
                                        <p className="text-xs text-slate-500">{member.User.email} • {member.User.College.name}</p>
                                    </div>
                                    <button onClick={() => { if(confirm('Remove member?')) removeMemberMutation.mutate({teamId: team.id, userId: member.userId}) }} className="text-slate-500 hover:text-red-400">
                                        <FiTrash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {team.TeamMembers.length === 0 && <p className="text-sm text-slate-500 italic">No members yet.</p>}
                        </div>
      
                         {addingMemberToTeamId === team.id && (
                             <div className="mt-4 border-t border-slate-800 pt-4">
                                 <h4 className="text-sm font-medium text-slate-300 mb-2">Add Member</h4>
                                 <input 
                                      type="text" 
                                      className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-white" 
                                      placeholder="Search by name, email or ID..."
                                      value={userSearchTerm}
                                      onChange={(e) => handleSearchUsers(e.target.value)}
                                 />
                                 {searchResults.length > 0 && (
                                     <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                         {searchResults.map(user => (
                                             <div key={user.id} className="flex items-center justify-between rounded bg-slate-900 p-2 hover:bg-slate-800 cursor-pointer"
                                                  onClick={() => {
                                                      addMemberMutation.mutate({ teamId: team.id, userId: user.id })
                                                      setUserSearchTerm('')
                                                      setSearchResults([])
                                                  }}
                                             >
                                                 <div className="text-sm">
                                                     <p className="text-white">{user.name}</p>
                                                     <p className="text-xs text-slate-500">{user.email}</p>
                                                 </div>
                                                 <FiPlus className="h-4 w-4 text-blue-400" />
                                             </div>
                                         ))}
                                     </div>
                                 )}
                                  <button onClick={() => { setAddingMemberToTeamId(null); setUserSearchTerm(''); setSearchResults([]); }} className="mt-2 text-xs text-slate-500 underline">Cancel</button>
                             </div>
                         )}
                    </div>
                ))}
                {teams.length === 0 && <p className="text-slate-500 text-center py-8">No teams created yet.</p>}
            </div>

            {isCreateTeamOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Create Team</h2>
                        <form onSubmit={handleCreateTeam}>
                            <input 
                              className="w-full mb-4 rounded-lg bg-slate-950 border border-slate-700 p-3 text-white"
                              placeholder="Team Name"
                              value={newTeamName}
                              onChange={e => setNewTeamName(e.target.value)}
                              required
                            />
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCreateTeamOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800">Cancel</button>
                                <button type="submit" disabled={createTeamMutation.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
