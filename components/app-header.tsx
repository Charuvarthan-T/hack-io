"use client";
import { Code, LogOut } from "lucide-react";
import { signOut, useSession, signIn } from "next-auth/react";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
export function AppHeader() {
  const { data: session } = useSession();
  const [points, setPoints] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function fetchPoints() {
      try {
        const res = await fetch("/api/users/me/points");
        if (res.ok) {
          const data = await res.json();
          if (mounted) setPoints(data.points ?? 0);
        }
      } catch (e) {
        console.warn("Failed to fetch user points", e);
      }
    }
    function onPointsUpdated(e: any) {
      const val = e?.detail?.totalPoints;
      if (typeof val === "number") setPoints(val);
      else fetchPoints();
    }
    if (session) fetchPoints();
    window.addEventListener("pointsUpdated", onPointsUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("pointsUpdated", onPointsUpdated);
    };
  }, [session]);
  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <SidebarTrigger />
          <Code className="w-6 h-6 text-primary" />
          <Link href={"/"}>
            <h1 className="text-2xl font-bold text-foreground">Hack.io</h1>
          </Link>
        </div>
        {}
        {session ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div>
                <Image
                  src={session.user?.image || "/image.png"}
                  alt="Profile"
                  width={100}
                  height={100}
                  priority
                  className="w-9 h-9 rounded-full ring-2 ring-border"
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpen((s) => !s)}
                      aria-expanded={open}
                      aria-label="Show my points"
                    >
                      <span className="text-white">🔥</span>
                      <span> {points ?? "-"} </span>
                    </button>
                    {}
                    {open && (
                      <div className="absolute right-0 mt-12 w-56 z-50 bg-card border rounded-md shadow-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400">🔥</span>
                            <span className="font-medium">Points</span>
                          </div>
                          <button
                            className="text-xs text-muted-foreground"
                            onClick={() => setOpen(false)}
                          >
                            Close
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-foreground">
                          Total points:{" "}
                          <span className="font-mono ml-1">{points ?? 0}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Keep solving problems to earn more points!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button variant="default" onClick={() => signIn("google")}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
