export type Role = 'admin' | 'manager' | 'new_joiner'
export type AccountStatus = 'active' | 'inactive'
export type ContentType = 'pdf' | 'internal_link' | 'external_link' | 'percipio'
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed'

export interface User {
  id: string
  role: Role
  name: string
  username: string
  email?: string | null
  employee_id?: string | null
  tower_id?: string | null
  tower_name?: string | null
  team_id?: string | null
  team_name?: string | null
  team_ids: string[]
  team_names: string[]
  manager_id?: string | null
  manager_name?: string | null
  joining_date?: string | null
  status: AccountStatus
  created_at?: string | null
  updated_at?: string | null
}

export interface Tower {
  id: string
  name: string
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Team {
  id: string
  name: string
  tower_id: string
  tower_name?: string | null
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TrainingModule {
  id: string
  name: string
  description?: string | null
  content_type: ContentType
  content_url: string
  duration_minutes: number
  tower_ids: string[]
  tower_names: string[]
  team_ids: string[]
  team_names: string[]
  status: AccountStatus
  created_by_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TrainingAssignment {
  id: string
  new_joiner_id: string
  new_joiner_name?: string | null
  training_module_id: string
  training_module_name?: string | null
  training_module_content_type?: string | null
  training_module_content_url?: string | null
  training_module_duration_minutes?: number | null
  assigned_by?: string | null
  assigned_by_name?: string | null
  assigned_date?: string | null
  due_date?: string | null
  status: AssignmentStatus
  progress: number
  overdue: boolean
  started_date?: string | null
  completed_date?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Feedback {
  id: string
  new_joiner_id?: string | null
  new_joiner_name?: string | null
  training_module_id: string
  training_module_name?: string | null
  rating: number
  comment?: string | null
  created_at?: string | null
}

export interface ProgressSummary {
  total_assignments: number
  completed: number
  in_progress: number
  not_started: number
  overdue: number
  completion_percentage: number
}

export interface TeamBreakdown {
  team_id: string
  team_name: string
  total_joiners: number
  total_assignments: number
  completed: number
  in_progress: number
  not_started: number
  overdue: number
  completion_percentage: number
}

export interface ReportSummary extends ProgressSummary {
  total_joiners: number
  team_breakdown: TeamBreakdown[]
}

export interface ReportRow {
  joiner_id: string
  joiner_name: string
  employee_id: string
  username: string
  team_name: string
  joining_date: string
  status: string
  total_assignments: number
  completed: number
  in_progress: number
  not_started: number
  overdue: number
  completion_percentage: number
}

export interface NewJoinerDashboard {
  profile: User
  summary: ProgressSummary
  next_due: TrainingAssignment | null
  recent: TrainingAssignment[]
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}