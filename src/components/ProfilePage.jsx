"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { supabase, waitForSupabaseUser } from "@/lib/supabase";

const initialProfile = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  date_of_birth: "",
  img_url: "",
  last_sign_in: "",
  role: "",
};

const ROLE_LABELS = {
  patient: "Pasien",
  doctor: "Dokter",
  admin: "Admin",
};

const ROLE_BADGE_CLASS = {
  patient: "bg-[#EEF3FF] text-[#5E81CC]",
  doctor: "bg-[#E9F5FF] text-[#0F5BC7]",
  admin: "bg-[#F3EDF8] text-[#6B46C1]",
};

export default function ProfilePage({ role = "patient" }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editForm, setEditForm] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState({
    password_lama: "",
    password_baru: "",
    konfirmasi_password: "",
  });
  const fileInputRef = useRef(null);

  const effectiveRole = profile.role || role;
  const isPatient = effectiveRole === "patient";
  const isDoctor = effectiveRole === "doctor";
  const isAdmin = effectiveRole === "admin";
  const showPhoneAndContact = isPatient || isDoctor;
  const roleLabel = ROLE_LABELS[effectiveRole] || "Pengguna";
  const badgeClass = ROLE_BADGE_CLASS[effectiveRole] || "bg-slate-100 text-slate-700";

  useEffect(() => {
    let active = true;

    async function initPage() {
      const { data, error } = await waitForSupabaseUser();
      if (!active) return;

      if (error || !data?.user) {
        setLoading(false);
        return;
      }

      setUserId(data.user.id);
      await fetchProfileData(data.user.id, data.user.last_sign_in_at);
    }

    initPage();
    return () => {
      active = false;
    };
  }, []);

  const fetchProfileData = async (uid, lastSignInRaw) => {
    try {
      const res = await fetch(`/api/profile?userId=${uid}`);
      const result = await res.json();
      if (res.ok && result.profile) {
        const updatedData = {
          ...result.profile,
          last_sign_in: lastSignInRaw || result.profile.last_sign_in || "",
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
    const file = e.target.files?.[0];
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
        body: JSON.stringify({
          id: userId,
          full_name: editForm.full_name,
          email: editForm.email,
          phone_number: editForm.phone_number,
          address: editForm.address,
          date_of_birth: editForm.date_of_birth,
          img_url: editForm.img_url,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Gagal menyimpan profil.");

      setProfile(result.profile);
      setEditForm(result.profile);
      setIsEditModalOpen(false);
      alert(result.message);

      const storedUser = localStorage.getItem("clinicalink:user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.img_url = result.profile.img_url;
        parsed.full_name = result.profile.full_name;
        localStorage.setItem("clinicalink:user", JSON.stringify(parsed));
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
      const { data, error } = await supabase.auth.updateUser({
        password: passwordForm.password_baru,
      });

      if (error) throw error;

      setIsPasswordModalOpen(false);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Profile Saya</h1>
        <p className="text-gray-500 text-sm">Kelola informasi akun dan data pribadi Anda.</p>
      </div>

      <div className="w-full mt-4">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start mt-4">
          <div className="flex flex-col items-center w-full md:w-1/3 md:border-r border-gray-200/60 pb-6 md:pb-0 md:pr-8 lg:pr-16">
            <div className="relative w-36 h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-sm mb-4">
              <img
                src={profile.img_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || "User")}`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-extrabold text-xl text-gray-900 text-center">{profile.full_name || "Nama Pengguna"}</h3>
            <span className={`mt-2 px-6 py-1.5 text-xs font-bold rounded-full shadow-sm ${badgeClass}`}>
              {roleLabel}
            </span>
          </div>

          <div className="flex-1 w-full space-y-0 text-sm">
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Nama Lengkap</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.full_name || "-"}</span>
            </div>
            <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
              <span className="text-gray-900 font-bold text-xs">Email</span>
              <span className="text-gray-900 font-bold px-4">:</span>
              <span className="text-gray-600 font-medium">{profile.email}</span>
            </div>
            {showPhoneAndContact && (
              <div className="grid grid-cols-[130px_auto_1fr] items-center py-4 border-b border-gray-50">
                <span className="text-gray-900 font-bold text-xs">Nomor Telepon</span>
                <span className="text-gray-900 font-bold px-4">:</span>
                <span className="text-gray-600 font-medium">{profile.phone_number || "-"}</span>
              </div>
            )}
            {isPatient && (
              <>
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
              </>
            )}
            <>
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
            </>

            <div className="flex gap-4 pt-8 justify-center md:justify-start">
              <button
                onClick={() => {
                  setEditForm({ ...profile });
                  setIsEditModalOpen(true);
                }}
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

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-gray-900">Edit profile</h2>
            <p className="text-[11px] text-gray-500 mb-8 font-medium">Perbarui profil Anda.</p>

            <form onSubmit={handleSaveProfile} className="flex flex-col md:flex-row gap-10">
              <div className="flex flex-col items-center w-full md:w-1/3 md:border-r border-gray-100 md:pr-10">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-50 mb-4 group">
                  <img
                    src={editForm.img_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editForm.full_name || "User")}`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[10px] font-bold">Ubah</span>
                  </button>
                </div>
                <h3 className="font-extrabold text-lg text-gray-900 text-center">{editForm.full_name || "Nama Pengguna"}</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>

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

                  {showPhoneAndContact && (
                    <>
                      <label className="text-[11px] font-bold text-gray-900">Nomor Telepon</label>
                      <span className="text-gray-900 font-bold px-3">:</span>
                      <input
                        type="text"
                        className="w-full p-2.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                        value={editForm.phone_number || ""}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                      />
                    </>
                  )}

                  {isPatient && (
                    <>
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
                    </>
                  )}
                </div>

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

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-gray-900">Ubah password</h2>
            <p className="text-[11px] text-gray-500 mb-8 font-medium">Pastikan password baru anda kuat dan aman.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-[140px_auto_1fr] items-center gap-y-4">
                <label className="text-[11px] font-bold text-gray-900">Password lama</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <div className="relative w-full">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="w-full p-2.5 pr-10 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={passwordForm.password_lama || ""}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_lama: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showOldPassword ? "Sembunyikan password lama" : "Tampilkan password lama"}
                  >
                    {showOldPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17.94 17.94A10.46 10.46 0 0 1 12 19.5c-5.4 0-9.93-3.38-11.79-8.25a1 1 0 0 1 0-.5A10.46 10.46 0 0 1 6.06 6.06" />
                        <path d="M1 1l22 22" />
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                        <path d="M10.65 6.65A7.96 7.96 0 0 1 12 5.5c5.4 0 9.93 3.38 11.79 8.25" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <label className="text-[11px] font-bold text-gray-900">Password baru</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <div className="relative w-full">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full p-2.5 pr-10 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={passwordForm.password_baru}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17.94 17.94A10.46 10.46 0 0 1 12 19.5c-5.4 0-9.93-3.38-11.79-8.25a1 1 0 0 1 0-.5A10.46 10.46 0 0 1 6.06 6.06" />
                        <path d="M1 1l22 22" />
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                        <path d="M10.65 6.65A7.96 7.96 0 0 1 12 5.5c5.4 0 9.93 3.38 11.79 8.25" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <label className="text-[11px] font-bold text-gray-900 leading-tight">Konfirmasi password</label>
                <span className="text-gray-900 font-bold px-3">:</span>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full p-2.5 pr-10 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E81CC]/20 focus:border-[#5E81CC] outline-none transition"
                    value={passwordForm.konfirmasi_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17.94 17.94A10.46 10.46 0 0 1 12 19.5c-5.4 0-9.93-3.38-11.79-8.25a1 1 0 0 1 0-.5A10.46 10.46 0 0 1 6.06 6.06" />
                        <path d="M1 1l22 22" />
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                        <path d="M10.65 6.65A7.96 7.96 0 0 1 12 5.5c5.4 0 9.93 3.38 11.79 8.25" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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
