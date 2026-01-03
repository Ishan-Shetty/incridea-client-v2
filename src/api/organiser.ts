import apiClient from './client'

export interface OrganiserEvent {
  id: number
  name: string
  eventType: 'INDIVIDUAL' | 'TEAM' | 'INDIVIDUAL_MULTIPLE_ENTRY' | 'TEAM_MULTIPLE_ENTRY'
  category: string
  venue: string | null
  fees: number
  startDateTime: string | null
  endDateTime: string | null
  published: boolean
  _count: {
    Teams: number
  }
}

export interface OrganiserEventDetails {
  id: number
  name: string
  category: string
  // Add other fields as per response
  Teams: Team[]
  Rounds: Round[]
}

export interface Team {
  id: number
  name: string
  confirmed: boolean
  attended: boolean
  leaderId: number | null
  eventId: number
  TeamMembers: TeamMember[]
  createdAt: string
}

export interface TeamMember {
  id: number
  userId: number
  teamId: number
  User: {
    id: number
    name: string
    email: string
    phoneNumber: string
    collegeId: number
    College: {
      name: string
    }
  }
}


export interface Judge {
    eventId: number
    roundNo: number
    userId: number
    User: {
        id: number
        name: string
        email: string
        phoneNumber: string
    }
}

export interface Criteria {
    id: number
    name: string
    type: 'TEXT' | 'NUMBER' | 'TIME'
}

export interface Round {
    roundNo: number
    completed: boolean
    eventId: number
    Judges: Judge[]
    Criteria: Criteria[]
    Quiz?: {
        id: string
        name: string
        completed: boolean
        allowAttempts: boolean
    } | null
    date?: string
}

export interface CreateTeamPayload {
  name: string
  eventId: number
}

export const fetchOrganiserEvents = async (token: string) => {
  const { data } = await apiClient.get<{ events: OrganiserEvent[] }>('/organiser/events', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const fetchOrganiserEventDetails = async (eventId: number, token: string) => {
  const { data } = await apiClient.get<{ event: OrganiserEventDetails }>(`/organiser/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const createTeam = async (eventId: number, payload: { name: string }, token: string) => {
  const { data } = await apiClient.post<{ team: Team }>(
    `/organiser/events/${eventId}/teams`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export const deleteTeam = async (teamId: number, token: string) => {
  const { data } = await apiClient.delete(`/organiser/teams/${teamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const addTeamMember = async (teamId: number, userId: number, token: string) => {
  const { data } = await apiClient.post(
    `/organiser/teams/${teamId}/members`,
    { userId },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  return data
}

export const removeTeamMember = async (teamId: number, userId: number, token: string) => {
  const { data } = await apiClient.delete(`/organiser/teams/${teamId}/members/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export const searchUsers = async (query: string, token: string) => {
    const { data } = await apiClient.get<{ users: TeamMember['User'][] }>(`/organiser/users/search`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

// Round Management
export const createRound = async (eventId: number, token: string) => {
    const { data } = await apiClient.post<{ round: Round }>(`/organiser/events/${eventId}/rounds`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const deleteRound = async (eventId: number, roundNo: number, token: string) => {
    const { data } = await apiClient.delete(`/organiser/events/${eventId}/rounds/${roundNo}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

// Judge Management
export const addJudge = async (eventId: number, roundNo: number, userId: number, token: string) => {
    const { data } = await apiClient.post(`/organiser/events/${eventId}/rounds/${roundNo}/judges`, { userId }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const removeJudge = async (eventId: number, roundNo: number, judgeUserId: number, token: string) => {
    const { data } = await apiClient.delete(`/organiser/events/${eventId}/rounds/${roundNo}/judges/${judgeUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

// Criteria Management
export const addCriteria = async (eventId: number, roundNo: number, payload: { name: string, type?: string }, token: string) => {
    const { data } = await apiClient.post<{ criteria: Criteria }>(`/organiser/events/${eventId}/rounds/${roundNo}/criteria`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const deleteCriteria = async (eventId: number, roundNo: number, criteriaId: number, token: string) => {
    const { data } = await apiClient.delete(`/organiser/events/${eventId}/rounds/${roundNo}/criteria/${criteriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}


export interface Option {
  id?: string
  value: string
  isAnswer: boolean
}

export interface Question {
  id?: string
  question: string
  description?: string
  isCode: boolean
  image?: string
  options: Option[]
  createdAt?: string
}

export interface Quiz {
  id: string
  name: string
  description?: string
  startTime: string
  endTime: string
  password?: string
  overridePassword?: string
  eventId: number
  roundId: number
  Questions: Question[]
}

export interface CreateQuizPayload {
  name: string
  description?: string
  startTime: string
  endTime: string
  password: string
  overridePassword?: string
}

export interface UpdateQuizPayload {
  name: string
  description?: string
  startTime: string
  endTime: string
  password: string
  overridePassword?: string
  questions: Question[]
}

// ... existing code ...

// Quiz Management
export const createQuiz = async (eventId: number, roundId: number, payload: CreateQuizPayload, token: string) => {
    const { data } = await apiClient.post<{ quiz: Quiz }>(`/organiser/events/${eventId}/rounds/${roundId}/quiz`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const getQuiz = async (eventId: number, roundId: number, token: string) => {
    const { data } = await apiClient.get<{ quiz: Quiz }>(`/organiser/events/${eventId}/rounds/${roundId}/quiz`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const updateQuiz = async (eventId: number, quizId: string, payload: UpdateQuizPayload, token: string) => {
    const { data } = await apiClient.patch<{ quiz: Quiz }>(`/organiser/events/${eventId}/quiz/${quizId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const deleteQuiz = async (eventId: number, quizId: string, token: string) => {
    const { data } = await apiClient.delete(`/organiser/events/${eventId}/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export interface QuizLeaderboardEntry {
    id: string
    score: number
    timeTaken: number
    Team: {
        id: number
        name: string
    }
}

export const getQuizLeaderboard = async (eventId: number, roundId: number, token: string) => {
    const { data } = await apiClient.get<{ leaderboard: QuizLeaderboardEntry[] }>(`/organiser/events/${eventId}/rounds/${roundId}/quiz/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const promoteParticipants = async (eventId: number, roundId: number, teamIds: number[], token: string) => {
    const { data } = await apiClient.post(`/organiser/events/${eventId}/rounds/${roundId}/quiz/promote`, { teamIds }, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return data
}

export const updateOrganiserProfile = async (data: { name: string; phoneNumber: string }, token: string) => {
  const { data: response } = await apiClient.put<{ message: string }>('/organiser/profile', data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response
}
