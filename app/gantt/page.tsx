import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GanttChart } from '@/components/gantt/GanttChart'

export default function GanttPage() {
  return (
    <DashboardLayout>
      <GanttChart />
    </DashboardLayout>
  )
}