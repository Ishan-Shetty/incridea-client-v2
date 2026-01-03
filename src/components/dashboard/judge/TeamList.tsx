import { useState, useMemo } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import type { Team } from "../../../api/judging";
import { promoteTeam, selectWinner } from "../../../api/judging";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ID } from "../../../utils/id";
import { showToast } from "../../../utils/toast";

interface Props {
  teams: Team[];
  roundNo: number;
  eventId: number;
  eventType: string;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  selectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  finalRound: boolean;
  // winners?: ...
}

export default function TeamList({
  teams,
  roundNo,
  eventId,
  selectedTeam,
  setSelectedTeam,
  selectionMode,
  setSelectionMode,
  finalRound,
}: Props) {
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<"Total Score" | "Your Score">("Your Score");
  const [winnerType, setWinnerType] = useState<"WINNER" | "RUNNER_UP" | "SECOND_RUNNER_UP">("WINNER");

  const queryClient = useQueryClient();

  const promoteMutation = useMutation({
    mutationFn: async ({ teamId, selected }: { teamId: number; selected: boolean }) => {
      return promoteTeam(eventId, roundNo, teamId, selected);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["judge-teams", eventId, roundNo] });
      showToast("Team updated successfully", "success");
    },
    onError: (err) => {
      showToast("Failed to update team", "error");
      console.error(err);
    }
  });

  const winnerMutation = useMutation({
      mutationFn: async ({ teamId, type }: { teamId: number, type: string }) => {
          return selectWinner(eventId, teamId, type)
      },
      onSuccess: () => {
           void queryClient.invalidateQueries({ queryKey: ["judge-teams", eventId, roundNo] }); // and winners
           showToast("Winner selected", "success")
      },
      onError: () => showToast("Failed to select winner", "error")
  })

  const getYourScore = (team: Team) => {
      if (!team.Score) return 0;
      return team.Score.reduce((acc, curr) => acc + Number(curr.score || 0), 0);
  };

  // TODO: Total Score from backend
  const getTotalScore = (team: Team) => getYourScore(team); 

  const filteredTeams = useMemo(() => {
    return teams.filter(() => {
        // Filter logic (e.g. valid for this round?)
        // Assuming API returns valid teams
        return true;
    }).filter(team => 
        team.name.toLowerCase().includes(query.toLowerCase()) || 
        ID.toTeamId(team.id).toLowerCase().includes(query.toLowerCase())
    );
  }, [teams, query]);

  const sortedTeams = useMemo(() => {
      return [...filteredTeams].sort((a, b) => {
          const scoreA = sortField === "Your Score" ? getYourScore(a) : getTotalScore(a);
          const scoreB = sortField === "Your Score" ? getYourScore(b) : getTotalScore(b);
          
          if (sortOrder === "asc") return scoreA - scoreB;
          else return scoreB - scoreA;
      });
  }, [filteredTeams, sortOrder, sortField]);

  // Removed unused variable teamOrParticipant

  return (
    <div className="h-full flex flex-col">
       <div className="sticky top-0 mb-1 flex flex-col md:flex-row justify-between rounded-t-lg bg-slate-800 p-3 shadow-sm gap-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by name or PID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-lg bg-white/20 px-4 pr-16 text-sm ring-white/40 placeholder:text-white/60 focus:outline-none focus:ring-2 text-white"
          />
          <AiOutlineSearch
            size="1.4rem"
            className="absolute right-3 top-2.5 text-white/60"
          />
        </div>
        
        <div className="flex gap-2">
            {selectionMode && (
                <>
                 <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white hover:bg-slate-600 border border-slate-600 text-sm"
                 >
                    {sortOrder === "asc" ? "▲" : "▼"}
                 </button>
                 <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as any)}
                    className="rounded-lg bg-white/20 px-3 py-2 text-white/60 ring-white/40 focus:outline-none focus:ring-2"
                 >
                     <option value="Your Score">Your Score</option>
                     {/* <option value="Total Score">Total Score</option> */}
                 </select>
                </>
            )}

            <button
                onClick={() => setSelectionMode(!selectionMode)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 font-semibold text-white ${selectionMode ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
                {selectionMode ? "Go Back" : "Select"}
            </button>
        </div>
       </div>

       <div className="flex-1 overflow-y-auto px-1">
            {selectionMode && finalRound && (
                <div className="my-3 flex flex-row gap-2">
                     {(["WINNER", "RUNNER_UP", "SECOND_RUNNER_UP"] as const).map(type => (
                         <button
                            key={type}
                            onClick={() => setWinnerType(type)}
                            className={`px-3 py-1 rounded text-sm transition ${type === winnerType ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                         >
                             {type.replace(/_/g, " ")}
                         </button>
                     ))}
                </div>
            )}

            <div className="space-y-2">
                {sortedTeams.map(team => (
                    <div 
                        key={team.id}
                        onClick={() => !selectionMode && setSelectedTeam(team)}
                        className={`p-3 rounded-lg border flex items-center gap-4 cursor-pointer transition ${selectedTeam?.id === team.id ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-800 border-transparent hover:bg-slate-700'}`}
                    >
                        <div className="flex-1">
                            <p className="font-semibold text-white">{team.name}</p>
                            <p className="text-sm text-slate-400">
                                {ID.toTeamId(team.id)}
                            </p>
                        </div>
                        
                        <div className="text-right">
                             <p className="text-xl font-bold text-indigo-400">{getYourScore(team)}</p>
                             <p className="text-xs text-slate-500">Score</p>
                        </div>

                        {selectionMode && (
                            <div onClick={e => e.stopPropagation()}>
                                {finalRound ? (
                                    <button
                                        onClick={() => winnerMutation.mutate({ teamId: team.id, type: winnerType })}
                                        disabled={winnerMutation.isPending}
                                        className="h-8 w-8 flex items-center justify-center rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                ) : (
                                    <input 
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={team.roundNo > roundNo} // Assuming already promoted if roundNo > current
                                        onChange={(e) => promoteMutation.mutate({ teamId: team.id, selected: e.target.checked })}
                                        disabled={promoteMutation.isPending}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {sortedTeams.length === 0 && <p className="text-center text-slate-500 py-10">No teams found</p>}
            </div>
       </div>
    </div>
  );
}
