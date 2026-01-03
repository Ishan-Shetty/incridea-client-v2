import apiClient from './client'

export interface PublicQuizQuestion {
    id: string
    question: string
    description?: string
    isCode: boolean
    image?: string
    options: {
        id: string
        value: string
    }[]
}

export interface PublicQuiz {
    id: string
    name: string
    description?: string
    startTime: string
    endTime: string
    allowAttempts: boolean
    questions: PublicQuizQuestion[]
    teamId?: number
    attemptStartTime?: string
}

export const getPublicQuiz = async (quizId: string) => {
    const token = localStorage.getItem('token')
    const { data } = await apiClient.get<{ quiz: PublicQuiz }>(`/quiz/${quizId}`, {
         headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const startQuiz = async (quizId: string, payload: { teamId: number }) => {
    const token = localStorage.getItem('token')
    const { data } = await apiClient.post<{ success: boolean, attemptStartTime: string }>(`/quiz/${quizId}/start`, payload, {
         headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const submitQuizAnswer = async (quizId: string, payload: { optionId: string, teamId: number }) => {
    const token = localStorage.getItem('token')
    const { data } = await apiClient.post<{ success: boolean }>(`/quiz/${quizId}/submit`, payload, {
         headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const finishQuiz = async (quizId: string, payload: { teamId: number }) => {
    const token = localStorage.getItem('token')
    const { data } = await apiClient.post<{ success: boolean, score: number }>(`/quiz/${quizId}/finish`, payload, {
         headers: { Authorization: `Bearer ${token}` }
    })
    return data
}
