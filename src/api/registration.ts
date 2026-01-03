import apiClient from './client'

export interface TeamMember {
  userId: number
  teamId: number
  User?: {
    id: number
    name: string
    email: string
  }
}

export interface Team {
  id: number
  name: string
  eventId: number
  leaderId: number
  confirmed: boolean
  TeamMembers: TeamMember[]
}

export async function registerSoloEvent(eventId: number) {
  const { data } = await apiClient.post<Team>('/registration/solo', { eventId })
  return data
}

export async function createTeam(eventId: number, name: string) {
  const { data } = await apiClient.post<Team>('/registration/create-team', { eventId, name })
  return data
}

export async function joinTeam(teamId: number) {
  const { data } = await apiClient.post<TeamMember>('/registration/join-team', { teamId })
  return data
}

export async function getMyTeam(eventId: number) {
  const { data } = await apiClient.get<{ team: Team | null }>(`/registration/my-team/${eventId}`)
  return data.team
}

export async function confirmTeam(teamId: number) {
  const { data } = await apiClient.post<Team>('/registration/confirm-team', { teamId })
  return data
}

export async function leaveTeam(teamId: number) {
    const { data } = await apiClient.post<{ count: number }>('/registration/leave-team', { teamId })
    return data
}

export async function deleteTeam(teamId: number) {
    const { data } = await apiClient.post<Team>('/registration/delete-team', { teamId })
    return data
}
