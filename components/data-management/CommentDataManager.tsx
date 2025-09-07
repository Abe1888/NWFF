'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  MessageSquare, Plus, Edit3, Trash2, Search, RefreshCw, Save, X,
  AlertTriangle, User, Calendar, Target, CheckSquare, Send
} from 'lucide-react'
import { useTasksOptimized } from '@/lib/hooks/useOptimizedSWR'
import { commentManager, DataValidator } from '@/lib/api/dataManager'
import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/supabase/database'
import type { Comment, Database } from '@/lib/supabase/types'

const CommentDataManager = () => {
  const { data: tasks = [] } = useTasksOptimized()
  
  // State management
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<string>('All')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'created_at' | 'author' | 'task_id'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Form state
  const [formData, setFormData] = useState<Partial<Comment>>({
    task_id: '',
    text: '',
    author: 'Current User'
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load all comments
  const loadComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load comments on mount
  React.useEffect(() => {
    loadComments()
  }, [loadComments])

  // Get unique authors for filtering
  const uniqueAuthors = useMemo(() => 
    Array.from(new Set(comments.map(c => c.author))),
    [comments]
  )

  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let filtered = comments.filter(comment => {
      const taskMatch = selectedTask === 'All' || comment.task_id === selectedTask
      const authorMatch = selectedAuthor === 'All' || comment.author === selectedAuthor
      const searchMatch = searchTerm === '' || 
        comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.toLowerCase().includes(searchTerm.toLowerCase())
      
      return taskMatch && authorMatch && searchMatch
    })

    // Sort comments
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'author':
          aValue = a.author
          bValue = b.author
          break
        case 'task_id':
          aValue = a.task_id
          bValue = b.task_id
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
  }, [comments, selectedTask, selectedAuthor, searchTerm, sortBy, sortOrder])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    const errors = DataValidator.validateComment(formData)
    setFormErrors(errors)
    
    if (errors.length > 0) return

    setIsSubmitting(true)
    try {
      await commentManager.createForTask(
        formData.task_id!,
        formData.text!,
        formData.author!
      )
      await loadComments()
      setFormData({
        task_id: '',
        text: '',
        author: 'Current User'
      })
      setShowAddForm(false)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to create comment:', error)
      setFormErrors(['Failed to create comment. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, loadComments])

  const handleUpdate = useCallback(async (id: string, text: string) => {
    try {
      const { error } = await db.comments.update(id, { text })

      if (error) throw error
      await loadComments()
      setEditingComment(null)
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }, [loadComments])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const { error } = await db.comments.delete(id)

      if (error) throw error
      await loadComments()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }, [loadComments])

  const getTaskName = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    return task ? task.name : 'Unknown Task'
  }, [tasks])

  const getCommentStats = useMemo(() => {
    const total = comments.length
    const byAuthor = comments.reduce((acc, comment) => {
      acc[comment.author] = (acc[comment.author] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const byTask = comments.reduce((acc, comment) => {
      acc[comment.task_id] = (acc[comment.task_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return { total, byAuthor, byTask }
  }, [comments])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Comment Management</h3>
            <p className="text-sm text-slate-600">Manage task comments and collaboration notes</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadComments}
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
              <span>Add Comment</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{getCommentStats.total}</div>
            <div className="text-xs text-blue-600">Total Comments</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-lg font-semibold text-green-800">{Object.keys(getCommentStats.byAuthor).length}</div>
            <div className="text-xs text-green-600">Active Authors</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-lg font-semibold text-purple-800">{Object.keys(getCommentStats.byTask).length}</div>
            <div className="text-xs text-purple-600">Tasks with Comments</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Tasks</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
          </select>

          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Authors</option>
            {uniqueAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
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
            <option value="created_at-desc">Created (Newest)</option>
            <option value="created_at-asc">Created (Oldest)</option>
            <option value="author-asc">Author (A-Z)</option>
            <option value="author-desc">Author (Z-A)</option>
            <option value="task_id-asc">Task (A-Z)</option>
            <option value="task_id-desc">Task (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Add Comment Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Comment</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Task *</label>
              <select
                value={formData.task_id || ''}
                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select task...</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Author *</label>
              <input
                type="text"
                value={formData.author || ''}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter author name..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment Text *</label>
            <textarea
              value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Enter your comment..."
            />
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
              disabled={isSubmitting || !formData.task_id || !formData.text?.trim() || !formData.author?.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Adding...' : 'Add Comment'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            taskName={getTaskName(comment.task_id)}
            isEditing={editingComment === comment.id}
            onEdit={() => setEditingComment(comment.id)}
            onCancelEdit={() => setEditingComment(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(comment.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredComments.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Comments Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedTask !== 'All' || selectedAuthor !== 'All'
              ? 'Try adjusting your filters to see more comments.'
              : 'No comments have been added yet.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Comment
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
                <h3 className="text-lg font-semibold text-slate-900">Delete Comment</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this comment? This will permanently remove it from the task.
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
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Comment Card Component
interface CommentCardProps {
  comment: Comment
  taskName: string
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (id: string, text: string) => void
  onDelete: () => void
}

const CommentCard = React.memo<CommentCardProps>(({ 
  comment, 
  taskName, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete 
}) => {
  const [editText, setEditText] = useState(comment.text)

  const handleSave = () => {
    onUpdate(comment.id, editText)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      {/* Comment Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{comment.author}</h3>
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <CheckSquare className="w-3 h-3" />
                <span>{taskName}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">
              {new Date(comment.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
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
      </div>

      {/* Comment Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
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
          </div>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{comment.text}</p>
        )}
      </div>
    </div>
  )
})

CommentCard.displayName = 'CommentCard'

export default CommentDataManager