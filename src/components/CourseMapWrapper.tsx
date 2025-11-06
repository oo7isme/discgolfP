"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";

// Loading component
const MapLoading = () => (
  <Card className="h-full">
    <CardContent className="p-4 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading course map...</p>
      </div>
    </CardContent>
  </Card>
);

// Dynamically import CourseMap
const CourseMap = dynamic(
  () => import("./CourseMap").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => <MapLoading />,
  }
);

interface CourseMapWrapperProps {
  courseId: string;
  className?: string;
}

export default function CourseMapWrapper({ courseId, className }: CourseMapWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MapLoading />;
  }

  return <CourseMap courseId={courseId} className={className} />;
}

