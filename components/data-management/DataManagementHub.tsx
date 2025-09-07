'use client'

import React, { useState, memo } from 'react'
import { 
  Database, Truck, MapPin, Users, CheckSquare, MessageSquare,
  Plus, Edit3, Trash2, Search, Filter, RefreshCw, Save, X, Settings
} from 'lucide-react'
import VehicleDataManager from './VehicleDataManager'
import LocationDataManager from './LocationDataManager'
import TeamMemberDataManager from './TeamMemberDataManager'
import TaskDataManager from './TaskDataManager'
import CommentDataManager from './CommentDataManager'
import ProjectDataSeeder from '../ui/ProjectDataSeeder'
import DatabaseTest from '../ui/DatabaseTest'

type DataType = 'project_seeder' | 'database_test' | 'vehicles' | 'locations' | 'team_members' | 'tasks' | 'comments'

const DataManagementHub = memo(() => {
  const [activeTab, setActiveTab] = useState<DataType>('database_test')

  const tabs = [
    { id: 'database_test', label: 'Database Test', icon: Database, component: DatabaseTest },
    { id: 'project_seeder', label: 'Project Setup', icon: Settings, component: ProjectDataSeeder },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, component: VehicleDataManager },
    { id: 'locations', label: 'Locations', icon: MapPin, component: LocationDataManager },
    { id: 'team_members', label: 'Team Members', icon: Users, component: TeamMemberDataManager },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, component: TaskDataManager },
    { id: 'comments', label: 'Comments', icon: MessageSquare, component: CommentDataManager },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-600 rounded-md flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Data Management Hub</h2>
              <p className="text-sm text-slate-600">Complete CRUD operations for all system data</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DataType)}
                  className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Active Component */}
      <div className="animate-fade-in">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
})

DataManagementHub.displayName = 'DataManagementHub'

export default DataManagementHub