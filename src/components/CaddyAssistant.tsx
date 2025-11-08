"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';

type DistanceCategory = "long" | "fairway" | "approach" | "circleTwo" | "circleOne" | "tapIn";

interface DistanceAdviceContext {
  distance: number;
  par: number;
  holeDistance: number | null;
}

const getDistanceCategory = (distance: number): DistanceCategory => {
  if (distance > 160) return "long";
  if (distance > 110) return "fairway";
  if (distance > 60) return "approach";
  if (distance > 35) return "circleTwo";
  if (distance > 15) return "circleOne";
  return "tapIn";
};

const distanceAdviceTemplates: Record<DistanceCategory, ((ctx: DistanceAdviceContext) => string)[]> = {
  long: [
    ({ distance, par, holeDistance }) =>
      `You're still ${distance}m out. Play a measured shot that keeps you in bounds and sets up an easy angle on this par ${par}.`,
    ({ distance, holeDistance }) =>
      `${distance}m remaining. Focus on placement—land in a landing zone that opens the green${holeDistance ? ` for this ${holeDistance}m hole` : ""}.`,
  ],
  fairway: [
    ({ distance }) =>
      `${distance}m left. Smooth tempo and balanced follow-through—let the disc do the work.`,
    ({ distance, par }) =>
      `${distance}m to go. A controlled fairway shot keeps birdie in play on this par ${par}.`,
  ],
  approach: [
    ({ distance }) =>
      `${distance}m out. Aim for a safe landing zone on the high side to avoid rollaways.`,
    ({ distance }) =>
      `Only ${distance}m remaining. Commit to your release point and leave a stress-free putt.`,
  ],
  circleTwo: [
    ({ distance }) =>
      `${distance}m—circle two look. Give it height, but respect the comeback putt.`,
    ({ distance }) =>
      `${distance}m away. Choose a confident line or chip it close if you're not feeling the long putt.`,
  ],
  circleOne: [
    ({ distance }) =>
      `${distance}m—inside the circle. Breathe, pick a chain link and commit.`,
    ({ distance }) =>
      `${distance}m left. Smooth spin, nose flat, and follow through toward the target.`,
  ],
  tapIn: [
    ({ distance }) =>
      `${distance}m—tap-in territory! Take the easy par (or birdie) and walk to the next tee smiling.`,
    ({ distance }) =>
      `Just ${distance}m. Centre the putter, knock it down, and keep the momentum rolling.`,
  ],
};

interface CaddyAssistantProps {
  currentHole: number;
  totalHoles: number;
  currentScore: number;
  coursePar: number;
  scores: { [hole: number]: number };
  courseHoles: Array<{ hole: number; par: number; distanceMeters?: number }>;
  userToBasketDistance?: number | null;
  isUserNearBasket?: boolean;
}

