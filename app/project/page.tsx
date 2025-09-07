import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProjectManagement } from '@/components/project/ProjectManagement'

export default function ProjectPage() {
  return (
    <DashboardLayout>
      <ProjectManagement />
    </DashboardLayout>
  )
}