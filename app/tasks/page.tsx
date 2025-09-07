import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TaskManagement } from '@/components/tasks/TaskManagement'

export default function TasksPage() {
  return (
    <DashboardLayout>
      <TaskManagement />
    </DashboardLayout>
  )
}