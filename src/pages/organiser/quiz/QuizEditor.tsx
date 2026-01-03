import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSave, FiArrowLeft, FiSettings, FiPlus } from 'react-icons/fi'
import { createQuiz, updateQuiz, getQuiz, type Question, type CreateQuizPayload, type UpdateQuizPayload } from '../../../api/organiser'
import { showToast } from '../../../utils/toast'
import QuestionEditor from './QuestionEditor'
import { toISTISOString } from '../../../utils/date'
import { useQuery } from '@tanstack/react-query'

interface QuizEditorProps {
    eventId: number
    roundId: number
    token: string
    onClose: () => void
}

export default function QuizEditor({ eventId, roundId, token, onClose }: QuizEditorProps) {
    const queryClient = useQueryClient()
    
    // Fetch existing quiz
    const { data: quizData } = useQuery({
        queryKey: ['quiz', eventId, roundId],
        queryFn: () => getQuiz(eventId, roundId, token),
        retry: false
    })

    const existingQuiz = quizData?.quiz

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [password, setPassword] = useState('')
    const [overridePassword, setOverridePassword] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])

    // Populate form when data loads
    useEffect(() => {
        if (existingQuiz) {
            setName(existingQuiz.name)
            setDescription(existingQuiz.description || '')
            setStartTime(toISTISOString(existingQuiz.startTime))
            setEndTime(toISTISOString(existingQuiz.endTime))
            setPassword(existingQuiz.password || '')
            setOverridePassword(existingQuiz.overridePassword || '')
            setQuestions(existingQuiz.Questions || [])
            console.log('Loaded Existing Quiz:', existingQuiz, {
                start: toISTISOString(existingQuiz.startTime),
                end: toISTISOString(existingQuiz.endTime)
            })
        }
    }, [existingQuiz])

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            id: undefined,
            question: '',
            description: '',
            isCode: false,
            image: '',
            options: [
                { value: '', isAnswer: false },
                { value: '', isAnswer: false },
                { value: '', isAnswer: false },
                { value: '', isAnswer: false }
            ]
        }])
    }

    const handleDeleteQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
        const newQuestions = [...questions]
        newQuestions[index] = updatedQuestion
        setQuestions(newQuestions)
    }

    // Mutations
    const createQuizMutation = useMutation({
        mutationFn: (payload: CreateQuizPayload) => createQuiz(eventId, roundId, payload, token),
        onSuccess: (data, variables) => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             queryClient.invalidateQueries({ queryKey: ['quiz', eventId, roundId] })
             
             if(questions.length > 0) {
                 updateQuizMutation.mutate({
                     ...data.quiz, // use returned quiz details
                     startTime: new Date(data.quiz.startTime).toISOString(),
                     endTime: new Date(data.quiz.endTime).toISOString(),
                     questions: questions,
                     password: variables.password, // re-send password 
                     overridePassword: variables.overridePassword
                 } as UpdateQuizPayload & { id: string })
             } else {
                 showToast('Quiz created', 'success')
                 onClose()
             }
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create quiz', 'error')
    })

    const updateQuizMutation = useMutation({
        mutationFn: (payload: UpdateQuizPayload & { id?: string }) => {
            const id = payload.id || existingQuiz?.id
            if (!id) throw new Error('Quiz ID missing')
            return updateQuiz(eventId, id, payload, token)
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['organiser-event', String(eventId)] })
             showToast('Quiz saved', 'success')
             onClose()
        },
        onError: (err: any) => showToast(err.response?.data?.message || 'Failed to save quiz', 'error')
    })

    const handleSave = () => {
        if (!name || !startTime || !endTime || !password) {
            showToast('Please fill all required fields', 'error')
            return
        }
        
        // Basic validation for questions
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            if (!q.question.trim()) {
                showToast(`Question ${i + 1} text is empty`, 'error')
                return
            }
            if (q.options.length < 2) {
                showToast(`Question ${i + 1} needs at least 2 options`, 'error')
                return
            }
            if (!q.options.some(o => o.isAnswer)) {
                showToast(`Question ${i + 1} needs a correct answer`, 'error')
                return
            }
        }

        const payload = {
            name,
            description,
            // Append +05:30 to treat the input time as IST
            startTime: new Date(`${startTime}:00+05:30`).toISOString(),
            endTime: new Date(`${endTime}:00+05:30`).toISOString(),
            password,
            overridePassword,
            questions
        }
        console.log('Quiz Save Payload:', payload, { inputStartTime: startTime, inputEndTime: endTime })
        showToast(`DEBUG: Sending Start: ${payload.startTime}`, 'info')

        if (existingQuiz) {
            updateQuizMutation.mutate({ ...payload, id: existingQuiz.id })
        } else {
            // For creation, we first create the quiz shell, then update it with questions in onSuccess (or I main change the logic to separate calls manually)
            // But relying on mutations logic above:
            createQuizMutation.mutate(payload)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-800 text-slate-400 hover:text-white">
                        <FiArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{existingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h2>
                        <p className="text-sm text-slate-400">{existingQuiz ? 'Update quiz details and questions' : 'Setup a new quiz for this round'}</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={createQuizMutation.isPending || updateQuizMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                >
                    <FiSave /> {createQuizMutation.isPending || updateQuizMutation.isPending ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FiSettings /> Settings</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Quiz Name</label>
                            <input 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Round 1 Quiz"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                            <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Instructions for participants..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                <input 
                                    type="datetime-local"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                    value={startTime} onChange={e => setStartTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                <input 
                                    type="datetime-local"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                    value={endTime} onChange={e => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                    value={password} onChange={e => setPassword(e.target.value)} placeholder="Secret"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Override Password</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none transition"
                                    value={overridePassword} onChange={e => setOverridePassword(e.target.value)} placeholder="Admin Override"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Panel */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Questions ({questions.length})</h3>
                        <button 
                            onClick={handleAddQuestion}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition"
                        >
                            <FiPlus /> Add Question
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <QuestionEditor 
                                key={idx} 
                                index={idx} 
                                question={q} 
                                onUpdate={(updated) => handleUpdateQuestion(idx, updated)}
                                onDelete={() => handleDeleteQuestion(idx)}
                            />
                        ))}
                    </div>
                    
                    {questions.length === 0 && (
                        <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl border-dashed">
                            <p className="text-slate-500">No questions added yet.</p>
                            <button onClick={handleAddQuestion} className="mt-2 text-blue-400 hover:underline">Add your first question</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
