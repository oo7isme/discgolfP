"use client";

import { useMemo } from "react";
import DgBasketIcon from "@/components/DgBasketIcon";
import { MapPin } from "lucide-react";

interface HoleMapProps {
  holeNumber: number;
  par: number;
  distanceMeters?: number | null;
  className?: string;
}

export function HoleMap({ holeNumber, par, distanceMeters, className = "" }: HoleMapProps) {
  // Determine hole layout based on distance and par
  const layout = useMemo(() => {
    if (!distanceMeters) return null;

    // Categorize hole type based on distance and par
    const isShort = distanceMeters < 100;
    const isMedium = distanceMeters >= 100 && distanceMeters < 200;
    const isLong = distanceMeters >= 200;

    // Determine if it's a dogleg (curved) or straight hole
    // For now, we'll use par to determine curvature
    const isDogleg = par >= 4 && distanceMeters > 150;

    return {
      distance: distanceMeters,
      isShort,
      isMedium,
      isLong,
      isDogleg,
      // Calculate path points for visualization
      teeX: 40,
      teeY: 180,
      basketX: isDogleg ? 260 : 280,
      basketY: isDogleg ? 80 : 40,
      controlX: isDogleg ? 180 : 160,
      controlY: isDogleg ? 60 : 110,
    };
  }, [distanceMeters, par]);

  if (!layout || !distanceMeters) {
    return (
      <div className={`w-full h-48 bg-muted/20 rounded-lg border-2 border-dashed border-muted flex items-center justify-center ${className}`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No distance data</p>
        </div>
      </div>
    );
  }

  // Create SVG path for the hole
  const pathD = layout.isDogleg
    ? `M ${layout.teeX} ${layout.teeY} Q ${layout.controlX} ${layout.controlY} ${layout.basketX} ${layout.basketY}`
    : `M ${layout.teeX} ${layout.teeY} L ${layout.basketX} ${layout.basketY}`;

  return (
    <div className={`w-full bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border-2 border-green-200/50 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 320 200"
        className="w-full h-48"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background - Fairway */}
        <defs>
          <linearGradient id="fairwayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.5" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Fairway area */}
        {layout.isDogleg ? (
          <path
            d={`M ${layout.teeX} ${layout.teeY} Q ${layout.controlX} ${layout.controlY} ${layout.basketX} ${layout.basketY}`}
            stroke="none"
            fill="url(#fairwayGradient)"
            strokeWidth="40"
            opacity="0.4"
          />
        ) : (
          <line
            x1={layout.teeX}
            y1={layout.teeY}
            x2={layout.basketX}
            y2={layout.basketY}
            stroke="#86efac"
            strokeWidth="40"
            opacity="0.4"
            strokeLinecap="round"
          />
        )}

        {/* Hole path line */}
        <path
          d={pathD}
          stroke="#16a34a"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
          opacity="0.6"
        />

        {/* Tee pad */}
        <g transform={`translate(${layout.teeX}, ${layout.teeY})`}>
          <rect
            x="-12"
            y="-6"
            width="24"
            height="12"
            rx="2"
            fill="#64748b"
            stroke="#475569"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            className="text-[8px] font-bold fill-white"
            fontSize="8"
          >
            TEE
          </text>
        </g>

        {/* Distance marker (midpoint) */}
        <g transform={`translate(${(layout.teeX + layout.basketX) / 2}, ${(layout.teeY + layout.basketY) / 2})`}>
          <circle
            cx="0"
            cy="0"
            r="20"
            fill="white"
            stroke="#16a34a"
            strokeWidth="2"
            opacity="0.9"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            className="text-[6px] font-bold fill-green-700"
            fontSize="6"
          >
            {distanceMeters}m
          </text>
        </g>

        {/* Basket */}
        <g transform={`translate(${layout.basketX}, ${layout.basketY})`}>
          <circle
            cx="0"
            cy="0"
            r="14"
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth="2"
            filter="url(#shadow)"
          />
          {/* Basket icon rendered as foreignObject */}
          <foreignObject x="-12" y="-12" width="24" height="24">
            <div className="flex items-center justify-center w-full h-full">
              <DgBasketIcon className="text-amber-700" size={24} />
            </div>
          </foreignObject>
        </g>

        {/* Hole number badge */}
        <g transform="translate(10, 10)">
          <rect
            x="0"
            y="0"
            width="32"
            height="24"
            rx="4"
            fill="#3b82f6"
            stroke="#2563eb"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />
          <text
            x="16"
            y="16"
            textAnchor="middle"
            className="text-[10px] font-bold fill-white"
            fontSize="10"
          >
            H{holeNumber}
          </text>
        </g>

        {/* Par badge */}
        <g transform="translate(10, 38)">
          <rect
            x="0"
            y="0"
            width="32"
            height="20"
            rx="4"
            fill="#22c55e"
            stroke="#16a34a"
            strokeWidth="1.5"
            filter="url(#shadow)"
          />
          <text
            x="16"
            y="14"
            textAnchor="middle"
            className="text-[9px] font-bold fill-white"
            fontSize="9"
          >
            Par {par}
          </text>
        </g>
      </svg>
    </div>
  );
}

