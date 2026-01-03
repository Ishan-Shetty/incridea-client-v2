import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FiClock, FiCheck, FiAlertCircle, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { showToast } from '../utils/toast'
import { getPublicQuiz, submitQuizAnswer, finishQuiz, startQuiz, type PublicQuizQuestion } from '../api/quiz'
import { useSocket } from '../hooks/useSocket'

export default function QuizPage() {
    const { quizId } = useParams<{ quizId: string }>()
    const navigate = useNavigate()
    const [hasStarted, setHasStarted] = useState(false)
    const [stopwatch, setStopwatch] = useState('00:00:00')
    const [attemptStartTime, setAttemptStartTime] = useState<Date | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
    const [timeLeft, setTimeLeft] = useState<string>('')
    const [isFinished, setIsFinished] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-quiz', quizId],
        queryFn: () => getPublicQuiz(quizId!),
        enabled: !!quizId,
        retry: false
    })

    const quiz = data?.quiz

    // Initialize state from fetched quiz
    useEffect(() => {
        if (quiz?.attemptStartTime) {
            setHasStarted(true)
            setAttemptStartTime(new Date(quiz.attemptStartTime))
        }
    }, [quiz])

    const { socket } = useSocket()

    useEffect(() => {
        if (!quiz?.teamId || !socket) return

        const room = `team-${quiz.teamId}`
        socket.emit('join-room', room)

        const handleQuizStarted = (data: { quizId: string; attemptStartTime: string }) => {
            if (data.quizId === quizId) {
                showToast('Quiz started by your team!', 'info')
                setAttemptStartTime(new Date(data.attemptStartTime))
                setHasStarted(true)
            }
        }

        const handleQuizFinished = (data: { quizId: string; score: number }) => {
            if (data.quizId === quizId) {
                showToast('Quiz submitted by your team!', 'info')
                setIsFinished(true)
            }
        }

        socket.on('QUIZ_STARTED', handleQuizStarted)
        socket.on('QUIZ_FINISHED', handleQuizFinished)

        return () => {
            socket.emit('leave-room', room)
            socket.off('QUIZ_STARTED', handleQuizStarted)
            socket.off('QUIZ_FINISHED', handleQuizFinished)
        }
    }, [quiz?.teamId, quizId, socket])

    // Timer & Stopwatch logic
    useEffect(() => {
        if (!quiz) return
        
        const interval = setInterval(() => {
            const now = new Date().getTime()
            
            // Countdown to End
            const end = new Date(quiz.endTime).getTime()
            const distance = end - now
            
            if (distance < 0) {
                clearInterval(interval)
                setTimeLeft('Expired')
                if (!isFinished) showToast('Quiz time is over! Submitting...', 'error')
                // disable or auto submit? Left as user requested previously.
            } else {
                 const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                 const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                 const seconds = Math.floor((distance % (1000 * 60)) / 1000)
                 setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
            }

            // Stopwatch (if started)
            if (hasStarted && attemptStartTime) {
                const diff = now - attemptStartTime.getTime()
                if (diff >= 0) {
                    const swHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                    const swMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const swSeconds = Math.floor((diff % (1000 * 60)) / 1000)
                    setStopwatch(`${swHours.toString().padStart(2, '0')}:${swMinutes.toString().padStart(2, '0')}:${swSeconds.toString().padStart(2, '0')}`)
                }
            }

        }, 1000)

        return () => clearInterval(interval)
    }, [quiz, hasStarted, attemptStartTime, isFinished])

    const startQuizMutation = useMutation({
        mutationFn: () => startQuiz(quizId!, { teamId: quiz?.teamId! }),
        onSuccess: (data) => {
            showToast('Quiz started!', 'success')
            setAttemptStartTime(new Date(data.attemptStartTime))
            setHasStarted(true)
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message || 'Failed to start quiz', 'error')
        }
    })

    const submitAnswerMutation = useMutation({
        mutationFn: (variables: { optionId: string }) => submitQuizAnswer(quizId!, { optionId: variables.optionId, teamId: quiz?.teamId! }),
        onError: (err: any) => {
            showToast(err.response?.data?.message || 'Failed to submit answer', 'error')
        }
    })

    const finishQuizMutation = useMutation({
        mutationFn: () => finishQuiz(quizId!, { teamId: quiz?.teamId! }),
        onSuccess: () => {
            showToast('Quiz submitted successfully', 'success')
            setIsFinished(true)
        },
        onError: (err: any) => {
            showToast(err.response?.data?.message || 'Failed to submit quiz', 'error')
        }
    })

    const handleOptionSelect = (questionId: string, optionId: string) => {
        if (!quiz?.teamId) return showToast('Team ID missing, cannot submit', 'error')

        setSelectedOptions(prev => ({ ...prev, [questionId]: optionId }))
        submitAnswerMutation.mutate({ optionId })
    }
    
    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Quiz...</div>
    
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white gap-4 p-4 text-center">
                <FiAlertCircle className="w-12 h-12 text-red-500" />
                <h1 className="text-2xl font-bold">Unable to load quiz</h1>
                <p className="text-slate-400">{(error as any).response?.data?.message || 'Something went wrong. You might not be a participant.'}</p>
            </div>
        )
    }

    if (!quiz) return null

    if (isFinished) {
        return (
             <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                    <FiCheck className="w-10 h-10 text-green-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold">Quiz Submitted!</h2>
                    <p className="text-slate-400 mt-2">Your answers have been recorded.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full">
                    <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-2">Notice</p>
                    <p>Please wait for the organisers to announce the results on the leaderboard.</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-white transition text-sm">Return to Dashboard</button>
            </div>
        )
    }
    
    // Start Screen
    if (!hasStarted) {
         return (
             <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center space-y-6 animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                    <h1 className="text-2xl font-bold mb-2">{quiz.name}</h1>
                    <p className="text-slate-400 mb-6">{quiz.description || 'Ready to start the quiz?'}</p>
                    
                    <div className="space-y-4 mb-8 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
                         <div className="flex justify-between">
                            <span className="text-slate-500">Questions</span>
                            <span className="font-mono">{quiz.questions.length}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Attempts Allowed</span>
                            <span className="font-mono">{quiz.allowAttempts ? 'Yes' : 'No'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500">Ends In</span>
                            <span className="font-mono text-blue-400 flex items-center gap-2"><FiClock /> {timeLeft}</span>
                         </div>
                    </div>

                    <button 
                        onClick={() => startQuizMutation.mutate()}
                        disabled={startQuizMutation.isPending}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {startQuizMutation.isPending ? 'Starting...' : 'Start Quiz'}
                    </button>
                </div>
             </div>
         )
    }

    const currentQuestion = quiz.questions[currentQuestionIndex] as PublicQuizQuestion | undefined

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="font-bold text-lg max-w-[200px] md:max-w-md truncate">{quiz.name}</h1>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-mono text-green-400">
                        <span className="text-xs text-slate-500 uppercase">Time</span>
                        {stopwatch}
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-mono text-blue-400">
                        <span className="text-xs text-slate-500 uppercase">Ends In</span>
                         {timeLeft}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 container mx-auto p-4 max-w-3xl flex flex-col justify-center">
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mb-6 relative overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                    />
                </div>

                {currentQuestion ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{currentQuestion.question}</h2>
                            {currentQuestion.isCode && (
                                <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 font-mono text-sm overflow-x-auto">
                                    {currentQuestion.description}
                                </div>
                            )}
                             {currentQuestion.image && (
                                <img src={currentQuestion.image} alt="Question" className="max-h-64 rounded-xl border border-slate-800 object-contain mx-auto" />
                            )}
                        </div>

                        <div className="grid gap-3">
                            {currentQuestion.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all relative flex items-center justify-between group ${
                                        selectedOptions[currentQuestion.id] === opt.id
                                        ? 'bg-blue-600/10 border-blue-600 text-white'
                                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 text-slate-300'
                                    }`}
                                >
                                    <span className="font-medium text-lg">{opt.value}</span>
                                    {selectedOptions[currentQuestion.id] === opt.id && <FiCheck className="text-blue-500 w-6 h-6" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                   null // Handled by isFinished
                )}
            </div>

            {/* Footer Navigation */}
            <div className="bg-slate-900 border-t border-slate-800 p-4">
                <div className="container mx-auto max-w-3xl flex justify-between">
                     <button 
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent text-slate-400 hover:text-white transition"
                    >
                        <FiChevronLeft /> Previous
                    </button>
                    
                    {currentQuestionIndex < quiz.questions.length - 1 ? (
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition"
                        >
                            Next <FiChevronRight />
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (confirm('Are you sure you want to finish the quiz?')) {
                                    finishQuizMutation.mutate()
                                }
                            }} 
                            disabled={finishQuizMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                        >
                            {finishQuizMutation.isPending ? 'Submitting...' : 'Finish'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