function CaddyAssistantComponent({ 
  currentHole, 
  totalHoles, 
  currentScore, 
  coursePar, 
  scores, 
  courseHoles,
  userToBasketDistance,
  isUserNearBasket
}: CaddyAssistantProps) {
  const [advice, setAdvice] = useState<string>("");
  const [adviceType, setAdviceType] = useState<'positive' | 'warning' | 'neutral' | 'motivational' | 'ace'>('neutral');
  const [icon, setIcon] = useState<any>(DgBasketIcon);

  // Use refs to track the last processed values to prevent infinite loops
  const lastProcessedRef = useRef<number | null>(null);
  const adviceRef = useRef<string>(advice);
  const adviceTypeRef = useRef<'positive' | 'warning' | 'neutral' | 'motivational' | 'ace'>(adviceType);
  const iconRef = useRef<any>(icon);
  const courseHolesRef = useRef(courseHoles);
  const scoresRef = useRef(scores);

  // Keep refs in sync with state (only state, not props to avoid dependency issues)
  useEffect(() => {
    adviceRef.current = advice;
    adviceTypeRef.current = adviceType;
    iconRef.current = icon;
  }, [advice, adviceType, icon]);

  // Keep prop refs in sync separately to avoid dependency array size issues
  useEffect(() => {
    courseHolesRef.current = courseHoles;
    scoresRef.current = scores;
  }, [courseHoles, scores]);


  // Memoize scores and courseHoles strings to avoid infinite loops from object reference changes
  // Only update when the actual content changes, not just the reference
  const scoresString = useMemo(() => {
    if (!scores) return '';
    try {
      const sorted = Object.keys(scores).sort((a, b) => Number(a) - Number(b));
      return sorted.map(k => `${k}:${scores[Number(k)]}`).join(',');
    } catch {
      return '';
    }
  }, [scores]);
  
  const courseHolesString = useMemo(() => {
    if (!courseHoles || courseHoles.length === 0) return '';
    try {
      return courseHoles.map(h => `${h.hole}:${h.par}`).join(',');
    } catch {
      return '';
    }
  }, [courseHoles]);

  // Create a unique numeric ID for the current state (memoized to prevent unnecessary recalculations)
  // This key should ONLY depend on input props, never on internal state
  // Using a numeric ID instead of string to avoid React dependency array parsing issues
  const stateKeyId = useMemo(() => {
    // Create a hash-like numeric ID from the state values
    const safeScores = scoresString || '';
    const safeHoles = courseHolesString || '';
    const distanceBucket =
      userToBasketDistance != null && isUserNearBasket
        ? getDistanceCategory(Math.round(userToBasketDistance))
        : 'none';
    // Simple hash function to create a numeric ID
    const hash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    };
    const combined = `${currentHole}-${currentScore}-${coursePar}-${totalHoles}-${safeScores}-${safeHoles}-${distanceBucket}`;
    return hash(combined);
  }, [currentHole, currentScore, coursePar, totalHoles, scoresString, courseHolesString, userToBasketDistance]);

  useEffect(() => {
    // Early return if we don't have the necessary data
    // Use refs to access courseHoles and scores to avoid dependency issues
    const currentCourseHoles = courseHolesRef.current;
    const currentScores = scoresRef.current;
    
    if (!currentCourseHoles || !currentCourseHoles.length) {
      return;
    }

    // Skip if we've already processed this exact state
    if (lastProcessedRef.current === stateKeyId) {
      return;
    }

    // Batch all state updates together to prevent multiple re-renders
    let newAdvice = "";
    let newAdviceType: 'positive' | 'warning' | 'neutral' | 'motivational' | 'ace' = 'neutral';
    let newIcon: any = DgBasketIcon;
    
    // Calculate advice directly in useEffect (no nested function)
    // Count only holes that have been actually played (not just pre-filled with par)
    // We'll use the currentHole prop which represents the actual hole being played
    const normalizedHoleNumber = Math.max(1, Math.min(currentHole, currentCourseHoles.length));
    const holesPlayed = Math.max(0, normalizedHoleNumber - 1);
    const holesRemaining = totalHoles - normalizedHoleNumber;
    const currentHoleIndex = Math.max(0, Math.min(normalizedHoleNumber - 1, currentCourseHoles.length - 1));
    const currentHoleData = currentCourseHoles[currentHoleIndex];
    const currentHolePar = currentHoleData?.par ?? 3;
    const holeDistanceMeters = currentHoleData?.distanceMeters ?? null;
    
    // Calculate current score to par more accurately
    // We need to sum the par for holes 1 through holesPlayed (1-based)
    const playedHolesPar = currentCourseHoles.slice(0, holesPlayed).reduce((sum, hole) => sum + hole.par, 0);
    const currentScoreToPar = currentScore - playedHolesPar;
    
    const averagePerHole = holesPlayed > 0 ? currentScore / holesPlayed : 0;
    
    // Recent performance analysis - only use actually played holes
    const playedScores = Object.values(currentScores || {}).slice(0, holesPlayed);
    const recentScores = playedScores.slice(-3);
    const recentAverage = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const isImproving = recentScores.length >= 2 && recentScores[recentScores.length - 1] < recentScores[recentScores.length - 2];

    // Check for ace (hole-in-one) on current hole
    const currentHoleScore = (currentScores || {})[currentHoleIndex] || 0;
    const aceHolePar = currentHolePar;
    
    if (currentHoleScore === 1 && aceHolePar > 1) {
      newAdvice = `🎉 ACE! HOLE-IN-ONE! 🎉 Incredible shot on this ${aceHolePar}-par hole!`;
      newAdviceType = 'ace';
      newIcon = CheckCircle;
    } else if (holesPlayed === 0) {
      // Generate contextual advice
      newAdvice = "Start strong! Focus on hitting par on this first hole to build confidence.";
      newAdviceType = 'motivational';
      newIcon = Lightbulb;
    } else if (holesRemaining === 0) {
      const finalScoreToPar = currentScore - coursePar;
      if (finalScoreToPar <= 0) {
        newAdvice = `Excellent round! You finished ${Math.abs(finalScoreToPar)} under par. Well played!`;
        newAdviceType = 'positive';
        newIcon = CheckCircle;
      } else {
        newAdvice = `Round complete! You finished ${finalScoreToPar} over par. Good effort!`;
        newAdviceType = 'neutral';
        newIcon = DgBasketIcon;
      }
    } else if (currentScoreToPar <= -2) {
      newAdvice = `You're ${Math.abs(currentScoreToPar)} under par! Keep playing steady - don't get too aggressive.`;
      newAdviceType = 'positive';
      newIcon = TrendingUp;
    } else if (currentScoreToPar >= 5) {
      newAdvice = `You're ${currentScoreToPar} over par. Focus on making pars - avoid big numbers.`;
      newAdviceType = 'warning';
      newIcon = AlertCircle;
    } else if (holesRemaining <= 3) {
      if (currentScoreToPar === 0) {
        newAdvice = `Final holes! You're at even par. Make pars on these last ${holesRemaining} holes to finish even.`;
      } else if (currentScoreToPar < 0) {
        newAdvice = `Final stretch! You're ${Math.abs(currentScoreToPar)} under par. Keep making pars to maintain your lead.`;
      } else {
        const targetPerHole = Math.ceil((currentScoreToPar + holesRemaining) / holesRemaining);
        if (targetPerHole <= currentHolePar) {
          newAdvice = `Final stretch! You need to average ${targetPerHole} strokes per hole to finish under par.`;
        } else {
          newAdvice = `Final holes! Try to make pars on these last ${holesRemaining} holes.`;
        }
      }
      newAdviceType = 'warning';
      newIcon = AlertCircle;
    } else if (isImproving && recentAverage < currentHolePar) {
      newAdvice = `Great improvement! Your recent holes are trending better. Keep this momentum on this ${currentHolePar}-par hole.`;
      newAdviceType = 'positive';
      newIcon = TrendingUp;
    } else if (averagePerHole > currentHolePar + 1) {
      newAdvice = `You're averaging ${averagePerHole.toFixed(1)} strokes per hole. Focus on making par on this ${currentHolePar}-par hole.`;
      newAdviceType = 'warning';
      newIcon = AlertCircle;
    } else if (currentScoreToPar === 0) {
      newAdvice = `Perfect! You're right on par. Keep playing steady golf for the remaining ${holesRemaining} holes.`;
      newAdviceType = 'neutral';
      newIcon = DgBasketIcon;
    } else if (currentScoreToPar === 1) {
      newAdvice = `You're 1 over par. A birdie on this ${currentHolePar}-par hole would bring you back to even.`;
      newAdviceType = 'neutral';
      newIcon = DgBasketIcon;
    } else if (currentScoreToPar === -1) {
      newAdvice = `You're 1 under par. A par on this ${currentHolePar}-par hole will maintain your lead.`;
      newAdviceType = 'positive';
      newIcon = TrendingUp;
    } else if (currentScoreToPar > 0) {
      // Add specific advice based on hole characteristics
      const distance = holeDistanceMeters || 0;
      
      let specificAdvice = "";
      if (currentHolePar === 3) {
        if (distance > 150) {
          specificAdvice = "This is a long par 3. Focus on accuracy over distance.";
        } else {
          specificAdvice = "Short par 3 - aim for the center of the green.";
        }
      } else if (currentHolePar === 4) {
        if (distance > 300) {
          specificAdvice = "Long par 4 - play it as two good shots.";
        } else {
          specificAdvice = "Standard par 4 - focus on hitting the fairway.";
        }
      } else if (currentHolePar === 5) {
        specificAdvice = "Par 5 - take your time and avoid big mistakes.";
      }
      
      newAdvice = `You're ${currentScoreToPar} over par. ${specificAdvice}`;
      newAdviceType = 'warning';
      newIcon = AlertCircle;
    } else {
      newAdvice = `You're ${Math.abs(currentScoreToPar)} under par. Keep playing steady golf.`;
      newAdviceType = 'positive';
      newIcon = TrendingUp;
    }
    
    if (isUserNearBasket && userToBasketDistance != null && Number.isFinite(userToBasketDistance)) {
      const distanceMeters = Math.round(userToBasketDistance);
      const distanceCategory = getDistanceCategory(distanceMeters);
      const templates = distanceAdviceTemplates[distanceCategory];

      if (templates && templates.length > 0) {
        const variantIndex = Math.abs((currentHoleIndex + distanceMeters) % templates.length);
        const distanceTip = templates[variantIndex]({
          distance: distanceMeters,
          par: currentHolePar,
          holeDistance: holeDistanceMeters,
        });

        if (distanceTip) {
          newAdvice = newAdvice ? `${newAdvice} ${distanceTip}`.trim() : distanceTip;
        }
      }

      if (distanceCategory === "circleOne" || distanceCategory === "tapIn") {
        if (newAdviceType !== 'ace') {
          newAdviceType = 'positive';
          newIcon = CheckCircle;
        }
      } else if (distanceCategory === "long" && newAdviceType === 'neutral') {
        newAdviceType = 'motivational';
        newIcon = Lightbulb;
      }
    }

    // Only update state if values actually changed to prevent unnecessary re-renders
    // This check prevents the infinite loop by ensuring we don't update state with the same values
    // Use refs to check current values without adding them to the dependency array
    if (adviceRef.current === newAdvice && adviceTypeRef.current === newAdviceType && iconRef.current === newIcon) {
      // Values haven't changed, just mark as processed and return
      lastProcessedRef.current = stateKeyId;
      return;
    }
    
    // Mark this state as processed BEFORE state updates to prevent re-triggering
    lastProcessedRef.current = stateKeyId;
    
    // Use React.startTransition to batch state updates and prevent synchronous re-renders
    // This ensures the effect won't re-trigger immediately after state updates
    React.startTransition(() => {
      setAdvice(newAdvice);
      setAdviceType(newAdviceType);
      setIcon(newIcon);
    });
  }, [stateKeyId]);

  const getAdviceColor = () => {
    switch (adviceType) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'motivational': return 'border-blue-200 bg-blue-50';
      case 'ace': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = () => {
    switch (adviceType) {
      case 'positive': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'motivational': return 'text-blue-600';
      case 'ace': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Always show something for debugging
  if (!courseHoles || !scores) {
    return (
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            Caddy Assistant - DEBUG
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3">
            <DgBasketIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" size={20} />
            <p className="text-sm leading-relaxed">
              Missing data: courseHoles={!!courseHoles}, scores={!!scores}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = typeof icon === 'function' ? icon : DgBasketIcon;

  return (
    <Card className={`border-2 ${getAdviceColor()} transition-all duration-300`}>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1 text-sm">
          <Brain className="h-4 w-4 text-purple-600" />
          Caddy Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isUserNearBasket && userToBasketDistance != null && (
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Distance to basket</span>
            <Badge variant="outline" className="border-purple-200 text-purple-700">
              {Math.round(userToBasketDistance)} m
            </Badge>
          </div>
        )}
        <div className="flex items-start gap-1">
          {React.createElement(IconComponent, { className: `h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor()}` })}
          <p className="text-sm leading-relaxed">{advice || "Welcome to the course! Start strong and stay focused. You've got this! 🎯"}</p>
        </div>
        
        {/* Round Progress */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-muted-foreground">Round Progress</span>
            <span className="font-semibold">
              {Math.min(currentHole, totalHoles)} / {totalHoles} holes
            </span>
          </div>
          <Progress 
            value={(Math.min(currentHole, totalHoles) / totalHoles) * 100} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Memoize the component to prevent unnecessary re-renders when props haven't changed
export const CaddyAssistant = React.memo(CaddyAssistantComponent, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if actual values changed
  if (prevProps.currentHole !== nextProps.currentHole) return false;
  if (prevProps.totalHoles !== nextProps.totalHoles) return false;
  if (prevProps.currentScore !== nextProps.currentScore) return false;
  if (prevProps.coursePar !== nextProps.coursePar) return false;
  
  // Compare scores objects
  const prevScoresStr = JSON.stringify(prevProps.scores || {});
  const nextScoresStr = JSON.stringify(nextProps.scores || {});
  if (prevScoresStr !== nextScoresStr) return false;
  
  // Compare courseHoles arrays
  const prevHolesStr = JSON.stringify((prevProps.courseHoles || []).map(h => ({ hole: h.hole, par: h.par })));
  const nextHolesStr = JSON.stringify((nextProps.courseHoles || []).map(h => ({ hole: h.hole, par: h.par })));
  if (prevHolesStr !== nextHolesStr) return false;

  if ((prevProps.userToBasketDistance ?? null) !== (nextProps.userToBasketDistance ?? null)) return false;
  
  // Props are equal, skip re-render
  return true;
});
