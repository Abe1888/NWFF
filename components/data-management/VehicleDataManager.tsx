'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Truck, Plus, Edit3, Trash2, Search, Filter, RefreshCw, Save, X,
  AlertTriangle, CheckCircle2, Navigation, Fuel, Clock, MapPin
} from 'lucide-react'
import { useVehiclesOptimized, useLocationsOptimized } from '@/lib/hooks/useOptimizedSWR'
import { vehicleManager, DataValidator } from '@/lib/api/dataManager'
import type { Vehicle } from '@/lib/supabase/types'

const VehicleDataManager = () => {
  const { data: vehicles = [], isLoading, error, mutate } = useVehiclesOptimized()
  const { data: locations = [] } = useLocationsOptimized()
  
  // State management
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('All')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'day' | 'location' | 'status' | 'type'>('day')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Form state
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    id: '',
    type: '',
    location: '',
    day: 1,
    time_slot: '',
    status: 'Pending',
    gps_required: 1,
    fuel_sensors: 1,
    fuel_tanks: 1
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle => {
      const locationMatch = selectedLocation === 'All' || vehicle.location === selectedLocation
      const statusMatch = selectedStatus === 'All' || vehicle.status === selectedStatus
      const searchMatch = searchTerm === '' || 
        vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(searchTerm.toLowerCase())
      
      return locationMatch && statusMatch && searchMatch
    })

    // Sort vehicles
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'day':
          aValue = a.day
          bValue = b.day
          break
        case 'location':
          aValue = a.location
          bValue = b.location
          break
        case 'status':
          const statusOrder = { 'In Progress': 3, 'Pending': 2, 'Completed': 1 }
          aValue = statusOrder[a.status as keyof typeof statusOrder]
          bValue = statusOrder[b.status as keyof typeof statusOrder]
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [vehicles, selectedLocation, selectedStatus, searchTerm, sortBy, sortOrder])

  // CRUD operations
  const handleCreate = useCallback(async () => {
    // The create method in vehicleManager expects 'Omit<Vehicle, 'created_at' | 'updated_at'>'
    // but the form gives a Partial<Vehicle>. We need to ensure required fields are there.
    const vehicleDataForCreation = {
        id: formData.id || '', // Ensure id is not undefined
        type: formData.type || '',
        location: formData.location || '',
        day: formData.day || 1,
        time_slot: formData.time_slot || '',
        status: formData.status || 'Pending',
        gps_required: formData.gps_required || 1,
        fuel_sensors: formData.fuel_sensors || 1,
        fuel_tanks: formData.fuel_tanks || 1,
    };

    const errors = DataValidator.validateVehicle(vehicleDataForCreation)
    setFormErrors(errors)
    
    if (errors.length > 0) return

    setIsSubmitting(true)
    try {
      await vehicleManager.create(vehicleDataForCreation)
      await mutate()
      setFormData({
        id: '',
        type: '',
        location: '',
        day: 1,
        time_slot: '',
        status: 'Pending',
        gps_required: 1,
        fuel_sensors: 1,
        fuel_tanks: 1
      })
      setShowAddForm(false)
      setFormErrors([]);
    } catch (error) {
      console.error('Failed to create vehicle:', error)
      setFormErrors(['Failed to create vehicle. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mutate])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Vehicle>) => {
    const errors = DataValidator.validateVehicle(updates)
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      await vehicleManager.update(id, updates)
      await mutate()
      setEditingVehicle(null)
    } catch (error) {
      console.error('Failed to update vehicle:', error)
      setFormErrors(['Failed to update vehicle. Please try again.'])
    }
  }, [mutate])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await vehicleManager.delete(id)
      await mutate()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
    }
  }, [mutate])

  const handleStatusUpdate = useCallback(async (id: string, status: Vehicle['status']) => {
    try {
      await vehicleManager.update(id, { status })
      await mutate()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [mutate])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Vehicle Management</h3>
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
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md"
          >
            <option value="All">All Locations</option>
            {locations.map(location => (
              <option key={location.name} value={location.name}>{location.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field as any)
              setSortOrder(order as any)
            }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md"
          >
            <option value="day-asc">Day (Ascending)</option>
            <option value="day-desc">Day (Descending)</option>
            <option value="location-asc">Location (A-Z)</option>
            <option value="location-desc">Location (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="type-desc">Type (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Vehicle</h3>
            <button
              onClick={() => setShowAddForm(false)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle ID</label>
              <input
                type="text"
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                placeholder="e.g., V025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
              <input
                type="text"
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                placeholder="Enter vehicle type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <select
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Select location...</option>
                {locations.map(location => (
                  <option key={location.name} value={location.name}>{location.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
              <input
                type="number"
                min="1"
                max="14"
                value={formData.day || 1}
                onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
              <select
                value={formData.time_slot || ''}
                onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Select time slot...</option>
                <option value="8:30–11:30 AM">8:30–11:30 AM</option>
                <option value="1:30–5:30 PM">1:30–5:30 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status || 'Pending'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Vehicle['status'] })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GPS Devices</label>
              <input
                type="number"
                min="1"
                value={formData.gps_required || 1}
                onChange={(e) => setFormData({ ...formData, gps_required: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Sensors</label>
              <input
                type="number"
                min="1"
                value={formData.fuel_sensors || 1}
                onChange={(e) => setFormData({ ...formData, fuel_sensors: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Tanks</label>
              <input
                type="number"
                min="1"
                value={formData.fuel_tanks || 1}
                onChange={(e) => setFormData({ ...formData, fuel_tanks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="btn-primary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Creating...' : 'Create Vehicle'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            isEditing={editingVehicle === vehicle.id}
            onEdit={() => setEditingVehicle(vehicle.id)}
            onCancelEdit={() => setEditingVehicle(null)}
            onUpdate={handleUpdate}
            onDelete={() => setDeleteConfirm(vehicle.id)}
            onStatusUpdate={handleStatusUpdate}
            locations={locations}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && !isLoading && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Vehicles Found</h3>
          <p className="text-sm text-slate-600 mb-4">
            {searchTerm || selectedLocation !== 'All' || selectedStatus !== 'All'
              ? 'Try adjusting your filters to see more vehicles.'
              : 'No vehicles have been added yet.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add First Vehicle
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Vehicle</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete vehicle {deleteConfirm}? All associated tasks and data will be permanently removed.
            </p>
            
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
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Vehicle Card Component
interface VehicleCardProps {
  vehicle: Vehicle
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (id: string, updates: Partial<Vehicle>) => void
  onDelete: () => void
  onStatusUpdate: (id: string, status: Vehicle['status']) => void
  locations: any[]
}

const VehicleCard = React.memo((props: VehicleCardProps) => { 
  const { 
    vehicle, 
    isEditing, 
    onEdit, 
    onCancelEdit, 
    onUpdate, 
    onDelete, 
    onStatusUpdate,
    locations 
  } = props;
  const [editData, setEditData] = useState<Partial<Vehicle>>(vehicle)

  const handleSave = () => {
    onUpdate(vehicle.id, editData)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'In Progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-slate-600" />
            {isEditing ? (
              <input
                type="text"
                value={editData.id || ''}
                onChange={(e) => setEditData({ ...editData, id: e.target.value })}
                className="text-sm font-semibold bg-white border border-slate-300 rounded px-2 py-1"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-900">{vehicle.id}</span>
            )}
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Vehicle Type */}
        <div>
          <label className="text-xs font-medium text-slate-700">Type</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.type || ''}
              onChange={(e) => setEditData({ ...editData, type: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
            />
          ) : (
            <div className="text-sm text-slate-900 truncate">{vehicle.type}</div>
          )}
        </div>

        {/* Location and Day */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700">Location</label>
            {isEditing ? (
              <select
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
              >
                {locations.map(location => (
                  <option key={location.name} value={location.name}>{location.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span className="text-sm text-slate-900">{vehicle.location}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Day</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="14"
                value={editData.day || 1}
                onChange={(e) => setEditData({ ...editData, day: Number(e.target.value) })}
                className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
            ) : (
              <div className="text-sm text-slate-900 mt-1">Day {vehicle.day}</div>
            )}
          </div>
        </div>

        {/* Time Slot */}
        <div>
          <label className="text-xs font-medium text-slate-700">Time Slot</label>
          {isEditing ? (
            <select
              value={editData.time_slot || ''}
              onChange={(e) => setEditData({ ...editData, time_slot: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
            >
              <option value="8:30–11:30 AM">8:30–11:30 AM</option>
              <option value="1:30–5:30 PM">1:30–5:30 PM</option>
            </select>
          ) : (
            <div className="flex items-center space-x-1 mt-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-sm text-slate-900">{vehicle.time_slot}</span>
            </div>
          )}
        </div>

        {/* Equipment */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700">GPS</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                value={editData.gps_required || 1}
                onChange={(e) => setEditData({ ...editData, gps_required: Number(e.target.value) })}
                className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
            ) : (
              <div className="flex items-center space-x-1 mt-1">
                <Navigation className="w-3 h-3 text-blue-600" />
                <span className="text-sm text-slate-900">{vehicle.gps_required}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Sensors</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                value={editData.fuel_sensors || 1}
                onChange={(e) => setEditData({ ...editData, fuel_sensors: Number(e.target.value) })}
                className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
            ) : (
              <div className="flex items-center space-x-1 mt-1">
                <Fuel className="w-3 h-3 text-green-600" />
                <span className="text-sm text-slate-900">{vehicle.fuel_sensors}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Tanks</label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                value={editData.fuel_tanks || 1}
                onChange={(e) => setEditData({ ...editData, fuel_tanks: Number(e.target.value) })}
                className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded"
              />
            ) : (
              <div className="text-sm text-slate-900 mt-1">{vehicle.fuel_tanks}</div>
            )}
          </div>
        </div>

        {/* Status and Actions */}
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
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(vehicle.status)}`}>
                {getStatusIcon(vehicle.status)}
                <span className="ml-1">{vehicle.status}</span>
              </span>
              
              <div className="flex space-x-1">
                {vehicle.status === 'Pending' && (
                  <button
                    onClick={() => onStatusUpdate(vehicle.id, 'In Progress')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Start
                  </button>
                )}
                {vehicle.status === 'In Progress' && (
                  <button
                    onClick={() => onStatusUpdate(vehicle.id, 'Completed')}
                    className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Complete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

VehicleCard.displayName = 'VehicleCard'

export default VehicleDataManager