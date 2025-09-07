export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicle
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Vehicle, 'id'>>
      }
      locations: {
        Row: Location
        Insert: Omit<Location, 'created_at'>
        Update: Partial<Location>
      }
      team_members: {
        Row: TeamMember
        Insert: Omit<TeamMember, 'created_at'>
        Update: Partial<TeamMember>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id'>>
      }
      project_settings: {
        Row: ProjectSettings
        Insert: Omit<ProjectSettings, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectSettings, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Omit<Comment, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Vehicle {
  id: string
  type: string
  location: string
  day: number
  time_slot: string
  status: 'Pending' | 'In Progress' | 'Completed'
  gps_required: number
  fuel_sensors: number
  fuel_tanks: number
  created_at?: string
  updated_at?: string
}

export interface Location {
  name: string
  duration: string
  vehicles: number
  gps_devices: number
  fuel_sensors: number
  created_at?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  specializations: string[]
  completion_rate: number
  average_task_time: number
  quality_score: number
  created_at?: string
}

export interface Task {
  id: string
  vehicle_id: string
  name: string
  description?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked'
  assigned_to: string
  priority: 'High' | 'Medium' | 'Low'
  estimated_duration?: number
  start_date?: string
  end_date?: string
  duration_days?: number
  notes?: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface ProjectSettings {
  id: string
  project_start_date: string
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: string
  task_id: string
  text: string
  author: string
  created_at: string
}