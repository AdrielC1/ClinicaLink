"use client";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoSvg from "../icons/ClinicaLink.svg";

function CrossOrnament({ className, color = "#8AAAE5" }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={`absolute ${className}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="0" width="4" height="32" rx="2" fill={color} />
            <rect x="0" y="14" width="32" height="4" rx="2" fill={color} />
        </svg>
    );
}

async function parseApiResponse(response) {
    const text = await response.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Server mengirim respons HTML, bukan JSON.");
    }
}

function findLocalPatientAccount(email, password) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const savedUsers = JSON.parse(localStorage.getItem("clinicalink:registeredUsers") || "[]");

    return savedUsers.find(
        (user) => user.email === normalizedEmail && user.password === password && user.role === "patient"
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // Guard: Jika user masuk ke halaman login (entah lewat tombol Back atau direct link),
    // kita asumsikan mereka ingin login ulang/keluar, jadi kita bersihkan sesi lama dengan aman.
    useEffect(() => {
        const clearPublicSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.auth.signOut();
                    console.log("Sesi lama telah dihancurkan karena user kembali ke halaman login.");
                }
            } catch (err) {
                console.warn("Gagal memeriksa sesi lama di halaman login:", err);
                try {
                    await supabase.auth.signOut();
                } catch {
                    // ignore cleanup failure
                }
            } finally {
                localStorage.removeItem("clinicalink:user");
                sessionStorage.removeItem("clinicalink:user");
                document.cookie = "clinicalink_role=; path=/; max-age=0";
            }
        };
        clearPublicSession();
    }, []);

    const handleNavigate = (path) => {
        setIsClosing(true);
        setTimeout(() => {
            router.push(path);
        }, 150);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let hasError = false;
        if (!email.trim()) {
            setEmailError("Mohon isi email.");
            hasError = true;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setEmailError("Format email tidak valid.");
                hasError = true;
            }
        }

        if (!password) {
            setPasswordError("Mohon isi password.");
            hasError = true;
        }
        if (hasError) return;

        setLoading(true);
        setError("");

        try {
            // 1. Tembak Autentikasi Langsung ke Supabase (Otomatis menyimpan sesi di browser)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError("Login gagal. Periksa email dan password Anda.");
                setLoading(false);
                return;
            }

            const { data: readyData, error: readyError } = await waitForSupabaseUser();
            if (readyError || !readyData?.user) {
                setError("Gagal menginisialisasi sesi login. Silakan coba lagi.");
                setLoading(false);
                return;
            }

            // 2. Ambil Role User dari tabel public.users untuk menentukan rute dashboard
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, deleted_at")
                .eq("id", authData.user.id)
                .single();

            if (userError || !userData) {
                setError("Gagal membaca otoritas akun Anda. Silakan hubungi admin.");
                setLoading(false);
                return;
            }

            // Blokir akun yang sudah di-soft delete oleh Admin
            if (userData.deleted_at) {
                await supabase.auth.signOut();
                setError("Akun Anda telah dinonaktifkan oleh Admin. Silakan hubungi klinik.");
                setLoading(false);
                return;
            }

            // Simpan role di localStorage DAN cookie agar proxy server bisa membaca role tanpa query DB
            localStorage.setItem("clinicalink:role", userData.role);
            
            // Simpan juga nama untuk ditampilkan di dashboard
            const fullName = authData.user?.user_metadata?.full_name || userData?.full_name || "Doctor";
            localStorage.setItem("clinicalink:name", fullName);

            // Cookie ini dibaca oleh proxy.js untuk validasi role di sisi server
            document.cookie = `clinicalink_role=${userData.role}; path=/; max-age=86400; SameSite=Lax`;

            // 3. Routing Pintar Berdasarkan Role
            let targetRoute = "/";
            if (userData.role === "patient") {
                targetRoute = "/patient/dashboard";
            } else if (userData.role === "doctor") {
                targetRoute = "/doctor/dashboard";
            } else if (userData.role === "admin") {
                targetRoute = "/admin/dashboard";
            }

            // 4. Arahkan ke rute yang benar — pakai replace() agar /login tidak bisa
            // diakses kembali via tombol Back browser.
            setIsClosing(true);
            setTimeout(() => router.replace(targetRoute), 150);

            // Catatan: setLoading(false) sengaja dilewati di blok sukses ini 
            // agar tombol tetap berstatus "Memproses..." selama animasi pindah halaman.

        } catch (err) {
            console.error("Error catch login:", err);
            setError("Tidak bisa menghubungi server autentikasi. Silakan coba lagi.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: "#F3F6FB" }}>

            {/* Background Ornaments */}
            <CrossOrnament className="top-10 left-32 opacity-60" color="#718096" />
            <CrossOrnament className="top-24 right-40 opacity-50" color="#5E81CC" />
            <CrossOrnament className="bottom-20 left-40 opacity-70" color="#718096" />
            <CrossOrnament className="bottom-40 right-32 opacity-60" color="#5E81CC" />
            <CrossOrnament className="top-1/2 left-10 opacity-40" color="#5E81CC" />
            <CrossOrnament className="top-1/3 right-10 opacity-40" color="#718096" />
            <CrossOrnament className="bottom-10 right-1/3 opacity-50" color="#5E81CC" />
            {/* Logo — fixed di tengah atas, tidak terpengaruh ukuran card */}
            <div className="fixed top-8 left-0 right-0 z-30 flex items-center justify-center gap-3 pointer-events-none">
                <Image src={logoSvg} alt="ClinicaLink Logo" width={44} height={44} priority />
                <span className="text-3xl font-bold">
                    <span style={{ color: "rgba(45, 55, 72, 0.5)" }}>Clinica</span>
                    <span style={{ color: "rgba(94, 129, 201, 0.5)" }}>Link</span>
                </span>
            </div>

            {/* Form Card — selalu di tengah layar, animasi hanya card */}
            <div className={`relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 transition-all duration-200 ease-out ${mounted && !isClosing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

                {/* Tombol Silang */}
                <button
                    onClick={() => handleNavigate("/landing")}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Tutup"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Masuk ke Akun Anda</h2>
                    <p className="text-sm text-gray-500">Silahkan masuk untuk melanjutkan ke ClinicaLink</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={emailError ? "#F87171" : "#A0AEC0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                placeholder="Masukkan email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all outline-none focus:border-transparent focus:ring-2 ${
                                    emailError 
                                    ? 'bg-red-50 border border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500' 
                                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
                                }`}
                            />
                        </div>
                        {emailError && <p className="text-xs text-red-500 font-medium mt-1.5">{emailError}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={passwordError ? "#F87171" : "#A0AEC0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) setPasswordError("");
                                }}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all outline-none focus:border-transparent focus:ring-2 ${
                                    passwordError 
                                    ? 'bg-red-50 border border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500' 
                                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
                                }`}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-gray-600 transition-colors">
                                    {showPassword ? (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                        {passwordError && <p className="text-xs text-red-500 font-medium mt-1.5">{passwordError}</p>}
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between -mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded accent-blue-500"
                            />
                            <span className="text-sm text-gray-600">Ingat saya</span>
                        </label>
                        <button type="button" onClick={() => handleNavigate("/forgot-password")} className="text-sm hover:underline" style={{ color: "#5E81CC" }}>
                            Lupa password?
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col items-center w-full">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${!loading ? "hover:opacity-90 active:scale-[0.98] cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                            style={{ backgroundColor: "#5E81CC", color: "#FFFFFF" }}
                        >
                            {loading ? "Memproses..." : "Masuk"}
                        </button>
                        <p className="mt-6 text-sm text-gray-900 font-medium">
                            Belum punya akun?{" "}
                            <button type="button" onClick={() => handleNavigate("/register")} style={{ color: "#5E81CC" }} className="hover:underline font-semibold">
                                Daftar di sini
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}