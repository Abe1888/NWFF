'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  CheckSquare, Plus, Edit3, Trash2, Search, Filter, RefreshCw, Save, X, CheckCircle2,
  AlertTriangle, Clock, User, Target, MessageSquare, Calendar, Tag,
  Activity, Send, ChevronDown, ChevronUp, Navigation, Fuel
} from 'lucide-react'
import { useTasksOptimized, useVehiclesOptimized, useTeamMembersOptimized } from '@/lib/hooks/useOptimizedSWR'
import { taskManager, commentManager, DataValidator, BulkOperations } from '@/lib/api/dataManager'
import type { Task, Comment } from '@/lib/supabase/types'

const TaskDataManager = () => {
  const { data: tasks = [], isLoading, error, mutate } = useTasksOptimized()
  const { data: vehicles = [] } = useVehiclesOptimized()
  const { data: teamMembers = [] } = useTeamMembersOptimized()
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All')
  const [selectedPriority, setSelectedPriority] = useState<string>('All')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'assigned_to' | 'created_at'>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Form state
  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    description: '',
    vehicle_id: '',
    assigned_to: '',
    priority: 'Medium',
    estimated_duration: 60,
    start_date: new Date().toISOString().split('T')[0],
    duration_days: 1,
    notes: '',
    tags: []
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskComments, setTaskComments] = useState<Record<string, Comment[]>>({})

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const statusMatch = selectedStatus === 'All' || task.status === selectedStatus
      const assigneeMatch = selectedAssignee === 'All' || task.assigned_to === selectedAssignee
      const priorityMatch = selectedPriority === 'All' || task.priority === selectedPriority
      const vehicleMatch = selectedVehicle === 'All' || task.vehicle_id === selectedVehicle
      const searchMatch = searchTerm === '' || 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())
      
      return statusMatch && assigneeMatch && priorityMatch && vehicleMatch && searchMatch
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
          break
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1, 'Blocked': 0 }
          aValue = statusOrder[a.status as keyof typeof statusOrder]
          bValue = statusOrder[b.status as keyof typeof statusOrder]
          break
        case 'assigned_to':
          aValue = a.assigned_to
          bValue = b.assigned_to
          break
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime()
          bValue = new Date(b.created_at || '').getTime()
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
  }, [tasks, selectedStatus, selectedAssignee, selectedPriority, selectedVehicle, searchTerm, sortBy, sortOrder])

  // Load comments for expanded tasks
  const loadTaskComments = useCallback(async (taskId: string) => {
    try {
      const comments = await commentManager.getByTaskId(taskId)
      setTaskComments(prev => ({ ...prev, [taskId]: comments }))
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }, [])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    const errors = DataValidator.validateTask(formData)
    setFormErrors(errors)
    
    if (errors.length > 0) return

    setIsSubmitting(true)
    try {
      await taskManager.create(formData as Omit<Task, 'id' | 'created_at' | 'updated_at'>)
      await mutate()
      setFormData({
        name: '',
        description: '',
        vehicle_id: '',
        assigned_to: '',
        priority: 'Medium',
        estimated_duration: 60,
        start_date: new Date().toISOString().split('T')[0],
        duration_days: 1,
        notes: '',
        tags: []
      })
      setShowAddForm(false)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to create task:', error)
      setFormErrors(['Failed to create task. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mutate])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Task>) => {
    const errors = DataValidator.validateTask(updates)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      await taskManager.update(id, updates)
      await mutate()
      setEditingTask(null)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to update task:', error)
      setFormErrors(['Failed to update task. Please try again.'])
    }
  }, [mutate])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await taskManager.delete(id)
      await mutate()
      setDeleteConfirm(null)
      // Remove from expanded tasks
      const newExpanded = new Set(expandedTasks)
      newExpanded.delete(id)
      setExpandedTasks(newExpanded)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }, [mutate, expandedTasks])

  const handleStatusUpdate = useCallback(async (id: string, status: Task['status']) => {
    try {
      await taskManager.update(id, { status })
      await mutate()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [mutate])

  const handleGenerateStandardTasks = useCallback(async (vehicleId: string) => {
    if (!vehicleId) return
    
    const assignee = teamMembers[0]?.name || 'Unassigned'
    
    try {
      await BulkOperations.createStandardTasksForVehicle(vehicleId, assignee)
      await mutate()
    } catch (error) {
      console.error('Failed to generate standard tasks:', error)
    }
  }, [teamMembers, mutate])

  const toggleTaskExpansion = useCallback((taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (expandedTasks.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
      // Load comments when expanding
      loadTaskComments(taskId)
    }
    setExpandedTasks(newExpanded)
  }, [expandedTasks, loadTaskComments])

  const addComment = useCallback(async (taskId: string, text: string, author: string) => {
    try {
      await commentManager.createForTask(taskId, text, author)
      // Reload comments for this task
      await loadTaskComments(taskId)
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }, [loadTaskComments])

  const getTaskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'Completed').length
    const inProgress = tasks.filter(t => t.status === 'In Progress').length
    const pending = tasks.filter(t => t.status === 'Pending').length
    const blocked = tasks.filter(t => t.status === 'Blocked').length
    const highPriority = tasks.filter(t => t.priority === 'High').length
    
    return { total, completed, inProgress, pending, blocked, highPriority }
  }, [tasks])

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData({ ...formData, tags })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Task Management</h3>
            <p className="text-sm text-slate-600">Create, edit, and manage installation tasks with nested comments</p>
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
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-lg font-semibold text-slate-800">{getTaskStats.total}</div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-lg font-semibold text-green-800">{getTaskStats.completed}</div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{getTaskStats.inProgress}</div>
            <div className="text-xs text-blue-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-lg font-semibold text-slate-800">{getTaskStats.pending}</div>
            <div className="text-xs text-slate-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-md border border-red-200">
            <div className="text-lg font-semibold text-red-800">{getTaskStats.blocked}</div>
            <div className="text-xs text-red-600">Blocked</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-md border border-orange-200">
            <div className="text-lg font-semibold text-orange-800">{getTaskStats.highPriority}</div>
            <div className="text-xs text-orange-600">High Priority</div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filters & Search</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Blocked">Blocked</option>
            </select>

            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="All">All Assignees</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as any)
                setSortOrder(order as any)
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md"
            >
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="status-desc">Status (Active First)</option>
              <option value="status-asc">Status (Completed First)</option>
              <option value="assigned_to-asc">Assignee (A-Z)</option>
              <option value="assigned_to-desc">Assignee (Z-A)</option>
              <option value="created_at-desc">Created (Newest)</option>
              <option value="created_at-asc">Created (Oldest)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {filteredTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700">Bulk Actions:</span>
              <button
                onClick={() => {
                  const vehicleId = vehicles[0]?.id
                  if (vehicleId) handleGenerateStandardTasks(vehicleId)
                }}
                className="btn-secondary text-xs"
                disabled={vehicles.length === 0}
              >
                Generate Standard Tasks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Task</h3>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Task Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle *</label>
              <select
                value={formData.vehicle_id || ''}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.id} - {vehicle.type} ({vehicle.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To *</label>
              <select
                value={formData.assigned_to || ''}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select assignee...</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority || 'Medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.estimated_duration || 60}
                onChange={(e) => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Task description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleTagInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., installation, gps, urgent"
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
              disabled={isSubmitting || !formData.name?.trim() || !formData.vehicle_id || !formData.assigned_to}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            vehicles={vehicles}
            teamMembers={teamMembers}
            comments={taskComments[task.id] || []}
            isExpanded={expandedTasks.has(task.id)}
            isEditing={editingTask === task.id}
            onToggleExpansion={() => toggleTaskExpansion(task.id)}
            onEdit={() => setEditingTask(task.id)}
            onCancelEdit={() => setEditingTask(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(task.id)}
            onStatusUpdate={handleStatusUpdate}
            onAddComment={addComment}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tasks Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedStatus !== 'All' || selectedAssignee !== 'All' || selectedPriority !== 'All' || selectedVehicle !== 'All'
              ? 'Try adjusting your filters to see more tasks.'
              : 'No tasks have been created yet.'}
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Create First Task
            </button>
            {vehicles.length > 0 && (
              <button
                onClick={() => handleGenerateStandardTasks(vehicles[0].id)}
                className="btn-secondary"
              >
                Generate Standard Tasks
              </button>
            )}
          </div>
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
                <h3 className="text-lg font-semibold text-slate-900">Delete Task</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this task? All associated comments will also be permanently removed.
            </p>
            
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
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Task Card Component with nested comments
interface TaskCardProps {
  task: Task
  vehicles: any[]
  teamMembers: any[]
  comments: Comment[]
  isExpanded: boolean
  isEditing: boolean
  onToggleExpansion: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: () => void
  onStatusUpdate: (id: string, status: Task['status']) => void
  onAddComment: (taskId: string, text: string, author: string) => void
}

const TaskCard = React.memo<TaskCardProps>(({ 
  task, 
  vehicles, 
  teamMembers, 
  comments, 
  isExpanded,
  isEditing,
  onToggleExpansion,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onStatusUpdate,
  onAddComment
}) => {
  const [editData, setEditData] = useState<Partial<Task>>(task)
  const [newComment, setNewComment] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)

  const vehicle = vehicles.find(v => v.id === task.vehicle_id)

  const handleSave = () => {
    onUpdate(task.id, editData)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    setIsAddingComment(true)
    try {
      await onAddComment(task.id, newComment, 'Current User')
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setEditData({ ...editData, tags })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />
      case 'Blocked':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Task Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {getStatusIcon(task.status)}
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-2 py-1 text-sm font-semibold border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <h3 className="text-sm font-semibold text-slate-900">{task.name}</h3>
              )}
              <p className="text-xs text-slate-600">
                {vehicle ? `${vehicle.id} - ${vehicle.type} (${vehicle.location})` : 'No vehicle assigned'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex space-x-2">
                <select
                  value={editData.priority || 'Medium'}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value as Task['priority'] })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select
                  value={editData.status || 'Pending'}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as Task['status'] })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
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
                <button
                  onClick={onToggleExpansion}
                  className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-slate-600">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              {isEditing ? (
                <select
                  value={editData.assigned_to || ''}
                  onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                  className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              ) : (
                <span>{task.assigned_to}</span>
              )}
            </div>
            {task.estimated_duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_duration}min</span>
              </div>
            )}
            {task.start_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(task.start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onToggleExpansion}
            className="flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900"
          >
            <MessageSquare className="w-3 h-3" />
            <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>

      {/* Task Description */}
      {(task.description || isEditing) && (
        <div className="px-4 py-3 bg-slate-50">
          {isEditing ? (
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Task description..."
            />
          ) : (
            <p className="text-sm text-slate-700">{task.description}</p>
          )}
        </div>
      )}

      {/* Tags */}
      {(task.tags && task.tags.length > 0) || isEditing ? (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          {isEditing ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={editData.tags?.join(', ') || ''}
                onChange={(e) => handleTagInput(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., installation, gps, urgent"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {task.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200"
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Task Actions */}
      {!isEditing && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {task.status === 'Pending' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'In Progress')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 flex items-center space-x-1"
                >
                  <Activity className="w-3 h-3" />
                  <span>Start Task</span>
                </button>
              )}
              {task.status === 'In Progress' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Completed')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Complete</span>
                </button>
              )}
              {task.status === 'Blocked' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Pending')}
                  className="px-3 py-1 text-xs bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200"
                >
                  Unblock
                </button>
              )}
              {task.status !== 'Blocked' && (
                <button
                  onClick={() => onStatusUpdate(task.id, 'Blocked')}
                  className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Block</span>
                </button>
              )}
            </div>
            
            <button
              onClick={onToggleExpansion}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details with Nested Comments */}
      {isExpanded && !isEditing && (
        <div className="border-t border-slate-200 bg-white">
          <div className="p-4">
            {/* Task Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Start Date</span>
                </div>
                <span className="text-slate-600">{task.start_date || 'Not set'}</span>
              </div>
              <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Duration</span>
                </div>
                <span className="text-slate-600">{task.duration_days || 1} day(s)</span>
              </div>
            </div>

            {/* Vehicle Details */}
            {vehicle && (
              <div className="bg-blue-50 rounded-md p-3 border border-blue-200 mb-4">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Vehicle Details</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span className="text-blue-700">GPS: {vehicle.gps_required}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Fuel className="w-3 h-3 text-green-600" />
                    <span className="text-blue-700">Sensors: {vehicle.fuel_sensors}</span>
                  </div>
                </div>
              </div>
            )}
            
            {task.notes && (
              <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200 mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Notes</span>
                </div>
                <p className="text-sm text-yellow-700">{task.notes}</p>
              </div>
            )}

            {/* Comments Section - Nested under task */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <h4 className="text-base font-semibold text-slate-900">
                  Comments ({comments.length})
                </h4>
              </div>
              
              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add Comment Form */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isAddingComment}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingComment ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>{isAddingComment ? 'Adding...' : 'Add Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard'

export default TaskDataManager