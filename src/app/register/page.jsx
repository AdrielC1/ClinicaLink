"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import logoSvg from "../icons/ClinicaLink.svg";

function CrossOrnament({ className, color = "#8AAAE5" }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={`absolute ${className}`} xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="0" width="4" height="32" rx="2" fill={color} />
            <rect x="0" y="14" width="32" height="4" rx="2" fill={color} />
        </svg>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        namaLengkap: "",
        email: "",
        noTelepon: "",
        password: "",
        konfirmasiPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Real-time email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isEmailValid = emailRegex.test(formData.email);
    const showEmailWarning = formData.email !== "" && !isEmailValid;

    // Sederhanakan Validasi Password: Hanya cek apakah sudah diisi
    const isPasswordValid = formData.password.trim() !== "";

    // Real-time confirm password validation
    const isConfirmMatch = formData.password === formData.konfirmasiPassword;
    const showConfirmWarning = formData.konfirmasiPassword !== "" && !isConfirmMatch;

    // Form validity check (Role dihapus dari pengecekan karena otomatis pasien)
    const isFormValid =
        formData.namaLengkap.trim() !== "" &&
        formData.email.trim() !== "" &&
        isEmailValid &&
        isPasswordValid &&
        isConfirmMatch;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid || loading) return;

        setLoading(true);
        setErrorMsg("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.namaLengkap,
                    phone_number: formData.noTelepon,
                    role: "pasien" // Otomatis dikunci ke role pasien
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Gagal melakukan registrasi");
            }

            // Sukses, redirect ke login
            router.push("/login");
        } catch (err) {
            setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden py-12" style={{ backgroundColor: "#F3F6FB" }}>

            {/* Background Ornaments */}
            <CrossOrnament className="top-10 left-32 opacity-60" color="#718096" />
            <CrossOrnament className="top-24 right-40 opacity-50" color="#5E81CC" />
            <CrossOrnament className="bottom-20 left-40 opacity-70" color="#718096" />
            <CrossOrnament className="bottom-40 right-32 opacity-60" color="#5E81CC" />
            <CrossOrnament className="top-1/2 left-10 opacity-40" color="#5E81CC" />
            <CrossOrnament className="top-1/3 right-10 opacity-40" color="#718096" />
            <CrossOrnament className="bottom-10 right-1/3 opacity-50" color="#5E81CC" />

            {/* Logo */}
            <div className="z-10 flex items-center justify-center gap-3 mb-8">
                <Image src={logoSvg} alt="ClinicaLink Logo" width={48} height={48} priority />
                <h1 className="text-3xl font-bold">
                    <span style={{ color: "rgba(45, 55, 72, 0.5)" }}>Clinica</span>
                    <span style={{ color: "rgba(94, 129, 201, 0.5)" }}>Link</span>
                </h1>
            </div>

            {/* Form Card */}
            <div className="z-10 bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 mx-4">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun Baru</h2>
                    <p className="text-sm text-gray-500">Daftar untuk mulai menggunakan layanan Pasien ClinicaLink</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                        {/* Nama Lengkap */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Nama Lengkap</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="namaLengkap"
                                    placeholder="Masukkan nama lengkap"
                                    value={formData.namaLengkap}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Masukkan email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-4 py-2.5 bg-white border ${showEmailWarning ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                                        } text-gray-900 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm`}
                                />
                            </div>
                            {showEmailWarning && (
                                <p className="mt-1 text-xs text-red-500 font-medium">Format email tidak valid (contoh: user@gmail.com)</p>
                            )}
                        </div>

                        {/* No Telepon */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">No Telepon</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                    </svg>
                                </div>
                                <input
                                    type="tel"
                                    name="noTelepon"
                                    placeholder="08xxxxxx"
                                    value={formData.noTelepon}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        {/* Pilihan Role Dihapus dari UI agar form bersih */}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Masukkan password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 focus:ring-blue-400 text-gray-900 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm"
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
                        </div>

                        {/* Konfirmasi Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Konfirmasi Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="konfirmasiPassword"
                                    placeholder="Konfirmasi password"
                                    value={formData.konfirmasiPassword}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-10 py-2.5 bg-white border ${showConfirmWarning ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                                        } text-gray-900 rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all placeholder-gray-400 text-sm`}
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
                            {showConfirmWarning && (
                                <p className="mt-1 text-xs text-red-500 font-medium">Konfirmasi password tidak cocok</p>
                            )}
                        </div>

                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col items-center justify-center mt-4 w-full">
                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium text-center w-full md:w-2/3">
                                {errorMsg}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={!isFormValid || loading}
                            className={`w-full md:w-2/3 py-3 rounded-lg font-semibold transition-all shadow-md ${isFormValid && !loading
                                ? "hover:opacity-90 active:scale-[0.98] cursor-pointer"
                                : "opacity-50 cursor-not-allowed"
                                }`}
                            style={{
                                backgroundColor: isFormValid && !loading ? "#5E81CC" : "#A0AEC0",
                                color: "#FFFFFF"
                            }}
                        >
                            {loading ? "Memproses..." : "Sign Up"}
                        </button>
                        <p className="mt-6 text-sm text-gray-900 font-medium">
                            Sudah punya akun? <Link href="/login" style={{ color: "#5E81CC" }} className="hover:underline">Sign In</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}