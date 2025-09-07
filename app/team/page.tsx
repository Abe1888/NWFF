import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TeamManagement } from '@/components/team/TeamManagement'

export default function TeamPage() {
  return (
    <DashboardLayout>
      <TeamManagement />
    </DashboardLayout>
  )
}