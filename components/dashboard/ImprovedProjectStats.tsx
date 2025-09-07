'use client'

import React from 'react'
import { 
  Calendar, MapPin, Truck, Navigation, Fuel, Users, 
  BarChart3, AlertTriangle, TrendingUp 
} from 'lucide-react'
import { useVehicleStatsApi, useTeamMembersApi, useLocationStatsApi } from '@/lib/hooks/useApi'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export default function ImprovedProjectStats() {
  const { data: vehicleStats, isLoading: vehiclesLoading, error: vehiclesError } = useVehicleStatsApi()
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembersApi()
  const { data: locationStats = [], isLoading: locationsLoading } = useLocationStatsApi()
  
  const loading = vehiclesLoading || teamLoading || locationsLoading
  
  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner text="Loading project statistics..." />
        </div>
      </div>
    )
  }

  if (vehiclesError) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-sm text-gray-600">Failed to load project statistics</p>
        </div>
      </div>
    )
  }

  if (!vehicleStats) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Statistics</h3>
            <p className="text-sm text-gray-600">Comprehensive project overview</p>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Vehicle Fleet</h4>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Vehicles</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{vehicleStats.total}</span>
              </div>
              <div className="text-xs text-blue-700">Across {locationStats.length} locations</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Completed</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{vehicleStats.completed}</span>
              </div>
              <div className="text-xs text-green-700">
                {vehicleStats.total > 0 ? Math.round((vehicleStats.completed / vehicleStats.total) * 100) : 0}% completion rate
              </div>
            </div>
          </div>

          {/* Equipment Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Equipment</h4>
            
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">GPS Devices</span>
                </div>
                <span className="text-2xl font-bold text-indigo-900">{vehicleStats.totalGpsDevices}</span>
              </div>
              <div className="text-xs text-indigo-700">One per vehicle</div>
            </div>

            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Fuel Sensors</span>
                </div>
                <span className="text-2xl font-bold text-teal-900">{vehicleStats.totalFuelSensors}</span>
              </div>
              <div className="text-xs text-teal-700">Including multi-tank configs</div>
            </div>
          </div>

          {/* Timeline Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Project Info</h4>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Duration</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">14</span>
              </div>
              <div className="text-xs text-purple-700">Working days</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Team Size</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{teamMembers.length}</div>
              <div className="text-xs text-orange-700">Installation specialists</div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Location Progress</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationStats.map((location) => (
              <div key={location.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{location.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    {location.duration}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-medium text-gray-900">{location.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${location.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{location.actualVehicles}</div>
                    <div className="text-xs text-gray-600">Vehicles</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{location.completed}</div>
                    <div className="text-xs text-green-600">Done</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{location.pending}</div>
                    <div className="text-xs text-blue-600">Pending</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}