'use client'

import React, { useMemo } from 'react'
import { 
  Calendar, MapPin, Truck, Navigation, Fuel, Users, 
  BarChart3, AlertTriangle 
} from 'lucide-react'
import { useVehicles, useLocations, useTeamMembers } from '@/lib/hooks/useSupabase'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function ProjectStats() {
  const { data: vehicles = [], isLoading: vehiclesLoading, error: vehiclesError } = useVehicles()
  const { data: locations = [], isLoading: locationsLoading } = useLocations()
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers()
  
  const loading = vehiclesLoading || locationsLoading || teamLoading
  
  // Memoize expensive calculations
  const stats = useMemo(() => {
    const totalGpsDevices = locations.reduce((sum, loc) => sum + (loc.gps_devices || 0), 0)
    const totalFuelSensors = locations.reduce((sum, loc) => sum + (loc.fuel_sensors || 0), 0)
    const totalVehicles = vehicles.length
    const completedVehicles = vehicles.filter(v => v.status === 'Completed').length
    const progressPercentage = totalVehicles > 0 ? Math.round((completedVehicles / totalVehicles) * 100) : 0
    const specialRequirements = vehicles.filter(v => (v.fuel_tanks || 0) > 1).length
    
    return {
      totalGpsDevices,
      totalFuelSensors,
      totalVehicles,
      completedVehicles,
      progressPercentage,
      specialRequirements
    }
  }, [vehicles, locations])
  
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
                <span className="text-2xl font-bold text-blue-900">{stats.totalVehicles}</span>
              </div>
              <div className="text-xs text-blue-700">Across 3 major locations</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Special Requirements</span>
                </div>
                <span className="text-2xl font-bold text-orange-900">{stats.specialRequirements}</span>
              </div>
              <div className="text-xs text-orange-700">Double fuel tank vehicles</div>
            </div>
          </div>

          {/* Equipment Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Equipment</h4>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">GPS Devices</span>
                </div>
                <span className="text-2xl font-bold text-green-900">{stats.totalGpsDevices}</span>
              </div>
              <div className="text-xs text-green-700">One per vehicle</div>
            </div>

            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-teal-800">Fuel Sensors</span>
                </div>
                <span className="text-2xl font-bold text-teal-900">{stats.totalFuelSensors}</span>
              </div>
              <div className="text-xs text-teal-700">Including double-tank configs</div>
            </div>
          </div>

          {/* Timeline Statistics */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Project Duration</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">14</span>
              </div>
              <div className="text-xs text-purple-700">Working days</div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">Team Members</span>
                </div>
                <span className="text-2xl font-bold text-indigo-900">{teamMembers.length}</span>
              </div>
              <div className="text-xs text-indigo-700">Installation technicians</div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Location Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
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
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{location.vehicles}</div>
                    <div className="text-xs text-gray-600">Vehicles</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{location.gps_devices}</div>
                    <div className="text-xs text-blue-600">GPS</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{location.fuel_sensors}</div>
                    <div className="text-xs text-green-600">Sensors</div>
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