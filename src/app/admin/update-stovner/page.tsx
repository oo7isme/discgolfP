"use client";

import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import DgBasketIcon from '@/components/DgBasketIcon';

export default function UpdateStovnerCoursePage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const updateStovnerCourse = useMutation(api.courses.updateStovnerCourse2025);
  const { toast } = useToast();

  const handleUpdateStovnerCourse = async () => {
    setIsUpdating(true);
    try {
      const result = await updateStovnerCourse();
      setResult(result);
      
      toast({
        title: "Course updated successfully!",
        description: "Stovner Discgolfpark has been updated with the Main 2025 layout.",
      });
    } catch (error) {
      console.error('Error updating Stovner course:', error);
      toast({
        title: "Error",
        description: "Failed to update Stovner course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Update Stovner Course</h1>
        <p className="text-[var(--muted-foreground)]">
          Update Stovner Discgolfpark with the Main 2025 layout
        </p>
      </div>

      {/* Course Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stovner Discgolfpark - Main 2025 Layout
          </CardTitle>
          <CardDescription>
            Updated course details from the provided screenshot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">18</div>
              <div className="text-sm text-muted-foreground">Holes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2,031m</div>
              <div className="text-sm text-muted-foreground">Total Length</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">58</div>
              <div className="text-sm text-muted-foreground">Total Par</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2h 0m</div>
              <div className="text-sm text-muted-foreground">Est. Play Time</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">Course Description:</h4>
            <p className="text-muted-foreground">
              Long - technical 18-hole course located in Oslo, Norway. 
              Most holes range between 66m - 205m (217 ft - 673 ft).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Hole Breakdown:</h4>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2 text-sm">
              {/* Holes 1-9 */}
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i + 1} className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">H{i + 1}</div>
                  <div className="text-xs text-muted-foreground">
                    Par {[3, 3, 3, 3, 3, 3, 4, 3, 3][i]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[88, 78, 114, 119, 130, 124, 205, 75, 92][i]}m
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2 text-sm">
              {/* Holes 10-18 */}
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i + 10} className="text-center p-2 bg-muted rounded">
                  <div className="font-medium">H{i + 10}</div>
                  <div className="text-xs text-muted-foreground">
                    Par {[4, 4, 3, 3, 3, 3, 3, 3, 3][i]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[165, 195, 87, 131, 91, 98, 66, 71, 103][i]}m
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Course Features:</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Long Course</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Technical</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Popular</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Elevation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Course Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Update Course Layout
          </CardTitle>
          <CardDescription>
            This will update the existing Stovner course with the Main 2025 layout data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleUpdateStovnerCourse} 
            disabled={isUpdating}
            className="w-full"
            size="lg"
          >
            {isUpdating ? 'Updating Course...' : 'Update Stovner Discgolfpark'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <DgBasketIcon className="h-4 w-4" size={16} />
                <span className="font-medium">Course Updated Successfully!</span>
              </div>
              <div className="mt-2 text-sm text-green-700">
                <p>Course ID: {result.courseId}</p>
                <p>Total Holes: {result.totalHoles}</p>
                <p>Total Par: {result.totalPar}</p>
                <p>Status: {result.message}</p>
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
