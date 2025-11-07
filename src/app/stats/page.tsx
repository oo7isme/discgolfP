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
import { HoleByHoleAnalysis } from '@/components/HoleByHoleAnalysis';
import { SocialComparison } from '@/components/SocialComparison';
import { useMutation } from 'convex/react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StatsPage() {
  const { user, currentUser } = useCurrentUser();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [recentRoundsToShow, setRecentRoundsToShow] = useState(5);
  
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
  
  // Calculate average PDGA rating (only for rounds with ratings)
  const roundsWithRatings = filteredRounds.filter(round => round.rating !== undefined && round.rating !== null);
  const totalRatings = roundsWithRatings.reduce((sum, round) => sum + (round.rating || 0), 0);
  const averageRating = roundsWithRatings.length > 0 
    ? Math.round(totalRatings / roundsWithRatings.length).toString()
    : 'N/A';
  
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

  // Rating calculation function (same as in the rounds API)
  const getRatingFromScore = (score: number) => {
    const scoreToRating: Record<number, number> = {
      95:402,94:414,93:426,92:438,91:450,90:462,89:474,88:486,87:498,86:510,
      85:522,84:534,83:546,82:558,81:570,80:582,79:594,78:606,77:618,76:630,
      75:642,74:654,73:666,72:678,71:690,70:702,69:714,68:726,67:738,66:750,
      65:762,64:774,63:786,62:798,61:810,60:822,59:834,58:846,57:858,56:870,
      55:882,54:894,53:906,52:918,51:930,50:942,49:834,48:846,47:858,46:870,
      45:1002,44:1014,43:1026,42:1038,41:1050,40:1062,39:1074,38:1086,37:1098,36:1110,
    };
    return scoreToRating[score] ?? null;
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
          <div className="flex flex-col gap-1 flex-[2]">
            <label className="text-xs font-medium text-muted-foreground">Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-9 w-full">
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
          
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-medium text-muted-foreground">Time Period</label>
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="h-9 w-full">
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
  

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="holes">Hole Analysis</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
              <div className="text-3xl font-bold text-primary">{averageRating}</div>
              <div className="text-sm text-muted-foreground mt-1">Avg PDGA Rating</div>
              {roundsWithRatings.length < totalRounds && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  ({roundsWithRatings.length} / {totalRounds} rounds)
                </div>
              )}
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

          {/* Your Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rounds</CardTitle>
              <CardDescription>
                Your latest disc golf rounds
              </CardDescription>
            </CardHeader>
            {filteredRounds && filteredRounds.length > 0 && (
              <div className="px-6 pb-4 border-b">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(
                    filteredRounds.reduce((acc, round) => {
                      acc[round.roundType] = (acc[round.roundType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <CardContent>
              {filteredRounds && filteredRounds.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {filteredRounds.slice(0, recentRoundsToShow).map((round) => (
                      <div
                        key={round._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {round.course?.name || 'Unknown Course'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(round.startedAt).toLocaleDateString()} • {round.roundType}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {round.totalStrokes || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">strokes</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/rounds/${round._id}`);
                            }}
                            className="h-8 w-8 p-0"
                            title="View round details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredRounds.length > 5 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (recentRoundsToShow < filteredRounds.length) {
                            setRecentRoundsToShow(prev => Math.min(prev + 5, filteredRounds.length));
                          } else {
                            setRecentRoundsToShow(5);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {recentRoundsToShow < filteredRounds.length ? (
                          <>
                            <span>Show {Math.min(5, filteredRounds.length - recentRoundsToShow)} More</span>
                            <ChevronDown className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>Show Less</span>
                            <ChevronUp className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rounds found. Start playing to see your stats!
                </div>
              )}
            </CardContent>
          </Card>
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
                See how you're improving over time
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

        {/* Hole-by-Hole Analysis Tab */}
        <TabsContent value="holes" className="space-y-6">
          <HoleByHoleAnalysis rounds={filteredRounds as any} />
        </TabsContent>

        {/* Social Comparison Tab */}
        <TabsContent value="social" className="space-y-6">
          {currentUser && (
            <SocialComparison
              currentUserId={currentUser._id}
              currentUserRounds={filteredRounds}
              currentUserStats={{
                totalRounds,
                averageScore: parseFloat(averageScore),
                bestScore: bestScore === Infinity ? 0 : bestScore,
                averageRating: roundsWithRatings.length > 0 ? Math.round(totalRatings / roundsWithRatings.length) : 0,
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      </div>
  );
}