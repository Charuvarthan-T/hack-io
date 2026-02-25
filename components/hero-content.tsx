"use client";
import { Shield } from "lucide-react";
import { ActionButtons } from "@/components/action-buttons";
export function HeroContent() {
  return (
    <main className="container mx-auto px-4">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center">
        <div className="max-w-6xl mx-auto stagger-slide-up flex flex-col items-center">
          { }
          <div className="relative overflow-hidden inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
            <span className="absolute inset-0 w-full h-full animate-shimmer" />
            <Shield className="w-4 h-4 mr-2 animate-pulse text-primary z-10" />
            <span className="z-10 relative">A Stellar Hackathon Platform</span>
          </div>
          { }
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary animate-gradient-text mb-4 leading-tight pb-2 mt-2">
            Hack.io
          </h1>
          { }
          <div className="mx-auto max-w-2xl mb-8">
            <p className="inline-block text-lg md:text-xl text-muted-foreground leading-relaxed animate-typewriter">
              Streamline your coding assessments and engage in Hackathons.
            </p>
          </div>
          { }
          <ActionButtons />
        </div>
      </div>
    </main>
  );
}
