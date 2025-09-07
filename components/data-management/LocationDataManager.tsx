'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  MapPin, Plus, Edit3, Trash2, Search, RefreshCw, Save, X,
  AlertTriangle, Calendar, Users, Navigation, Fuel, TrendingUp
} from 'lucide-react'
import { useLocationsOptimized, useVehiclesOptimized } from '@/lib/hooks/useOptimizedSWR'
import { locationManager, DataValidator } from '@/lib/api/dataManager'
import type { Location } from '@/lib/supabase/types'

const LocationDataManager = () => {
  const { data: locations = [], isLoading, error, mutate } = useLocationsOptimized()
  const { data: vehicles = [] } = useVehiclesOptimized()
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    duration: '',
    vehicles: 0,
    gps_devices: 0,
    fuel_sensors: 0
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const searchMatch = searchTerm === '' || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.duration.toLowerCase().includes(searchTerm.toLowerCase())
      
      return searchMatch
    })
  }, [locations, searchTerm])

  // Get location statistics
  const getLocationStats = useCallback((locationName: string) => {
    const locationVehicles = vehicles.filter(v => v.location === locationName)
    const completed = locationVehicles.filter(v => v.status === 'Completed').length
    const inProgress = locationVehicles.filter(v => v.status === 'In Progress').length
    const pending = locationVehicles.filter(v => v.status === 'Pending').length
    const total = locationVehicles.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    
    const actualGpsDevices = locationVehicles.reduce((sum, v) => sum + v.gps_required, 0)
    const actualFuelSensors = locationVehicles.reduce((sum, v) => sum + v.fuel_sensors, 0)
    
    return {
      total,
      completed,
      inProgress,
      pending,
      progress,
      actualGpsDevices,
      actualFuelSensors
    }
  }, [vehicles])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    const errors = DataValidator.validateLocation(formData)
    setFormErrors(errors)
    
    if (errors.length > 0) return

    setIsSubmitting(true)
    try {
      await locationManager.create(formData as Omit<Location, 'created_at'>)
      await mutate()
      setFormData({
        name: '',
        duration: '',
        vehicles: 0,
        gps_devices: 0,
        fuel_sensors: 0
      })
      setShowAddForm(false)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to create location:', error)
      setFormErrors(['Failed to create location. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mutate])

  const handleUpdate = useCallback(async (name: string, updates: Partial<Location>) => {
    const errors = DataValidator.validateLocation(updates)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      await locationManager.update(name, updates)
      await mutate()
      setEditingLocation(null)
      setFormErrors([])
    } catch (error) {
      console.error('Failed to update location:', error)
      setFormErrors(['Failed to update location. Please try again.'])
    }
  }, [mutate])

  const handleDelete = useCallback(async (name: string) => {
    try {
      await locationManager.delete(name)
      await mutate()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete location:', error)
    }
  }, [mutate])

  const handleSyncCounts = useCallback(async (locationName: string) => {
    const stats = getLocationStats(locationName)
    try {
      await locationManager.update(locationName, {
        vehicles: stats.total,
        gps_devices: stats.actualGpsDevices,
        fuel_sensors: stats.actualFuelSensors
      })
      await mutate()
    } catch (error) {
      console.error('Failed to sync location counts:', error)
    }
  }, [getLocationStats, mutate])

  const getOverallStats = useMemo(() => {
    const totalLocations = locations.length
    const totalVehicles = locations.reduce((sum, loc) => sum + loc.vehicles, 0)
    const totalGpsDevices = locations.reduce((sum, loc) => sum + loc.gps_devices, 0)
    const totalFuelSensors = locations.reduce((sum, loc) => sum + loc.fuel_sensors, 0)
    
    return { totalLocations, totalVehicles, totalGpsDevices, totalFuelSensors }
  }, [locations])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Location Management</h3>
            <p className="text-sm text-slate-600">Manage installation locations and capacity planning</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => mutate()}
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
              <span>Add Location</span>
            </button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-lg font-semibold text-slate-800">{getOverallStats.totalLocations}</div>
            <div className="text-xs text-slate-600">Locations</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{getOverallStats.totalVehicles}</div>
            <div className="text-xs text-blue-600">Total Vehicles</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-lg font-semibold text-green-800">{getOverallStats.totalGpsDevices}</div>
            <div className="text-xs text-green-600">GPS Devices</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-lg font-semibold text-purple-800">{getOverallStats.totalFuelSensors}</div>
            <div className="text-xs text-purple-600">Fuel Sensors</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Location Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Location</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration *</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 8 days, 3 days"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Count</label>
              <input
                type="number"
                min="0"
                value={formData.vehicles || 0}
                onChange={(e) => setFormData({ ...formData, vehicles: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GPS Devices</label>
              <input
                type="number"
                min="0"
                value={formData.gps_devices || 0}
                onChange={(e) => setFormData({ ...formData, gps_devices: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Sensors</label>
              <input
                type="number"
                min="0"
                value={formData.fuel_sensors || 0}
                onChange={(e) => setFormData({ ...formData, fuel_sensors: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
              disabled={isSubmitting || !formData.name?.trim() || !formData.duration?.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create Location'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLocations.map((location) => (
          <LocationCard
            key={location.name}
            location={location}
            stats={getLocationStats(location.name)}
            isEditing={editingLocation === location.name}
            onEdit={() => setEditingLocation(location.name)}
            onCancelEdit={() => setEditingLocation(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(location.name)}
            onSyncCounts={() => handleSyncCounts(location.name)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredLocations.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Locations Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search to see more locations.'
              : 'No locations have been added yet.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Location
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
                <h3 className="text-lg font-semibold text-slate-900">Delete Location</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">Warning:</p>
              <p className="text-sm text-red-700">
                Deleting this location may affect vehicles and tasks that reference it. 
                Make sure to update or remove dependent data first.
              </p>
            </div>
            
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
                Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Location Card Component
interface LocationCardProps {
  location: Location
  stats: any
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (name: string, updates: Partial<Location>) => void
  onDelete: () => void
  onSyncCounts: () => void
}

const LocationCard = React.memo<LocationCardProps>(({ 
  location, 
  stats, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete,
  onSyncCounts
}) => {
  const [editData, setEditData] = useState<Partial<Location>>(location)

  const handleSave = () => {
    onUpdate(location.name, editData)
  }

  const needsSync = location.vehicles !== stats.total || 
                   location.gps_devices !== stats.actualGpsDevices || 
                   location.fuel_sensors !== stats.actualFuelSensors

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Location Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
              <MapPin className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-sm font-semibold bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <h3 className="text-sm font-semibold text-slate-900">{location.name}</h3>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editData.duration || ''}
                  onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                  className="text-xs text-slate-600 bg-white border border-slate-300 rounded px-2 py-1 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8 days"
                />
              ) : (
                <p className="text-xs text-slate-600">{location.duration}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-700">Installation Progress</span>
            <span className="text-xs text-slate-600">{stats.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-slate-900">{stats.total}</div>
            <div className="text-slate-600">Total</div>
          </div>
          <div>
            <div className="font-semibold text-green-600">{stats.completed}</div>
            <div className="text-green-600">Done</div>
          </div>
          <div>
            <div className="font-semibold text-blue-600">{stats.inProgress}</div>
            <div className="text-blue-600">Active</div>
          </div>
          <div>
            <div className="font-semibold text-slate-600">{stats.pending}</div>
            <div className="text-slate-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">Vehicles</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editData.vehicles || 0}
                onChange={(e) => setEditData({ ...editData, vehicles: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="text-lg font-semibold text-blue-900">
                {location.vehicles}
                {needsSync && stats.total !== location.vehicles && (
                  <span className="text-xs text-orange-600 ml-1">({stats.total})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Navigation className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">GPS</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editData.gps_devices || 0}
                onChange={(e) => setEditData({ ...editData, gps_devices: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="text-lg font-semibold text-green-900">
                {location.gps_devices}
                {needsSync && stats.actualGpsDevices !== location.gps_devices && (
                  <span className="text-xs text-orange-600 ml-1">({stats.actualGpsDevices})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Fuel className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-800">Sensors</span>
            </div>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editData.fuel_sensors || 0}
                onChange={(e) => setEditData({ ...editData, fuel_sensors: Number(e.target.value) })}
                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="text-lg font-semibold text-purple-900">
                {location.fuel_sensors}
                {needsSync && stats.actualFuelSensors !== location.fuel_sensors && (
                  <span className="text-xs text-orange-600 ml-1">({stats.actualFuelSensors})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Sync Warning */}
        {needsSync && !isEditing && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Data out of sync</span>
              </div>
              <button
                onClick={onSyncCounts}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200"
              >
                Sync Now
              </button>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Location data doesn't match actual vehicle counts. Click "Sync Now" to update.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          {isEditing ? (
            <div className="flex space-x-2">
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
          ) : (
            <>
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <Calendar className="w-3 h-3" />
                <span>Created: {new Date(location.created_at || '').toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <TrendingUp className={`w-3 h-3 ${
                  stats.progress >= 75 ? 'text-green-600' : 
                  stats.progress >= 50 ? 'text-blue-600' : 
                  stats.progress >= 25 ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className={`text-xs font-medium ${
                  stats.progress >= 75 ? 'text-green-800' : 
                  stats.progress >= 50 ? 'text-blue-800' : 
                  stats.progress >= 25 ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {stats.progress}% Complete
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

LocationCard.displayName = 'LocationCard'

export default LocationDataManager