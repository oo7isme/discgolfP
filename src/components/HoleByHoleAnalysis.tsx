"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Target, TrendingUp, TrendingDown, Minus, Award, AlertCircle, BarChart3, Zap } from 'lucide-react';

interface Round {
  _id: string;
  scores?: Array<{ hole: number; strokes: number }>;
  course?: { holes: number } | null;
  courseHoles?: Array<{ hole: number; par: number }>;
}

interface HoleByHoleAnalysisProps {
  rounds: Round[];
}

export function HoleByHoleAnalysis({ rounds }: HoleByHoleAnalysisProps) {
  // Filter rounds with scores
  const roundsWithScores = rounds.filter(r => r.scores && r.scores.length > 0);

  if (roundsWithScores.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Hole-by-Hole Analysis
          </CardTitle>
          <CardDescription>
            Detailed performance breakdown by hole number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="h-8 w-8" />
            </div>
            <p className="font-medium text-base mb-1">No hole-level data available</p>
            <p className="text-sm text-center max-w-sm">Play some rounds to see detailed hole-by-hole analysis and insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Aggregate hole statistics
  const holeStats: Record<number, {
    hole: number;
    totalStrokes: number;
    count: number;
    average: number;
    best: number;
    worst: number;
    par: number;
    birdies: number;
    pars: number;
    bogeys: number;
    worse: number;
  }> = {};

  roundsWithScores.forEach(round => {
    const courseHoles = round.courseHoles || [];
    const parMap = new Map(courseHoles.map(h => [h.hole, h.par]));
    
    round.scores?.forEach(score => {
      const hole = score.hole;
      const par = parMap.get(hole) || 3; // Default to par 3
      
      if (!holeStats[hole]) {
        holeStats[hole] = {
          hole,
          totalStrokes: 0,
          count: 0,
          average: 0,
          best: Infinity,
          worst: 0,
          par,
          birdies: 0,
          pars: 0,
          bogeys: 0,
          worse: 0,
        };
      }

      const stats = holeStats[hole];
      stats.totalStrokes += score.strokes;
      stats.count += 1;
      stats.best = Math.min(stats.best, score.strokes);
      stats.worst = Math.max(stats.worst, score.strokes);

      const relativeToPar = score.strokes - par;
      if (relativeToPar <= -2) {
        // Eagle or better
        stats.birdies += 1;
      } else if (relativeToPar === -1) {
        stats.birdies += 1;
      } else if (relativeToPar === 0) {
        stats.pars += 1;
      } else if (relativeToPar === 1) {
        stats.bogeys += 1;
      } else {
        stats.worse += 1;
      }
    });
  });

  // Calculate averages and convert to array
  const holeData = Object.values(holeStats)
    .map(stats => ({
      ...stats,
      average: stats.count > 0 ? stats.totalStrokes / stats.count : 0,
      best: stats.best === Infinity ? 0 : stats.best,
    }))
    .sort((a, b) => a.hole - b.hole);

  // Calculate overall statistics
  const totalHoles = holeData.length;
  const averageScore = holeData.reduce((sum, h) => sum + h.average, 0) / totalHoles;
  const bestHole = holeData.reduce((best, h) => h.average < best.average ? h : best, holeData[0]);
  const worstHole = holeData.reduce((worst, h) => h.average > worst.average ? h : worst, holeData[0]);

  // Par 3/4/5 breakdown
  const par3Holes = holeData.filter(h => h.par === 3);
  const par4Holes = holeData.filter(h => h.par === 4);
  const par5Holes = holeData.filter(h => h.par === 5);

  const par3Avg = par3Holes.length > 0 
    ? par3Holes.reduce((sum, h) => sum + h.average, 0) / par3Holes.length 
    : 0;
  const par4Avg = par4Holes.length > 0 
    ? par4Holes.reduce((sum, h) => sum + h.average, 0) / par4Holes.length 
    : 0;
  const par5Avg = par5Holes.length > 0 
    ? par5Holes.reduce((sum, h) => sum + h.average, 0) / par5Holes.length 
    : 0;

  // Chart data for average score by hole
  const chartData = holeData.map(h => ({
    hole: `H${h.hole}`,
    average: Number(h.average.toFixed(2)),
    par: h.par,
    toPar: Number((h.average - h.par).toFixed(2)),
  }));

  const getColor = (toPar: number) => {
    if (toPar <= -0.5) return '#10b981'; // Green for under par
    if (toPar <= 0.5) return '#3b82f6'; // Blue for par
    if (toPar <= 1.5) return '#f59e0b'; // Orange for bogey
    return '#ef4444'; // Red for worse
  };

  const bestToPar = bestHole ? bestHole.average - bestHole.par : 0;
  const worstToPar = worstHole ? worstHole.average - worstHole.par : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex flex-nowrap gap-2">
        <Card className="border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 flex-1 min-w-0">
          <CardHeader className="pb-1.5 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-green-100 dark:bg-green-900/30">
                <Award className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              Best Hole
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-green-700 dark:text-green-400 whitespace-nowrap">Hole {bestHole?.hole}</span>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 text-xs w-fit">
                  Par {bestHole?.par}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Avg Score</div>
                <div className="text-base font-semibold">{bestHole?.average.toFixed(2)}</div>
                <div className={`text-xs font-medium ${bestToPar < 0 ? 'text-green-600' : bestToPar === 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {bestToPar > 0 ? '+' : ''}{bestToPar.toFixed(2)} to par
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 flex-1 min-w-0">
          <CardHeader className="pb-1.5 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
             Worst Hole
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">Hole {worstHole?.hole}</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 text-xs w-fit">
                  Par {worstHole?.par}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Avg Score</div>
                <div className="text-base font-semibold">{worstHole?.average.toFixed(2)}</div>
                <div className={`text-xs font-medium ${worstToPar < 0 ? 'text-green-600' : worstToPar === 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {worstToPar > 0 ? '+' : ''}{worstToPar.toFixed(2)} to par
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 flex-1 min-w-0">
          <CardHeader className="pb-1.5 pt-3 px-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              Overall Average
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1">
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{averageScore.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">strokes/hole</div>
              <div className="pt-1 border-t">
                <div className="text-xs text-muted-foreground">{totalHoles} holes</div>
                <div className="text-xs text-muted-foreground">{roundsWithScores.length} round{roundsWithScores.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Average Score by Hole Chart */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Average Score by Hole
          </CardTitle>
          <CardDescription>
            Your average performance relative to par for each hole
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="hsl(var(--muted-foreground))" />
                <XAxis 
                  dataKey="hole" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                  label={{ 
                    value: 'Strokes to Par', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '12px' }
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-xl backdrop-blur-sm">
                          <p className="font-semibold text-base mb-2">{data.hole}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Par:</span>
                              <span className="font-medium">{data.par}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Avg Score:</span>
                              <span className="font-semibold">{data.average.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1 border-t">
                              <span className="text-sm text-muted-foreground">To Par:</span>
                              <span className={`font-semibold ${data.toPar > 0 ? 'text-red-600 dark:text-red-400' : data.toPar < 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {data.toPar > 0 ? '+' : ''}{data.toPar.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="toPar" radius={[6, 6, 0, 0]} strokeWidth={1}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.toPar)} stroke={getColor(entry.toPar)} strokeOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Par Breakdown */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center gap-2 text-xs">
            <Zap className="h-3 w-3 text-primary" />
            Performance by Par
          </CardTitle>
          <CardDescription className="text-xs">
            Average score by hole par value
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex flex-nowrap gap-2">
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex-1 min-w-0">
              <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-0.5">Par 3</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-0.5">{par3Avg.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mb-1">
                {par3Holes.length > 0 ? `+${(par3Avg - 3).toFixed(2)}` : 'N/A'} avg
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                {par3Holes.length} hole{par3Holes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex-1 min-w-0">
              <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-0.5">Par 4</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-300 mb-0.5">{par4Avg.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mb-1">
                {par4Holes.length > 0 ? `+${(par4Avg - 4).toFixed(2)}` : 'N/A'} avg
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                {par4Holes.length} hole{par4Holes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 flex-1 min-w-0">
              <div className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-0.5">Par 5</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-300 mb-0.5">{par5Avg.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mb-1">
                {par5Holes.length > 0 ? `+${(par5Avg - 5).toFixed(2)}` : 'N/A'} avg
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                {par5Holes.length} hole{par5Holes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Detailed Hole Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Detailed Hole Statistics
          </CardTitle>
          <CardDescription>
            Complete breakdown for each hole with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holeData.map((hole) => {
              const toPar = hole.average - hole.par;
              const totalOutcomes = hole.birdies + hole.pars + hole.bogeys + hole.worse;
              const birdieRate = totalOutcomes > 0 ? (hole.birdies / totalOutcomes) * 100 : 0;
              const parRate = totalOutcomes > 0 ? (hole.pars / totalOutcomes) * 100 : 0;
              const bogeyRate = totalOutcomes > 0 ? ((hole.bogeys + hole.worse) / totalOutcomes) * 100 : 0;
              
              return (
                <div key={hole.hole} className="border rounded-xl p-4 hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{hole.hole}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-base">Hole {hole.hole}</div>
                        <Badge variant="outline" className="text-xs mt-0.5">Par {hole.par}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{hole.average.toFixed(2)}</div>
                      <div className={`text-sm font-medium ${toPar > 0 ? 'text-red-600 dark:text-red-400' : toPar < 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {toPar > 0 ? '+' : ''}{toPar.toFixed(2)} to par
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best / Worst</div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">{hole.best}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-600 dark:text-red-400 font-bold text-lg">{hole.worst}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rounds</div>
                      <div className="font-semibold text-lg">{hole.count}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Birdies</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                          {hole.birdies}
                        </Badge>
                        {totalOutcomes > 0 && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {Math.round(birdieRate)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pars / Bogeys+</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                          {hole.pars}
                        </Badge>
                        <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                          {hole.bogeys + hole.worse}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Bar */}
                  {totalOutcomes > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Performance Distribution</div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-green-500 transition-all" 
                          style={{ width: `${birdieRate}%` }}
                          title={`Birdies: ${Math.round(birdieRate)}%`}
                        />
                        <div 
                          className="bg-blue-500 transition-all" 
                          style={{ width: `${parRate}%` }}
                          title={`Pars: ${Math.round(parRate)}%`}
                        />
                        <div 
                          className="bg-red-500 transition-all" 
                          style={{ width: `${bogeyRate}%` }}
                          title={`Bogeys+: ${Math.round(bogeyRate)}%`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

