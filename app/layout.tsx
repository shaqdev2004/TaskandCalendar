import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/ConvexClientProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SidebarProvider } from '@/components/ui/sidebar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'TaskFlow - Modern Task Management',
  description: 'Parse, organize, and manage your tasks with AI-powered natural language processing',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get Clerk publishable key with fallback
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          {clerkPublishableKey ? (
            <ClerkProvider publishableKey={clerkPublishableKey}>
              <ConvexClientProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </ConvexClientProvider>
            </ClerkProvider>
          ) : (
            <div className="p-4 text-center">
              <p className="text-red-500">
                Missing Clerk configuration. Please check your environment variables.
              </p>
              <ConvexClientProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </ConvexClientProvider>
            </div>
          )}
        </ErrorBoundary>
      </body>
    </html>
  )
}