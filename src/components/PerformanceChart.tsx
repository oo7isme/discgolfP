"use client";

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RoundData {
  _id: string;
  startedAt: number;
  totalStrokes?: number;
  course?: {
    _id: string;
    _creationTime: number;
    name: string;
    location?: string;
    description?: string;
    addressUrl?: string;
    estimatedLengthMeters?: number;
    latitude?: number;
    longitude?: number;
    difficulty?: string;
    createdAt: number;
    holes: number;
  } | null;
}

interface PerformanceChartProps {
  rounds: any[];
}

export function PerformanceChart({ rounds }: PerformanceChartProps) {
  const [zoomStart, setZoomStart] = useState(0);
  const [zoomEnd, setZoomEnd] = useState(100);

  // Sort rounds by date and prepare chart data
  const filteredRounds = rounds
    .filter(round => round.totalStrokes && round.startedAt && round.course)
    .sort((a, b) => a.startedAt - b.startedAt);
  
  // First, create base chart data with scores
  const baseChartData = filteredRounds.map((round, index) => {
    const coursePar = (round.course?.holes || 18) * 3;
    const scoreToPar = round.totalStrokes! - coursePar;
    
    return {
      round: index + 1,
      score: scoreToPar,
      absoluteScore: round.totalStrokes,
      coursePar: coursePar,
      date: new Date(round.startedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      course: round.course?.name || 'Unknown',
      fullDate: new Date(round.startedAt).toLocaleDateString()
    };
  });

  // Now create chart data with intersection points at y=0
  const chartData: Array<typeof baseChartData[0] & { greenScore: number | null; redScore: number | null; isIntersection?: boolean }> = [];
  
  for (let i = 0; i < baseChartData.length; i++) {
    const current = baseChartData[i];
    const prev = i > 0 ? baseChartData[i - 1] : null;
    
    // Check if line crosses 0 between previous and current point
    if (prev && ((prev.score < 0 && current.score > 0) || (prev.score > 0 && current.score < 0))) {
      // Calculate the exact round number where the line crosses y=0
      // Linear interpolation: x = x1 + (0 - y1) * (x2 - x1) / (y2 - y1)
      const x1 = prev.round;
      const y1 = prev.score;
      const x2 = current.round;
      const y2 = current.score;
      const intersectionRound = x1 + (0 - y1) * (x2 - x1) / (y2 - y1);
      
      // Create intersection point at y=0
      const intersectionPoint = {
        ...prev,
        round: intersectionRound,
        score: 0,
        greenScore: 0,
        redScore: 0,
        isIntersection: true,
        // Use interpolated date (approximate)
        date: `${prev.date} - ${current.date}`,
        course: 'Intersection'
      };
      
      chartData.push(intersectionPoint);
    }
    
    // Add the current point
    chartData.push({
      ...current,
      greenScore: current.score < 0 ? current.score : null,
      redScore: current.score > 0 ? current.score : null
    });
  }
  
  // Sort by round number to ensure proper order (intersection points might be between integers)
  chartData.sort((a, b) => a.round - b.round);
  
  // Update greenScore and redScore to properly segment the line at y=0
  for (let i = 0; i < chartData.length; i++) {
    const point = chartData[i];
    
    if (point.isIntersection) {
      // Intersection point at y=0 should be in both lines
      point.greenScore = 0;
      point.redScore = 0;
    } else {
      // For regular points, assign based on their score value
      if (point.score < 0) {
        // Below 0 - only in green line
        point.greenScore = point.score;
        point.redScore = null;
      } else if (point.score > 0) {
        // Above 0 - only in red line
        point.greenScore = null;
        point.redScore = point.score;
      } else {
        // Exactly 0 - include in both (shouldn't happen often, but handle it)
        point.greenScore = 0;
        point.redScore = 0;
      }
    }
  }

  if (chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-xl">Performance Chart</CardTitle>
            <CardDescription className="mt-1">
              Your score progression over time
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center space-y-3">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-base font-medium">No rounds to display</p>
              <p className="text-sm text-muted-foreground">Play some rounds to see your performance chart!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average score for reference line (using only original data points, not intersections)
  const averageScore = baseChartData.length > 0
    ? baseChartData.reduce((sum, data) => sum + data.score, 0) / baseChartData.length
    : 0;

  const handleZoomIn = () => {
    if (chartData.length === 0) return;
    const range = zoomEnd - zoomStart;
    const newRange = Math.max(10, range * 0.7);
    const center = (zoomStart + zoomEnd) / 2;
    setZoomStart(Math.max(0, center - newRange / 2));
    setZoomEnd(Math.min(100, center + newRange / 2));
  };

  const handleZoomOut = () => {
    if (chartData.length === 0) return;
    const range = zoomEnd - zoomStart;
    const newRange = Math.min(100, range * 1.3);
    const center = (zoomStart + zoomEnd) / 2;
    setZoomStart(Math.max(0, center - newRange / 2));
    setZoomEnd(Math.min(100, center + newRange / 2));
  };

  const handleReset = () => {
    setZoomStart(0);
    setZoomEnd(100);
  };

  // Calculate visible data indices safely for Brush
  // Ensure zoomStart and zoomEnd are valid numbers
  const safeZoomStart = typeof zoomStart === 'number' && !isNaN(zoomStart) ? zoomStart : 0;
  const safeZoomEnd = typeof zoomEnd === 'number' && !isNaN(zoomEnd) ? zoomEnd : 100;
  
  const startIndex = chartData.length > 0 
    ? Math.max(0, Math.min(chartData.length - 1, Math.floor((chartData.length * safeZoomStart) / 100)))
    : 0;
  const endIndex = chartData.length > 0
    ? Math.max(startIndex, Math.min(chartData.length - 1, Math.ceil((chartData.length * safeZoomEnd) / 100) - 1))
    : chartData.length > 0 ? chartData.length - 1 : 0;
  
  // Ensure endIndex is always >= startIndex and valid
  const validEndIndex = Math.max(startIndex, Math.min(endIndex, chartData.length - 1));
  
  // Ensure indices are valid numbers (not NaN)
  const safeStartIndex = typeof startIndex === 'number' && !isNaN(startIndex) ? startIndex : 0;
  const safeEndIndex = typeof validEndIndex === 'number' && !isNaN(validEndIndex) ? validEndIndex : (chartData.length > 0 ? chartData.length - 1 : 0);
  
  // Validate indices are safe for Brush
  const canRenderBrush = chartData.length > 1 && 
    safeStartIndex >= 0 && 
    safeEndIndex >= safeStartIndex && 
    safeEndIndex < chartData.length &&
    safeStartIndex < chartData.length &&
    !isNaN(safeStartIndex) && 
    !isNaN(safeEndIndex);
  
  // Calculate the round number range for XAxis domain
  // Use baseChartData to get actual round count (excluding intersection points)
  const maxRound = baseChartData.length > 0 ? baseChartData.length : 1;
  const minRound = 1;
  
  const startRound = chartData.length > 0 && safeStartIndex >= 0 && safeStartIndex < chartData.length 
    ? chartData[safeStartIndex]?.round || minRound
    : chartData.length > 0 ? chartData[0]?.round || minRound : minRound;
  const endRound = chartData.length > 0 && safeEndIndex >= 0 && safeEndIndex < chartData.length
    ? chartData[safeEndIndex]?.round || maxRound
    : chartData.length > 0 ? chartData[chartData.length - 1]?.round || maxRound : maxRound;
  
  // Generate all round numbers for XAxis ticks
  const allRoundNumbers = Array.from({ length: maxRound }, (_, i) => i + 1);

  return (
    <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Performance Chart</CardTitle>
              <CardDescription className="mt-1">
                Your score relative to par over time (negative is better)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn} 
                title="Zoom In"
                className="h-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut} 
                title="Zoom Out"
                className="h-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset} 
                title="Reset Zoom"
                className="h-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full flex justify-center">
          <div className="h-80 w-full max-w-full" style={{ minHeight: '320px', minWidth: '320px' }}>
            <ResponsiveContainer width="100%" height={320} minWidth={320} minHeight={320}>
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 5, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis 
                dataKey="round" 
                type="number"
                ticks={allRoundNumbers}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                label={{ 
                  value: 'Round Number', 
                  position: 'bottom', 
                  offset: 45,
                  style: { 
                    textAnchor: 'middle',
                    fill: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    fontWeight: '500'
                  } 
                }}
                domain={zoomStart === 0 && zoomEnd === 100 
                  ? [minRound, maxRound] 
                  : [startRound, endRound]}
                allowDataOverflow={false}
                allowDecimals={false}
              />
              <YAxis 
                tick={(props: any) => {
                  const { x, y, payload } = props;
                  const isZero = payload.value === 0;
                  return (
                    <g>
                      <text
                        x={x}
                        y={y}
                        fill={isZero ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                        fontSize={isZero ? 12 : 11}
                        fontWeight={isZero ? 'bold' : 'normal'}
                        textAnchor="end"
                        dy={3}
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                domain={(dataMin, dataMax) => {
                  const min = typeof dataMin === 'number' && !isNaN(dataMin) ? dataMin - 5 : -10;
                  const max = typeof dataMax === 'number' && !isNaN(dataMax) ? dataMax + 5 : 10;
                  return [min, max];
                }}
                label={{ 
                  value: 'Score to Par', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '12px' }
                }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    // Skip tooltip for intersection points (they're just for line rendering)
                    if (data.isIntersection) {
                      return null;
                    }
                    return (
                      <div className="bg-background border border-border rounded-lg p-4 shadow-xl z-50 backdrop-blur-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
                            <p className="font-semibold text-base">Round {Math.round(data.round)}</p>
                            <p className="text-xs text-muted-foreground">{data.fullDate}</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Score to Par:</span>
                              <span className={`font-semibold text-sm ${data.score > 0 ? 'text-red-600 dark:text-red-400' : data.score < 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {data.score > 0 ? '+' : ''}{data.score}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Total Strokes:</span>
                              <span className="font-medium text-sm">{data.absoluteScore}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">Course:</span>
                              <span className="font-medium text-sm">{data.course}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
                              <span className="text-sm text-muted-foreground">Par:</span>
                              <span className="font-medium text-sm">{data.coursePar}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.5 }}
              />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5" 
                strokeOpacity={0.9}
                label={{ value: '', position: 'right', style: { fill: 'hsl(var(--foreground))', fontWeight: 'bold', fontSize: '11px' } }}
              />
              <ReferenceLine y={averageScore} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Avg', position: 'right' }} />
              {/* Green line for scores below par */}
              <Line
                type="monotone"
                dataKey="greenScore"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                activeDot={false}
                connectNulls={false}
                name=""
              />
              {/* Red line for scores above par */}
              <Line
                type="monotone"
                dataKey="redScore"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
                activeDot={false}
                connectNulls={false}
                name=""
              />
              {/* Render all dots with appropriate colors (skip intersection points) */}
              <Line
                type="monotone"
                dataKey="score"
                stroke="transparent"
                strokeWidth={0}
                dot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  const key = `dot-${payload?.round ?? index ?? 'unknown'}`;
                  if (cx == null || cy == null || payload?.isIntersection) return <g key={key} />;
                  const dotColor = payload.score < 0 ? '#22c55e' : '#ef4444';
                  return (
                    <circle
                      key={key}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={dotColor}
                      stroke={dotColor}
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
                activeDot={(props: any) => {
                  const { cx, cy, payload, index } = props;
                  const key = `active-dot-${payload?.round ?? index ?? 'unknown'}`;
                  if (cx == null || cy == null || payload?.isIntersection) return <g key={key} />;
                  const dotColor = payload.score < 0 ? '#22c55e' : '#ef4444';
                  return (
                    <circle
                      key={key}
                      cx={cx}
                      cy={cy}
                      r={7}
                      fill={dotColor}
                      stroke={dotColor}
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
                connectNulls={false}
                name="Score to Par"
              />
              {canRenderBrush && (
                <Brush 
                  dataKey="round" 
                  height={30}
                  startIndex={safeStartIndex}
                  endIndex={safeEndIndex}
                  onChange={(e) => {
                    if (!e || !chartData.length) return;
                    
                    const newStartIdx = typeof e.startIndex === 'number' && !isNaN(e.startIndex) 
                      ? Math.max(0, Math.min(chartData.length - 1, Math.floor(e.startIndex)))
                      : safeStartIndex;
                    const newEndIdx = typeof e.endIndex === 'number' && !isNaN(e.endIndex)
                      ? Math.max(newStartIdx, Math.min(chartData.length - 1, Math.floor(e.endIndex)))
                      : safeEndIndex;
                    
                    // Validate indices are within bounds and valid
                    if (newStartIdx >= 0 && 
                        newEndIdx >= newStartIdx && 
                        newEndIdx < chartData.length && 
                        newStartIdx < chartData.length &&
                        !isNaN(newStartIdx) &&
                        !isNaN(newEndIdx)) {
                      const newStart = Math.max(0, Math.min(100, (newStartIdx / chartData.length) * 100));
                      const newEnd = Math.max(newStart, Math.min(100, ((newEndIdx + 1) / chartData.length) * 100));
                      setZoomStart(newStart);
                      setZoomEnd(newEnd);
                    }
                  }}
                  tickFormatter={(value) => {
                    // Format brush ticks to show round numbers
                    if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                      return `R${value}`;
                    }
                    return '';
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
        
        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-sm font-medium">Below Par</span>
            <span className="text-xs text-muted-foreground">(Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-sm font-medium">Above Par</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
            <span className="text-sm text-muted-foreground">
              Average: <span className="font-medium">{averageScore > 0 ? '+' : ''}{averageScore.toFixed(1)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
            <span className="text-sm text-muted-foreground">
              Par: <span className="font-medium">0</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
