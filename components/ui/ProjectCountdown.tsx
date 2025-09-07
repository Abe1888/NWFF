'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Play, Pause } from 'lucide-react'

interface ProjectCountdownProps {
  startDate: string
  className?: string
  onCountdownComplete?: () => void
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function ProjectCountdown({ 
  startDate, 
  className = '',
  onCountdownComplete 
}: ProjectCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })
  const [isActive, setIsActive] = useState(true)

  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime()
    const target = new Date(targetDate).getTime()
    const difference = target - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, total: difference }
  }

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining(startDate)
      setTimeRemaining(remaining)

      if (remaining.total <= 0 && onCountdownComplete) {
        onCountdownComplete()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startDate, isActive, onCountdownComplete])

  // Initial calculation
  useEffect(() => {
    const remaining = calculateTimeRemaining(startDate)
    setTimeRemaining(remaining)
  }, [startDate])

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0')
  }

  const isProjectStarted = timeRemaining.total <= 0
  const isStartingSoon = timeRemaining.days <= 7 && timeRemaining.total > 0

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isProjectStarted ? 'bg-green-600' : isStartingSoon ? 'bg-orange-600' : 'bg-primary-600'
            }`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isProjectStarted ? 'Project Started!' : 'Project Countdown'}
              </h3>
              <p className="text-sm text-gray-600">
                {isProjectStarted 
                  ? 'Installation project is now active'
                  : `Project starts on: ${new Date(startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}`
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsActive(!isActive)}
            className={`p-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label={isActive ? 'Pause countdown' : 'Resume countdown'}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="card-body">
        {isProjectStarted ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold text-green-800 mb-2">Project is Live!</h4>
            <p className="text-sm text-green-700">
              Installation work can now begin according to schedule.
            </p>
          </div>
        ) : (
          <>
            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.days)}
                </div>
                <div className="text-xs text-gray-600 font-medium">DAYS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.hours)}
                </div>
                <div className="text-xs text-gray-600 font-medium">HOURS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.minutes)}
                </div>
                <div className="text-xs text-gray-600 font-medium">MINUTES</div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`}>
                  {formatNumber(timeRemaining.seconds)}
                </div>
                <div className="text-xs text-gray-600 font-medium">SECONDS</div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`text-center p-4 rounded-lg border ${
              isStartingSoon 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-primary-50 border-primary-200'
            }`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className={`w-4 h-4 ${
                  isStartingSoon ? 'text-orange-600' : 'text-primary-600'
                }`} />
                <span className={`text-sm font-medium ${
                  isStartingSoon ? 'text-orange-800' : 'text-primary-800'
                }`}>
                  {isStartingSoon ? 'Starting Soon!' : 'Countdown Active'}
                </span>
              </div>
              <p className={`text-xs ${
                isStartingSoon ? 'text-orange-700' : 'text-primary-700'
              }`}>
                {isStartingSoon 
                  ? 'Project starts in less than a week. Prepare for installation activities.'
                  : 'Monitor the countdown and prepare for the upcoming installation project.'
                }
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Time Progress</span>
                <span className="text-xs text-gray-600">
                  {timeRemaining.days > 0 ? `${timeRemaining.days} days remaining` : 'Starting today!'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isStartingSoon ? 'bg-orange-500' : 'bg-primary-500'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, 100 - (timeRemaining.days / 30) * 100))}%` 
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectCountdown
