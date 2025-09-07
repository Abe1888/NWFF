'use client'

import React, { useState } from 'react'
import { Database, RefreshCw, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react'
import { resetAndSeedProject, clearAllData, seedProjectData } from '@/lib/utils/seedProjectData'
import { resetAndSeedCore, clearCoreData, seedCoreProjectData } from '@/lib/utils/seedCoreData'

export default function ProjectDataSeeder() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleResetAndSeed = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await resetAndSeedProject()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedOnly = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await seedProjectData()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearOnly = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await clearAllData()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Data Management</h3>
          <p className="text-sm text-slate-600">Initialize your database with real project data from Vehicle-GPS-Tracking-Device.md</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Data Overview */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2">Project Data Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-slate-900">24</div>
              <div className="text-slate-600">Vehicles</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">3</div>
              <div className="text-slate-600">Locations</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">6</div>
              <div className="text-slate-600">Team Members</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">72+</div>
              <div className="text-slate-600">Tasks</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={async () => {
              setIsLoading(true)
              setResult(null)
              try {
                const response = await resetAndSeedCore()
                setResult(response)
              } catch (error) {
                setResult({
                  success: false,
                  message: error instanceof Error ? error.message : 'Unknown error occurred'
                })
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>Quick Setup (Recommended)</span>
          </button>

          <button
            onClick={async () => {
              setIsLoading(true)
              setResult(null)
              try {
                const response = await seedCoreProjectData()
                setResult(response)
              } catch (error) {
                setResult({
                  success: false,
                  message: error instanceof Error ? error.message : 'Unknown error occurred'
                })
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Add Data Only</span>
          </button>
        </div>
        
        {/* Advanced Options */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Advanced Options</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleResetAndSeed}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>Full Reset & Seed</span>
            </button>

            <button
              onClick={handleSeedOnly}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Full Seed Only</span>
            </button>

            <button
              onClick={handleClearOnly}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Action Descriptions */}
        <div className="text-sm text-slate-600 space-y-1">
          <div><strong>Quick Setup:</strong> Clears and loads core project data (vehicles, locations, team members)</div>
          <div><strong>Add Data Only:</strong> Adds core project data (safe, uses upsert)</div>
          <div className="text-xs text-slate-500 mt-2">Advanced options include full schema with tasks and complex relationships</div>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="font-medium mb-1">
                  {result.success ? 'Success!' : 'Error'}
                </div>
                <div className="text-sm whitespace-pre-line">
                  {result.message}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-2">Project Details</h4>
          <div className="space-y-2 text-sm text-slate-600">
            <div><strong>Bahir Dar:</strong> Days 1-8 (15 vehicles)</div>
            <div><strong>Kombolcha:</strong> Days 10-12 (6 vehicles, Day 9 travel)</div>
            <div><strong>Addis Ababa:</strong> Days 13-14 (3 vehicles)</div>
            <div className="text-xs text-slate-500 mt-2">
              Data source: Vehicle-GPS-Tracking-Device.md
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
