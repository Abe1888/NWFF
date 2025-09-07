import { DashboardLayout } from '@/components/layout/DashboardLayout'
import SystemHealthCheck from '@/components/ui/SystemHealthCheck'
import DataValidationPanel from '@/components/ui/DataValidationPanel'
import PerformanceMonitor from '@/components/ui/PerformanceMonitor'
import AccessibilityChecker from '@/components/ui/AccessibilityChecker'
import TestingPanel from '@/components/ui/TestingPanel'

export default function SystemStatusPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">
            Monitor system health, validate data integrity, run automated tests, check performance metrics, and ensure accessibility compliance
          </p>
        </div>

        {/* System Health Check */}
        <SystemHealthCheck />

        {/* Data Validation Panel */}
        <DataValidationPanel />

        {/* Testing Panel */}
        <TestingPanel />

        {/* Performance Monitor */}
        <PerformanceMonitor />

        {/* Accessibility Checker */}
        <AccessibilityChecker />
      </div>
    </DashboardLayout>
  )
}