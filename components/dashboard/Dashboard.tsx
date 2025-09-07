'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ProjectStats } from './ProjectStats'
import { LocationOverview } from './LocationOverview'
import { ProjectCountdown } from '../ui/ProjectCountdown'
import { useProjectSettings } from '@/lib/hooks/useSupabase'
import { LoadingSpinner } from '../ui/LoadingSpinner'

// Lazy load heavy components for faster initial load
const LazyProjectStats = dynamic(() => import('./ProjectStats').then(mod => ({ default: mod.ProjectStats })), {
  loading: () => <LoadingSpinner text="Loading statistics..." />,
  ssr: false,
})

const LazyLocationOverview = dynamic(() => import('./LocationOverview').then(mod => ({ default: mod.LocationOverview })), {
  loading: () => <LoadingSpinner text="Loading locations..." />,
  ssr: false,
})

export function Dashboard() {
  const { projectSettings } = useProjectSettings()
  const currentStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Monitor project progress and manage installation schedules
        </p>
      </div>

      {/* Project Countdown */}
      <ProjectCountdown 
        startDate={currentStartDate}
        onCountdownComplete={() => console.log('Project started!')}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<LoadingSpinner text="Loading statistics..." />}>
          <LazyProjectStats />
        </Suspense>
        <Suspense fallback={<LoadingSpinner text="Loading locations..." />}>
          <LazyLocationOverview />
        </Suspense>
      </div>
    </div>
  )
}