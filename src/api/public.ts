import apiClient from './client'

export interface RegistrationFees {
  internalRegistrationFeeGen: number
  internalRegistrationFeeInclusiveMerch: number
  externalRegistrationFee: number
  externalRegistrationFeeOnSpot: number
  internalRegistrationOnSpot: number
  alumniRegistrationFee: number
}

export interface RegistrationConfigResponse {
  isRegistrationOpen: boolean
  isSpotRegistration: boolean
  fees: RegistrationFees
}

export type PublicEventCategory = 'TECHNICAL' | 'NON_TECHNICAL' | 'CORE' | 'SPECIAL'
export type PublicEventType =
  | 'INDIVIDUAL'
  | 'TEAM'
  | 'INDIVIDUAL_MULTIPLE_ENTRY'
  | 'TEAM_MULTIPLE_ENTRY'

export interface PublicEventRound {
  roundNo: number
  date: string | null
}

export interface PublicEvent {
  id: number
  name: string
  description?: string | null
  image?: string | null
  venue?: string | null
  fees?: number | null
  maxTeams?: number | null
  minTeamSize: number
  maxTeamSize: number
  eventType: PublicEventType
  category: PublicEventCategory
  rounds: PublicEventRound[]
}

export interface PublicEventOrganiser {
  name: string
  email?: string | null
  phoneNumber?: string | null
}

export interface PublicEventDetail extends PublicEvent {
  organisers: PublicEventOrganiser[]
}

export interface EventDayConfig {
  day1: string | null
  day2: string | null
  day3: string | null
  day4: string | null
}

export interface PublishedEventsResponse {
  events: PublicEvent[]
  days: EventDayConfig
}

export interface PublishedEventResponse {
  event: PublicEventDetail
}

export async function fetchRegistrationConfig(): Promise<RegistrationConfigResponse> {
  const { data } = await apiClient.get<RegistrationConfigResponse>('/public/registration-config')
  return data
}

export async function fetchPublishedEvents(): Promise<PublishedEventsResponse> {
  const { data } = await apiClient.get<PublishedEventsResponse>('/public/events')
  return data
}

export async function fetchPublishedEvent(id: number): Promise<PublishedEventResponse> {
  const { data } = await apiClient.get<PublishedEventResponse>(`/public/events/${id}`)
  return data
}
