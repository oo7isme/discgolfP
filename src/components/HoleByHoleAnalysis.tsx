"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Hole-by-Hole Analysis</CardTitle>
          <CardDescription>
            Detailed performance breakdown by hole number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <p>No hole-level data available</p>
              <p className="text-sm">Play some rounds to see hole-by-hole analysis!</p>
            </div>
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Best Hole</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">Hole {bestHole?.hole}</div>
                <div className="text-sm text-muted-foreground">
                  Avg: {bestHole?.average.toFixed(2)} (Par {bestHole?.par})
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">Hole {worstHole?.hole}</div>
                <div className="text-sm text-muted-foreground">
                  Avg: {worstHole?.average.toFixed(2)} (Par {worstHole?.par})
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{averageScore.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">strokes per hole</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Par Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Par</CardTitle>
          <CardDescription>
            Average score by hole par value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">Par 3</div>
              <div className="text-3xl font-bold mt-2">{par3Avg.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {par3Holes.length} holes
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">Par 4</div>
              <div className="text-3xl font-bold mt-2">{par4Avg.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {par4Holes.length} holes
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">Par 5</div>
              <div className="text-3xl font-bold mt-2">{par5Avg.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {par5Holes.length} holes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score by Hole Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Score by Hole</CardTitle>
          <CardDescription>
            Your average performance relative to par for each hole
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="hole" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Strokes to Par', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.hole}</p>
                          <p className="text-sm">Par: {data.par}</p>
                          <p className="text-sm">
                            Avg Score: <span className="font-medium">{data.average.toFixed(2)}</span>
                          </p>
                          <p className="text-sm">
                            To Par: <span className={`font-medium ${data.toPar > 0 ? 'text-red-600' : data.toPar < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                              {data.toPar > 0 ? '+' : ''}{data.toPar.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="toPar" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.toPar)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Hole Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Hole Statistics</CardTitle>
          <CardDescription>
            Complete breakdown for each hole
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Hole</th>
                  <th className="text-right p-2">Par</th>
                  <th className="text-right p-2">Avg</th>
                  <th className="text-right p-2">Best</th>
                  <th className="text-right p-2">Worst</th>
                  <th className="text-right p-2">Rounds</th>
                  <th className="text-right p-2">Birdies</th>
                  <th className="text-right p-2">Pars</th>
                  <th className="text-right p-2">Bogeys+</th>
                </tr>
              </thead>
              <tbody>
                {holeData.map((hole) => {
                  const toPar = hole.average - hole.par;
                  return (
                    <tr key={hole.hole} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Hole {hole.hole}</td>
                      <td className="p-2 text-right">{hole.par}</td>
                      <td className="p-2 text-right">
                        <span className="font-medium">{hole.average.toFixed(2)}</span>
                        <span className={`text-xs ml-1 ${toPar > 0 ? 'text-red-600' : toPar < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          ({toPar > 0 ? '+' : ''}{toPar.toFixed(2)})
                        </span>
                      </td>
                      <td className="p-2 text-right text-green-600 font-medium">{hole.best}</td>
                      <td className="p-2 text-right text-red-600 font-medium">{hole.worst}</td>
                      <td className="p-2 text-right text-muted-foreground">{hole.count}</td>
                      <td className="p-2 text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {hole.birdies}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {hole.pars}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {hole.bogeys + hole.worse}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

