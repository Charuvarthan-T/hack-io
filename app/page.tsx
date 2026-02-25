"use client";
import { Header } from "@/components/header";
import { HeroContent } from "@/components/hero-content";
import { useRef, useEffect } from "react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
    <div className="dark relative min-h-screen overflow-hidden text-foreground">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-[-2]"
      >
        <source src="/animated-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-[-1]"></div>
      <Header />
      <HeroContent />
    </div>
  );
}
