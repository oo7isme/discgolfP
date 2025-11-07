"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { CaddyAssistant } from '@/components/CaddyAssistant';
import { MultiPlayerScoreInput } from '@/components/MultiPlayerScoreInput';
import { RoundRecap } from '@/components/RoundRecap';
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';
import { useRouter, useSearchParams } from 'next/navigation';

interface Participant {
  id: string;
  type: 'user' | 'guest';
  name: string;
  guestEmail?: string;
  userId?: any; // Convex ID type
}

interface ScoreData {
  [participantId: string]: {
    [hole: number]: number;
  };
}

function ScorePageContent() {
  const { user, currentUser } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get game setup from URL params
  const courseId = searchParams.get('courseId');
  const roundType = searchParams.get('roundType') || 'CASUAL';
  const participantsParam = searchParams.get('participants');
  const weatherParam = searchParams.get('weather');
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [scores, setScores] = useState<ScoreData>({});
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentHole, setCurrentHole] = useState(1);
  const [showRecap, setShowRecap] = useState(false);
  const [savedRoundId, setSavedRoundId] = useState<string | null>(null);

  // Queries
  const course = useQuery(api.courses.getById, courseId ? { id: courseId as any } : "skip");
  const courseHoles = useQuery(api.courses.getHoles, 
    courseId ? { courseId: courseId as any } : "skip"
  );

  // Mutations
  const createRound = useMutation(api.rounds.create);
  const createGroupRound = useMutation(api.groupRounds.createGroupRound);

  // Parse participants and weather from URL
  useEffect(() => {
    if (participantsParam) {
      try {
        const parsedParticipants = JSON.parse(decodeURIComponent(participantsParam));
        setParticipants(parsedParticipants);
      } catch (error) {
        console.error('Error parsing participants:', error);
      }
    }
    
    if (weatherParam) {
      try {
        const parsedWeather = JSON.parse(decodeURIComponent(weatherParam));
        setWeather(parsedWeather);
      } catch (error) {
        console.error('Error parsing weather:', error);
      }
    }
  }, [participantsParam, weatherParam]);

  // Initialize scores with par values
  useEffect(() => {
    if (courseHoles && currentUser) {
      const initialScores: ScoreData = {};
      
      // Initialize current user scores (use 'you' as key to match MultiPlayerScoreInput)
      initialScores['you'] = {};
      courseHoles.forEach((hole: { hole: number; par: number }, index: number) => {
        initialScores['you'][index] = hole.par;
      });

      // Initialize participant scores
      participants.forEach(participant => {
        initialScores[participant.id] = {};
        courseHoles.forEach((hole: { hole: number; par: number }, index: number) => {
          initialScores[participant.id][index] = hole.par;
        });
      });

      setScores(initialScores);
    }
  }, [courseHoles, participants, currentUser]);

  const handleRoundComplete = (complete: boolean) => {
    setIsRoundComplete(complete);
  };

  const handleSaveRound = async () => {
    if (!currentUser || !courseId || !courseHoles) {
      toast({
        title: "Error",
        description: "Missing user, course, or hole data.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (participants.length === 0) {
        // Solo round
        const playerScores = scores['you'] || {};
        const roundScores = courseHoles?.map((hole: { hole: number; par: number }, index: number) => ({
          hole: hole.hole,
          strokes: playerScores[index] || hole.par,
        })) || [];

        const roundId = await createRound({
          userId: currentUser._id,
          courseId: courseId as any,
          scores: roundScores,
        });

        setSavedRoundId(roundId);
        setShowRecap(true);
      } else {
        // Group round - transform participants to match Convex schema
        const allParticipants = [
          {
            userId: currentUser._id,
            scores: courseHoles?.map((hole: { hole: number; par: number }, index: number) => ({
              hole: hole.hole,
              strokes: scores['you']?.[index] || hole.par,
            })) || [],
          },
          ...participants.map(p => ({
            userId: p.type === 'user' ? p.userId as any : undefined,
            guestName: p.type === 'guest' ? p.name : undefined,
            guestEmail: p.type === 'guest' ? p.guestEmail : undefined,
            scores: courseHoles?.map((hole: { hole: number; par: number }, index: number) => ({
              hole: hole.hole,
              strokes: scores[p.id]?.[index] || hole.par,
            })) || [],
          }))
        ];

        const groupRoundResult = await createGroupRound({
          userId: currentUser._id,
          courseId: courseId as any,
          roundType: roundType as any,
          participants: allParticipants,
          weather: weather,
        });

        // For group rounds, use the first individual round ID for navigation
        setSavedRoundId(groupRoundResult.roundIds[0]);
        setShowRecap(true);
      }

      // Don't navigate immediately - show recap first
    } catch (error) {
      console.error("Error saving round:", error);
      toast({
        title: "Error",
        description: "Failed to save round. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToSetup = () => {
    router.push('/new');
  };

  const handleRecapClose = () => {
    setShowRecap(false);
    router.push('/');
  };

  const handleViewDetails = () => {
    setShowRecap(false);
    if (savedRoundId) {
      // Validate that we have actual score data before navigating
      const hasValidScores = Object.values(scores).some(playerScores => 
        Object.values(playerScores).some(score => score > 0)
      );
      
      if (hasValidScores) {
        router.push(`/rounds/${savedRoundId}`);
      } else {
        // If no valid scores, go to rounds page instead
        router.push('/rounds');
      }
    } else {
      // For multi-player rounds, navigate to rounds page to show recent rounds
      router.push('/rounds');
    }
  };

  // Redirect if no course selected
  if (!courseId || !course) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">No course selected. Please start a new game.</p>
          <Button onClick={handleBackToSetup} className="mt-4">
            Start New Game
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact Header */}
      <div className="p-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSetup}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{course.name}</h1>
            <p className="text-xs text-muted-foreground">
              {roundType} • {participants.length + 1} player{participants.length > 0 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Combined Score and Map */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-4 space-y-4 min-h-full">
          {/* Caddy Assistant */}
          {courseHoles && scores['you'] && (
            <div className="w-full max-w-2xl">
              <CaddyAssistant
                currentHole={currentHole}
                totalHoles={courseHoles.length}
                currentScore={Object.values(scores['you']).slice(0, currentHole - 1).reduce((sum, score) => sum + score, 0)}
                coursePar={courseHoles.reduce((sum: number, hole: { hole: number; par: number }) => sum + hole.par, 0)}
                scores={scores['you']}
                courseHoles={courseHoles}
              />
            </div>
          )}
          
          {/* Score Input with Integrated Map */}
          {courseHoles && (
            <div className="w-full max-w-2xl">
              <MultiPlayerScoreInput 
                courseHoles={courseHoles}
                courseId={courseId || undefined}
                participants={participants}
                onScoresChange={setScores}
                onRoundComplete={handleRoundComplete}
                onCurrentHoleChange={setCurrentHole}
                initialCurrentHole={currentHole}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Status and Save Button */}
      <div className="p-4 border-t bg-background/95 backdrop-blur">
        {courseHoles && !isRoundComplete && (
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Complete all holes to save your round
            </p>
            <div className="text-xs text-muted-foreground">
              Navigate through all holes and enter scores for all players
            </div>
          </div>
        )}

        {/* Save Round - Only show when round is complete */}
        {courseHoles && isRoundComplete && (
          <Button 
            onClick={handleSaveRound} 
            disabled={isSaving}
            className="w-full h-12 text-base font-medium"
          >
            {isSaving ? "Saving..." : participants.length === 0 ? 'Save Round' : `Save Group Round (${participants.length + 1} players)`}
          </Button>
        )}
      </div>

      {/* Round Recap Modal */}
      {showRecap && course && courseHoles && (
        <RoundRecap
          roundId={savedRoundId || ''}
          roundData={{
            courseName: course.name,
            totalStrokes: participants.length === 0 
              ? Object.values(scores['you'] || {}).reduce((sum, score) => sum + score, 0)
              : Object.values(scores['you'] || {}).reduce((sum, score) => sum + score, 0),
            coursePar: courseHoles.reduce((sum: number, hole: { hole: number; par: number }) => sum + hole.par, 0),
            roundType: roundType,
            startedAt: Date.now() - (2 * 60 * 60 * 1000), // Approximate start time
            completedAt: Date.now(),
            scores: courseHoles.map((hole: { hole: number; par: number }, index: number) => ({
              hole: hole.hole,
              strokes: scores['you']?.[index] || hole.par,
              par: hole.par,
            })),
            participants: participants.length > 0 ? [
              {
                name: currentUser?.name || 'You',
                totalStrokes: Object.values(scores['you'] || {}).reduce((sum, score) => sum + score, 0),
              },
              ...participants.map(p => ({
                name: p.name,
                totalStrokes: Object.values(scores[p.id] || {}).reduce((sum, score) => sum + score, 0),
              }))
            ] : undefined,
          }}
          onClose={handleRecapClose}
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
}

export default function ScorePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2"></div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <ScorePageContent />
    </Suspense>
  );
}
