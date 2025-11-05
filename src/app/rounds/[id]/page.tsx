"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Minus, 
  Calendar, 
  Clock, 
  MapPin,
  ArrowLeft,
  Users,
  Award,
  BarChart3
} from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, use } from 'react';

interface RoundDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RoundDetailsPage({ params }: RoundDetailsPageProps) {
  const { user, currentUser } = useCurrentUser();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const roundId = resolvedParams.id;

  // Try to determine if this is a group round or individual round
  // For now, let's try the universal query
  const round = useQuery(api.rounds.getRoundOrGroupRoundById, 
    currentUser && roundId ? { id: roundId } : "skip"
  );


  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!user || !currentUser) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to view round details.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Round not found</CardTitle>
            <CardDescription>
              The round you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if this is an incomplete round with no data
  const hasNoData = (!round.scores || round.scores.length === 0) && 
                   (!round.course) && 
                   (!round.participants || round.participants.length === 0);

  if (hasNoData) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Incomplete Round</CardTitle>
            <CardDescription>
              This round was created but no scores have been entered yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No Scores Yet</h3>
              <p className="text-muted-foreground mb-4">
                This round hasn't been completed. Scores need to be entered to view detailed statistics.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/')} variant="outline">
                  Back to Home
                </Button>
                <Button onClick={() => router.push('/new')}>
                  Start New Round
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate detailed stats
  const totalStrokes = ('totalStrokes' in round && typeof round.totalStrokes === 'number') ? round.totalStrokes : 0;
  
  // Calculate course par more accurately using courseHoles data - NO GUESSING
  let coursePar = 54; // Default fallback only if no data available
  
  // First try to use actual courseHoles data if available
  if (round.courseHoles && round.courseHoles.length > 0) {
    coursePar = round.courseHoles.reduce((sum, hole) => sum + hole.par, 0);
  }
  // Calculate course par using actual hole pars from scores
  else if (round.scores && round.scores.length > 0) {
    coursePar = round.scores.reduce((sum, score) => sum + getHolePar(score.hole), 0);
  }
  
  const scoreToPar = totalStrokes - coursePar;
  const isUnderPar = scoreToPar < 0;
  const isPar = scoreToPar === 0;
  const isOverPar = scoreToPar > 0;

  // Find best and worst holes using actual course par data
  // Helper function to get hole par using actual courseHoles data - NO GUESSING
  const getHolePar = (holeNumber: number) => {
    if (round.courseHoles && round.courseHoles.length > 0) {
      const hole = round.courseHoles.find(h => h.hole === holeNumber);
      return hole ? hole.par : 3; // Default to par 3 if hole not found
    }
    
    // If no courseHoles data, we can't guess - return 3 as fallback
    return 3;
  };

  const bestHole = round.scores && round.scores.length > 0 ? round.scores.reduce((best: any, current: any) => {
    const currentPar = getHolePar(current.hole);
    const bestPar = getHolePar(best.hole);
    const currentDiff = current.strokes - currentPar;
    const bestDiff = best.strokes - bestPar;
    return currentDiff < bestDiff ? current : best;
  }) : null;

  const worstHole = round.scores && round.scores.length > 0 ? round.scores.reduce((worst: any, current: any) => {
    const currentPar = getHolePar(current.hole);
    const worstPar = getHolePar(worst.hole);
    const currentDiff = current.strokes - currentPar;
    const worstDiff = worst.strokes - worstPar;
    return currentDiff > worstDiff ? current : worst;
  }) : null;

  // Calculate over/under par trend using actual hole pars
  const parTrend = round.scores && round.scores.length > 0 ? round.scores.map((score: any) => {
    const holePar = getHolePar(score.hole);
    return score.strokes - holePar;
  }) : [];
  const positiveTrend = parTrend.filter((diff: number) => diff < 0).length; // Under par holes
  const negativeTrend = parTrend.filter((diff: number) => diff > 0).length; // Over par holes
  const parHoles = parTrend.filter((diff: number) => diff === 0).length;

  // Calculate round duration
  const endTime = ('completed' in round && typeof round.completed === 'boolean' && round.completed) ? Date.now() : Date.now(); // Use current time as approximation
  const startedAt = ('startedAt' in round && typeof round.startedAt === 'number') ? round.startedAt : Date.now();
  const duration = endTime - startedAt;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  // Format date
  const roundDate = new Date(startedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate average score per hole
  const averageScorePerHole = round.scores && round.scores.length > 0 ? (totalStrokes / round.scores.length).toFixed(1) : "0.0";

  // Calculate consistency (standard deviation)
  const mean = round.scores && round.scores.length > 0 ? totalStrokes / round.scores.length : 0;
  const variance = round.scores && round.scores.length > 0 ? round.scores.reduce((acc: number, score: any) => {
    return acc + Math.pow(score.strokes - mean, 2);
  }, 0) / round.scores.length : 0;
  const standardDeviation = Math.sqrt(variance).toFixed(1);

  // Calculate birdie/eagle/bogey counts
  const birdies = parTrend.filter((diff: number) => diff === -1).length;
  const eagles = parTrend.filter((diff: number) => diff <= -2).length;
  const bogeys = parTrend.filter((diff: number) => diff === 1).length;
  const doubleBogeys = parTrend.filter((diff: number) => diff >= 2).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="p-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {round.course && 'name' in round.course ? round.course.name : 'Unknown Course'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {roundDate} • {('roundType' in round && typeof round.roundType === 'string') ? round.roundType : 'Casual'}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "p-4 space-y-6 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Round Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Round Summary
            </CardTitle>
            <CardDescription>
              Overall performance and key metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{totalStrokes}</div>
                <div className="text-sm text-muted-foreground">Total Strokes</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className={cn(
                  "text-3xl font-bold",
                  isUnderPar ? "text-green-600" : isPar ? "text-blue-600" : "text-red-600"
                )}>
                  {Math.abs(scoreToPar)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isUnderPar ? "Under Par" : isPar ? "Par" : "Over Par"}
                </div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{coursePar}</div>
                <div className="text-sm text-muted-foreground">Course Par</div>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{averageScorePerHole}</div>
                <div className="text-sm text-muted-foreground">Avg per Hole</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Best/Worst Holes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DgBasketIcon className="h-5 w-5" size={20} />
                Hole Performance
              </CardTitle>
              <CardDescription>
                Your best and most challenging holes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bestHole && worstHole && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-800">Best Hole</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      Hole {bestHole.hole}
                    </div>
                    <div className="text-sm text-green-600">
                      {bestHole.strokes} strokes (Par {getHolePar(bestHole.hole)})
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      {(() => {
                        const holePar = getHolePar(bestHole.hole);
                        const diff = bestHole.strokes - holePar;
                        return diff < 0 ? 
                          `${Math.abs(diff)} under par` :
                          diff === 0 ? 'Par' :
                          `${diff} over par`;
                      })()}
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DgBasketIcon className="h-5 w-5 text-red-600 mr-2" size={20} />
                      <span className="font-semibold text-red-800">Toughest Hole</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      Hole {worstHole.hole}
                    </div>
                    <div className="text-sm text-red-600">
                      {worstHole.strokes} strokes (Par {getHolePar(worstHole.hole)})
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      {(() => {
                        const holePar = getHolePar(worstHole.hole);
                        const diff = worstHole.strokes - holePar;
                        return diff < 0 ? 
                          `${Math.abs(diff)} under par` :
                          diff === 0 ? 'Par' :
                          `${diff} over par`;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Score Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of your scoring performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{eagles}</div>
                  <div className="text-sm text-green-600">Eagles</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{birdies}</div>
                  <div className="text-sm text-green-600">Birdies</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{parHoles}</div>
                  <div className="text-sm text-blue-600">Pars</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{bogeys}</div>
                  <div className="text-sm text-red-600">Bogeys</div>
                </div>
              </div>
              {doubleBogeys > 0 && (
                <div className="text-center p-3 bg-red-100 rounded-lg">
                  <div className="text-xl font-bold text-red-700">{doubleBogeys}</div>
                  <div className="text-sm text-red-600">Double Bogeys+</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Over/Under Par Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your round performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Performance Bars */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Under Par Holes</span>
                  <span className="text-sm text-muted-foreground">{positiveTrend} holes</span>
                </div>
                <Progress 
                  value={(positiveTrend / round.scores.length) * 100} 
                  className="h-3 bg-green-100"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Par Holes</span>
                  <span className="text-sm text-muted-foreground">{parHoles} holes</span>
                </div>
                <Progress 
                  value={(parHoles / round.scores.length) * 100} 
                  className="h-3 bg-blue-100"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Over Par Holes</span>
                  <span className="text-sm text-muted-foreground">{negativeTrend} holes</span>
                </div>
                <Progress 
                  value={(negativeTrend / round.scores.length) * 100} 
                  className="h-3 bg-red-100"
                />
              </div>

              {/* Consistency Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{standardDeviation}</div>
                  <div className="text-xs text-muted-foreground">Consistency Score</div>
                  <div className="text-xs text-muted-foreground">(Lower = More Consistent)</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {((positiveTrend / round.scores.length) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Under Par Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hole-by-Hole Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DgBasketIcon className="h-5 w-5" size={20} />
              Hole-by-Hole Breakdown
            </CardTitle>
            <CardDescription>
              Detailed scores for each hole
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1">
              {round.scores
                .sort((a: any, b: any) => a.hole - b.hole)
                .map((score: any) => {
                  const holePar = getHolePar(score.hole);
                  const scoreToPar = score.strokes - holePar;
                  const isUnderPar = scoreToPar < 0;
                  const isPar = scoreToPar === 0;
                  const isOverPar = scoreToPar > 0;
                  
                  return (
                    <div 
                      key={score.hole}
                      className={cn(
                        "p-2 rounded text-center border text-xs",
                        isUnderPar ? "bg-green-50 border-green-200" :
                        isPar ? "bg-blue-50 border-blue-200" :
                        "bg-red-50 border-red-200"
                      )}
                    >
                      <div className="text-xs text-muted-foreground mb-1">H{score.hole}</div>
                      <div className="text-lg font-bold">{score.strokes}</div>
                      <div className="text-xs text-muted-foreground">Par {holePar}</div>
                      <div className={cn(
                        "text-xs font-medium mt-1",
                        isUnderPar ? "text-green-600" :
                        isPar ? "text-blue-600" :
                        "text-red-600"
                      )}>
                        {isUnderPar ? `${Math.abs(scoreToPar)} under` :
                         isPar ? 'Par' :
                         `${scoreToPar} over`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Round Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Round Information
            </CardTitle>
            <CardDescription>
              Additional details about this round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Date</div>
                  <div className="text-xs text-muted-foreground">{roundDate}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-xs text-muted-foreground">
                    {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Course</div>
                  <div className="text-xs text-muted-foreground">{round.course && 'name' in round.course ? round.course.name : 'Unknown Course'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Type</div>
                  <div className="text-xs text-muted-foreground">{('roundType' in round && typeof round.roundType === 'string') ? round.roundType : 'Casual'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Weather Conditions
            </CardTitle>
            <CardDescription>
              Weather data recorded during this round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Temperature</div>
                <div className="text-lg font-semibold">
                  {round.weather?.temperature ? `${round.weather.temperature}°F` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Wind Speed</div>
                <div className="text-lg font-semibold">
                  {round.weather?.windSpeed ? `${round.weather.windSpeed} mph` : 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Conditions</div>
                <div className="text-lg font-semibold">
                  {round.weather?.conditions || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Humidity</div>
                <div className="text-lg font-semibold">
                  {round.weather?.humidity ? `${round.weather.humidity}%` : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {('notes' in round && typeof round.notes === 'string') && (
          <Card>
            <CardHeader>
              <CardTitle>Round Notes</CardTitle>
              <CardDescription>
                Additional notes from this round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{round.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Group Round Participants */}
        {round.participants && round.participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Round Participants
              </CardTitle>
              <CardDescription>
                All players who participated in this round
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {round.participants
                  .sort((a: any, b: any) => a.totalStrokes - b.totalStrokes)
                  .map((participant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{participant.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{participant.totalStrokes}</div>
                      <div className="text-xs text-muted-foreground">strokes</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
