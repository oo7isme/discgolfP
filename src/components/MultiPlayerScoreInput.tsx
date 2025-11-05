"use client";

import { useState, useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserPlus, Plus, Minus, Target, Ruler, Trophy, TrendingUp } from 'lucide-react';
import { HoleMap } from '@/components/HoleMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Participant {
  id: string;
  type: 'user' | 'guest';
  name: string;
  email?: string;
  userId?: any; // Convex ID type
}

interface ScoreData {
  [participantId: string]: {
    [hole: number]: number;
  };
}

interface MultiPlayerScoreInputProps {
  participants: Participant[];
  courseHoles: any[];
  onScoresChange: (scores: ScoreData) => void;
  onRoundComplete?: (isComplete: boolean) => void;
  onCurrentHoleChange?: (currentHole: number) => void;
}

export function MultiPlayerScoreInput({ 
  participants, 
  courseHoles, 
  onScoresChange,
  onRoundComplete,
  onCurrentHoleChange
}: MultiPlayerScoreInputProps) {
  const [currentHole, setCurrentHole] = useState(0);
  const [showHalfwayReview, setShowHalfwayReview] = useState(false);
  const [hasShownHalfwayReview, setHasShownHalfwayReview] = useState(false);
  const [scores, setScores] = useState<ScoreData>(() => {
    const initialScores: ScoreData = {};
    // Initialize scores for 'you'
    initialScores['you'] = Array(courseHoles?.length || 18).fill(0).reduce((acc, _, i) => {
      acc[i] = courseHoles?.[i]?.par || 3;
      return acc;
    }, {} as { [hole: number]: number });
    // Initialize scores for other participants
    participants.forEach(p => {
      initialScores[p.id] = Array(courseHoles?.length || 18).fill(0).reduce((acc, _, i) => {
        acc[i] = courseHoles?.[i]?.par || 3;
        return acc;
      }, {} as { [hole: number]: number });
    });
    return initialScores;
  });


  const currentPar = courseHoles?.find(h => h.hole === currentHole + 1)?.par || 3;
  const totalHoles = courseHoles?.length || 18;

  // Notify parent of current hole changes
  useEffect(() => {
    onCurrentHoleChange?.(currentHole + 1); // Convert to 1-based for parent
  }, [currentHole, onCurrentHoleChange]);

  const handleScoreChange = (participantId: string, hole: number, newScore: number) => {
    const newScores = {
      ...scores,
      [participantId]: {
        ...scores[participantId],
        [hole]: newScore,
      },
    };
    setScores(newScores);
    onScoresChange(newScores);
  };

  const incrementScore = (participantId: string, hole: number) => {
    const currentScore = getCurrentScore(participantId, hole);
    const newScore = Math.min(currentScore + 1, 20); // Max 20 strokes
    handleScoreChange(participantId, hole, newScore);
  };

  const decrementScore = (participantId: string, hole: number) => {
    const currentScore = getCurrentScore(participantId, hole);
    const newScore = Math.max(currentScore - 1, 1); // Min 1 stroke
    handleScoreChange(participantId, hole, newScore);
  };

  const getCurrentScore = (participantId: string, hole: number) => {
    return scores[participantId]?.[hole] || currentPar;
  };

  const getTotalScore = (participantId: string) => {
    const participantScores = scores[participantId] || {};
    return Object.values(participantScores).reduce((sum, score) => sum + score, 0);
  };

  // Calculate scores for first 9 holes
  const getFirstNineScore = (participantId: string) => {
    const participantScores = scores[participantId] || {};
    const firstNineHoles = Array.from({ length: 9 }, (_, i) => i);
    return firstNineHoles.reduce((sum, hole) => sum + (participantScores[hole] || 0), 0);
  };

  // Calculate par for first 9 holes
  const getFirstNinePar = () => {
    const firstNineHoles = courseHoles?.slice(0, 9) || [];
    return firstNineHoles.reduce((sum, hole) => sum + hole.par, 0);
  };

  // Check if we've reached halfway point (after hole 9, moving to hole 10)
  useEffect(() => {
    if (currentHole === 9 && !hasShownHalfwayReview && totalHoles >= 18) {
      setShowHalfwayReview(true);
      setHasShownHalfwayReview(true);
    }
  }, [currentHole, hasShownHalfwayReview, totalHoles]);

  const isRoundComplete = () => {
    return currentHole === totalHoles - 1;
  };

  const canFinishRound = () => {
    // Simply check if we're on the last hole
    // The user can always save their round once they've reached the end
    return isRoundComplete();
  };

  // For solo play, we still show the scoring interface
  const isSoloPlay = participants.length === 0;

  // Notify parent when round completion status changes
  useEffect(() => {
    if (onRoundComplete) {
      const isComplete = canFinishRound();
      onRoundComplete(isComplete);
    }
  }, [currentHole, onRoundComplete]);

  // Score input component with plus/minus buttons
  const ScoreInput = ({ participantId, hole, label }: { participantId: string; hole: number; label: string }) => {
    const currentScore = getCurrentScore(participantId, hole);
    const isPar = currentScore === currentPar;
    const isUnderPar = currentScore < currentPar;
    const isOverPar = currentScore > currentPar;

    return (
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => decrementScore(participantId, hole)}
          disabled={currentScore <= 1}
          className="h-12 w-12 p-0 border-2 hover:bg-red-50"
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <div
            className={`text-center text-2xl font-bold py-3 border-2 rounded-md ${
              isPar ? 'border-blue-400 bg-blue-50 text-blue-700' :
              isUnderPar ? 'border-green-400 bg-green-50 text-green-700' :
              isOverPar ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300 bg-gray-50'
            }`}
          >
            {currentScore} ({isPar ? ' E' : isUnderPar ? `- ${currentPar - currentScore}` : `+ ${currentScore - currentPar} `})
          </div>
        </div>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => incrementScore(participantId, hole)}
          disabled={currentScore >= 20}
          className="h-12 w-12 p-0 border-2 hover:bg-green-50"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  const currentHoleData = courseHoles?.find(h => h.hole === currentHole + 1);
  const currentDistance = currentHoleData?.distanceMeters || 0;

  const firstNinePar = getFirstNinePar();
  const allParticipants = [
    { id: 'you', name: 'You', type: 'user' as const },
    ...participants
  ];

  return (
    <>
      {/* Halfway Review Dialog */}
      <Dialog open={showHalfwayReview} onOpenChange={setShowHalfwayReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Halfway Review
            </DialogTitle>
            <DialogDescription>
              You've completed the first 9 holes! Here's how everyone is doing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {allParticipants.map((participant) => {
              const firstNineScore = getFirstNineScore(participant.id);
              const scoreToPar = firstNineScore - firstNinePar;
              const isUnderPar = scoreToPar < 0;
              const isOverPar = scoreToPar > 0;
              const isPar = scoreToPar === 0;
              const participantScores = scores[participant.id] || {};

              return (
                <div
                  key={participant.id}
                  className={`p-4 rounded-lg border-2 ${
                    isUnderPar
                      ? 'border-green-400 bg-green-50'
                      : isPar
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-red-400 bg-red-50'
                  }`}
                >
                  {/* Header with total score */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div className="flex items-center gap-2">
                      {participant.type === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <UserPlus className="h-5 w-5" />
                      )}
                      <span className="font-semibold">{participant.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {firstNineScore}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          isUnderPar
                            ? 'text-green-700'
                            : isPar
                            ? 'text-blue-700'
                            : 'text-red-700'
                        }`}
                      >
                        {isPar
                          ? 'Even'
                          : isUnderPar
                          ? `${Math.abs(scoreToPar)} under par`
                          : `${scoreToPar} over par`}
                      </div>
                    </div>
                  </div>

                  {/* Hole-by-hole breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                      Hole-by-Hole Breakdown
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 9 }, (_, i) => {
                        const holeNumber = i;
                        const holeScore = participantScores[holeNumber] || 0;
                        const holeData = courseHoles?.find(h => h.hole === holeNumber + 1);
                        const holePar = holeData?.par || 3;
                        const holeScoreToPar = holeScore - holePar;
                        const holeIsUnderPar = holeScoreToPar < 0;
                        const holeIsOverPar = holeScoreToPar > 0;
                        const holeIsPar = holeScoreToPar === 0;

                        return (
                          <div
                            key={holeNumber}
                            className={`p-2 rounded text-center border ${
                              holeIsUnderPar
                                ? 'border-green-300 bg-green-100/50'
                                : holeIsPar
                                ? 'border-blue-300 bg-blue-100/50'
                                : 'border-red-300 bg-red-100/50'
                            }`}
                          >
                            <div className="text-xs text-muted-foreground mb-1">
                              H{holeNumber + 1}
                            </div>
                            <div className="text-lg font-bold">
                              {holeScore}
                            </div>
                            <div className={`text-xs ${
                              holeIsUnderPar
                                ? 'text-green-700'
                                : holeIsPar
                                ? 'text-blue-700'
                                : 'text-red-700'
                            }`}>
                              {holeIsPar
                                ? 'E'
                                : holeIsUnderPar
                                ? `-${Math.abs(holeScoreToPar)}`
                                : `+${holeScoreToPar}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Par {holePar}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Front 9 Par:</span>
                <span className="font-semibold">{firstNinePar}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Holes remaining:</span>
                <span className="font-semibold">9 holes</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowHalfwayReview(false)}
              className="w-full"
              size="lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Continue Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg border-2">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl">Score Input</CardTitle>
        <CardDescription className="text-base">
          Hole {currentHole + 1} of {totalHoles}
          {isSoloPlay && " • Solo Round"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hole Map Visualization */}
        <HoleMap
          holeNumber={currentHole + 1}
          par={currentPar}
          distanceMeters={currentDistance}
        />

        {/* Hole Details - Badge Style */}
        <div className="flex items-center justify-center gap-2 flex-wrap">          
          <Badge variant="outline" className="px-4 py-2 text-base font-semibold border-2 border-green-500/30 bg-green-500/5">
            <Target className="h-4 w-4 mr-1.5 text-green-600" />
            <span className="text-green-600">Par {currentPar}</span>
          </Badge>
          
          {currentDistance > 0 && (
            <>
              <Badge variant="outline" className="px-4 py-2 text-base font-semibold border-2 border-blue-500/30 bg-blue-500/5">
                <Ruler className="h-4 w-4 mr-1.5 text-blue-600" />
                <span className="text-blue-600">{currentDistance}m</span>
              </Badge>
            </>
          )}
        </div>

        {/* Hole Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setCurrentHole(prev => Math.max(0, prev - 1))}
            disabled={currentHole === 0}
            variant="outline"
            size="sm"
            className="h-10"
          >
            Previous
          </Button>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Navigate Holes</div>
          </div>
          <Button
            onClick={() => setCurrentHole(prev => Math.min(totalHoles - 1, prev + 1))}
            disabled={currentHole === totalHoles - 1}
            size="sm"
            className="h-10"
          >
            Next
          </Button>
        </div>

        {/* Score Inputs */}
        <div className="space-y-4">
          {/* Main player (you) */}
          <div className="p-4 border-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">You</span>
                <Badge variant="secondary">
                  {isSoloPlay ? 'Solo' : 'Host'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {getTotalScore('you')}
              </div>
            </div>
            <ScoreInput participantId="you" hole={currentHole} label="You" />
          </div>

          {/* Other participants (only show if not solo play) */}
          {!isSoloPlay && participants.map((participant) => (
            <div key={participant.id} className="p-4 border-2 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {participant.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="font-medium">{participant.name}</span>
                  <Badge variant={participant.type === 'user' ? 'default' : 'outline'}>
                    {participant.type === 'user' ? 'Friend' : 'Guest'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {getTotalScore(participant.id)}
                </div>
              </div>
              <ScoreInput participantId={participant.id} hole={currentHole} label={participant.name} />
            </div>
          ))}
        </div>

        {/* Round Status */}
        {isRoundComplete() && (
          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {canFinishRound() 
                  ? '🎉 Round Complete! All scores entered.' 
                  : isSoloPlay 
                    ? 'Please enter your score for all holes to complete the round.'
                    : 'Please enter scores for all participants on all holes to complete the round.'
                }
              </p>
              {!canFinishRound() && (
                <div className="text-xs text-muted-foreground">
                  {isSoloPlay 
                    ? 'Navigate through all holes to enter your scores.'
                    : 'Navigate through all holes to enter scores for all players.'
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
