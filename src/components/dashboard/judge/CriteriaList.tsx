import type { JudgeRound } from "../../../api/judging";

interface Props {
    round: JudgeRound;
}

export default function CriteriaList({ round }: Props) {
    return (
        <div className="h-full flex flex-col">
             <div className="sticky top-0 mb-2 rounded-t-lg bg-slate-800 px-4 py-3 shadow-sm">
                 <h2 className="text-xl font-semibold text-white">Criteria</h2>
             </div>
             
             <div className="flex-1 overflow-y-auto px-2 space-y-2">
                 {round.Criteria && round.Criteria.length > 0 ? (
                     round.Criteria.map(criteria => (
                         <div key={criteria.id} className="p-3 rounded-lg bg-slate-800/50 border border-transparent">
                             <p className="text-white font-medium">{criteria.name}</p>
                             <p className="text-xs text-slate-400 uppercase">{criteria.type}</p>
                         </div>
                     ))
                 ) : (
                     <p className="text-center text-slate-500 py-4">No criteria defined for this round.</p>
                 )}
             </div>
             
             <div className="mt-4 p-4 border-t border-slate-700">
                 <p className="text-sm text-slate-400">
                     Note: Scoring is done by selecting a team from the list. 
                     Criteria shown here are for reference.
                 </p>
             </div>
        </div>
    )
}
