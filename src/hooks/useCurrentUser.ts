import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useEffect } from 'react'

export function useCurrentUser() {
  const { user, isLoaded } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser, 
    user ? { clerkId: user.id } : "skip"
  )
  const createUser = useMutation(api.users.createUser)
  const generateUsernameForUser = useMutation(api.users.generateUsernameForUser)
  const updateUserWithUsername = useMutation(api.users.updateUserWithUsername)

  // Automatically create user in Convex when they sign in with Clerk
  useEffect(() => {
    if (isLoaded && user && !currentUser) {
      // User is signed in with Clerk but doesn't exist in Convex database
      const email = user.emailAddresses[0]?.emailAddress || '';
      const name = user.fullName || '';
      
      // Generate username from email or name
      let username = user.username || '';
      if (!username) {
        if (name) {
          // Use name: "John Doe" -> "john_doe"
          username = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        } else if (email) {
          // Use email: "john@example.com" -> "john"
          username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        }
      }
      
      // Add random number if username is too short or empty
      if (username.length < 3) {
        username = `user_${Math.random().toString(36).substr(2, 6)}`;
      }
      
      createUser({
        email: email,
        username: username,
        name: name || undefined,
        image: user.imageUrl || undefined,
        clerkId: user.id,
      }).catch((error) => {
        console.error('Failed to create user in Convex:', error)
      })
    }
  }, [isLoaded, user, currentUser, createUser])

  // Automatically generate username for existing users who don't have one
  useEffect(() => {
    if (isLoaded && user && currentUser && !currentUser.username) {
      // Prefer Clerk's username if available, otherwise generate
      if (user.username) {
        updateUserWithUsername({
          clerkId: user.id,
          username: user.username,
        }).catch((error) => {
          console.error('Failed to update username from Clerk:', error)
        })
      } else {
        generateUsernameForUser({
          clerkId: user.id,
        }).catch((error) => {
          console.error('Failed to generate username for user:', error)
        })
      }
    }
  }, [isLoaded, user, currentUser, generateUsernameForUser, updateUserWithUsername])

  return {
    user,
    currentUser,
    isLoaded,
  }
}
