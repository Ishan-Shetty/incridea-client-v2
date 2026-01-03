import { useState } from 'react'
import { Link } from 'react-router-dom';
import { CiLogin } from "react-icons/ci";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyTeam, registerSoloEvent, confirmTeam, leaveTeam, deleteTeam } from '../../api/registration'
import { showToast } from '../../utils/toast'
import CreateTeamModal from './CreateTeamModal'
import JoinTeamModal from './JoinTeamModal'
import { IoCheckmarkDoneCircle, IoCopyOutline, IoExitOutline, IoPeopleOutline, IoTrashOutline } from 'react-icons/io5'

type EventRegistrationProps = {
  eventId: number;
  type: string;
  fees: number;
};

export default function EventRegistration({ eventId, type, fees }: EventRegistrationProps) {
  const token = localStorage.getItem('token');
  const user = token ? { name: localStorage.getItem('userName'), id: Number(localStorage.getItem('userId')) } : null;
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const { data: team, isLoading } = useQuery({
    queryKey: ['my-team', eventId],
    queryFn: () => getMyTeam(eventId),
    enabled: !!user,
  })

  // Mutations
  const registerSoloMutation = useMutation({
    mutationFn: (eId: number) => registerSoloEvent(eId),
    onSuccess: () => {
      showToast("Registered successfully!", "success")
      queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || "Registration failed", "error")
    }
  })

  const confirmTeamMutation = useMutation({
      mutationFn: (tId: number) => confirmTeam(tId),
      onSuccess: () => {
          showToast("Team confirmed!", "success");
          queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
      },
      onError: (err: any) => {
          showToast(err.response?.data?.message || "Confirmation failed", "error")
      }
  })
  
  const leaveTeamMutation = useMutation({
      mutationFn: (tId: number) => leaveTeam(tId),
      onSuccess: () => {
          showToast("Left team successfully", "success");
          queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
      },
      onError: (err: any) => {
          showToast(err.response?.data?.message || "Failed to leave team", "error")
      }
  })
  
  const deleteTeamMutation = useMutation({
      mutationFn: (tId: number) => deleteTeam(tId),
      onSuccess: () => {
          showToast("Unregistered successfully", "success");
          queryClient.invalidateQueries({ queryKey: ['my-team', eventId] })
      },
      onError: (err: any) => {
          showToast(err.response?.data?.message || "Failed to unregister", "error")
      }
  })

  if (eventId === 51) {
    return (
      <div className="border border-sky-500/50 bg-sky-500/10 p-2.5 px-3 font-semibold italic text-sky-200 flex w-full justify-center rounded-lg backdrop-blur-3xl">
        Exhibition open on all 3 days
      </div>
    );
  }

  if (eventId === 69) {
    return (
      <div className="border border-sky-500/50 bg-sky-500/10 p-2.5 px-3 font-semibold italic text-sm text-sky-200 flex w-full justify-center rounded-lg backdrop-blur-3xl text-center">
        Open to only Faculties and Non Teaching Staff
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        to={`/login?redirectUrl=${encodeURIComponent(`/events/${eventId}`)}`}
        className="w-fit lg:w-full"
      >
        <button className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 capitalize text-white hover:bg-sky-500 transition-colors duration-300">
          <CiLogin className="text-xl" />
          Login to Register
        </button>
      </Link>
    );
  }

  if (isLoading) {
      return <div className="text-center text-slate-400">Loading status...</div>
  }

  // Already registered/in a team
  if (team) {
      const isLeader = team.leaderId === user.id
      return (
          <div className="w-full rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sky-100">{team.name}</h3>
                  {team.confirmed ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                          <IoCheckmarkDoneCircle /> Confirmed
                      </span>
                  ) : (
                      <span className="text-xs text-amber-400 bg-amber-950/30 px-2 py-1 rounded">
                          Not Confirmed
                      </span>
                  )}
              </div>
              
              <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase">Members</p>
                  {team.TeamMembers?.map(member => (
                       <div key={member.userId} className="text-sm text-slate-200 flex justify-between">
                           <span>{member.User?.name || `User ${member.userId}`}</span>
                       </div>
                  ))}
              </div>

              {(fees === 0 || !team.confirmed) && isLeader && (
                  <div className="pt-2">
                       {!team.confirmed && fees > 0 && (
                           <button 
                             className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                             onClick={() => alert("Payment integration pending")}
                           >
                              Pay ₹{fees} to Confirm
                           </button>
                       )}
                       
                       {!team.confirmed && fees === 0 && (
                           <button 
                             className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                             onClick={() => confirmTeamMutation.mutate(team.id)}
                             disabled={confirmTeamMutation.isPending}
                           >
                              {confirmTeamMutation.isPending ? 'Confirming...' : 'Confirm Registration'}
                           </button>
                       )}
                       
                       <button 
                             className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 transition-colors"
                             onClick={() => {
                                 if(confirm("Are you sure you want to unregister/delete team?"))
                                     deleteTeamMutation.mutate(team.id)
                             }}
                             disabled={deleteTeamMutation.isPending}
                        >
                              {deleteTeamMutation.isPending ? 'Unregistering...' : (type.includes('TEAM') ? <><IoTrashOutline/> Delete Team</> : 'Unregister')}
                        </button>
                  </div>
              )}
              
              {(fees === 0 || !team.confirmed) && !isLeader && (
                  <button 
                    onClick={() => leaveTeamMutation.mutate(team.id)}
                    className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 mt-2"
                  >
                     <IoExitOutline /> Leave Team
                  </button>
              )}
              
              {/* Copy Team ID for others to join */}
              {type.includes('TEAM') && (
                  <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded text-xs text-slate-400 mt-2">
                      <span>Team ID: <span className="text-white font-mono">{team.id}</span></span>
                      <button onClick={() => {
                          navigator.clipboard.writeText(String(team.id))
                          showToast('Copied Team ID', 'success')
                      }} title="Copy Team ID">
                          <IoCopyOutline className="hover:text-white" />
                      </button>
                  </div>
              )}
          </div>
      )
  }

  // Not registered
  const isSolo = type === 'INDIVIDUAL' || type === 'INDIVIDUAL_MULTIPLE_ENTRY'

  if (isSolo) {
      return (
          <button 
             className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 capitalize text-white hover:bg-sky-500 transition-colors duration-300"
             onClick={() => registerSoloMutation.mutate(eventId)}
             disabled={registerSoloMutation.isPending}
          >
             {fees > 0 ? `Pay ₹${fees} & Register` : (registerSoloMutation.isPending ? 'Registering...' : 'Register Now')}
          </button>
      )
  }

  return (
    <div className="w-full flex flex-col gap-2">
       <button 
         className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 capitalize text-white hover:bg-sky-500 transition-colors duration-300"
         onClick={() => setShowCreateModal(true)}
       >
         Create Team
       </button>
       <button 
         className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 capitalize text-white hover:bg-slate-700 transition-colors duration-300"
         onClick={() => setShowJoinModal(true)}
       >
         <IoPeopleOutline /> Join Team
       </button>
       
       {showCreateModal && <CreateTeamModal eventId={eventId} onClose={() => setShowCreateModal(false)} />}
       {showJoinModal && <JoinTeamModal eventId={eventId} onClose={() => setShowJoinModal(false)} />}
    </div>
  );
}
