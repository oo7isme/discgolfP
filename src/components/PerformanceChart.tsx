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
  const chartData = rounds
    .filter(round => round.totalStrokes && round.startedAt && round.course)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((round, index) => {
      // Calculate course par (assuming average par of 3 per hole)
      const coursePar = (round.course?.holes || 18) * 3;
      const scoreToPar = round.totalStrokes! - coursePar;
      
      return {
        round: index + 1,
        score: scoreToPar, // Score relative to par
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

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
          <CardDescription>
            Your score progression over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No rounds to display</p>
              <p className="text-sm">Play some rounds to see your performance chart!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average score for reference line
  const averageScore = chartData.reduce((sum, data) => sum + data.score, 0) / chartData.length;

  const handleZoomIn = () => {
    const range = zoomEnd - zoomStart;
    const newRange = Math.max(10, range * 0.7);
    const center = (zoomStart + zoomEnd) / 2;
    setZoomStart(Math.max(0, center - newRange / 2));
    setZoomEnd(Math.min(100, center + newRange / 2));
  };

  const handleZoomOut = () => {
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

  const visibleData = chartData.slice(
    Math.floor((chartData.length * zoomStart) / 100),
    Math.ceil((chartData.length * zoomEnd) / 100)
  );

  return (
    <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Chart</CardTitle>
              <CardDescription>
                Your score relative to par over time (negative is better)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} title="Reset Zoom">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="round" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                label={{ value: 'Round Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                domain={['dataMin - 5', 'dataMax + 5']}
                label={{ value: 'Score to Par', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg z-50">
                        <p className="font-medium">Round {data.round}</p>
                        <p className="text-sm text-muted-foreground">{data.fullDate}</p>
                        <p className="text-sm">
                          Score to Par: <span className={`font-medium ${data.score > 0 ? 'text-red-600' : data.score < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                            {data.score > 0 ? '+' : ''}{data.score}
                          </span>
                        </p>
                        <p className="text-sm">Total Strokes: <span className="font-medium">{data.absoluteScore}</span></p>
                        <p className="text-sm">Course: {data.course}</p>
                        <p className="text-sm text-muted-foreground">Par: {data.coursePar}</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <ReferenceLine y={averageScore} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Avg', position: 'right' }} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, cursor: 'pointer' }}
                activeDot={{ r: 7, stroke: 'hsl(var(--primary))', strokeWidth: 2, cursor: 'pointer' }}
                name="Score to Par"
              />
              <Brush 
                dataKey="round" 
                height={30}
                startIndex={Math.floor((chartData.length * zoomStart) / 100)}
                endIndex={Math.ceil((chartData.length * zoomEnd) / 100)}
                onChange={(e) => {
                  if (e && typeof e.startIndex === 'number' && typeof e.endIndex === 'number') {
                    setZoomStart((e.startIndex / chartData.length) * 100);
                    setZoomEnd((e.endIndex / chartData.length) * 100);
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span>Score to Par</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground border-dashed border-t border-muted-foreground"></div>
            <span>Average ({averageScore > 0 ? '+' : ''}{averageScore.toFixed(1)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground border-dashed border-t border-muted-foreground"></div>
            <span>Par (0)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
