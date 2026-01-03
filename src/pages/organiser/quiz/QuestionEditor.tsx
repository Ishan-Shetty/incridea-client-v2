import { useState } from 'react'
import { FiTrash2, FiCode, FiImage, FiCheck } from 'react-icons/fi'
import type { Question } from '../../../api/organiser'

interface QuestionEditorProps {
    index: number
    question: Question
    onUpdate: (q: Question) => void
    onDelete: () => void
}

export default function QuestionEditor({ index, question, onUpdate, onDelete }: QuestionEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    const handleOptionChange = (optIndex: number, value: string) => {
        const newOptions = [...question.options]
        newOptions[optIndex] = { ...newOptions[optIndex], value }
        onUpdate({ ...question, options: newOptions })
    }

    const handleCorrectAnswerChange = (optIndex: number) => {
        const newOptions = question.options.map((opt, i) => ({
            ...opt,
            isAnswer: i === optIndex
        }))
        onUpdate({ ...question, options: newOptions })
    }

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all">
            <div 
                className="flex items-center justify-between p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <span className="bg-slate-700 text-slate-300 font-bold w-8 h-8 flex items-center justify-center rounded-lg">
                        {index + 1}
                    </span>
                    <span className="font-medium text-white truncate max-w-md">
                        {question.question || <span className="text-slate-500 italic">New Question</span>}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {question.isCode && <FiCode className="text-purple-400" />}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete() }}
                        className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-6 space-y-6 border-t border-slate-800">
                    {/* Question Text */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Question Text</label>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition"
                            rows={2}
                            value={question.question}
                            onChange={(e) => onUpdate({ ...question, question: e.target.value })}
                            placeholder="Enter question here..."
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-400">Options</label>
                        <div className="grid md:grid-cols-2 gap-4">
                            {question.options.map((opt, i) => (
                                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${opt.isAnswer ? 'border-green-500/50 bg-green-500/5' : 'border-slate-800 bg-slate-950'}`}>
                                    <button
                                        onClick={() => handleCorrectAnswerChange(i)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                                            opt.isAnswer 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-slate-600 hover:border-slate-500 text-transparent'
                                        }`}
                                        title="Mark as correct answer"
                                    >
                                        <FiCheck className="w-3 h-3" />
                                    </button>
                                    <input 
                                        className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt.value}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Extra Settings */}
                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="checkbox" 
                                checked={question.isCode}
                                onChange={(e) => onUpdate({ ...question, isCode: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-offset-slate-900"
                            />
                            <span className="text-sm text-slate-400 group-hover:text-white transition">Code Question</span>
                        </label>

                         {/* Image URL (Simplified for now, could be upload) */}
                         <div className="flex-1">
                             <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition">
                                <FiImage className="text-slate-500" />
                                <input 
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-600"
                                    placeholder="Image URL (optional)"
                                    value={question.image || ''}
                                    onChange={(e) => onUpdate({ ...question, image: e.target.value })}
                                />
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    )
}
