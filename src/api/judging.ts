import apiClient from './client'

export interface JudgeRound {
    eventId: number
    roundNo: number
    date: string | null
    Event: {
        id: number
        name: string
        eventType: string
    }
    Quiz: {
        id: number
        name: string
        completed: boolean
    } | null
    Criteria: {
        id: number
        name: string
        type: 'NUMBER' | 'TEXT' | 'TIME'
    }[]
}

export interface TeamMember {
    User: {
        name: string
        email: string
        phoneNumber: string
        id: number
    }
}

export interface Team {
    id: number
    name: string
    teamId: string // This might need to be derived or is existing field? V2 schema has `id` (int). Team ID usually is constructed like `INC-<ID>`.
    leaderId: number | null
    roundNo: number
    TeamMembers: TeamMember[]
    Score?: {
        score: string
        judgeId: number
        criteriaId: number
    }[]
    Winners?: Winner[]
}

export interface Winner {
    id: number
    teamId: number
    eventId: number
    type: 'WINNER' | 'RUNNER_UP' | 'SECOND_RUNNER_UP'
    team: {
        id: number
        name: string
        leaderId: number | null
    }
}

export const getJudgeRounds = async () => {
    const { data } = await apiClient.get<{ rounds: JudgeRound[] }>('/judge/rounds')
    return data
}

export const getTeamsByRound = async (eventId: number, roundNo: number) => {
    const { data } = await apiClient.get<{ teams: Team[] }>(`/judge/events/${eventId}/rounds/${roundNo}/teams`)
    return data
}

export const submitScore = async (eventId: number, roundNo: number, teamId: number, criteriaId: number, score: string) => {
    const { data } = await apiClient.post(`/judge/events/${eventId}/rounds/${roundNo}/score`, { teamId, criteriaId, score })
    return data
}

export const promoteTeam = async (eventId: number, roundNo: number, teamId: number, selected: boolean) => {
    const { data } = await apiClient.post(`/judge/events/${eventId}/rounds/${roundNo}/promote`, { teamId, selected })
    return data
}

export const selectWinner = async (eventId: number, teamId: number, type: string) => {
    const { data } = await apiClient.post(`/judge/events/${eventId}/winners`, { teamId, type })
    return data
}

export const deleteWinner = async (winnerId: number) => {
    const { data } = await apiClient.delete(`/judge/winners/${winnerId}`)
    return data
}

export const updateRoundStatus = async (eventId: number, roundNo: number, selectStatus: boolean) => {
    const { data } = await apiClient.patch(`/judge/events/${eventId}/rounds/${roundNo}/status`, { selectStatus })
    return data
}
