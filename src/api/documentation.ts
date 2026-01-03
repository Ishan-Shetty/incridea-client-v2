import apiClient from './client'
import type { EventCategory, EventTier } from './types'
import type { EventType } from './branchRep'

export interface DocumentationEvent {
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
    isBranch: boolean
    branchId: number | null
    branchName: string
    organisers: {
        userId: number
        name: string
        email: string
    }[]
}

export interface DocumentationEventDetails {
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
    isBranch: boolean
    branchId: number | null
    branchName: string
    organisers: {
        userId: number
        name: string
        email: string
        phoneNumber: string
    }[]
}

export interface CreateDocumentationEventPayload {
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
    branchId?: number | null
    isBranch: boolean
    image?: string
}

export interface UpdateDocumentationEventPayload {
    name?: string
    description?: string
    venue?: string
    fees?: number
    minTeamSize?: number
    maxTeamSize?: number
    maxTeams?: number | null
    eventType?: EventType
    category?: EventCategory
    tier?: EventTier
    branchId?: number | null
    isBranch?: boolean
    image?: string
    published?: boolean
}

export interface DocumentationEventsResponse {
    events: DocumentationEvent[]
}

export interface Branch {
    id: number
    name: string
}

export interface DocumentationUser {
    id: number
    name: string
    email: string
    phoneNumber: string
}

export interface DocumentationOrganiser {
    userId: number
    name: string
    email: string
    phoneNumber: string
}

function authHeader(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } }
}

export async function fetchDocumentationEvents(token: string): Promise<DocumentationEventsResponse> {
    const { data } = await apiClient.get<DocumentationEventsResponse>('/documentation/events', authHeader(token))
    return data
}

export async function createDocumentationEvent(payload: CreateDocumentationEventPayload, token: string) {
    const { data } = await apiClient.post<{ event: DocumentationEvent }>(
        '/documentation/events',
        payload,
        authHeader(token),
    )
    return data
}

export async function fetchDocumentationEventDetails(eventId: number, token: string) {
    const { data } = await apiClient.get<{ event: DocumentationEventDetails }>(
        `/documentation/events/${eventId}`,
        authHeader(token),
    )
    return data
}

export async function updateDocumentationEvent(
    eventId: number,
    payload: UpdateDocumentationEventPayload,
    token: string,
) {
    const { data } = await apiClient.put<{ event: DocumentationEventDetails }>(
        `/documentation/events/${eventId}`,
        payload,
        authHeader(token),
    )
    return data
}

export interface BranchWithReps {
    id: number
    name: string
    reps: {
        id: number // branchRepId
        userId: number
        name: string
        email: string
        phoneNumber: string
    }[]
}

export async function fetchBranches(token: string) {
    const { data } = await apiClient.get<{ branches: BranchWithReps[] }>('/documentation/branches', authHeader(token))
    return data
}

export async function createBranch(name: string, token: string) {
    const { data } = await apiClient.post<{ branch: { id: number; name: string } }>('/documentation/branches', { name }, authHeader(token))
    return data
}

export async function deleteBranch(branchId: number, token: string) {
    const { data } = await apiClient.delete<{ message: string }>(`/documentation/branches/${branchId}`, authHeader(token))
    return data
}

export async function addBranchRep(branchId: number, email: string, token: string) {
    const { data } = await apiClient.post<{ rep: { id: number; userId: number; user: DocumentationUser } }>(`/documentation/branches/${branchId}/reps`, { email }, authHeader(token))
    return data
}

export async function removeBranchRep(branchId: number, userId: number, token: string) {
    const { data } = await apiClient.delete<{ message: string }>(`/documentation/branches/${branchId}/reps/${userId}`, authHeader(token))
    return data
}

export async function searchDocumentationUsers(query: string, token: string) {
    const { data } = await apiClient.get<{ users: DocumentationUser[] }>(
        '/documentation/users',
        {
            ...authHeader(token),
            params: { q: query },
        },
    )
    return data
}

export async function addOrganiserToEvent(eventId: number, email: string, token: string) {
    const { data } = await apiClient.post<{ organiser: DocumentationOrganiser }>(
        `/documentation/events/${eventId}/organisers`,
        { email },
        authHeader(token),
    )
    return data
}

export async function removeOrganiserFromEvent(eventId: number, userId: number, token: string) {
    const { data } = await apiClient.delete<{ message: string }>(
        `/documentation/events/${eventId}/organisers/${userId}`,
        authHeader(token),
    )
    return data
}
