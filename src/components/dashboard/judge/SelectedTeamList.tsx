import { useMutation, useQueryClient } from "@tanstack/react-query";
import { promoteTeam, deleteWinner } from "../../../api/judging";
import type { Team, Winner } from "../../../api/judging";
import { ID } from "../../../utils/id";
import { showToast } from "../../../utils/toast";
import { AiOutlineClose } from "react-icons/ai";

interface Props {
    teams: Team[];
    winners: Winner[] | undefined;
    roundNo: number;
    eventId: number;
    finalRound: boolean;
}

export default function SelectedTeamList({
    teams,
    winners,
    roundNo,
    eventId,
    finalRound
}: Props) {
    const queryClient = useQueryClient();

    const promoteMutation = useMutation({
        mutationFn: async ({ teamId, selected }: { teamId: number; selected: boolean }) => {
            return promoteTeam(eventId, roundNo, teamId, selected);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["judge-teams", eventId, roundNo] });
            showToast("Team removed from selection", "success");
        },
        onError: () => showToast("Failed to remove team", "error")
    });

    const deleteWinnerMutation = useMutation({
        mutationFn: async (id: number) => {
            return deleteWinner(id)
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["judge-teams", eventId, roundNo] }); // and winners
            showToast("Winner removed", "success")
        },
        onError: () => showToast("Failed to remove winner", "error")
    });

    const selectedTeams = teams.filter(team => team.roundNo > roundNo);

    return (
        <div className="h-full flex flex-col">
            <div className="sticky top-0 mb-2 rounded-t-lg bg-slate-800 px-4 py-3 shadow-sm">
                 <h2 className="text-xl font-semibold text-white">Selected Teams</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 space-y-2">
                 {!finalRound && selectedTeams.length === 0 && (
                     <p className="text-center text-slate-500 py-4">No teams selected for next round.</p>
                 )}

                 {!finalRound && selectedTeams.map(team => (
                     <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-transparent hover:bg-slate-800">
                         <div>
                             <p className="text-white font-medium">{team.name}</p>
                             <p className="text-sm text-slate-400">{ID.toTeamId(team.id)}</p>
                         </div>
                         <button 
                            onClick={() => promoteMutation.mutate({ teamId: team.id, selected: false })}
                            className="p-2 text-slate-400 hover:text-red-400"
                            disabled={promoteMutation.isPending}
                         >
                             <AiOutlineClose />
                         </button>
                     </div>
                 ))}

                 {finalRound && winners?.length === 0 && (
                     <p className="text-center text-slate-500 py-4">No winners selected.</p>
                 )}

                 {finalRound && winners?.map(winner => (
                     <div key={winner.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-transparent hover:bg-slate-800">
                         <div>
                             <p className="text-white font-medium">{winner.team.name}</p>
                             <div className="flex gap-2 text-sm text-slate-400">
                                 <span>{ID.toTeamId(winner.team.id)}</span>
                                 <span>•</span>
                                 <span className="text-indigo-400">{winner.type.replace(/_/g, " ")}</span>
                             </div>
                         </div>
                         <button 
                            onClick={() => deleteWinnerMutation.mutate(winner.id)}
                            className="p-2 text-slate-400 hover:text-red-400"
                            disabled={deleteWinnerMutation.isPending}
                         >
                             <AiOutlineClose />
                         </button>
                     </div>
                 ))}
            </div>
        </div>
    )
}
