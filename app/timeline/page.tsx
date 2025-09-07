import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { InstallationTimeline } from '@/components/timeline/InstallationTimeline'

export default function TimelinePage() {
  return (
    <DashboardLayout>
      <InstallationTimeline />
    </DashboardLayout>
  )
}