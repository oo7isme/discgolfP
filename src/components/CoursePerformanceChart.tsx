"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoundData {
  _id: string;
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

interface CoursePerformanceChartProps {
  rounds: any[];
}

export function CoursePerformanceChart({ rounds }: CoursePerformanceChartProps) {
  // Group rounds by course and calculate averages
  const courseData = rounds
    .filter(round => round.totalStrokes && round.course?.name)
    .reduce((acc, round) => {
      const courseName = round.course!.name;
      const coursePar = (round.course?.holes || 18) * 3;
      const scoreToPar = round.totalStrokes! - coursePar;
      
      if (!acc[courseName]) {
        acc[courseName] = {
          course: courseName,
          rounds: 0,
          totalScoreToPar: 0,
          averageScoreToPar: 0,
          bestScoreToPar: Infinity,
          worstScoreToPar: -Infinity,
          totalStrokes: 0,
          averageStrokes: 0,
          bestStrokes: Infinity,
          worstStrokes: 0,
          coursePar: coursePar
        };
      }
      
      acc[courseName].rounds += 1;
      acc[courseName].totalScoreToPar += scoreToPar;
      acc[courseName].totalStrokes += round.totalStrokes!;
      acc[courseName].bestScoreToPar = Math.min(acc[courseName].bestScoreToPar, scoreToPar);
      acc[courseName].worstScoreToPar = Math.max(acc[courseName].worstScoreToPar, scoreToPar);
      acc[courseName].bestStrokes = Math.min(acc[courseName].bestStrokes, round.totalStrokes!);
      acc[courseName].worstStrokes = Math.max(acc[courseName].worstStrokes, round.totalStrokes!);
      
      return acc;
    }, {} as Record<string, any>);

  const chartData = Object.values(courseData)
    .map((course: any) => ({
      ...course,
      averageScoreToPar: Math.round((course.totalScoreToPar / course.rounds) * 10) / 10,
      averageStrokes: Math.round((course.totalStrokes / course.rounds) * 10) / 10,
      bestScoreToPar: course.bestScoreToPar === Infinity ? 0 : course.bestScoreToPar,
      worstScoreToPar: course.worstScoreToPar === -Infinity ? 0 : course.worstScoreToPar,
      bestStrokes: course.bestStrokes === Infinity ? 0 : course.bestStrokes
    }))
    .sort((a, b) => a.averageScoreToPar - b.averageScoreToPar);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>
            Your average scores by course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🏌️</div>
              <p>No course data to display</p>
              <p className="text-sm">Play rounds on different courses to see comparisons!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>
            Your average score to par by course (negative is better)
          </CardDescription>
        </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="course" 
                tick={{ fontSize: 10 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.course}</p>
                        <p className="text-sm">Avg Score to Par: <span className="font-medium">{data.averageScoreToPar > 0 ? '+' : ''}{data.averageScoreToPar}</span></p>
                        <p className="text-sm">Avg Total Strokes: <span className="font-medium">{data.averageStrokes}</span></p>
                        <p className="text-sm">Rounds Played: <span className="font-medium">{data.rounds}</span></p>
                        <p className="text-sm">Best to Par: <span className="font-medium">{data.bestScoreToPar > 0 ? '+' : ''}{data.bestScoreToPar}</span></p>
                        <p className="text-sm">Worst to Par: <span className="font-medium">{data.worstScoreToPar > 0 ? '+' : ''}{data.worstScoreToPar}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="averageScoreToPar" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Course Stats */}
        <div className="mt-4 space-y-2">
          {chartData.map((course) => (
            <div key={course.course} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
              <div>
                <div className="font-medium text-sm">{course.course}</div>
                <div className="text-xs text-muted-foreground">{course.rounds} rounds</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{course.averageScoreToPar > 0 ? '+' : ''}{course.averageScoreToPar}</div>
                <div className="text-xs text-muted-foreground">to par</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
