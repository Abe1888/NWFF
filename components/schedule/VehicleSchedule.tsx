'use client'

import React, { useState } from 'react'
import { Calendar, List, Grid } from 'lucide-react'
import OptimizedVehicleSchedule from './OptimizedVehicleSchedule'
import VehicleScheduleCalendar from './VehicleScheduleCalendar'

export function VehicleSchedule() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('calendar')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar View</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>List View</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-screen">
        {activeTab === 'calendar' ? (
          <VehicleScheduleCalendar />
        ) : (
          <OptimizedVehicleSchedule />
        )}
      </div>
    </div>
  )
}
