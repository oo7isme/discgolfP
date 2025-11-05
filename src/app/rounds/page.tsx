"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Users, Trophy, Calendar, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Star, BarChart3, Activity, Cloud } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useRef, useEffect } from 'react';

export default function RoundsPage() {
  const { user, currentUser } = useCurrentUser();
  const router = useRouter();
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const detailsRef = useRef<HTMLDivElement>(null);
  
  const rounds = useQuery(api.rounds.getByUser, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Get detailed round data when a round is selected
  const selectedRoundData = useQuery(api.rounds.getRoundOrGroupRoundById, 
    selectedRound ? { id: selectedRound } : "skip"
  );

  // Sort rounds by date
  const sortedRounds = rounds ? [...rounds].sort((a, b) => {
    const dateA = a.startedAt || a._creationTime || 0;
    const dateB = b.startedAt || b._creationTime || 0;
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  }) : [];

  // Scroll to details when a round is selected
  useEffect(() => {
    if (selectedRound && detailsRef.current) {
      detailsRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedRound]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return 'In progress';
    const duration = endTime - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getScoreToPar = (totalStrokes: number, coursePar: number) => {
    const diff = totalStrokes - coursePar;
    if (diff === 0) return 'Par';
    if (diff < 0) return `${Math.abs(diff)} under`;
    return `${diff} over`;
  };

  const getScoreColor = (totalStrokes: number, coursePar: number) => {
    const diff = totalStrokes - coursePar;
    if (diff < 0) return 'text-green-600';
    if (diff === 0) return 'text-blue-600';
    return 'text-red-600';
  };

  // Helper function to calculate course par for card display using actual data
  const getCourseParForCard = (round: any) => {
    // If we have courseHoles data, use it
    if (round.courseHoles && round.courseHoles.length > 0) {
      return round.courseHoles.reduce((sum: number, hole: any) => sum + hole.par, 0);
    }
    
    // If we have scores, calculate from actual hole pars
    if (round.scores && round.scores.length > 0) {
      return round.scores.reduce((sum: number, score: any) => {
        // Use actual hole par if available, otherwise default to 3
        const hole = round.courseHoles?.find((h: any) => h.hole === score.hole);
        return sum + (hole ? hole.par : 3);
      }, 0);
    }
    
    // Last resort: use course holes count * 3
    return (round.course?.holes || 18) * 3;
  };

  if (!user || !currentUser) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to view your rounds history.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
        <div className="p-4 space-y-6 snap-start">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Previous Rounds</h1>
        <p className="text-[var(--muted-foreground)]">
          View your disc golf round history and detailed statistics
        </p>
      </div>

      {/* Sort Controls */}
      {sortedRounds.length > 0 && (
        <div className="flex justify-end">
          <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {rounds && rounds.length > 0 ? (
        <div className="space-y-4">
          {/* Rounds List */}
          <div className="space-y-3">
            {sortedRounds.map((round) => (
              <Card 
                key={round._id} 
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => router.push(`/rounds/${round._id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{round.course?.name || 'Unknown Course'}</h3>
                        <Badge variant="secondary">{round.roundType}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(round.startedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DgBasketIcon className="h-4 w-4" size={16} />
                          {round.totalStrokes} strokes
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {round.course?.holes || 18} holes
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          <span className={getScoreColor(round.totalStrokes || 0, getCourseParForCard(round))}>
                            {getScoreToPar(round.totalStrokes || 0, getCourseParForCard(round))}
                          </span>
                        </div>
                      </div>
                      
                      {/* Weather Data */}
                      {round.weather && (
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Cloud className="h-3 w-3" />
                            <span>{round.weather.temperature ? `${round.weather.temperature}°C` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{round.weather.conditions || 'N/A'}</span>
                          </div>
                          {round.weather.windSpeed && (
                            <div className="flex items-center gap-1">
                              <span>{round.weather.windSpeed} m/s</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-2xl font-bold">
                          {round.totalStrokes}
                        </div>
                        <div className="text-xs text-muted-foreground">total</div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Rounds Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start playing to see your round history and statistics here.
            </p>
            <Button asChild>
              <a href="/new">Start New Round</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
