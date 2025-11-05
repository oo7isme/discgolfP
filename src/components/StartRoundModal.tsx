"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { FriendSelector } from '@/components/FriendSelector';
import { Cloud, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DialogClose } from '@/components/ui/dialog';

interface Participant {
  id: string;
  type: 'user' | 'guest';
  name: string;
  email?: string;
  userId?: any;
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  conditions: string;
  humidity: number;
}

interface StartRoundModalProps {
  course: {
    _id: string;
    name: string;
    location?: string;
    holes: number;
    latitude?: number;
    longitude?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (params: {
    courseId: string;
    roundType: string;
    participants: Participant[];
    weather?: WeatherData;
  }) => void;
}

export function StartRoundModal({ course, isOpen, onClose, onStartGame }: StartRoundModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [roundType, setRoundType] = useState<string>("CASUAL");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const handleFetchWeather = useCallback(async () => {
    if (!course.latitude || !course.longitude) {
     
      return;
    }

    setIsLoadingWeather(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${course.latitude}&lon=${course.longitude}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Weather fetch failed');
      }
      
      const data = await response.json();
      
      setWeather({
        temperature: Math.round(data.main.temp),
        windSpeed: Math.round(data.wind?.speed || 0),
        conditions: data.weather[0]?.main || 'Clear',
        humidity: data.main.humidity || 0,
      });
      
    
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Weather Fetch Failed",
        description: "Could not fetch weather data. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  }, [course.latitude, course.longitude, toast]);

  // Fetch weather data automatically when modal opens
  useEffect(() => {
    if (isOpen && course.latitude && course.longitude && !weather && !isLoadingWeather) {
      handleFetchWeather();
    }
  }, [isOpen, course.latitude, course.longitude, weather, isLoadingWeather, handleFetchWeather]);

  const handleStartGame = () => {
    onStartGame({
      courseId: course._id,
      roundType,
      participants,
      weather: weather || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[350px] max-h-[90vh] overflow-y-auto overflow-x-hidden" showCloseButton={false}>
        {/* Custom close button in top left */}
        <DialogClose
          onClick={onClose}
          className="absolute top-4 left-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-0 min-w-0 w-full">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <DialogTitle className="truncate">Create Your Round</DialogTitle>
          </div>
          {/* Round Type Selection in header */}
          <Select value={roundType} onValueChange={setRoundType}>
            <SelectTrigger className="h-10 w-[100px] ml-auto flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASUAL">Casual</SelectItem>
              <SelectItem value="PRACTICE">Practice</SelectItem>
              <SelectItem value="TOURNAMENT">Tournament</SelectItem>
              <SelectItem value="COMPETITIVE">Competitive</SelectItem>
            </SelectContent>
          </Select>
        </DialogHeader>

        <div className="space-y-4 w-full min-w-0">

          {/* Friend/Player Selection */}
          <FriendSelector 
            participants={participants}
            onParticipantsChange={setParticipants}
          />


          {/* Weather Selection */}
          <Card>
            <CardHeader className="pb-1 px-4 pt-3">
              <CardTitle className="text-base mb-0.5">Weather Conditions</CardTitle>
              <CardDescription className="text-xs mt-0">
                Current weather at the course
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              {course.latitude && course.longitude ? (
                weather && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 p-2 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-xs text-muted-foreground leading-tight">Temperature</div>
                      <div className="text-sm font-semibold leading-tight">{weather.temperature}°C</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground leading-tight">Wind</div>
                      <div className="text-sm font-semibold leading-tight">{weather.windSpeed} m/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground leading-tight">Conditions</div>
                      <div className="text-sm font-semibold leading-tight">{weather.conditions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground leading-tight">Humidity</div>
                      <div className="text-sm font-semibold leading-tight">{weather.humidity}%</div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Location data not available for this course
                </p>
              )}
            </CardContent>
          </Card>

          {/* Start Game Button */}
         
                <Button 
                  onClick={handleStartGame}
                  className="w-full h-12 text-base font-medium"
                >
                  Start Game
                </Button>
              </div>
      </DialogContent>
    </Dialog>
  );
}

