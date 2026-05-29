"use client";

import { useState } from "react";
import { User, Building2, Shield, Pencil, Camera, X } from "lucide-react";

export default function AdminSettingsPage() {
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editKlinikModal, setEditKlinikModal] = useState(false);
  const [editPasswordModal, setEditPasswordModal] = useState(false);

  const [profile, setProfile] = useState({
    name: "Admin",
    email: "Admin@gmail.com",
    role: "Administrator",
  });

  const [klinik, setKlinik] = useState({
    name: "ClinicaLink",
    address: "Jl. Diponegoro 1, Kab.Tembalang",
    phone: "0xxxxxxxxxx",
    email: "ClinicaLink@gmail.com",
  });

  return (
    <div className="font-sans text-slate-800 pb-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Pengaturan</h1>
        <p className="text-gray-500 text-sm">
          Kelola informasi akun admin dan pengaturan ClinicaLink
        </p>
      </div>

      <div className="w-full">
        {/* Profil Admin */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6EDFF] text-[#5E81CC] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Profil Admin</h2>
            </div>
            <button
              onClick={() => setEditProfileModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start gap-8 sm:ml-[52px]">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=150" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-gray-600 hover:bg-gray-700 transition-colors rounded-full text-white border-2 border-white">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-y-4 text-sm font-bold text-gray-900 mt-2">
              <div className="text-gray-900">Nama Lengkap</div>
              <div className="text-gray-900 font-semibold">{profile.name}</div>
              
              <div className="text-gray-900">Email</div>
              <div className="text-gray-900 font-semibold">{profile.email}</div>
              
              <div className="text-gray-900">Peran</div>
              <div className="text-gray-900 font-semibold">{profile.role}</div>
            </div>
          </div>
        </div>

        {/* Informasi Klinik */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6EDFF] text-[#5E81CC] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Informasi klinik</h2>
            </div>
            <button
              onClick={() => setEditKlinikModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          
          <div className="sm:ml-[52px] grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-y-4 text-sm font-bold text-gray-900">
            <div className="text-gray-900">Nama klinik</div>
            <div className="text-gray-900 font-semibold">{klinik.name}</div>
            
            <div className="text-gray-900">Alamat</div>
            <div className="text-gray-900 font-semibold">{klinik.address}</div>
            
            <div className="text-gray-900">No Telepon</div>
            <div className="text-gray-900 font-semibold">{klinik.phone}</div>
            
            <div className="text-gray-900">Email</div>
            <div className="text-gray-900 font-semibold">{klinik.email}</div>
          </div>
        </div>

        {/* Keamanan Klinik */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6EDFF] text-[#5E81CC] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Keamanan Klinik</h2>
            </div>
            <button
              onClick={() => setEditPasswordModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
          
          <div className="sm:ml-[52px] grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-y-4 text-sm font-bold text-gray-900">
            <div className="text-gray-900">Password</div>
            <div>
              <div className="text-gray-900 font-semibold mb-1">Terakhir diubah: 10 Mei 2030, 07.00 WIB</div>
              <div className="text-xs font-semibold text-gray-500 leading-relaxed max-w-md">
                Untuk menjaga keamanan akun gunakan password yang kuat dan jangan bagikan ke siapapun
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Modal Edit Profil */}
      {editProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Profile</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nama Admin</label>
                <input type="text" defaultValue={profile.name} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Email</label>
                <input type="email" defaultValue={profile.email} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Peran</label>
                <input type="text" defaultValue={profile.role} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
            </div>

            <div className="flex justify-start sm:justify-center gap-3 mt-8">
              <button onClick={() => setEditProfileModal(false)} className="px-6 py-2 bg-white border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors">
                Batal
              </button>
              <button onClick={() => setEditProfileModal(false)} className="px-6 py-2 bg-[#5E81CC] text-white hover:bg-[#4A6BB0] rounded-lg text-sm font-bold transition-colors shadow-sm">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Edit Klinik */}
      {editKlinikModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Informasi Klinik</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nama</label>
                <input type="text" defaultValue={klinik.name} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Alamat</label>
                <input type="text" defaultValue={klinik.address} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">No telpon</label>
                <input type="text" defaultValue={klinik.phone} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Email</label>
                <input type="email" defaultValue={klinik.email} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
            </div>

            <div className="flex justify-start sm:justify-center gap-3 mt-8">
              <button onClick={() => setEditKlinikModal(false)} className="px-6 py-2 bg-white border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors">
                Batal
              </button>
              <button onClick={() => setEditKlinikModal(false)} className="px-6 py-2 bg-[#5E81CC] text-white hover:bg-[#4A6BB0] rounded-lg text-sm font-bold transition-colors shadow-sm">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Edit Password */}
      {editPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">Ubah password</h3>
            <p className="text-xs font-semibold text-gray-500 mb-6">pastikan password baru anda kuat dan aman.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-bold text-gray-900">Password lama <span className="float-right">:</span></label>
                <input type="password" placeholder="" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-bold text-gray-900">Password baru <span className="float-right">:</span></label>
                <input type="password" placeholder="" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-bold text-gray-900">Konfirmasi password <span className="float-right">:</span></label>
                <input type="password" placeholder="" className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5E81CC] transition-all" />
              </div>
            </div>

            <div className="flex justify-start gap-3 mt-8 ml-[156px]">
              <button onClick={() => setEditPasswordModal(false)} className="px-6 py-2 bg-white border border-[#5E81CC] text-[#5E81CC] hover:bg-[#F3F6FB] rounded-lg text-sm font-bold transition-colors">
                Tutup
              </button>
              <button onClick={() => setEditPasswordModal(false)} className="px-6 py-2 bg-[#5E81CC] text-white hover:bg-[#4A6BB0] rounded-lg text-sm font-bold transition-colors shadow-sm">
                Simpan perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
