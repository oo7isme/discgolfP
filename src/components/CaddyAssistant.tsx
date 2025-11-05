"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';

interface CaddyAssistantProps {
  currentHole: number;
  totalHoles: number;
  currentScore: number;
  coursePar: number;
  scores: { [hole: number]: number };
  courseHoles: Array<{ hole: number; par: number; distanceMeters?: number }>;
}

export function CaddyAssistant({ 
  currentHole, 
  totalHoles, 
  currentScore, 
  coursePar, 
  scores, 
  courseHoles 
}: CaddyAssistantProps) {
  const [advice, setAdvice] = useState<string>("");
  const [adviceType, setAdviceType] = useState<'positive' | 'warning' | 'neutral' | 'motivational' | 'ace'>('neutral');
  const [icon, setIcon] = useState<any>(DgBasketIcon);

  useEffect(() => {
    generateAdvice();
  }, [currentHole, currentScore, coursePar, scores]);

  const generateAdvice = () => {
    // Count only holes that have been actually played (not just pre-filled with par)
    // We'll use the currentHole prop which represents the actual hole being played
    const holesPlayed = Math.max(0, currentHole - 1);
    const holesRemaining = totalHoles - holesPlayed;
    
    // Calculate current score to par more accurately
    // We need to sum the par for holes 1 through holesPlayed (1-based)
    const playedHolesPar = courseHoles.slice(0, holesPlayed).reduce((sum, hole) => sum + hole.par, 0);
    const currentScoreToPar = currentScore - playedHolesPar;
    
    const averagePerHole = holesPlayed > 0 ? currentScore / holesPlayed : 0;
    
    // Get current hole par (next hole to be played)
    const currentHolePar = courseHoles[currentHole - 1]?.par || 3;
    
    // Calculate what you need to shoot to maintain/improve position
    const remainingPar = courseHoles.slice(holesPlayed).reduce((sum, hole) => sum + hole.par, 0);
    const targetScore = Math.ceil(coursePar / totalHoles * holesRemaining);
    const scoreNeeded = Math.max(1, targetScore - currentScore);

    // Recent performance analysis - only use actually played holes
    const playedScores = Object.values(scores).slice(0, holesPlayed);
    const recentScores = playedScores.slice(-3);
    const recentAverage = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const isImproving = recentScores.length >= 2 && recentScores[recentScores.length - 1] < recentScores[recentScores.length - 2];

    // Check for ace (hole-in-one) on current hole
    const currentHoleScore = scores[currentHole - 1] || 0;
    const aceHolePar = courseHoles[currentHole - 1]?.par || 3;
    
    if (currentHoleScore === 1 && aceHolePar > 1) {
      setAdvice(`🎉 ACE! HOLE-IN-ONE! 🎉 Incredible shot on this ${aceHolePar}-par hole!`);
      setAdviceType('ace');
      setIcon(CheckCircle);
      return;
    }

    // Generate contextual advice
    if (holesPlayed === 0) {
      setAdvice("Start strong! Focus on hitting par on this first hole to build confidence.");
      setAdviceType('motivational');
      setIcon(Lightbulb);
    } else if (holesRemaining === 0) {
      const finalScoreToPar = currentScore - coursePar;
      if (finalScoreToPar <= 0) {
        setAdvice(`Excellent round! You finished ${Math.abs(finalScoreToPar)} under par. Well played!`);
        setAdviceType('positive');
        setIcon(CheckCircle);
      } else {
        setAdvice(`Round complete! You finished ${finalScoreToPar} over par. Good effort!`);
        setAdviceType('neutral');
        setIcon(DgBasketIcon);
      }
    } else if (currentScoreToPar <= -2) {
      setAdvice(`You're ${Math.abs(currentScoreToPar)} under par! Keep playing steady - don't get too aggressive.`);
      setAdviceType('positive');
      setIcon(TrendingUp);
    } else if (currentScoreToPar >= 5) {
      setAdvice(`You're ${currentScoreToPar} over par. Focus on making pars - avoid big numbers.`);
      setAdviceType('warning');
      setIcon(AlertCircle);
    } else if (holesRemaining <= 3) {
      if (currentScoreToPar === 0) {
        setAdvice(`Final holes! You're at even par. Make pars on these last ${holesRemaining} holes to finish even.`);
      } else if (currentScoreToPar < 0) {
        setAdvice(`Final stretch! You're ${Math.abs(currentScoreToPar)} under par. Keep making pars to maintain your lead.`);
      } else {
        const targetPerHole = Math.ceil((currentScoreToPar + holesRemaining) / holesRemaining);
        if (targetPerHole <= currentHolePar) {
          setAdvice(`Final stretch! You need to average ${targetPerHole} strokes per hole to finish under par.`);
        } else {
          setAdvice(`Final holes! Try to make pars on these last ${holesRemaining} holes.`);
        }
      }
      setAdviceType('warning');
      setIcon(AlertCircle);
    } else if (isImproving && recentAverage < currentHolePar) {
      setAdvice(`Great improvement! Your recent holes are trending better. Keep this momentum on this ${currentHolePar}-par hole.`);
      setAdviceType('positive');
      setIcon(TrendingUp);
    } else if (averagePerHole > currentHolePar + 1) {
      setAdvice(`You're averaging ${averagePerHole.toFixed(1)} strokes per hole. Focus on making par on this ${currentHolePar}-par hole.`);
      setAdviceType('warning');
      setIcon(AlertCircle);
    } else if (currentScoreToPar === 0) {
      setAdvice(`Perfect! You're right on par. Keep playing steady golf for the remaining ${holesRemaining} holes.`);
      setAdviceType('neutral');
      setIcon(DgBasketIcon);
    } else if (currentScoreToPar === 1) {
      setAdvice(`You're 1 over par. A birdie on this ${currentHolePar}-par hole would bring you back to even.`);
      setAdviceType('neutral');
      setIcon(DgBasketIcon);
    } else if (currentScoreToPar === -1) {
      setAdvice(`You're 1 under par. A par on this ${currentHolePar}-par hole will maintain your lead.`);
      setAdviceType('positive');
      setIcon(TrendingUp);
    } else if (currentScoreToPar > 0) {
      // Add specific advice based on hole characteristics
      const currentHoleData = courseHoles[currentHole - 1];
      const distance = currentHoleData?.distanceMeters || 0;
      
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
      
      setAdvice(`You're ${currentScoreToPar} over par. ${specificAdvice}`);
      setAdviceType('warning');
      setIcon(AlertCircle);
    } else {
      setAdvice(`You're ${Math.abs(currentScoreToPar)} under par. Keep playing steady golf.`);
      setAdviceType('positive');
      setIcon(TrendingUp);
    }
  };

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
