import { AppLayout } from "@/components/AppLayout"
import { SignedIn, UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <SignedIn>
          <div className="bg-white rounded-lg border">
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0",
                }
              }}
            />
          </div>
        </SignedIn>
      </div>
    </AppLayout>
  )
}
