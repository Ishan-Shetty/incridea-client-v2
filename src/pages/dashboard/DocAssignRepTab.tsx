import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { 
    addBranchRep, 
    createBranch, 
    deleteBranch, 
    fetchBranches, 
    removeBranchRep, 
    searchDocumentationUsers,
    type DocumentationUser
} from '../../api/documentation'
import { showToast } from '../../utils/toast'
import { FiPlus, FiSearch, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi'

export default function DocAssignRepTab() {
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
    const [userSearchQuery, setUserSearchQuery] = useState('')
    const [userSearchResults, setUserSearchResults] = useState<DocumentationUser[]>([])
    const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)
    const [newBranchName, setNewBranchName] = useState('')

    const branchesQuery = useQuery({
        queryKey: ['documentation-branches'],
        queryFn: () => {
             const token = localStorage.getItem('token')
             if (!token) throw new Error('No token')
             return fetchBranches(token)
        }
    })

    const createBranchMutation = useMutation({
        mutationFn: (name: string) => {
             const token = localStorage.getItem('token')
             if (!token) throw new Error('No token')
             return createBranch(name, token)
        },
        onSuccess: () => {
            showToast('Branch created', 'success')
            setIsAddBranchOpen(false)
            setNewBranchName('')
            void branchesQuery.refetch()
        },
        onError: (err) => showToast(err.message, 'error')
    })

    const deleteBranchMutation = useMutation({
        mutationFn: (branchId: number) => {
             const token = localStorage.getItem('token')
             if (!token) throw new Error('No token')
             return deleteBranch(branchId, token)
        },
        onSuccess: () => {
            showToast('Branch deleted', 'success')
            if (selectedBranchId) setSelectedBranchId(null)
            void branchesQuery.refetch()
        },
        onError: (err) => showToast(err.message, 'error')
    })

    const addRepMutation = useMutation({
        mutationFn: ({ branchId, email }: { branchId: number; email: string }) => {
             const token = localStorage.getItem('token')
             if (!token) throw new Error('No token')
             return addBranchRep(branchId, email, token)
        },
        onSuccess: () => {
            showToast('Branch rep added', 'success')
            setUserSearchQuery('')
            setUserSearchResults([])
            void branchesQuery.refetch()
        },
        onError: (err) => showToast(err.message, 'error')
    })

    const removeRepMutation = useMutation({
        mutationFn: ({ branchId, userId }: { branchId: number; userId: number }) => {
             const token = localStorage.getItem('token')
             if (!token) throw new Error('No token')
             return removeBranchRep(branchId, userId, token)
        },
        onSuccess: () => {
            showToast('Branch rep removed', 'success')
            void branchesQuery.refetch()
        },
        onError: (err) => showToast(err.message, 'error')
    })

    const handleUserSearch = async (query: string) => {
        setUserSearchQuery(query)
        if (query.trim().length < 2) {
            setUserSearchResults([])
            return
        }
        try {
            const token = localStorage.getItem('token')
            if (token) {
                const { users } = await searchDocumentationUsers(query, token)
                setUserSearchResults(users)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const branches = branchesQuery.data?.branches ?? []
    const selectedBranch = branches.find(b => b.id === selectedBranchId)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Left Column: Branch List */}
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-200">Branches</h3>
                    <button 
                        onClick={() => setIsAddBranchOpen(true)}
                        className="text-emerald-400 hover:text-emerald-300 transition p-1"
                        title="Add Branch"
                    >
                        <FiPlus size={20} />
                    </button>
                 </div>

                 {/* Add Branch Input */}
                 {isAddBranchOpen && (
                     <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                         <input 
                            type="text"
                            placeholder="Branch Name"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                         />
                         <div className="flex gap-2">
                             <button
                                onClick={() => createBranchMutation.mutate(newBranchName)}
                                disabled={!newBranchName.trim() || createBranchMutation.isPending}
                                className="flex-1 bg-emerald-500/10 text-emerald-400 text-xs py-1 rounded hover:bg-emerald-500/20"
                             >
                                Create
                             </button>
                             <button
                                onClick={() => setIsAddBranchOpen(false)}
                                className="flex-1 bg-slate-800 text-slate-400 text-xs py-1 rounded hover:bg-slate-700"
                             >
                                Cancel
                             </button>
                         </div>
                     </div>
                 )}

                 <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                     {branches.map(branch => (
                         <div 
                            key={branch.id} 
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between group ${
                                selectedBranchId === branch.id 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                         >
                             <div>
                                 <p className={`font-medium ${selectedBranchId === branch.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                                     {branch.name}
                                 </p>
                                 <p className="text-xs text-slate-500">{branch.reps.length} Reps</p>
                             </div>
                             
                             {/* Delete Branch Button (Only visible on hover or selected) */}
                             <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Delete branch ${branch.name}? This cannot be undone.`)) {
                                        deleteBranchMutation.mutate(branch.id)
                                    }
                                }}
                                className={`text-slate-600 hover:text-rose-400 transition p-1 ${selectedBranchId === branch.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                             >
                                 <FiTrash2 />
                             </button>
                         </div>
                     ))}
                     {branches.length === 0 && !branchesQuery.isLoading && (
                         <p className="text-sm text-slate-500 text-center py-4">No branches found.</p>
                     )}
                 </div>
            </div>

            {/* Right Column: Branch Details & Rep Management */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 min-h-[400px]">
                {selectedBranch ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">{selectedBranch.name}</h2>
                            <p className="text-sm text-slate-400">Manage Branch Representatives</p>
                        </div>

                        {/* Add Rep Search */}
                        <div className="relative max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Search user by name or email..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                                value={userSearchQuery}
                                onChange={(e) => handleUserSearch(e.target.value)}
                            />
                            {userSearchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                    {userSearchResults.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => addRepMutation.mutate({ branchId: selectedBranch.id, email: user.email })}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-800 transition flex items-center justify-between group border-b border-slate-800 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm text-slate-200 font-medium">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                            <FiUserPlus className="text-slate-600 group-hover:text-emerald-400 transition" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reps List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Current Representatives</h3>
                            {selectedBranch.reps.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {selectedBranch.reps.map(rep => (
                                        <div key={rep.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{rep.name}</p>
                                                <p className="text-xs text-slate-500">{rep.email}</p>
                                                <p className="text-xs text-slate-600">{rep.phoneNumber}</p>
                                            </div>
                                            <button 
                                                onClick={() => removeRepMutation.mutate({ branchId: selectedBranch.id, userId: rep.userId })}
                                                className="text-slate-600 hover:text-rose-400 p-2 transition"
                                                title="Remove Rep"
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-slate-800 rounded-lg text-center">
                                    <p className="text-slate-500 text-sm">No representatives assigned to this branch yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <p>Select a branch to manage representatives</p>
                    </div>
                )}
            </div>
        </div>
    )
}
