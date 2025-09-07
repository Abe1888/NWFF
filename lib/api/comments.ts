import { supabase } from '@/lib/supabase/client'

export interface Comment {
  id: string
  task_id: string
  text: string
  author: string
  created_at: string
}

export interface CommentCreateData {
  task_id: string
  text: string
  author: string
}

/**
 * Fetch comments for a task
 */
export async function getTaskComments(taskId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
}

/**
 * Create a new comment
 */
export async function createComment(commentData: CommentCreateData): Promise<Comment> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        ...commentData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error creating comment:', error)
    throw error
  }
}

/**
 * Update a comment
 */
export async function updateComment(id: string, text: string): Promise<Comment> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error updating comment:', error)
    throw error
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

/**
 * Get all comments with task and vehicle information
 */
export async function getAllCommentsWithContext(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        tasks (
          name,
          vehicle_id,
          vehicles (
            id,
            type,
            location
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch comments with context: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error fetching comments with context:', error)
    throw error
  }
}