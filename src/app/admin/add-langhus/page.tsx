"use client";

import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';

export default function AddLanghusCoursePage() {
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const addLanghusCourse = useMutation(api.courses.addLanghusCourse);
  const { toast } = useToast();

  const handleAddLanghusCourse = async () => {
    setIsAdding(true);
    try {
      const result = await addLanghusCourse();
      setResult(result);
      
      toast({
        title: "Course added successfully!",
        description: "Langhus Disc Golf Course has been added to the database.",
      });
    } catch (error) {
      console.error('Error adding Langhus course:', error);
      toast({
        title: "Error",
        description: "Failed to add Langhus course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Add Langhus Course</h1>
        <p className="text-[var(--muted-foreground)]">
          Add the Langhus Disc Golf Course to the database
        </p>
      </div>

      {/* Course Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Langhus Disc Golf Course Preview
          </CardTitle>
          <CardDescription>
            Course details from the provided screenshot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">18</div>
              <div className="text-sm text-muted-foreground">Holes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,291m</div>
              <div className="text-sm text-muted-foreground">Total Length</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">58</div>
              <div className="text-sm text-muted-foreground">Total Par</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1h 28m</div>
              <div className="text-sm text-muted-foreground">Est. Play Time</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Course Description:</h4>
            <p className="text-muted-foreground">
              Short - highly technical 18-hole course located in Langhus, Norway. 
              Most holes range between 46m - 117m (150 ft - 383 ft).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Hole Breakdown:</h4>
            <div className="grid grid-cols-6 md:grid-cols-9 gap-2 text-sm">
              {Array.from({ length: 18 }, (_, i) => (
                <div key={i + 1} className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">H{i + 1}</div>
                  <div className="text-xs text-muted-foreground">
                    {i + 1 === 3 || i + 1 === 4 || i + 1 === 6 ? 'Par 4' : 'Par 3'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Course Button */}
      <Card>
        <CardHeader>
          <CardTitle>Add to Database</CardTitle>
          <CardDescription>
            This will create the course and all 18 holes in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAddLanghusCourse} 
            disabled={isAdding}
            className="w-full"
            size="lg"
          >
            {isAdding ? 'Adding Course...' : 'Add Langhus Disc Golf Course'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <DgBasketIcon className="h-4 w-4" size={16} />
                <span className="font-medium">Course Added Successfully!</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>Course ID: {result.courseId}</p>
                <p>Total Holes: {result.totalHoles}</p>
                <p>Total Par: {result.totalPar}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Database Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
