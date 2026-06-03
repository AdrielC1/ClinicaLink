"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoSvg from "../icons/ClinicaLink.svg";
import { supabase } from "@/lib/supabase";

function CrossOrnament({ className, color = "#8AAAE5" }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={`absolute ${className}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="0" width="4" height="32" rx="2" fill={color} />
            <rect x="0" y="14" width="32" height="4" rx="2" fill={color} />
        </svg>
    );
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // Supabase secara otomatis membaca #access_token dari URL dan membuat sesi
    // saat pengguna diarahkan ke halaman ini dari email reset.
    // Kita bisa mengecek jika tidak ada sesi dan URL tidak memiliki hash, 
    // berarti link mungkin sudah expired atau invalid.
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            // Jika kita mendarat di halaman ini tanpa sesi atau hash di URL
            if (!data.session && !window.location.hash) {
                setError("Tautan tidak valid atau sudah kedaluwarsa. Anda akan dialihkan.");
                setLoading(true); // Disable form
                setTimeout(() => {
                    handleNavigate("/login");
                }, 3000);
            }
        };
        checkSession();
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
        if (!newPassword) {
            setNewPasswordError("Mohon isi password baru.");
            hasError = true;
        } else if (newPassword.length < 6) {
            setNewPasswordError("Password minimal 6 karakter.");
            hasError = true;
        }

        if (!confirmPassword) {
            setConfirmPasswordError("Mohon konfirmasi password baru.");
            hasError = true;
        } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            setConfirmPasswordError("Password tidak cocok!");
            hasError = true;
        }

        if (hasError) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setError(updateError.message);
                setLoading(false);
            } else {
                setMessage("Password berhasil diubah, silakan login kembali.");
                // Setelah sukses, arahkan ke halaman login
                setTimeout(() => {
                    handleNavigate("/login");
                }, 2000); // Beri jeda agar user bisa membaca pesan sukses
            }
        } catch (err) {
            console.error("Error during password reset:", err);
            setError("Terjadi kesalahan. Silakan coba lagi.");
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

            {/* Logo */}
            <div className="fixed top-8 left-0 right-0 z-30 flex items-center justify-center gap-3 pointer-events-none">
                <Image src={logoSvg} alt="ClinicaLink Logo" width={44} height={44} priority />
                <span className="text-3xl font-bold">
                    <span style={{ color: "rgba(45, 55, 72, 0.5)" }}>Clinica</span>
                    <span style={{ color: "rgba(94, 129, 201, 0.5)" }}>Link</span>
                </span>
            </div>

            {/* Form Card */}
            <div className={`relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-8 transition-all duration-200 ease-out ${mounted && !isClosing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-sm text-gray-500">Masukkan password baru Anda.</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}
                
                {message && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700 font-medium">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Password Baru</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={newPasswordError ? "#F87171" : "#A0AEC0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                            </div>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Masukkan password baru"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (newPasswordError) setNewPasswordError("");
                                }}
                                disabled={loading}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all outline-none focus:border-transparent focus:ring-2 ${
                                    newPasswordError 
                                    ? 'bg-red-50 border border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500' 
                                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
                                }`}
                            />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-gray-600 transition-colors">
                                    {showNewPassword ? (
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
                        {newPasswordError && <p className="text-xs text-red-500 font-medium mt-1.5">{newPasswordError}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Konfirmasi Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={confirmPasswordError ? "#F87171" : "#A0AEC0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Ulangi password baru"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (confirmPasswordError) setConfirmPasswordError("");
                                }}
                                disabled={loading}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all outline-none focus:border-transparent focus:ring-2 ${
                                    confirmPasswordError 
                                    ? 'bg-red-50 border border-red-400 text-red-900 placeholder-red-300 focus:ring-red-500' 
                                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-400'
                                }`}
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-gray-600 transition-colors">
                                    {showConfirmPassword ? (
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
                        {confirmPasswordError && <p className="text-xs text-red-500 font-medium mt-1.5">{confirmPasswordError}</p>}
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col items-center w-full mt-2">
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className={`w-full py-3 rounded-lg font-semibold transition-all shadow-md ${!loading && !message ? "hover:opacity-90 active:scale-[0.98] cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                            style={{ backgroundColor: "#5E81CC", color: "#FFFFFF" }}
                        >
                            {loading ? "Memproses..." : "Simpan Password Baru"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
