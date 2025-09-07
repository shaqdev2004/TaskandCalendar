import { AppLayout } from "@/components/AppLayout"

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Advanced task management features (to be continued)
          </p>
        </div>
        
        <div className="bg-white rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-gray-600">
            Advanced task management features will be implemented here.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
