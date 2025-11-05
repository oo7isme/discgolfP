"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, MapPin } from "lucide-react";
import DgBasketIcon from '@/components/DgBasketIcon';

interface CourseHole {
  hole: number;
  par: number;
  distanceMeters?: number;
}

interface CourseFormData {
  name: string;
  location: string;
  description: string;
  holes: number;
  difficulty: string;
  estimatedLengthMeters: number;
  latitude?: number;
  longitude?: number;
  addressUrl?: string;
  courseHoles: CourseHole[];
}

export function CourseCreationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    name: "",
    location: "",
    description: "",
    holes: 18,
    difficulty: "Intermediate",
    estimatedLengthMeters: 0,
    courseHoles: []
  });

  const createCourse = useMutation(api.courses.create);
  const { toast } = useToast();

  // Initialize holes when holes count changes
  const updateHolesCount = (count: number) => {
    const newHoles: CourseHole[] = [];
    for (let i = 1; i <= count; i++) {
      const existingHole = formData.courseHoles.find(h => h.hole === i);
      newHoles.push({
        hole: i,
        par: existingHole?.par || 3,
        distanceMeters: existingHole?.distanceMeters || undefined
      });
    }
    setFormData(prev => ({ ...prev, holes: count, courseHoles: newHoles }));
  };

  const updateHole = (holeNumber: number, field: keyof CourseHole, value: number) => {
    setFormData(prev => ({
      ...prev,
      courseHoles: prev.courseHoles.map(hole =>
        hole.hole === holeNumber ? { ...hole, [field]: value } : hole
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the course
      const courseId = await createCourse({
        name: formData.name,
        location: formData.location,
        description: formData.description,
        holes: formData.holes,
        difficulty: formData.difficulty,
        estimatedLengthMeters: formData.estimatedLengthMeters,
        latitude: formData.latitude,
        longitude: formData.longitude,
        addressUrl: formData.addressUrl
      });

      // Create course holes
      await createCourseHoles({
        courseId: courseId as any,
        holes: formData.courseHoles
      });

      toast({
        title: "Course created successfully!",
        description: `${formData.name} has been added to the database.`,
      });

      // Reset form
      setFormData({
        name: "",
        location: "",
        description: "",
        holes: 18,
        difficulty: "Intermediate",
        estimatedLengthMeters: 0,
        courseHoles: []
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createCourseHoles = useMutation(api.courses.createHoles);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Course
        </CardTitle>
        <CardDescription>
          Create a new disc golf course with hole details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ekeberg Disc Golf Course"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Oslo, Norway"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holes">Number of Holes *</Label>
              <Select
                value={formData.holes.toString()}
                onValueChange={(value) => updateHolesCount(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9 Holes</SelectItem>
                  <SelectItem value="18">18 Holes</SelectItem>
                  <SelectItem value="27">27 Holes</SelectItem>
                  <SelectItem value="36">36 Holes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedLength">Estimated Length (meters)</Label>
              <Input
                id="estimatedLength"
                type="number"
                value={formData.estimatedLengthMeters}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedLengthMeters: parseInt(e.target.value) || 0 }))}
                placeholder="e.g., 5400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressUrl">Address URL (Google Maps)</Label>
              <Input
                id="addressUrl"
                value={formData.addressUrl || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, addressUrl: e.target.value }))}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the course, its features, and any special notes..."
              rows={3}
            />
          </div>

          {/* Hole Details */}
          {formData.courseHoles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DgBasketIcon className="h-5 w-5" size={20} />
                <h3 className="text-lg font-semibold">Hole Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.courseHoles.map((hole) => (
                  <Card key={hole.hole} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Hole {hole.hole}</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`par-${hole.hole}`}>Par</Label>
                        <Select
                          value={hole.par.toString()}
                          onValueChange={(value) => updateHole(hole.hole, 'par', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">Par 2</SelectItem>
                            <SelectItem value="3">Par 3</SelectItem>
                            <SelectItem value="4">Par 4</SelectItem>
                            <SelectItem value="5">Par 5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`distance-${hole.hole}`}>Distance (meters)</Label>
                        <Input
                          id={`distance-${hole.hole}`}
                          type="number"
                          value={hole.distanceMeters || ""}
                          onChange={(e) => updateHole(hole.hole, 'distanceMeters', parseInt(e.target.value) || 0)}
                          placeholder="e.g., 280"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Course..." : "Create Course"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
