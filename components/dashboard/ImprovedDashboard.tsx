'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ProjectCountdown } from '../ui/ProjectCountdown'
import { useProjectSettingsApi, useProjectStatsApi } from '@/lib/hooks/useApi'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import ApiErrorBoundary from '../ui/ApiErrorBoundary'

// Lazy load components for better performance
const ProjectStats = dynamic(() => import('./ImprovedProjectStats'), {
  loading: () => <LoadingSpinner text="Loading statistics..." />,
  ssr: false,
})

const LocationOverview = dynamic(() => import('./ImprovedLocationOverview'), {
  loading: () => <LoadingSpinner text="Loading locations..." />,
  ssr: false,
})

export function ImprovedDashboard() {
  const { data: projectSettings } = useProjectSettingsApi()
  const { data: projectStats, mutate: refreshStats } = useProjectStatsApi()
  
  const currentStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0]

  const handleDataRefresh = () => {
    refreshStats()
  }

  return (
    <ApiErrorBoundary onRetry={handleDataRefresh}>
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
            <ProjectStats />
          </Suspense>
          <Suspense fallback={<LoadingSpinner text="Loading locations..." />}>
            <LocationOverview />
          </Suspense>
        </div>

        {/* Project Overview */}
        {projectStats && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{projectStats.vehicles.total}</div>
                <div className="text-sm text-gray-600">Total Vehicles</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{projectStats.vehicles.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{projectStats.tasks.total}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{projectStats.teamMemberCount}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">{projectStats.projectProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${projectStats.projectProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ApiErrorBoundary>
  )
}