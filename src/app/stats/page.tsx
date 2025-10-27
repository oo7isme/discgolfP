"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PerformanceChart } from '@/components/PerformanceChart';
import { CoursePerformanceChart } from '@/components/CoursePerformanceChart';
import { useMutation } from 'convex/react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function StatsPage() {
  const { user, currentUser } = useCurrentUser();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  
  const courses = useQuery(api.courses.getAll);
  const rounds = useQuery(api.rounds.getByUser, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const analytics = useQuery(api.stats.getAnalytics, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const monthlyGoal = useQuery(api.goals.getMonthlyRoundsGoal, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  const setMonthlyGoal = useMutation(api.goals.setMonthlyRoundsGoal);

  // Filter rounds by course and time period
  const filteredRounds = rounds?.filter(round => {
    // Course filter
    const courseMatch = selectedCourse === 'all' || round.courseId === selectedCourse;
    
    // Time period filter
    if (timePeriod === 'all') return courseMatch;
    
    const roundDate = new Date(round.startedAt);
    const currentDate = new Date();
    
    let timeMatch = false;
    switch (timePeriod) {
      case 'week':
        const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeMatch = roundDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        timeMatch = roundDate >= monthAgo;
        break;
      case 'year':
        const yearAgo = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        timeMatch = roundDate >= yearAgo;
        break;
      default:
        timeMatch = true;
    }
    
    return courseMatch && timeMatch;
  }) || [];

  // Calculate stats
  const totalRounds = filteredRounds.length;
  const totalStrokes = filteredRounds.reduce((sum, round) => sum + (round.totalStrokes || 0), 0);
  const averageScore = totalRounds > 0 ? (totalStrokes / totalRounds).toFixed(1) : '0';
  const bestScore = filteredRounds.length > 0 
    ? Math.min(...filteredRounds.map(round => round.totalStrokes || Infinity))
    : 0;
  const worstScore = filteredRounds.length > 0 
    ? Math.max(...filteredRounds.map(round => round.totalStrokes || 0))
    : 0;

  // Calculate improvement over time
  const recentRounds = filteredRounds.slice(0, 5);
  const olderRounds = filteredRounds.slice(-5);
  const recentAverage = recentRounds.length > 0 
    ? recentRounds.reduce((sum, round) => sum + (round.totalStrokes || 0), 0) / recentRounds.length
    : 0;
  const olderAverage = olderRounds.length > 0 
    ? olderRounds.reduce((sum, round) => sum + (round.totalStrokes || 0), 0) / olderRounds.length
    : 0;
  const improvement = olderAverage > 0 ? ((olderAverage - recentAverage) / olderAverage * 100) : 0;

  // Calculate monthly progress
  const monthlyRounds = rounds?.filter(round => {
    const roundDate = new Date(round.startedAt);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return roundDate.getMonth() === currentMonth && roundDate.getFullYear() === currentYear;
  }).length || 0;

  const goalTarget = monthlyGoal?.target || 10;
  const monthlyProgress = Math.min((monthlyRounds / goalTarget) * 100, 100);

  const handleSetGoal = async () => {
    if (currentUser && newGoalTarget > 0) {
      await setMonthlyGoal({ 
        userId: currentUser._id, 
        target: newGoalTarget 
      });
      setGoalDialogOpen(false);
    }
  };

  return (
    <div className="p-4 space-y-6 snap-start">
      {/* Header with Filters */}
      <div className="flex flex-col md:items-center md:justify-between gap-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Stats & Analytics</h1>
          <p className="text-[var(--muted-foreground)]">
            Track your disc golf performance and insights
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex sm:flex-row gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Time Period</label>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Quick Navigation */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/rounds">
          <Button variant="outline" size="sm">
            📋 View All Rounds
          </Button>
        </Link>
        <Link href="/friends">
          <Button variant="outline" size="sm">
            👥 Friends
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
          <CardDescription>
            Overview of your disc golf performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalRounds}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Rounds</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{averageScore}</div>
              <div className="text-sm text-muted-foreground mt-1">Average Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {bestScore === Infinity ? 'N/A' : bestScore}
            </div>
              <div className="text-sm text-muted-foreground mt-1">Best Score</div>
          </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {new Set(filteredRounds?.map(round => round.courseId)).size || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Courses Played</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Goal</CardTitle>
              <CardDescription>
                Rounds played this month: {monthlyRounds} / {goalTarget}
              </CardDescription>
              </div>
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Set Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Monthly Goal</DialogTitle>
                  <DialogDescription>
                    Set your target number of rounds to play this month.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-target">Target Rounds</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      min="1"
                      max="100"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 10)}
                    />
          </div>
        </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSetGoal}>
                    Set Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={monthlyProgress} className="w-full" />
          <div className="mt-2 text-sm text-muted-foreground">
            {monthlyProgress.toFixed(0)}% complete
      </div>
          {monthlyGoal?.completed && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              🎉 Goal achieved!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rounds</CardTitle>
              <CardDescription>
                Your latest disc golf rounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRounds && filteredRounds.length > 0 ? (
                <div className="space-y-3">
                  {filteredRounds.slice(0, 5).map((round) => (
                    <div
                      key={round._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                    <div className="flex items-center gap-3">
                        <div className="text-2xl">🥏</div>
                      <div>
                          <div className="font-medium">
                            {round.course?.name || 'Unknown Course'}
                        </div>
                          <div className="text-sm text-muted-foreground">
                          {new Date(round.startedAt).toLocaleDateString()} • {round.roundType}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {round.totalStrokes || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">strokes</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rounds found. Start playing to see your stats!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Round Types Breakdown */}
          {filteredRounds && filteredRounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Round Types</CardTitle>
                <CardDescription>
                  Breakdown of your rounds by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    filteredRounds.reduce((acc, round) => {
                      acc[round.roundType] = (acc[round.roundType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <Badge variant="secondary">{type}</Badge>
                      <span className="font-medium">{count} rounds</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Chart */}
          <PerformanceChart rounds={filteredRounds as any} />

          {/* Course Performance Chart */}
          <CoursePerformanceChart rounds={filteredRounds as any} />

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                How you're improving over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Recent Performance</div>
                    <div className="text-sm text-muted-foreground">
                      Last 5 rounds average
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {recentAverage.toFixed(1)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Previous Performance</div>
                    <div className="text-sm text-muted-foreground">
                      Previous 5 rounds average
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {olderAverage.toFixed(1)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Improvement</div>
                    <div className="text-sm text-muted-foreground">
                      Change in performance
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Round Types Analysis */}
          {filteredRounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Round Types Analysis</CardTitle>
                <CardDescription>
                  Performance by round type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    filteredRounds.reduce((acc, round) => {
                      if (!acc[round.roundType]) {
                        acc[round.roundType] = { count: 0, totalStrokes: 0 };
                      }
                      acc[round.roundType].count += 1;
                      acc[round.roundType].totalStrokes += round.totalStrokes || 0;
                      return acc;
                    }, {} as Record<string, { count: number; totalStrokes: number }>)
                  ).map(([type, data]) => {
                    const average = data.count > 0 ? (data.totalStrokes / data.count).toFixed(1) : '0';
                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Badge variant="secondary">{type}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {data.count} rounds
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{average}</div>
                          <div className="text-xs text-muted-foreground">avg score</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                AI-powered insights about your game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {totalRounds === 0 ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="font-medium text-gray-800">📈 Start Playing!</div>
                    <div className="text-sm text-gray-700">
                      Play some rounds to see personalized insights about your disc golf performance.
                    </div>
                  </div>
                ) : (
                  <>
                    {improvement > 5 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800">🎉 Great Improvement!</div>
                        <div className="text-sm text-green-700">
                          You've improved by {improvement.toFixed(1)}% in your recent rounds. Keep up the great work!
                        </div>
                      </div>
                    )}
                    
                    {totalRounds >= 10 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">📊 Consistent Player</div>
                        <div className="text-sm text-blue-700">
                          You've played {totalRounds} rounds, showing great dedication to the sport!
                        </div>
                      </div>
                    )}
                    
                    {bestScore < 50 && bestScore > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">🏆 Excellent Performance</div>
                        <div className="text-sm text-yellow-700">
                          Your best score of {bestScore} is impressive! You're playing at a high level.
                        </div>
                      </div>
                    )}

                    {totalRounds > 0 && totalRounds < 5 && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-medium text-purple-800">🌱 Getting Started</div>
                        <div className="text-sm text-purple-700">
                          You've played {totalRounds} rounds. Play a few more to unlock detailed insights!
                        </div>
                      </div>
                    )}

                    {worstScore > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800">🎯 Room for Improvement</div>
                        <div className="text-sm text-orange-700">
                          Your worst score was {worstScore}. Focus on consistency to lower your average!
                        </div>
              </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
  );
}