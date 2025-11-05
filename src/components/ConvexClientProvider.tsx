'use client'

import React from 'react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { useAuth } from '@clerk/nextjs'
import BottomNav from '@/components/BottomNav'
import { Toaster } from '@/components/ui/toaster'

// Create Convex client with proper error handling
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable")
}

const convex = new ConvexReactClient(convexUrl)

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  // Debug logging
  React.useEffect(() => {
    if (isLoaded) {
      console.log('🔐 Convex Client Provider Status:', {
        isLoaded,
        isSignedIn,
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
        hasToken: !!getToken,
      })
    }
  }, [isLoaded, isSignedIn, getToken])

  // Use ConvexProviderWithClerk to properly pass authentication tokens to Convex
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <div className={`mx-auto max-w-md min-h-dvh bg-[var(--background)] text-[var(--foreground)] ${isSignedIn ? 'pb-16' : 'overflow-hidden'}`}>
        {children}
        <BottomNav user={isSignedIn} />
        <Toaster />
      </div>
    </ConvexProviderWithClerk>
  )
}