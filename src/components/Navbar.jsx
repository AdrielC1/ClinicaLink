"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function Logo({ size = "md" }) {
  const s = size === "sm" ? 28 : 36;
  const id = size === "sm" ? "hg-sm" : "hg-md";
  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg width={s} height={s} viewBox="0 0 36 36" fill="none" style={{ minWidth: s }}>
        <path
          d="M18 31C18 31 5 23 5 13a9 9 0 0118 0 9 9 0 0118 0c0 10-13 18-13 18z"
          fill={`url(#${id})`}
        />
        <path
          d="M9 18h4l3-5 4 10 3-7 2 4h4"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        <defs>
          <linearGradient id={id} x1="5" y1="4" x2="31" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xl font-bold whitespace-nowrap">
        <span className="text-gray-800">Clinica</span>
        <span className="text-indigo-600">Link</span>
      </span>
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Beranda");

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Fitur", href: "#fitur" },
    { label: "Cara kerja", href: "#cara-kerja" },
    { label: "Doctor", href: "#doctor" },
    { label: "About", href: "#about" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map(link => ({
        id: link.href.substring(1),
        label: link.label
      }));
      
      let current = "Beranda";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Navbar is sticky and takes up some space, 100px is a good threshold
          if (rect.top <= 100) {
            current = section.label;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                l.label === activeSection
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-0.5"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >{l.label}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link href="/login"
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >Sign In</Link>
          <Link href="/register"
            className="px-5 py-2 text-sm font-medium text-white rounded-lg whitespace-nowrap hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#6366F1,#3B82F6)" }}
          >Sign Up</Link>
        </div>
        <button className="md:hidden p-1" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 bg-white border-t border-gray-100">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium transition-colors ${
                l.label === activeSection ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"
              }`}>{l.label}</a>
          ))}
          <Link href="/login" className="text-sm text-indigo-600 font-medium">Sign In</Link>
          <Link href="/register"
            className="text-sm text-white font-medium px-4 py-2 rounded-lg text-center"
            style={{ background: "linear-gradient(135deg,#6366F1,#3B82F6)" }}
          >Sign Up</Link>
        </div>
      )}
    </nav>
  );
}
