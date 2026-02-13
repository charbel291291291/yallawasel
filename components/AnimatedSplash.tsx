import React, { useState, useEffect, useRef } from "react";

interface AnimatedSplashProps {
  onComplete: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);

  // Initialize wind sound
  useEffect(() => {
    const audio = new Audio("/assets/sounds/wind.mp3");
    audio.volume = 0.1;
    audio.loop = true;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);
    });

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle user interaction to start audio (browser autoplay policy)
  const handleUserInteraction = () => {
    if (audioRef.current && audioLoaded) {
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play failed:", e));
    }
  };

  // Start splash animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out audio
      if (audioRef.current) {
        const fadeOut = () => {
          if (audioRef.current && audioRef.current.volume > 0) {
            audioRef.current.volume = Math.max(
              0,
              audioRef.current.volume - 0.02
            );
            setTimeout(fadeOut, 50);
          } else if (audioRef.current) {
            audioRef.current.pause();
          }
        };
        fadeOut();
      }

      // Hide splash and notify completion
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 2500); // Show for 2.5 seconds

    // Start wind particles animation
    startWindAnimation();

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Wind particles animation
  const startWindAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
    }[] = [];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();

        // Move particles
        particle.x += particle.speed;
        particle.y += Math.sin(particle.x * 0.01) * 0.5;

        // Reset particles that go off screen
        if (particle.x > canvas.width) {
          particle.x = -5;
          particle.y = Math.random() * canvas.height;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 overflow-hidden"
      onClick={handleUserInteraction}
    >
      {/* Wind particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Logo container with animations */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with floating animation */}
        <div className="animate-float">
          <img
            src="/assets/logo.png"
            alt="Yalla Wasel Logo"
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl animate-pulse-slow"
          />
        </div>

        {/* Brand name with fade-in */}
        <div className="mt-6 text-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-luxury font-bold text-white tracking-wider">
            Yalla Wasel
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/80 font-medium">
            Luxury Lebanese Super-Kit
          </p>
        </div>
      </div>

      {/* Click to start hint */}
      <div className="absolute bottom-8 text-center animate-pulse">
        <p className="text-white/60 text-sm font-medium">
          Click to experience the luxury
        </p>
        <div className="mt-2 w-8 h-8 mx-auto border-2 border-white/40 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedSplash;
