"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function getStoredUser() {
  const rawUser =
    localStorage.getItem("clinicalink:user") ||
    sessionStorage.getItem("clinicalink:user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem("clinicalink:user");
    sessionStorage.removeItem("clinicalink:user");
    return null;
  }
}

function updateStoredUser(user) {
  const key = "clinicalink:user";
  const rawUser = localStorage.getItem(key);
  const target = rawUser ? localStorage : sessionStorage;

  target.setItem(
    key,
    JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    })
  );
}

export default function PatientProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [savedData, setSavedData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    const loadProfile = async () => {
      const storedUser = getStoredUser();

      if (!storedUser?.id) {
        setLoading(false);
        return;
      }

      setUser(storedUser);

      try {
        const response = await fetch(`/api/profile?userId=${storedUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Gagal memuat profil.");
          setMessageType("error");
          return;
        }

        const nextProfileData = {
          full_name: data.profile.full_name || "",
          email: data.profile.email || "",
          phone_number: data.profile.phone_number || "",
        };

        setFormData(nextProfileData);
        setSavedData(nextProfileData);
      } catch (error) {
        setMessage("Tidak bisa menghubungi server profil.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditing(false);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (user.email !== formData.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: formData.email });
        if (authError) {
          setMessage("Gagal mengubah email autentikasi.");
          setMessageType("error");
          alert("Gagal mengubah email autentikasi.");
          setSaving(false);
          return;
        }
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          ...formData,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Gagal menyimpan profil.");
        setMessageType("error");
        alert(data.message || "Gagal menyimpan profil.");
        return;
      }

      const nextProfileData = {
        full_name: data.profile.full_name || "",
        email: data.profile.email || "",
        phone_number: data.profile.phone_number || "",
      };

      setFormData(nextProfileData);
      setSavedData(nextProfileData);
      setUser(data.profile);
      updateStoredUser(data.profile);
      const successMsg = data.message || "Profil berhasil diperbarui.";
      setMessage(successMsg);
      setMessageType("success");
      alert(successMsg);
    } catch (error) {
      setMessage("Tidak bisa menyimpan profil saat ini.");
      setMessageType("error");
      alert("Tidak bisa menyimpan profil saat ini.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">Memuat profil...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">ClinicaLink</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Profil Pasien
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Silakan login terlebih dahulu untuk melihat dan mengedit profil.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Ke Halaman Login
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">ClinicaLink</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Profil Pasien
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Kelola informasi pribadi dan kontak agar data kunjungan tetap akurat.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Data Profil</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Ubah data yang diperlukan lalu simpan perubahan."
                : "Klik edit profil untuk mengubah data akun pasien."}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className="w-full rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:w-auto"
            >
              Edit Profil
            </button>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Nama lengkap
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={!isEditing || saving}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!isEditing || saving}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Nomor telepon
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Contoh: 081234567890"
              disabled={!isEditing || saving}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Role
            </label>
            <input
              type="text"
              value={user.role || "patient"}
              disabled
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm capitalize text-slate-500"
            />
          </div>
        </div>

        {message && (
          <div
            className={`mt-5 rounded-lg border px-4 py-3 text-sm font-medium ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {isEditing && (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
