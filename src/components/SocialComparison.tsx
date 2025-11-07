"use client";

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, TrendingUp, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SocialComparisonProps {
  currentUserId: string;
  currentUserRounds: any[];
  currentUserStats: {
    totalRounds: number;
    averageScore: number;
    bestScore: number;
    averageRating: number;
  };
}

export function SocialComparison({ 
  currentUserId, 
  currentUserRounds,
  currentUserStats 
}: SocialComparisonProps) {
  const friends = useQuery(api.friends.getFriends, { userId: currentUserId as any });
  const leaderboard = useQuery(api.stats.getLeaderboard, {
    friendsOnly: true,
    userId: currentUserId as any,
  });

  if (!friends || friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Comparison
          </CardTitle>
          <CardDescription>
            Compare your performance with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">👥</div>
              <p>No friends yet</p>
              <p className="text-sm">Add friends to compare your stats!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create a map of friend user details for quick lookup
  const friendUserMap = friends?.reduce((acc, friend) => {
    if (friend) acc[friend._id] = friend;
    return acc;
  }, {} as Record<string, any>) || {};

  // Calculate friend stats
  const friendStats = leaderboard?.map(friend => {
    const friendUser = friendUserMap[friend.userId];
    const friendRounds = currentUserRounds.filter(r => r.userId === friend.userId);
    const roundsWithRatings = friendRounds.filter(r => r.rating !== undefined && r.rating !== null);
    const averageRating = roundsWithRatings.length > 0
      ? Math.round(roundsWithRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / roundsWithRatings.length)
      : 0;
    const bestScore = friendRounds.length > 0
      ? Math.min(...friendRounds.map(r => r.totalStrokes || Infinity))
      : 0;

    return {
      ...friend,
      image: friendUser?.image,
      name: friendUser?.name || friend.name,
      totalRounds: friend.totalRounds,
      averageScore: friend.averageScore,
      bestScore,
      averageRating,
    };
  }) || [];

  // Get current user details
  const currentUserDetails = friendUserMap[currentUserId] || null;

  // Add current user to comparison
  const allStats = [
    {
      userId: currentUserId,
      name: 'You',
      username: 'You',
      image: currentUserDetails?.image,
      ...currentUserStats,
      isCurrentUser: true,
    },
    ...friendStats.map(f => ({ ...f, isCurrentUser: false })),
  ];

  // Calculate rankings
  const sortedByRounds = [...allStats].sort((a, b) => b.totalRounds - a.totalRounds);
  const sortedByAverage = [...allStats].sort((a, b) => a.averageScore - b.averageScore);
  const sortedByRating = [...allStats].filter(s => s.averageRating > 0)
    .sort((a, b) => b.averageRating - a.averageRating);

  const currentUserRankRounds = sortedByRounds.findIndex(s => s.isCurrentUser) + 1;
  const currentUserRankAverage = sortedByAverage.findIndex(s => s.isCurrentUser) + 1;
  const currentUserRankRating = sortedByRating.findIndex(s => s.isCurrentUser) + 1;

  // Calculate percentiles
  const totalFriends = friendStats.length;
  const betterThanRounds = totalFriends > 0 
    ? Math.round(((totalFriends - currentUserRankRounds + 1) / totalFriends) * 100)
    : 0;
  const betterThanAverage = totalFriends > 0
    ? Math.round(((totalFriends - currentUserRankAverage + 1) / totalFriends) * 100)
    : 0;

  // Find top performers
  const topRounds = sortedByRounds.slice(0, 3);
  const topAverage = sortedByAverage.slice(0, 3);
  const topRating = sortedByRating.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Your Ranking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rounds Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUserRankRounds}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Ranked #{currentUserRankRounds} of {totalFriends + 1}
            </div>
            <div className="mt-2">
              <Progress value={betterThanRounds} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                Better than {betterThanRounds}% of friends
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentUserRankAverage}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Ranked #{currentUserRankAverage} of {totalFriends + 1}
            </div>
            <div className="mt-2">
              <Progress value={betterThanAverage} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                Better than {betterThanAverage}% of friends
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              PDGA Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUserRankRating > 0 ? (
              <>
                <div className="text-2xl font-bold">{currentUserRankRating}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Ranked #{currentUserRankRating} of {sortedByRating.length}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No rating data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Rounds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Rounds</CardTitle>
            <CardDescription>Total rounds played</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRounds.map((stat, index) => (
                <div
                  key={stat.userId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    stat.isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={stat.image} />
                    <AvatarFallback>
                      {stat.name?.charAt(0) || stat.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {stat.isCurrentUser ? 'You' : stat.name || stat.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.totalRounds} rounds
                    </div>
                  </div>
                  {stat.isCurrentUser && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Average */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Best Average</CardTitle>
            <CardDescription>Lowest average score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAverage.map((stat, index) => (
                <div
                  key={stat.userId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    stat.isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={stat.image} />
                    <AvatarFallback>
                      {stat.name?.charAt(0) || stat.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {stat.isCurrentUser ? 'You' : stat.name || stat.username}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stat.averageScore.toFixed(1)} avg
                    </div>
                  </div>
                  {stat.isCurrentUser && (
                    <Badge variant="secondary">You</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Highest Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Highest Rating</CardTitle>
            <CardDescription>Best PDGA rating</CardDescription>
          </CardHeader>
          <CardContent>
            {topRating.length > 0 ? (
              <div className="space-y-3">
                {topRating.map((stat, index) => (
                  <div
                    key={stat.userId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      stat.isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={stat.image} />
                      <AvatarFallback>
                        {stat.name?.charAt(0) || stat.username?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {stat.isCurrentUser ? 'You' : stat.name || stat.username}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.averageRating} rating
                      </div>
                    </div>
                    {stat.isCurrentUser && (
                      <Badge variant="secondary">You</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No rating data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Full Comparison</CardTitle>
          <CardDescription>
            Complete stats comparison with all friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Player</th>
                  <th className="text-right p-2">Rounds</th>
                  <th className="text-right p-2">Avg Score</th>
                  <th className="text-right p-2">Best Score</th>
                  <th className="text-right p-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRounds.map((stat) => (
                  <tr
                    key={stat.userId}
                    className={`border-b hover:bg-muted/50 ${
                      stat.isCurrentUser ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={stat.image} />
                          <AvatarFallback className="text-xs">
                            {stat.name?.charAt(0) || stat.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {stat.isCurrentUser ? 'You' : stat.name || stat.username}
                        </span>
                        {stat.isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-right">{stat.totalRounds}</td>
                    <td className="p-2 text-right">{stat.averageScore.toFixed(1)}</td>
                    <td className="p-2 text-right">
                      {stat.bestScore === Infinity ? 'N/A' : stat.bestScore}
                    </td>
                    <td className="p-2 text-right">
                      {stat.averageRating > 0 ? stat.averageRating : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

