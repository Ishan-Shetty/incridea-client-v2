import apiClient from './client'

export interface SignupPayload {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  selection: 'NMAMIT' | 'OTHER' | 'ALUMNI'
  collegeId?: number
  yearOfGraduation?: number
  idDocument?: string
  accommodation?: {
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    checkIn?: string
    checkOut?: string
    idProofUrl: string
  }
}

export interface UserPayload {
  id: string
  name: string
  email: string
  category: string
  collegeId: number
  roles: string[]
  isVerified: boolean
  phoneNumber: string
  isBranchRep?: boolean
  isOrganiser?: boolean
  isJudge?: boolean
  yearOfGraduation?: number | null
  alumniIdDocument?: string | null
}

export interface SignupResponse {
  message: string
  user: UserPayload
}

export interface VerifyOtpResponse {
  message: string
  token: string
  user: UserPayload
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: UserPayload
}

export interface MeResponse {
  user: UserPayload
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface ChangePasswordResponse {
  message: string
}

export interface ResetPasswordRequestPayload {
  email: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface ResetPasswordConfirmPayload {
  token: string
  newPassword: string
  confirmNewPassword: string
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>('/auth/signup', payload)
  return data
}

export async function verifyOtp(payload: { email: string; otp: string }): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', payload)
  return data
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function fetchMe(token: string): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function changePassword(
  payload: ChangePasswordPayload,
  token: string,
): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.post<ChangePasswordResponse>('/auth/change-password', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function requestPasswordReset(
  payload: ResetPasswordRequestPayload,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>('/auth/request-password-reset', payload)
  return data
}

export async function resetPasswordConfirm(
  payload: ResetPasswordConfirmPayload,
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>('/auth/reset-password-confirm', payload)
  return data
}


export interface VerifyMasterKeyResponse {
  success: boolean
  message: string
}

export async function verifyMasterKey(key: string, token: string): Promise<VerifyMasterKeyResponse> {
  const { data } = await apiClient.post<VerifyMasterKeyResponse>(
    '/auth/verify-master',
    { key },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data
}
