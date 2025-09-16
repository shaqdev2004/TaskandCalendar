"use client"

import { SignedIn, SignedOut } from "@clerk/nextjs"
import { AppLayout } from "@/components/AppLayout"
import { HomePage } from "@/components/HomePage"
import { LandingPage } from "@/components/LandingPage"

export default function RootPage() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <AppLayout>
          <HomePage />
        </AppLayout>
      </SignedIn>
    </>
  )
}
