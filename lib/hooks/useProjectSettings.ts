'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { ProjectSettings } from '@/lib/supabase/types'

// Generic fetcher function
async function fetcher<T>(
  table: string,
  select: string = '*',
  orderBy?: { column: string; ascending?: boolean }
): Promise<T[]> {
  let query = supabase.from(table).select(select)
  
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
  }
  
  const { data, error } = await query
  
  if (error) {
    throw new Error(`Failed to fetch ${table}: ${error.message}`)
  }
  
  return data || []
}

// Project settings hook
export function useProjectSettings() {
  const { data, error, mutate, isLoading } = useSWR<ProjectSettings[]>(
    'project_settings',
    () => fetcher<ProjectSettings>('project_settings'),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )

  const projectSettings = data?.[0]

  const updateProjectStartDate = async (newDate: string) => {
    const { error } = await supabase
      .from('project_settings')
      .upsert({
        id: 'default',
        project_start_date: newDate,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      throw new Error(`Failed to update project start date: ${error.message}`)
    }

    mutate()
  }

  const resetProject = async () => {
    // Reset all vehicles to pending
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ 
        status: 'Pending',
        updated_at: new Date().toISOString()
      })
      .neq('id', '')

    if (vehicleError) {
      throw new Error(`Failed to reset vehicles: ${vehicleError.message}`)
    }

    // Reset all tasks to pending
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ 
        status: 'Pending',
        updated_at: new Date().toISOString()
      })
      .neq('id', '')

    if (taskError) {
      throw new Error(`Failed to reset tasks: ${taskError.message}`)
    }

    // Trigger revalidation of all data
    mutate()
  }

  return {
    projectSettings,
    loading: isLoading,
    error,
    updateProjectStartDate,
    resetProject,
    mutate,
  }
}