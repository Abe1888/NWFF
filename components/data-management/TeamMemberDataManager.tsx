'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Users, Plus, Edit3, Trash2, Search, RefreshCw, Save, X,
  AlertTriangle, User, Award, Clock, Target, TrendingUp, Star
} from 'lucide-react'
import { useTeamMembersOptimized, useTasksOptimized } from '@/lib/hooks/useOptimizedSWR'
import { teamMemberManager, DataValidator } from '@/lib/api/dataManager'
import type { TeamMember } from '@/lib/supabase/types'

const TeamMemberDataManager = () => {
  const { data: teamMembers = [], isLoading, error, mutate } = useTeamMembersOptimized()
  const { data: tasks = [] } = useTasksOptimized()
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'name' | 'completion_rate' | 'quality_score'>('completion_rate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Form state
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    id: '',
    name: '',
    role: '',
    specializations: [],
    completion_rate: 0,
    average_task_time: 0,
    quality_score: 0
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get unique roles for filtering
  const uniqueRoles = useMemo(() => 
    Array.from(new Set(teamMembers.map(m => m.role))),
    [teamMembers]
  )

  // Filter and sort team members
  const filteredMembers = useMemo(() => {
    let filtered = teamMembers.filter(member => {
      const roleMatch = selectedRole === 'All' || member.role === selectedRole
      const searchMatch = searchTerm === '' || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return roleMatch && searchMatch
    })

    // Sort members
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'completion_rate':
          aValue = a.completion_rate
          bValue = b.completion_rate
          break
        case 'quality_score':
          aValue = a.quality_score
          bValue = b.quality_score
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [teamMembers, selectedRole, searchTerm, sortBy, sortOrder])

  // Get member task statistics
  const getMemberStats = useCallback((memberName: string) => {
    const memberTasks = tasks.filter(task => task.assigned_to === memberName)
    const completed = memberTasks.filter(task => task.status === 'Completed').length
    const inProgress = memberTasks.filter(task => task.status === 'In Progress').length
    const pending = memberTasks.filter(task => task.status === 'Pending').length
    const blocked = memberTasks.filter(task => task.status === 'Blocked').length
    
    return {
      total: memberTasks.length,
      completed,
      inProgress,
      pending,
      blocked,
      completionRate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
    }
  }, [tasks])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    const errors = DataValidator.validateTeamMember(formData)
    setFormErrors(errors)
    
    if (errors.length > 0) return

    setIsSubmitting(true)
    try {
      // Generate ID if not provided
      const id = formData.id || `TM${String(teamMembers.length + 1).padStart(3, '0')}`
      
      await teamMemberManager.create({
        ...formData,
        id
      } as Omit<TeamMember, 'created_at'>)
      await mutate()
      setFormData({
        id: '',
        name: '',
        role: '',
        specializations: [],
        completion_rate: 0,
        average_task_time: 0,
        quality_score: 0
      })
      setShowAddForm(false)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to create team member:', error)
      setFormErrors(['Failed to create team member. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, teamMembers, mutate])

  const handleUpdate = useCallback(async (id: string, updates: Partial<TeamMember>) => {
    const errors = DataValidator.validateTeamMember(updates)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      await teamMemberManager.update(id, updates)
      await mutate()
      setEditingMember(null)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to update team member:', error)
      setFormErrors(['Failed to update team member. Please try again.'])
    }
  }, [mutate])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await teamMemberManager.delete(id)
      await mutate()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete team member:', error)
    }
  }, [mutate])

  const handleSpecializationInput = (value: string) => {
    const specializations = value.split(',').map(spec => spec.trim()).filter(spec => spec.length > 0)
    setFormData({ ...formData, specializations })
  }

  const getTeamStats = useMemo(() => {
    const totalMembers = teamMembers.length
    const avgCompletion = teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((sum, m) => sum + m.completion_rate, 0) / teamMembers.length)
      : 0
    const avgQuality = teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((sum, m) => sum + m.quality_score, 0) / teamMembers.length)
      : 0
    const avgTaskTime = teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((sum, m) => sum + m.average_task_time, 0) / teamMembers.length)
      : 0
    
    return { totalMembers, avgCompletion, avgQuality, avgTaskTime }
  }, [teamMembers])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Member Management</h3>
            <p className="text-sm text-slate-600">Manage installation team members and performance metrics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => mutate()}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{getTeamStats.totalMembers}</div>
            <div className="text-xs text-blue-600">Team Members</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-lg font-semibold text-green-800">{getTeamStats.avgCompletion}%</div>
            <div className="text-xs text-green-600">Avg Completion</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-lg font-semibold text-purple-800">{getTeamStats.avgQuality}%</div>
            <div className="text-xs text-purple-600">Avg Quality</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
            <div className="text-lg font-semibold text-orange-800">{getTeamStats.avgTaskTime}</div>
            <div className="text-xs text-orange-600">Avg Time (min)</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field as any)
              setSortOrder(order as any)
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="completion_rate-desc">Completion Rate (High to Low)</option>
            <option value="completion_rate-asc">Completion Rate (Low to High)</option>
            <option value="quality_score-desc">Quality Score (High to Low)</option>
            <option value="quality_score-asc">Quality Score (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Add Team Member Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Team Member</h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormErrors([])
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Errors */}
          {formErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {formErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Member ID</label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., TM006 (auto-generated if empty)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter full name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <input
                type="text"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Senior Technician"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specializations (comma-separated)</label>
              <input
                type="text"
                value={formData.specializations?.join(', ') || ''}
                onChange={(e) => handleSpecializationInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., GPS Installation, Fuel Sensors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Completion Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.completion_rate || 0}
                onChange={(e) => setFormData({ ...formData, completion_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quality Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.quality_score || 0}
                onChange={(e) => setFormData({ ...formData, quality_score: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Average Task Time (minutes)</label>
              <input
                type="number"
                min="0"
                value={formData.average_task_time || 0}
                onChange={(e) => setFormData({ ...formData, average_task_time: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormErrors([])
              }}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !formData.name?.trim() || !formData.role?.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create Member'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            stats={getMemberStats(member.name)}
            isEditing={editingMember === member.id}
            onEdit={() => setEditingMember(member.id)}
            onCancelEdit={() => setEditingMember(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(member.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Team Members Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedRole !== 'All'
              ? 'Try adjusting your filters to see more team members.'
              : 'No team members have been added yet.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Member
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Team Member</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">Warning:</p>
              <p className="text-sm text-red-700">
                Deleting this team member may affect tasks assigned to them. 
                Consider reassigning tasks before deletion.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-danger"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Team Member Card Component
interface TeamMemberCardProps {
  member: TeamMember
  stats: any
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (id: string, updates: Partial<TeamMember>) => void
  onDelete: () => void
}

const TeamMemberCard = React.memo<TeamMemberCardProps>(({ 
  member, 
  stats, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete 
}) => {
  const [editData, setEditData] = useState<Partial<TeamMember>>(member)

  const handleSave = () => {
    onUpdate(member.id, editData)
  }

  const handleSpecializationInput = (value: string) => {
    const specializations = value.split(',').map(spec => spec.trim()).filter(spec => spec.length > 0)
    setEditData({ ...editData, specializations })
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-blue-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 95) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 85) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const overallPerformance = Math.round((member.completion_rate + member.quality_score) / 2)

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Member Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-sm font-semibold bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <h3 className="text-sm font-semibold text-slate-900">{member.name}</h3>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editData.role || ''}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="text-xs text-slate-600 bg-white border border-slate-300 rounded px-2 py-1 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="text-xs text-slate-600">{member.role}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={onEdit}
                  className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Performance Badge */}
        <div className="flex justify-center">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPerformanceBadge(overallPerformance)}`}>
            {overallPerformance}% Overall Performance
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="100"
                value={editData.completion_rate || 0}
                onChange={(e) => setEditData({ ...editData, completion_rate: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className={`text-lg font-semibold ${getPerformanceColor(member.completion_rate)}`}>
                {member.completion_rate}%
              </div>
            )}
            <div className="text-xs text-slate-600">Completion</div>
          </div>
          
          <div className="text-center">
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="100"
                value={editData.quality_score || 0}
                onChange={(e) => setEditData({ ...editData, quality_score: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className={`text-lg font-semibold ${getPerformanceColor(member.quality_score)}`}>
                {member.quality_score}%
              </div>
            )}
            <div className="text-xs text-slate-600">Quality</div>
          </div>
          
          <div className="text-center">
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editData.average_task_time || 0}
                onChange={(e) => setEditData({ ...editData, average_task_time: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="text-lg font-semibold text-slate-800">
                {member.average_task_time}
              </div>
            )}
            <div className="text-xs text-slate-600">Avg Time</div>
          </div>
        </div>

        {/* Specializations */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-700 mb-2">Specializations</h4>
          {isEditing ? (
            <input
              type="text"
              value={editData.specializations?.join(', ') || ''}
              onChange={(e) => handleSpecializationInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., GPS Installation, Fuel Sensors"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {member.specializations.map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md border border-blue-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Current Workload */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-700 mb-2">Current Workload</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-sm font-semibold text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-600">Total</div>
            </div>
            <div className="bg-green-50 rounded-md p-2">
              <div className="text-sm font-semibold text-green-800">{stats.completed}</div>
              <div className="text-xs text-green-600">Done</div>
            </div>
            <div className="bg-blue-50 rounded-md p-2">
              <div className="text-sm font-semibold text-blue-800">{stats.inProgress}</div>
              <div className="text-xs text-blue-600">Active</div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-sm font-semibold text-slate-800">{stats.pending}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          {isEditing ? (
            <div className="flex space-x-2">
              <button
                onClick={onCancelEdit}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary text-xs"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-1 text-xs text-slate-600">
                <Target className="w-3 h-3" />
                <span>{stats.completionRate}% task completion</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className={`w-3 h-3 ${getPerformanceColor(overallPerformance)}`} />
                <span className={`text-xs font-medium ${getPerformanceColor(overallPerformance)}`}>
                  {overallPerformance >= 95 ? 'Excellent' : 
                   overallPerformance >= 85 ? 'Good' : 
                   overallPerformance >= 75 ? 'Average' : 'Needs Improvement'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

TeamMemberCard.displayName = 'TeamMemberCard'

export default TeamMemberDataManager