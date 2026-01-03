import apiClient from './client'
import type { EventCategory, EventTier } from './types'

export const EVENT_TYPES = [
  'INDIVIDUAL',
  'TEAM',
  'INDIVIDUAL_MULTIPLE_ENTRY',
  'TEAM_MULTIPLE_ENTRY',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export interface BranchRepOrganiser {
  userId: number
  name: string
  email: string
  phoneNumber: string
}

export interface BranchRepEvent {
  id: number
  name: string
  eventType: EventType
  published: boolean
  organisers: BranchRepOrganiser[]
  description: string | null
  image: string | null
  fees: number
  venue: string | null
  minTeamSize: number
  maxTeamSize: number
  maxTeams: number | null
  category: EventCategory
  tier: EventTier
}

export interface CreateBranchRepEventPayload {
  name: string
  description?: string
  venue?: string
  fees?: number
  minTeamSize?: number
  maxTeamSize?: number
  maxTeams?: number | null
  eventType: EventType
  category?: EventCategory
  tier?: EventTier
}

export interface BranchRepEventDetails {
  id: number
  name: string
  description: string | null
  image: string | null
  fees: number
  venue: string | null
  minTeamSize: number
  maxTeamSize: number
  maxTeams: number | null
  eventType: EventType
  category: EventCategory
  tier: EventTier
  published: boolean
  organisers: BranchRepOrganiser[]
}

export interface BranchRepUser {
  id: number
  name: string
  email: string
  phoneNumber: string
}

export interface BranchRepEventsResponse {
  branchId: number
  branchName: string | null
  events: BranchRepEvent[]
}

function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function fetchBranchRepEvents(token: string): Promise<BranchRepEventsResponse> {
  const { data } = await apiClient.get<BranchRepEventsResponse>('/branch-rep/events', authHeader(token))
  return data
}

export async function createBranchRepEvent(payload: CreateBranchRepEventPayload, token: string) {
  const { data } = await apiClient.post<{ event: BranchRepEvent }>(
    '/branch-rep/events',
    payload,
    authHeader(token),
  )
  return data
}

export async function addOrganiserToEvent(eventId: number, email: string, token: string) {
  const { data } = await apiClient.post<{ organiser: BranchRepOrganiser }>(
    `/branch-rep/events/${eventId}/organisers`,
    { email },
    authHeader(token),
  )
  return data
}

export async function removeOrganiserFromEvent(eventId: number, userId: number, token: string) {
  const { data } = await apiClient.delete<{ message: string }>(
    `/branch-rep/events/${eventId}/organisers/${userId}`,
    authHeader(token),
  )
  return data
}

export async function deleteBranchRepEvent(eventId: number, token: string) {
  const { data } = await apiClient.delete<{ message: string }>(
    `/branch-rep/events/${eventId}`,
    authHeader(token),
  )
  return data
}

export async function fetchBranchRepEventDetails(eventId: number, token: string) {
  const { data } = await apiClient.get<{ event: BranchRepEventDetails }>(
    `/branch-rep/events/${eventId}`,
    authHeader(token),
  )
  return data
}

export async function updateBranchRepEvent(
  eventId: number,
  payload: Partial<{
    name: string
    description: string | null
    venue: string | null
    fees: number
    minTeamSize: number
    maxTeamSize: number
    maxTeams: number | null
    eventType: EventType
    category: EventCategory
    tier: EventTier
  }>,
  token: string,
) {
  const { data } = await apiClient.put<{ event: BranchRepEventDetails }>(
    `/branch-rep/events/${eventId}`,
    payload,
    authHeader(token),
  )
  return data
}

export async function toggleBranchRepEventPublish(eventId: number, publish: boolean, token: string) {
  const { data } = await apiClient.post<{ event: { id: number; published: boolean } }>(
    `/branch-rep/events/${eventId}/publish`,
    { publish },
    authHeader(token),
  )
  return data
}

export async function searchBranchRepUsers(query: string, token: string) {
  const { data } = await apiClient.get<{ users: BranchRepUser[] }>(
    '/branch-rep/users',
    {
      ...authHeader(token),
      params: { q: query },
    },
  )
  return data
}
