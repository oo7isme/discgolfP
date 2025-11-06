"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from '../../../../convex/_generated/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetEkebergPositionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const setEkebergPositions = useMutation(api.courses.setEkebergHolePositions);

  const handleSetPositions = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await setEkebergPositions();
      setResult({ success: true, data: response });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Set Ekeberg Hole Positions</CardTitle>
          <CardDescription>
            This will set the tee and basket positions for all holes on the Ekeberg Disc Golf Course.
            <br />
            <strong>Note:</strong> The current coordinates in the mutation are placeholder values.
            You need to update them with the actual GPS coordinates from OpenStreetMap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to OpenStreetMap and find the Ekeberg Disc Golf Course</li>
              <li>For each hole, find the tee and basket positions</li>
              <li>Right-click on each position and select "Show address" or get coordinates</li>
              <li>Update the coordinates in <code>convex/courses.ts</code> in the <code>setEkebergHolePositions</code> mutation</li>
              <li>Run this mutation to save the positions</li>
            </ol>
          </div>

          <Button
            onClick={handleSetPositions}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting positions..." : "Set Ekeberg Hole Positions"}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {result.success ? (
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
                  <pre className="text-sm text-green-700 whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

