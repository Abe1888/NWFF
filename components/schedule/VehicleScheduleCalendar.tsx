'use client';

import React, { useState, memo, useMemo, useCallback } from 'react';
import { 
  Calendar, Clock, MapPin, Truck, Navigation, Fuel, CheckCircle2, AlertTriangle, 
  Activity, Target, RefreshCw, Filter, Search, ChevronLeft, ChevronRight,
  Users, Edit, Save, X, Move, RotateCcw, AlertCircle, Info
} from 'lucide-react';
import { useVehiclesSWR, useLocationsSWR, useTeamMembersSWR } from '@/lib/hooks/useSWR';
import { supabase } from '@/lib/supabase/client';
import { db } from '@/lib/supabase/database';
import { Vehicle } from '@/lib/supabase/types';
import { useProjectSettings } from '@/lib/hooks/useProjectSettings';
import { calculateDateForDay } from '@/lib/utils/projectUtils';

interface VehicleScheduleCalendarProps {
  className?: string;
}

interface RescheduleModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onConfirm: (vehicleId: string, newDay: number, newTimeSlot: string) => Promise<void>;
  availableDays: number[];
  currentDay: number;
  currentTimeSlot: string;
}

const timeSlots = [
  '08:00-10:00', '10:00-12:00', '12:00-14:00', 
  '14:00-16:00', '16:00-18:00', '18:00-20:00'
];

