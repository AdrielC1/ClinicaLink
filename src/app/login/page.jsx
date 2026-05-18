"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Logo() {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path
          d="M18 31C18 31 5 23 5 13a9 9 0 0118 0 9 9 0 0118 0c0 10-13 18-13 18z"
          fill="url(#hg-login)"
        />
        <path
          d="M9 18h4l3-5 4 10 3-7 2 4h4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <defs>
          <linearGradient id="hg-login" x1="5" y1="4" x2="31" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-2xl font-bold">
        <span className="text-gray-800">Clinica</span>
        <span className="text-indigo-600">Link</span>
      </span>
    </div>
  );
}

// Decorative plus sign
function Plus({ className = "" }) {
  return (
    <span
      className={`absolute select-none font-light leading-none ${className}`}
      style={{ fontSize: 28 }}
    >
      +
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: ganti dengan logic auth kita nnti
    setTimeout(() => {
      setLoading(false);
      router.push("/patient/dashboard");
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F0F4FF 0%, #E8EEFF 50%, #EEF6FF 100%)" }}
    >
      {/* Decorative plus signs */}
      <Plus className="top-10 left-1/3 text-gray-400 opacity-50" />
      <Plus className="top-24 right-16 text-indigo-300 opacity-60" />
      <Plus className="top-1/2 left-8 text-indigo-300 opacity-50" />
      <Plus className="bottom-28 left-1/4 text-gray-400 opacity-40" />
      <Plus className="bottom-16 left-1/2 text-gray-400 opacity-40" />
      <Plus className="bottom-10 right-1/3 text-indigo-300 opacity-50" />
      <Plus className="top-1/3 right-8 text-indigo-200 opacity-60" style={{ fontSize: 22 }} />
      <Plus className="bottom-1/3 right-24 text-gray-300 opacity-60" />

      {/* "Sign in" top-left label */}
      <p className="absolute top-5 left-5 text-sm text-gray-400">Sign in</p>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
          <Logo />

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Masuk ke Akun Anda</h1>
          <p className="text-sm text-gray-500 mb-7">
            Silahkan masuk untuk melanjutkan ke ClinicaLink
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 gap-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M2 4h16v12H2z" rx="2" strokeLinecap="round" />
                  <path d="M2 4l9 7 9-7" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 gap-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <rect x="3" y="8" width="14" height="10" rx="2" />
                  <path d="M7 8V6a4 4 0 018 0v2" strokeLinecap="round" />
                </svg>
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-600">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-1 hover:opacity-90 transition-opacity disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #6366F1, #3B82F6)" }}
            >
              {loading ? "Memproses..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-5">
            Belum punya akun?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
