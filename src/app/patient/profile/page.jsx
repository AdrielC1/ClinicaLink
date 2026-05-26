"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchProfileData(user.id, user.last_sign_in_at);
      } else {
        setLoading(false);
      }
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
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        
        {/* Header Halaman */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profile Saya</h1>
          <p className="text-sm text-slate-500">Kelola informasi akun dan data pribadi anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mt-8">
          
          {/* Kolom Kiri: Foto */}
          <div className="flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 border">
              <img 
                src={profile.img_url || "https://api.dicebear.com/7.x/initials/svg?seed=" + (profile.full_name || "User")} 
                alt="Avatar" 
                className="w-full h-full object-cover"
            />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-slate-900">{profile.full_name || "Nama Pasien"}</h3>
            <span className="mt-1 px-4 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">Pasien</span>
          </div>

          {/* Kolom Rencana Kanan: Tampilan Detail Informasi */}
          <div className="md:col-span-2 space-y-4 text-sm">
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Nama Lengkap</span>
              <span className="col-span-2 text-slate-900">: {profile.full_name}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="col-span-2 text-slate-900">: {profile.email}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Nomor Telepon</span>
              <span className="col-span-2 text-slate-900">: {profile.phone_number || "-"}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Alamat</span>
              <span className="col-span-2 text-slate-900">: {profile.address || "-"}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Tanggal Lahir</span>
              <span className="col-span-2 text-slate-900">: {profile.date_of_birth || "-"}</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Password</span>
              <span className="col-span-2 text-slate-900">: ********</span>
            </div>
            <div className="grid grid-cols-3 py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Terakhir Login</span>
              <span className="col-span-2 text-slate-900">: {renderLastLogin(profile.last_sign_in)}</span>
            </div>

            <div className="flex gap-4 pt-6 justify-end">
              <button 
                onClick={() => { setEditForm({ ...profile }); setIsEditModalOpen(true); }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-5 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900">Edit profile</h2>
            <p className="text-xs text-slate-400 mb-6">Perbarui profil anda.</p>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Sisi Kiri: Upload Foto */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 h-fit">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border bg-white group">
                  <img 
                    src={editForm.img_url || "https://via.placeholder.com/150"} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    Ganti
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="mt-3 text-xs text-blue-600 font-medium hover:underline"
                >
                  Pilih Berkas Gambar
                </button>
              </div>

              {/* Sisi Kanan: Input Field Form */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editForm.full_name} 
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      value={editForm.email} 
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Nomor Telepon</label>
                    <input 
                      type="text" 
                      className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                      value={editForm.phone_number || ""} 
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Alamat</label>
                  <input 
                    type="text" 
                    className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editForm.address || ""} 
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>

                {/* Input Tanggal Lahir dibuat Full-width karena kolom username dihapus */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    value={editForm.date_of_birth || ""} 
                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="col-span-1 md:col-span-3 flex justify-end gap-3 pt-4 border-t mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 2: UBAH PASSWORD                                     */}
      {/* ========================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900">Ubah password</h2>
            <p className="text-xs text-slate-400 mb-6">Pastikan password baru anda kuat dan aman.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Password lama</label>
                <input 
                  type="password" 
                  className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  value={passwordForm.password_lama || ""}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_lama: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Password baru</label>
                <input 
                  type="password" 
                  className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  value={passwordForm.password_baru}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Konfirmasi password</label>
                <input 
                  type="password" 
                  className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  value={passwordForm.konfirmasi_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-slate-300"
                >
                  {submitLoading ? "Memproses..." : "Simpan perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}