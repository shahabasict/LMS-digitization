import { apiClient } from './client'
import type {
  AssignmentStatus,
  LoginResponse,
  NewJoinerDashboard,
  ReportRow,
  ReportSummary,
  Team,
  Tower,
  TrainingAssignment,
  TrainingModule,
  User,
  Feedback,
} from '../types'

export interface ManagerPayload {
  name: string
  username: string
  email?: string
  employee_id?: string
  tower_id: string
  team_ids: string[]
  password?: string
}

export interface ManagerUpdatePayload {
  name?: string
  email?: string
  employee_id?: string
  tower_id?: string
  team_ids?: string[]
  status?: 'active' | 'inactive'
  password?: string
}

export interface NewJoinerPayload {
  name: string
  username: string
  employee_id?: string
  email?: string
  tower_id: string
  team_id: string
  joining_date?: string | null
  password?: string
}

export interface NewJoinerUpdatePayload {
  name?: string
  email?: string
  employee_id?: string
  tower_id?: string
  team_id?: string
  joining_date?: string | null
  manager_id?: string
  status?: 'active' | 'inactive'
  password?: string
}

export interface ModulePayload {
  name: string
  description?: string
  content_type: string
  content_url: string
  duration_minutes: number
  tower_ids: string[]
  team_ids: string[]
}

export interface ModuleUpdatePayload {
  name?: string
  description?: string
  content_type?: string
  content_url?: string
  duration_minutes?: number
  tower_ids?: string[]
  team_ids?: string[]
  status?: 'active' | 'inactive'
}

export interface AssignmentPayload {
  new_joiner_ids: string[]
  training_module_ids: string[]
  due_date?: string | null
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient
      .post<LoginResponse>('/auth/login', { username, password })
      .then((r) => r.data),
  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
}

export const masterApi = {
  towers: () => apiClient.get<Tower[]>('/towers').then((r) => r.data),
  teams: (towerId?: string) =>
    apiClient
      .get<Team[]>('/teams', { params: towerId ? { tower_id: towerId } : {} })
      .then((r) => r.data),
}

export const adminApi = {
  managers: (params?: { search?: string; status?: string }) =>
    apiClient.get<User[]>('/admin/managers', { params }).then((r) => r.data),
  manager: (id: string) =>
    apiClient.get<User>(`/admin/managers/${id}`).then((r) => r.data),
  createManager: (payload: ManagerPayload) =>
    apiClient.post<User>('/admin/managers', payload).then((r) => r.data),
  updateManager: (id: string, payload: ManagerUpdatePayload) =>
    apiClient.put<User>(`/admin/managers/${id}`, payload).then((r) => r.data),
  setManagerStatus: (id: string, status: 'active' | 'inactive') =>
    apiClient
      .patch<User>(`/admin/managers/${id}/status`, { status })
      .then((r) => r.data),
  createTower: (payload: { name: string; description?: string }) =>
    apiClient.post<Tower>('/admin/towers', payload).then((r) => r.data),
  updateTower: (id: string, payload: { name?: string; description?: string }) =>
    apiClient.put<Tower>(`/admin/towers/${id}`, payload).then((r) => r.data),
  createTeam: (payload: { name: string; tower_id: string; description?: string }) =>
    apiClient.post<Team>('/admin/teams', payload).then((r) => r.data),
  updateTeam: (id: string, payload: { name?: string; description?: string }) =>
    apiClient.put<Team>(`/admin/teams/${id}`, payload).then((r) => r.data),
}

export const managerApi = {
  joiners: (params?: { search?: string; status?: string; team_id?: string }) =>
    apiClient.get<User[]>('/joiners', { params }).then((r) => r.data),
  joiner: (id: string) =>
    apiClient.get<User>(`/joiners/${id}`).then((r) => r.data),
  joinerProgress: (id: string) =>
    apiClient
      .get<{ joiner: User; assignments: TrainingAssignment[]; summary: import('../types').ProgressSummary }>(
        `/joiners/${id}/progress`,
      )
      .then((r) => r.data),
  createJoiner: (payload: NewJoinerPayload) =>
    apiClient.post<User>('/joiners', payload).then((r) => r.data),
  updateJoiner: (id: string, payload: NewJoinerUpdatePayload) =>
    apiClient.put<User>(`/joiners/${id}`, payload).then((r) => r.data),
  setJoinerStatus: (id: string, status: 'active' | 'inactive') =>
    apiClient
      .patch<User>(`/joiners/${id}/status`, { status })
      .then((r) => r.data),

  modules: (params?: { search?: string; status?: string; content_type?: string }) =>
    apiClient.get<TrainingModule[]>('/training-modules', { params }).then((r) => r.data),
  module: (id: string) =>
    apiClient.get<TrainingModule>(`/training-modules/${id}`).then((r) => r.data),
  createModule: (payload: ModulePayload) =>
    apiClient.post<TrainingModule>('/training-modules', payload).then((r) => r.data),
  updateModule: (id: string, payload: ModuleUpdatePayload) =>
    apiClient.put<TrainingModule>(`/training-modules/${id}`, payload).then((r) => r.data),
  setModuleStatus: (id: string, status: 'active' | 'inactive') =>
    apiClient
      .patch<TrainingModule>(`/training-modules/${id}/status`, { status })
      .then((r) => r.data),

  assignments: (params?: {
    status?: AssignmentStatus
    new_joiner_id?: string
    training_module_id?: string
    overdue?: boolean
  }) => apiClient.get<TrainingAssignment[]>('/assignments', { params }).then((r) => r.data),
  createAssignments: (payload: AssignmentPayload) =>
    apiClient.post<TrainingAssignment[]>('/assignments', payload).then((r) => r.data),
  deleteAssignment: (id: string) =>
    apiClient.delete(`/assignments/${id}`).then((r) => r.data),

  feedback: (params?: { training_module_id?: string; new_joiner_id?: string }) =>
    apiClient.get<Feedback[]>('/feedback', { params }).then((r) => r.data),

  reportSummary: (teamId?: string) =>
    apiClient
      .get<ReportSummary>('/reports/summary', { params: teamId ? { team_id: teamId } : {} })
      .then((r) => r.data),
  teamReport: (teamId?: string) =>
    apiClient
      .get<{ count: number; rows: ReportRow[] }>('/reports/team', {
        params: teamId ? { team_id: teamId } : {},
      })
      .then((r) => r.data),
  teamReportCsvUrl: (teamId?: string) =>
    `/api/v1/reports/team?format=csv${teamId ? `&team_id=${teamId}` : ''}`,
}

export const meApi = {
  dashboard: () =>
    apiClient.get<NewJoinerDashboard>('/me/dashboard').then((r) => r.data),
  assignments: () =>
    apiClient.get<TrainingAssignment[]>('/me/assignments').then((r) => r.data),
  setStatus: (assignmentId: string, status: AssignmentStatus, progress?: number) =>
    apiClient
      .patch<TrainingAssignment>(`/me/assignments/${assignmentId}/status`, {
        status,
        progress,
      })
      .then((r) => r.data),
  feedback: () =>
    apiClient.get<Feedback[]>('/me/feedback').then((r) => r.data),
  submitFeedback: (payload: { training_module_id: string; rating: number; comment?: string }) =>
    apiClient.post<Feedback>('/me/feedback', payload).then((r) => r.data),
}