const RescheduleModal: React.FC<RescheduleModalProps> = memo(({ 
  isOpen, vehicle, onClose, onConfirm, availableDays, currentDay, currentTimeSlot 
}) => {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(currentTimeSlot);
  const [isLoading, setIsLoading] = useState(false);
  const { projectSettings } = useProjectSettings();

  const handleConfirm = async () => {
    if (!vehicle || (selectedDay === currentDay && selectedTimeSlot === currentTimeSlot)) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(vehicle.id, selectedDay, selectedTimeSlot);
      onClose();
    } catch (error) {
      console.error('Failed to reschedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !vehicle) return null;

  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];
  const newInstallationDate = calculateDateForDay(projectStartDate, selectedDay);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reschedule Installation
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Vehicle: {vehicle.id}</h4>
                <p className="text-sm text-blue-700">{vehicle.type} • {vehicle.location}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Current: Day {currentDay} • {currentTimeSlot}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableDays.map(day => (
                <option key={day} value={day}>
                  Day {day} ({new Date(calculateDateForDay(projectStartDate, day)).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Time Slot
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedTimeSlot === slot
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {selectedDay !== currentDay || selectedTimeSlot !== currentTimeSlot ? (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">New Schedule</p>
                  <p className="text-sm text-green-700">
                    Day {selectedDay} • {selectedTimeSlot}
                  </p>
                  <p className="text-xs text-green-600">
                    {new Date(newInstallationDate).toLocaleDateString()} • {selectedTimeSlot}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Select a different day or time slot to reschedule
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (selectedDay === currentDay && selectedTimeSlot === currentTimeSlot)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>Reschedule</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const VehicleScheduleCalendar: React.FC<VehicleScheduleCalendarProps> = memo(({ className }) => {
  const { data: vehicles = [], isLoading: vehiclesLoading, mutate: refetchVehicles } = useVehiclesSWR();
  const { data: locations = [] } = useLocationsSWR();
  const { data: teamMembers = [] } = useTeamMembersSWR();
  const { projectSettings } = useProjectSettings();
  
  // State for rescheduling
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    vehicle: null as Vehicle | null,
  });
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);

  // Get current project start date
  const projectStartDate = projectSettings?.project_start_date || new Date().toISOString().split('T')[0];
  
  // Calculate days and weeks
  const totalDays = 14; // 2-week project
  const daysPerWeek = 7;
  const totalWeeks = Math.ceil(totalDays / daysPerWeek);
  
  const getCurrentWeekDays = useMemo(() => {
    const start = currentWeek * daysPerWeek + 1;
    const end = Math.min(start + daysPerWeek - 1, totalDays);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentWeek, totalDays, daysPerWeek]);

  // Group vehicles by day and time slot
  const getVehiclesByDayAndTime = useMemo(() => {
    const filtered = vehicles.filter(vehicle => {
      const locationMatch = selectedLocation === 'All' || vehicle.location === selectedLocation;
      const statusMatch = selectedStatus === 'All' || vehicle.status === selectedStatus;
      const searchMatch = searchTerm === '' || 
        vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return locationMatch && statusMatch && searchMatch;
    });

    const grouped: Record<number, Record<string, Vehicle[]>> = {};
    
    filtered.forEach(vehicle => {
      if (!grouped[vehicle.day]) {
        grouped[vehicle.day] = {};
      }
      if (!grouped[vehicle.day][vehicle.time_slot]) {
        grouped[vehicle.day][vehicle.time_slot] = [];
      }
      grouped[vehicle.day][vehicle.time_slot].push(vehicle);
    });

    return grouped;
  }, [vehicles, selectedLocation, selectedStatus, searchTerm]);

  // Available days for rescheduling (all project days)
  const availableDays = useMemo(() => 
    Array.from({ length: totalDays }, (_, i) => i + 1),
    [totalDays]
  );

  // Reschedule functionality
  const handleRescheduleClick = useCallback((vehicle: Vehicle) => {
    setRescheduleModal({
      isOpen: true,
      vehicle,
    });
  }, []);

  const handleRescheduleConfirm = useCallback(async (vehicleId: string, newDay: number, newTimeSlot: string) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        day: newDay,
        time_slot: newTimeSlot,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      // Refetch vehicles to update the calendar
      await refetchVehicles();
    } catch (error) {
      console.error('Failed to reschedule vehicle:', error);
      throw error;
    }
  }, [refetchVehicles]);

  const handleStatusUpdate = useCallback(async (vehicleId: string, status: Vehicle['status']) => {
    try {
      const { error } = await db.vehicles.update(vehicleId, {
        status, 
        updated_at: new Date().toISOString() 
      });

      if (error) throw error;
      await refetchVehicles();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
    }
  }, [refetchVehicles]);

  // Utility functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'In Progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  }, []);

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Installation Schedule Calendar</h2>
          <p className="text-gray-600">Manage vehicle installation schedules with drag-and-drop rescheduling</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetchVehicles()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vehicles..."
                className="pl-10 input"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="input"
            >
              <option value="All">All Locations</option>
              {Array.from(new Set(locations.map(l => l.name))).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Week</span>
          </button>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">
              Week {currentWeek + 1} of {totalWeeks}
            </h3>
            <p className="text-sm text-gray-600">
              Days {getCurrentWeekDays[0]} - {getCurrentWeekDays[getCurrentWeekDays.length - 1]}
            </p>
          </div>
          
          <button
            onClick={() => setCurrentWeek(Math.min(totalWeeks - 1, currentWeek + 1))}
            disabled={currentWeek >= totalWeeks - 1}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next Week</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50">
          <div className="p-3 border-r border-gray-200">
            <span className="font-medium text-gray-900">Time Slot</span>
          </div>
          {getCurrentWeekDays.map(day => (
            <div key={day} className="p-3 border-r border-gray-200 last:border-r-0 text-center">
              <div className="font-medium text-gray-900">Day {day}</div>
              <div className="text-xs text-gray-600">
                {new Date(calculateDateForDay(projectStartDate, day)).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {timeSlots.map(timeSlot => (
          <div key={timeSlot} className="grid grid-cols-8 border-t border-gray-200">
            <div className="p-3 border-r border-gray-200 bg-gray-50 font-medium text-gray-900">
              {timeSlot}
            </div>
            {getCurrentWeekDays.map(day => (
              <div key={`${day}-${timeSlot}`} className="p-2 border-r border-gray-200 last:border-r-0 min-h-[100px]">
                {getVehiclesByDayAndTime[day]?.[timeSlot]?.map(vehicle => (
                  <div
                    key={vehicle.id}
                    className={`mb-2 p-2 rounded-lg border text-xs ${getStatusColor(vehicle.status)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleRescheduleClick(vehicle)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{vehicle.id}</span>
                      {getStatusIcon(vehicle.status)}
                    </div>
                    <div className="text-xs opacity-75">
                      <div>{vehicle.type}</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{vehicle.location}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Navigation className="w-3 h-3" />
                          <span>{vehicle.gps_required}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Fuel className="w-3 h-3" />
                          <span>{vehicle.fuel_sensors}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-current border-opacity-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRescheduleClick(vehicle);
                        }}
                        className="flex items-center space-x-1 text-xs hover:underline"
                      >
                        <Move className="w-3 h-3" />
                        <span>Reschedule</span>
                      </button>
                      <select
                        value={vehicle.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(vehicle.id, e.target.value as Vehicle['status']);
                        }}
                        className="text-xs border-none bg-transparent p-0 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={rescheduleModal.isOpen}
        vehicle={rescheduleModal.vehicle}
        onClose={() => setRescheduleModal({ isOpen: false, vehicle: null })}
        onConfirm={handleRescheduleConfirm}
        availableDays={availableDays}
        currentDay={rescheduleModal.vehicle?.day || 1}
        currentTimeSlot={rescheduleModal.vehicle?.time_slot || '08:00-10:00'}
      />
    </div>
  );
});

VehicleScheduleCalendar.displayName = 'VehicleScheduleCalendar';
RescheduleModal.displayName = 'RescheduleModal';

export default VehicleScheduleCalendar;
