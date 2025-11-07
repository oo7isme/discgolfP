'use client'

import React, { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  // Ensure we only render client-side differences after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (isLoaded && mounted) {
      console.log('🔐 Convex Client Provider Status:', {
        isLoaded,
        isSignedIn,
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
        hasToken: !!getToken,
      })
    }
  }, [isLoaded, isSignedIn, getToken, mounted])

  // During SSR and initial render, use a consistent state
  // After mount, use the actual auth state
  const showBottomNav = mounted && isLoaded && isSignedIn

  // Use ConvexProviderWithClerk to properly pass authentication tokens to Convex
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <div className={`mx-auto max-w-md min-h-dvh bg-[var(--background)] text-[var(--foreground)] ${showBottomNav ? 'pb-16' : 'overflow-hidden'}`}>
        {children}
        {showBottomNav && <BottomNav user={true} />}
        <Toaster />
      </div>
    </ConvexProviderWithClerk>
  )
}