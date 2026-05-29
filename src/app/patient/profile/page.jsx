"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";

export default function PatientProfilePage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // State Data Profil Utama (Tanpa Username)
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    date_of_birth: "",
    img_url: "",
    last_sign_in: "",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [editForm, setEditForm] = useState({ ...profile });
  const [passwordForm, setPasswordForm] = useState({
    password_lama: "",
    password_baru: "",
    konfirmasi_password: "",
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    async function initPage() {
      const { data, error } = await waitForSupabaseUser();
      if (error || !data?.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      await fetchProfileData(data.user.id, data.user.last_sign_in_at);
    }
    initPage();
  }, []);

  const fetchProfileData = async (uid, lastSignInRaw) => {
    try {
      const res = await fetch(`/api/profile?userId=${uid}`);
      const result = await res.json();
      if (res.ok && result.profile) {
        const updatedData = {
          ...result.profile,
          last_sign_in: lastSignInRaw || "",
        };
        setProfile(updatedData);
        setEditForm(updatedData);
      }
    } catch (err) {
      console.error("Gagal memuat data profil:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !userId) return;

    setSubmitLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("foto profil")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("foto profil")
        .getPublicUrl(filePath);

      setEditForm((prev) => ({ ...prev, img_url: publicUrl }));
      alert("Foto profil berhasil diunggah!");
    } catch (error) {
      alert(`Gagal mengunggah gambar: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

const handleSaveProfile = async (e) => {
  e.preventDefault();
  setSubmitLoading(true);

  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...editForm }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    // 1. Update state halaman utama profil
    setProfile((prev) => ({ ...prev, ...result.profile }));
    setIsEditModalOpen(false);
    alert(result.message);
    window.location.reload();
    
    // 2. JALAN KEDUA: Update cache lokal di dalam blok try agar sinkron ke Sidebar
    const storedUser = localStorage.getItem("clinicalink:user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.img_url = result.profile.img_url; // Masukkan URL foto baru
      parsed.full_name = result.profile.full_name; // Masukkan nama baru sekalian
      
      localStorage.setItem("clinicalink:user", JSON.stringify(parsed));
      
      // Trigger event storage secara manual agar didengar oleh komponen Sidebar Layout
      window.dispatchEvent(new Event("storage"));
    }

  } catch (error) {
    alert(error.message);
  } finally {
    setSubmitLoading(false);
  }
};

  const handleUpdatePassword = async (e) => {
  e.preventDefault();

  if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
    alert("Konfirmasi password baru tidak cocok.");
    return;
  }

  if (passwordForm.password_baru.length < 6) {
    alert("Password baru wajib minimal 6 karakter.");
    return;
  }

  setSubmitLoading(true);
  try {
    // LANGSUNG PANGGIL SUPABASE DI SINI (Client-Side)
    const { data, error } = await supabase.auth.updateUser({
      password: passwordForm.password_baru
    });

    if (error) throw error;

    setIsPasswordModalOpen(false);
    // Reset form password kembali kosong
    setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" });
    alert("Password berhasil diperbarui!");
  } catch (error) {
    alert(`Gagal memperbarui password: ${error.message}`);
  } finally {
    setSubmitLoading(false);
  }
};

  const renderLastLogin = (isoString) => {
    if (!isoString) return "-";
    try {
      return format(new Date(isoString), "dd MMMM yyyy, HH.mm 'WIB'", { locale: id });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Memuat halaman profil...</div>;
  }

  return (
    <>
      {/* Header Halaman */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile Saya</h1>
        <p className="text-gray-500 text-sm">Kelola informasi akun dan data pribadi anda.</p>
      </div>

      <div className="w-full mt-4">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start mt-4">
          
          {/* Kolom Kiri: Foto */}
          <div className="flex flex-col items-center w-full md:w-1/3 md:border-r border-gray-200/60 pb-6 md:pb-0 md:pr-8 lg:pr-16">
            <div className="relative w-36 h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-sm mb-4">
              <img 
                src={profile.img_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (profile.full_name || "User")} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-extrabold text-xl text-gray-900 text-center">{profile.full_name || "Nama Pasien"}</h3>
            <span className="mt-2 px-6 py-1.5 text-xs font-bold text-[#5E81CC] bg-[#EEF3FF] rounded-full shadow-sm">Pasien</span>
          </div>

          {/* Kolom Rencana Kanan: Tampilan Detail Informasi */}
          <div className="flex-1 w-full space-y-0 text-sm">
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Email</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.email}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Nomor Telepon</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.phone_number || "-"}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Alamat</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.address || "-"}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Tanggal Lahir</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.date_of_birth || "-"}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Terakhir Login</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{renderLastLogin(profile.last_sign_in)}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Status</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-[#14C914] bg-[#E9FFE8] px-3 py-1 rounded-full text-[11px] font-bold w-fit">Aktif</span>
            </div>

            <div className="flex gap-4 pt-8 justify-center md:justify-start">
              <button 
                onClick={() => { setEditForm({ ...profile }); setIsEditModalOpen(true); }}
                className="px-8 py-2.5 bg-[#5E81CC] hover:bg-[#4D6FB5] text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-8 py-2.5 border border-[#5E81CC] text-[#5E81CC] hover:bg-blue-50/50 rounded-xl text-xs font-bold transition"
              >
                Ubah Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL 1: EDIT PROFILE                                      */}
      {/* ========================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-gray-900">Edit profile</h2>
            <p className="text-[11px] text-gray-500 mb-8 font-medium">Perbarui profil anda.</p>

            <form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-10">
              
              {/* Sisi Kiri: Upload Foto */}
              <div className="flex flex-col items-center w-full md:w-1/3 md:border-r border-gray-100 md:pr-10">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-50 mb-4 group">
                  <img 
                    src={editForm.img_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (editForm.full_name || "User")} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span className="text-[10px] font-bold">Ubah</span>
                  </button>
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 text-center">{editForm.full_name || "Nama Pasien"}</h3>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* Sisi Kanan: Input Field Form */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-[120px_auto_1fr] items-center gap-y-4">
                  
                  <label className="text-[11px] font-bold text-gray-900">Nama Lengkap</label>
                  <span className="text-gray-900 font-bold px-3">:</span>
                  <input 
                    type="text" 
                    className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={editForm.full_name} 
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                  />

                  <label className="text-[11px] font-bold text-gray-900">Email</label>
                  <span className="text-gray-900 font-bold px-3">:</span>
                  <input 
                    type="email" 
                    className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={editForm.email} 
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />

                  <label className="text-[11px] font-bold text-gray-900">Nomor Telepon</label>
                  <span className="text-gray-900 font-bold px-3">:</span>
                  <input 
                    type="text" 
                    className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={editForm.phone_number || ""} 
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  />

                  <label className="text-[11px] font-bold text-gray-900">Alamat</label>
                  <span className="text-gray-900 font-bold px-3">:</span>
                  <input 
                    type="text" 
                    className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={editForm.address || ""} 
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />

                  <label className="text-[11px] font-bold text-gray-900">Tanggal Lahir</label>
                  <span className="text-gray-900 font-bold px-3">:</span>
                  <input 
                    type="date" 
                    className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={editForm.date_of_birth || ""} 
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  />
                </div>

                {/* Footer Modal */}
                <div className="grid grid-cols-2 gap-4 pt-6 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-full py-2.5 text-xs font-bold border border-[#5E81CC] text-[#5E81CC] rounded-xl hover:bg-blue-50/50 transition"
                  >
                    Tutup
                  </button>
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-2.5 text-xs font-bold bg-[#5E81CC] text-white rounded-xl hover:bg-[#4D6FB5] transition shadow-sm disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitLoading ? "Menyimpan..." : "Simpan perubahan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: UBAH PASSWORD                                     */}
      {/* ========================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-gray-900">Ubah password</h2>
            <p className="text-[11px] text-gray-500 mb-8 font-medium">pastikan password baru anda kuat dan aman.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-[140px_auto_1fr] items-center gap-y-4">
                
                <label className="text-[11px] font-bold text-gray-900">Password lama</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <input 
                  type="password" 
                  className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                  value={passwordForm.password_lama || ""}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_lama: e.target.value })}
                />
                
                <label className="text-[11px] font-bold text-gray-900">Password baru</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <input 
                  type="password" 
                  className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                  value={passwordForm.password_baru}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                  required
                />
                
                <label className="text-[11px] font-bold text-gray-900 leading-tight">Konfirmasi password</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <input 
                  type="password" 
                  className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                  value={passwordForm.konfirmasi_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="w-full py-2.5 text-xs font-bold border border-[#5E81CC] text-[#5E81CC] rounded-xl hover:bg-blue-50/50 transition"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-2.5 text-xs font-bold bg-[#5E81CC] text-white rounded-xl hover:bg-[#4D6FB5] transition shadow-sm disabled:bg-slate-300 disabled:shadow-none"
                >
                  {submitLoading ? "Memproses..." : "Simpan perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}