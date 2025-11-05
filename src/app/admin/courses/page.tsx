"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CourseCreationForm } from "@/components/CourseCreationForm";
import { CourseImportForm } from "@/components/CourseImportForm";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Search, MapPin, Users, Calendar, Upload } from "lucide-react";
import DgBasketIcon from '@/components/DgBasketIcon';

export default function CourseManagementPage() {
  const { user, currentUser } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  
  const courses = useQuery(api.courses.getAll);

  // Filter courses based on search query
  const filteredCourses = courses?.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.location && course.location.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Course Management</h1>
        <p className="text-muted-foreground mt-2">Please sign in to manage courses.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">
            Manage disc golf courses and add new ones
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCreateForm ? "Hide Form" : "Add Course"}
          </Button>
          
          <Button
            onClick={() => setShowImportForm(!showImportForm)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {showImportForm ? "Hide Import" : "Import Courses"}
          </Button>
        </div>
      </div>

      {/* Course Creation Form */}
      {showCreateForm && (
        <CourseCreationForm onSuccess={() => setShowCreateForm(false)} />
      )}

      {/* Course Import Form */}
      {showImportForm && (
        <CourseImportForm onSuccess={() => setShowImportForm(false)} />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Courses ({filteredCourses.length})
          </h2>
        </div>

        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DgBasketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms." : "No courses have been added yet."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Course
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{course.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {course.location || "No location"}
                      </CardDescription>
                    </div>
                    {course.difficulty && (
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DgBasketIcon className="h-3 w-3" size={12} />
                      {course.holes} holes
                    </div>
                    {course.estimatedLengthMeters && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(course.estimatedLengthMeters / 1000).toFixed(1)} km
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(course.createdAt)}
                    </div>
                  </div>

                  {course.addressUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(course.addressUrl, '_blank')}
                    >
                      View on Map
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
