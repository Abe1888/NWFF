import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { VehicleSchedule } from '@/components/schedule/VehicleSchedule'

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <VehicleSchedule />
    </DashboardLayout>
  )
}