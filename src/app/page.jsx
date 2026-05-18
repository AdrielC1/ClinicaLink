"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        router.push("/landing");
      }, 600);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #DBEAFE 100%)",
      }}
    >
      {/* Background decorative circles */}
      <div
        className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, #A5B4FC, #C7D2FE)" }}
      />
      <div
        className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #93C5FD, #BFDBFE)" }}
      />

      {/* Plus decorations */}
      <span className="absolute top-16 right-24 text-4xl font-thin text-blue-300 opacity-60 select-none">+</span>
      <span className="absolute bottom-24 left-16 text-4xl font-thin text-blue-300 opacity-60 select-none">+</span>

      {/* Calendar icon bottom left */}
      <div className="absolute bottom-16 left-20 opacity-30">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="8" y="16" width="64" height="56" rx="8" stroke="#818CF8" strokeWidth="4"/>
          <path d="M8 32h64" stroke="#818CF8" strokeWidth="4"/>
          <path d="M24 8v16M56 8v16" stroke="#818CF8" strokeWidth="4" strokeLinecap="round"/>
          <path d="M24 52l12 12 20-20" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Stethoscope icon bottom right */}
      <div className="absolute bottom-12 right-16 opacity-25">
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
          <circle cx="65" cy="65" r="12" stroke="#60A5FA" strokeWidth="4"/>
          <path d="M20 20 Q20 50 45 55 Q60 58 65 53" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <circle cx="20" cy="20" r="6" stroke="#60A5FA" strokeWidth="3"/>
          <circle cx="35" cy="20" r="6" stroke="#60A5FA" strokeWidth="3"/>
        </svg>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-6 z-10">
        {/* Logo */}
        <div className="flex items-center gap-4 animate-pulse-slow">
          {/* Heart with pulse icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #6366F1, #3B82F6)",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path
                d="M18 30s-13-8-13-17a8 8 0 0116 0 8 8 0 0116 0c0 9-13 17-13 17z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M8 18h4l3-5 4 10 3-7 2 4h4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Brand name */}
          <div>
            <div className="text-3xl font-bold tracking-tight">
              <span className="text-gray-800">Clinica</span>
              <span style={{ color: "#4F46E5" }}>Link</span>
            </div>
            <div className="text-xs text-gray-500 tracking-widest uppercase mt-0.5">
              Smart Clinic Appointment System
            </div>
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6366F1, #3B82F6)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
