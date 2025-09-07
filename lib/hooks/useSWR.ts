'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { Vehicle, Location, TeamMember, Task } from '@/lib/supabase/types'

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

// Vehicles hook
export function useVehiclesSWR() {
  return useSWR<Vehicle[]>(
    'vehicles',
    () => fetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )
}

// Locations hook
export function useLocationsSWR() {
  return useSWR<Location[]>(
    'locations',
    () => fetcher<Location>('locations'),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Team members hook
export function useTeamMembersSWR() {
  return useSWR<TeamMember[]>(
    'team_members',
    () => fetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
    }
  )
}

// Tasks hook
export function useTasksSWR() {
  return useSWR<Task[]>(
    'tasks',
    () => fetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
    }
  )
}