'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { BarChart3, Target, Trophy, Flame, Star, Bird, Disc3, Users, Brain } from 'lucide-react'
import Image from 'next/image'

function DgBasketIcon({ className, size = 35 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className={className}
    >
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="40" y="24" width="48" height="8" rx="2" />
        <line x1="64" y1="32" x2="64" y2="66" />
        <line x1="54" y1="32" x2="58" y2="66" />
        <line x1="74" y1="32" x2="70" y2="66" />
        <line x1="46" y1="32" x2="52" y2="66" />
        <line x1="82" y1="32" x2="76" y2="66" />
        <rect x="36" y="66" width="56" height="8" rx="2" />
        <line x1="40" y1="66" x2="40" y2="74" />
        <line x1="88" y1="66" x2="88" y2="74" />
        <line x1="64" y1="74" x2="64" y2="104" />
        <line x1="50" y1="104" x2="78" y2="104" />
      </g>
    </svg>
  )
}
export default function Home() {
  const { user, currentUser, isLoaded } = useCurrentUser()
  
  // Fetch user's rounds data
  const rounds = useQuery(api.rounds.getByUser, currentUser ? { userId: currentUser._id } : "skip")
  
  // Fetch leaderboard data
  const leaderboard = useQuery(api.stats.getLeaderboard, 
    currentUser ? { userId: currentUser._id, friendsOnly: false } : "skip"
  )
  
  // Calculate comprehensive stats from rounds data
  const allStats = rounds ? {
    totalRounds: rounds.length,
    bestScore: rounds.length > 0 ? Math.min(...rounds.map(r => r.totalStrokes || 0)) : 0,
    totalAces: rounds.reduce((acc, round) => {
      if (!round.scores) return acc
      return acc + round.scores.filter(score => score.strokes === 1).length
    }, 0),
    totalBirdies: rounds.reduce((acc, round) => {
      if (!round.scores || !round.courseHoles) return acc
      return acc + round.scores.filter(score => {
        const holeData = round.courseHoles.find(hole => hole.hole === score.hole)
        return holeData && score.strokes === holeData.par - 1
      }).length
    }, 0),
    averageScore: rounds.length > 0 ? Math.round(rounds.reduce((sum, round) => sum + (round.totalStrokes || 0), 0) / rounds.length) : 0,
    consistency: rounds.length > 1 ? Math.round(rounds.reduce((sum, round) => sum + Math.abs((round.totalStrokes || 0) - (rounds.reduce((s, r) => s + (r.totalStrokes || 0), 0) / rounds.length)), 0) / rounds.length) : 0,
    improvement: rounds.length > 1 ? (() => {
      const recent = rounds.slice(-5).reduce((sum, round) => sum + (round.totalStrokes || 0), 0) / Math.min(5, rounds.length)
      const older = rounds.slice(0, -5).reduce((sum, round) => sum + (round.totalStrokes || 0), 0) / Math.max(1, rounds.length - 5)
      return Math.round(older - recent)
    })() : 0,
    coursesPlayed: new Set(rounds.map(r => r.courseId)).size,
    streak: (() => {
      let currentStreak = 0
      for (let i = rounds.length - 1; i >= 0; i--) {
        const round = rounds[i]
        if (round.totalStrokes && round.courseHoles) {
          const coursePar = round.courseHoles.reduce((sum, hole) => sum + hole.par, 0)
          if (round.totalStrokes <= coursePar) {
            currentStreak++
          } else {
            break
          }
        }
      }
      return currentStreak
    })(),
    weeklyStreak: (() => {
      // Calculate weekly streak - playing once per week
      if (rounds.length === 0) return 0
      
      const now = Date.now()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      
      // Group rounds by week
      const roundsByWeek = new Map<number, number[]>()
      rounds.forEach(round => {
        const weekNum = Math.floor((now - (round.startedAt || round._creationTime || now)) / weekMs)
        if (!roundsByWeek.has(weekNum)) {
          roundsByWeek.set(weekNum, [])
        }
        roundsByWeek.get(weekNum)!.push(round.totalStrokes || 0)
      })
      
      // Count consecutive weeks with at least one round
      let streak = 0
      for (let weekOffset = 0; weekOffset < 100; weekOffset++) {
        if (roundsByWeek.has(weekOffset) && roundsByWeek.get(weekOffset)!.length > 0) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    })()
  } : {
    totalRounds: 0, bestScore: 0, totalAces: 0, totalBirdies: 0,
    averageScore: 0, consistency: 0, improvement: 0, coursesPlayed: 0, streak: 0, weeklyStreak: 0
  }

  // Enabled stats - showing key stats
  const enabledStats = ['averageScore', 'totalRounds', 'weeklyStreak']
  
  // Available shortcuts
  const availableShortcuts = [
    { key: 'newRound', label: 'New Round', icon: '🥏', href: '/new' },
    { key: 'previousRounds', label: 'Previous Rounds', icon: '📋', href: '/rounds' },
    { key: 'stats', label: 'My Stats', icon: '📊', href: '/stats' },
    { key: 'friends', label: 'Friends', icon: '👥', href: '/friends' },
  ]
  
  // Calculate user rank in leaderboard
  const userLeaderboardData = leaderboard && currentUser ? (() => {
    const userEntry = leaderboard.find((entry: any) => entry.userId === currentUser._id)
    const userRank = leaderboard.findIndex((entry: any) => entry.userId === currentUser._id) + 1
    
    return {
      userRank: userRank || 0,
      userEntry,
      topPlayers: leaderboard.slice(0, 3) // Top 3 players (pole positions)
    }
  })() : null

  if (!isLoaded || (user && rounds === undefined)) {
    return (
      <main className="h-[calc(100vh-4rem)] flex flex-col p-3 bg-background overflow-hidden">
        <div className="text-center py-3 flex-shrink-0">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Loading your stats...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-xs text-muted-foreground">Loading...</div>
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="h-dvh flex flex-col items-center justify-center p-6 bg-background overflow-hidden">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Disc3 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground">
              DiscGolf Tracker
            </h1>
            <p className="text-muted-foreground">
              Track your rounds and improve your game
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <BarChart3 className="w-5 h-5" />
              <span>Smart analytics and insights</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Brain className="w-5 h-5" />
              <span>AI caddy assistant</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>Compete with friends</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full h-11">
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button variant="outline" className="w-full h-11">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="text-xs text-muted-foreground">
            Free • Secure • Mobile-friendly
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="h-[calc(100vh-4rem)] flex flex-col p-3 bg-background overflow-hidden">
      {/* Header */}
      <div className="text-center py-3 flex-shrink-0">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Disc3 className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{currentUser?.name ? `, ${currentUser.name}` : ''}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ready to play some disc golf?
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Stats */}
        <div className="max-w-sm mx-auto w-full flex-shrink-0 mb-3">
          <div className="grid gap-3 grid-cols-3">
            {enabledStats.map((statKey) => {
              const statValue = allStats[statKey as keyof typeof allStats]
              const statLabels: Record<string, string> = {
                totalRounds: 'Rounds',
                bestScore: 'Best',
                totalAces: 'Aces',
                totalBirdies: 'Birdies',
                averageScore: 'Average',
                consistency: 'Consistency',
                improvement: 'Improvement',
                coursesPlayed: 'Courses',
                streak: 'Streak',
                weeklyStreak: 'Week Streak',
              }
              
              const statColors: Record<string, { bg: string, iconBg: string, text: string, graph: string }> = {
                averageScore: { bg: 'bg-blue-50', iconBg: 'bg-blue-500', text: 'text-blue-700', graph: 'stroke-blue-500' },
                totalRounds: { bg: 'bg-purple-50', iconBg: 'bg-purple-500', text: 'text-purple-700', graph: 'stroke-purple-500' },
                weeklyStreak: { bg: 'bg-green-50', iconBg: 'bg-green-500', text: 'text-green-700', graph: 'stroke-green-500' },
                bestScore: { bg: 'bg-green-50', iconBg: 'bg-green-500', text: 'text-green-700', graph: 'stroke-green-500' },
                totalAces: { bg: 'bg-orange-50', iconBg: 'bg-orange-500', text: 'text-orange-700', graph: 'stroke-orange-500' },
                totalBirdies: { bg: 'bg-yellow-50', iconBg: 'bg-yellow-500', text: 'text-yellow-700', graph: 'stroke-yellow-500' },
              }
              
              const colors = statColors[statKey] || statColors.averageScore
              
              const statIcons: Record<string, React.ComponentType<{ className?: string }>> = {
                averageScore: BarChart3,
                totalRounds: Target,
                weeklyStreak: Flame,
                bestScore: Trophy,
                totalAces: Star,
                totalBirdies: Bird,
              }
              
              const IconComponent = statIcons[statKey] || BarChart3
              
              // Generate mini line graph for this stat
              const getStatHistory = () => {
                if (!rounds) return []
                
                if (statKey === 'averageScore') {
                  // Calculate rolling average for each round
                  return rounds.slice(-10).map((_, idx, arr) => {
                    const recentRounds = arr.slice(0, idx + 1)
                    return recentRounds.reduce((sum, r) => sum + (r.totalStrokes || 0), 0) / recentRounds.length
                  })
                } else if (statKey === 'totalRounds') {
                  // Count of rounds
                  return rounds.slice(-10).map((_, idx) => idx + 1)
                } else if (statKey === 'weeklyStreak') {
                  // Rolling weekly streak
                  return rounds.slice(-10).map((_, idx) => {
                    const recent = rounds.slice(0, rounds.length - (10 - idx))
                    if (recent.length < 7) return 0
                    const weeks = Math.floor(recent.length / 7)
                    return weeks
                  })
                }
                return []
              }
              
              const statHistory = getStatHistory()
              const maxVal = Math.max(...statHistory, 1)
              const minVal = Math.min(...statHistory, 0)
              const range = maxVal - minVal || 1
              
              return (
                <Card key={statKey} className={`${colors.bg} h-full`}>
                  <CardContent className="p-3 h-full">
                    <div className="flex flex-col items-center justify-center gap-2 h-full">
                      {/* Icon */}
                      {statKey === 'totalRounds' ? (
                        <DgBasketIcon className={colors.text} size={38} />
                      ) : (
                        <IconComponent className={`${colors.text} w-8 h-8`} />
                      )}
                      
                      {/* Value with arrow */}
                      <div className="flex items-center gap-1">
                        <span className={`text-2xl font-bold ${colors.text}`}>
                          {statKey === 'bestScore' && statValue === 0 ? '-' : statValue}
                        </span>
                        <span className={colors.text}>↗</span>
                      </div>
                      
                      {/* Label */}
                      <div className={`text-xs font-medium ${colors.text}`}>
                        {statLabels[statKey] || statKey}
                      </div>
                      
                      {/* Mini line graph */}
                      {statHistory.length > 0 && (
                        <div className="w-full">
                          <svg width="100%" height="30" viewBox="0 0 100 30" className="mt-1">
                            <polyline
                              points={statHistory.map((val, idx) => {
                                const x = (idx / Math.max(1, statHistory.length - 1)) * 100
                                const y = 30 - ((val - minVal) / range) * 30
                                return `${x},${y}`
                              }).join(' ')}
                              fill="none"
                              strokeWidth="2"
                              className={colors.graph}
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="max-w-sm mx-auto w-full flex-shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base"> All users Leaderboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4">
                {userLeaderboardData?.topPlayers?.length ? (
                  <div className="grid grid-cols-3 items-end gap-3">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center">
                      <Trophy className="w-6 h-6 text-gray-400 mb-1" />
                      <div className="h-20 w-full rounded-md bg-muted/70 flex items-end justify-center">
                        <div className="mb-2 text-xs font-semibold text-muted-foreground">2</div>
                      </div>
                      <div className="mt-2 text-center text-sm font-medium truncate w-full">
                        {(userLeaderboardData.topPlayers[1]?.username) || (userLeaderboardData.topPlayers[1]?.name) || ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userLeaderboardData.topPlayers[1]?.averageScore?.toFixed?.(1) || ''}
                      </div>
                    </div>

                    {/* 1st place */}
                    <div className="flex flex-col items-center">
                      <Trophy className="w-7 h-7 text-yellow-500 mb-1" />
                      <div className="h-28 w-full rounded-md bg-yellow-500/90 flex items-end justify-center text-white">
                        <div className="mb-2 text-xs font-semibold">1</div>
                      </div>
                      <div className="mt-2 text-center text-sm font-semibold truncate w-full">
                        {(userLeaderboardData.topPlayers[0]?.username) || (userLeaderboardData.topPlayers[0]?.name) || ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userLeaderboardData.topPlayers[0]?.averageScore?.toFixed?.(1) || ''}
                      </div>
                    </div>

                    {/* 3rd place */}
                    <div className="flex flex-col items-center">
                      <Trophy className="w-6 h-6 text-orange-500 mb-1" />
                      <div className="h-16 w-full rounded-md bg-orange-400/80 flex items-end justify-center text-white">
                        <div className="mb-2 text-xs font-semibold">3</div>
                      </div>
                      <div className="mt-2 text-center text-sm font-medium truncate w-full">
                        {(userLeaderboardData.topPlayers[2]?.username) || (userLeaderboardData.topPlayers[2]?.name) || ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userLeaderboardData.topPlayers[2]?.averageScore?.toFixed?.(1) || ''}
                      </div>
                    </div>
                  </div>
                ) : null}

                {userLeaderboardData && userLeaderboardData.userRank > 3 && (
                  <div className="pt-3 text-center text-xs text-muted-foreground">
                    Your rank: #{userLeaderboardData.userRank}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}