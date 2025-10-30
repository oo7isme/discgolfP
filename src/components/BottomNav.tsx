"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Disc3, BarChart3, User } from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/new", icon: Disc3, label: "New Round" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/profile", icon: User, label: "Profile" },
];

interface BottomNavProps {
  user?: boolean;
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();
  
  // Hide bottom nav for non-authenticated users
  if (!user) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 text-center py-4 transition-all duration-200 hover:scale-105",
                isActive
                  ? "text-primary bg-primary/10 border-t-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                <div className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{item.label}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


