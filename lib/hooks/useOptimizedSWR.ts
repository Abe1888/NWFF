'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import type { Vehicle, Location, TeamMember, Task } from '@/lib/supabase/types'

// Generic fetcher function with caching
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

// Optimized vehicles hook with aggressive caching
export function useVehiclesOptimized() {
  return useSWR<Vehicle[]>(
    'vehicles-optimized',
    () => fetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
      dedupingInterval: 10000,
      errorRetryCount: 2,
      errorRetryInterval: 2000,
    }
  )
}

// Optimized locations hook
export function useLocationsOptimized() {
  return useSWR<Location[]>(
    'locations-optimized',
    () => fetcher<Location>('locations'),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
      dedupingInterval: 30000,
    }
  )
}

// Optimized team members hook
export function useTeamMembersOptimized() {
  return useSWR<TeamMember[]>(
    'team_members-optimized',
    () => fetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
      dedupingInterval: 30000,
    }
  )
}

// Optimized tasks hook
export function useTasksOptimized() {
  return useSWR<Task[]>(
    'tasks-optimized',
    () => fetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }),
    {
      revalidateOnFocus: false,
      refreshInterval: 15000,
      dedupingInterval: 5000,
    }
  )
}

// Prefetch functions for instant navigation
export function prefetchVehiclesOptimized() {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }).catch(() => {})
      })
    } else {
      setTimeout(() => {
        fetcher<Vehicle>('vehicles', '*', { column: 'day', ascending: true }).catch(() => {})
      }, 0)
    }
  }
}

export function prefetchLocationsOptimized() {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetcher<Location>('locations').catch(() => {})
      })
    } else {
      setTimeout(() => {
        fetcher<Location>('locations').catch(() => {})
      }, 0)
    }
  }
}

export function prefetchTeamMembersOptimized() {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }).catch(() => {})
      })
    } else {
      setTimeout(() => {
        fetcher<TeamMember>('team_members', '*', { column: 'name', ascending: true }).catch(() => {})
      }, 0)
    }
  }
}

export function prefetchTasksOptimized() {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }).catch(() => {})
      })
    } else {
      setTimeout(() => {
        fetcher<Task>('tasks', '*', { column: 'created_at', ascending: false }).catch(() => {})
      }, 0)
    }
  }
}

export function prefetchAllDataOptimized() {
  if (typeof window !== 'undefined') {
    // Stagger prefetch calls to avoid overwhelming the browser
    prefetchVehiclesOptimized()
    setTimeout(() => prefetchLocationsOptimized(), 50)
    setTimeout(() => prefetchTeamMembersOptimized(), 100)
    setTimeout(() => prefetchTasksOptimized(), 150)
  }
}