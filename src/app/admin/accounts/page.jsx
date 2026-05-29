"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Loader2,
  Shield,
  User
} from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "patient",
};

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const { data } = await res.json();
        setAccounts(data);
      }
      
      const resDel = await fetch("/api/accounts?include_deleted=only");
      if (resDel.ok) {
        const { data: delData } = await resDel.json();
        setDeletedCount(delData.length);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return accounts.filter((account) => {
      return !query ||
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query);
    });
  }, [accounts, searchQuery]);

  const openAddModal = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setModal("add");
  };

  const openEditModal = (account) => {
    setSelectedAccount(account);
    setFormData({
      name: account.name,
      email: account.email,
      phone: account.phone,
      role: account.role,
    });
    setFormErrors({});
    setModal("edit");
  };

  const openDeleteModal = (account) => {
    setSelectedAccount(account);
    setModal("delete");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedAccount(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Mohon isi nama lengkap.";
    if (!formData.email?.trim()) errors.email = "Mohon isi email.";
    if (modal === "add" && !formData.password) errors.password = "Mohon isi password.";
    
    if (formData.role === 'patient' && !formData.phone?.trim()) {
        errors.phone = "Mohon isi nomor telepon untuk pasien.";
    }

    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setFormErrors({});
    setIsSaving(true);
    try {
      if (modal === "edit" && selectedAccount) {
        const res = await fetch("/api/accounts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedAccount.id,
            name: formData.name,
            phone: formData.phone,
            role: selectedAccount.role,
          }),
        });
        if (res.ok) await fetchData();
        else alert("Gagal memperbarui data akun.");
      }

      if (modal === "add") {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.role === 'patient' ? formData.phone : undefined,
            password: formData.password,
            role: formData.role,
          }),
        });
        if (res.ok) await fetchData();
        else {
          const err = await res.json();
          alert(err.message || "Gagal menambah akun.");
        }
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
      closeModal();
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      if (selectedAccount) {
        const res = await fetch(`/api/accounts?id=${selectedAccount.id}`, {
          method: "DELETE",
        });
        if (res.ok) await fetchData();
        else alert("Gagal menghapus akun.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
      closeModal();
    }
  };

  return (
    <div className="font-sans text-slate-800 pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Akun</h1>
        <p className="text-gray-500 text-sm">Kelola data akun pengguna yang terdaftar di sistem</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <SummaryCard label="Total Akun" value={accounts.length} />
        <SummaryCard label="Akun Admin" value={accounts.filter(a => a.role === 'admin').length} />
        <SummaryCard label="Akun Pasien" value={accounts.filter(a => a.role === 'patient').length} />
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search akun..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#5E81CC] focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5E81CC] text-white font-semibold rounded-lg text-sm shadow-md hover:bg-[#4A6BB0] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Akun
        </button>

        {/* Lihat Terhapus Link */}
        <Link
          href="/admin/accounts/deleted"
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-white text-gray-600 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Daftar Terhapus {deletedCount > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{deletedCount}</span>}
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6">
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Daftar Akun</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Nama Pengguna</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">No Telepon</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5E81CC]" />
                    Memuat data akun...
                  </td>
                </tr>
              ) : filteredAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                  <td className="px-6 py-4 text-gray-600">{account.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      account.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      account.role === 'doctor' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {account.role === 'admin' && <Shield className="w-3 h-3" />}
                      {account.role === 'doctor' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                      {account.role === 'patient' && <User className="w-3 h-3" />}
                      {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{account.role === 'admin' ? '-' : account.phone}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(account)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Akun"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(account)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Tidak ada akun ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <AccountFormModal
          title={modal === "add" ? "Tambah Akun" : "Edit Akun"}
          mode={modal}
          formData={formData}
          onChange={setFormData}
          onCancel={closeModal}
          onSave={handleSave}
          isSaving={isSaving}
          errors={formErrors}
          setErrors={setFormErrors}
        />
      )}

      {modal === "delete" && selectedAccount && (
        <DeleteAccountModal
          accountName={selectedAccount.name}
          onCancel={closeModal}
          onDelete={handleDelete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 w-40 flex-grow sm:flex-grow-0 flex flex-col items-center justify-center">
      <span className="text-sm font-bold text-gray-600 mb-2 text-center">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

function AccountFormModal({ title, mode, formData, onChange, onCancel, onSave, isSaving, errors, setErrors }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {mode === 'add' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tipe Akun (Role)</label>
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, role: 'patient' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.role === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <User className="w-4 h-4" />
                  Pasien
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, role: 'admin' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${formData.role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <TextField
              label="Nama Lengkap *"
              value={formData.name}
              error={errors?.name}
              onChange={(value) => { onChange({ ...formData, name: value }); setErrors(e => ({...e, name: null})); }}
            />
            <TextField
              label="Email *"
              value={formData.email}
              disabled={mode === 'edit'}
              error={errors?.email}
              onChange={(value) => { onChange({ ...formData, email: value }); setErrors(e => ({...e, email: null})); }}
            />
            
            {mode === 'add' && (
              <TextField
                label="Password *"
                type="password"
                value={formData.password}
                error={errors?.password}
                onChange={(value) => { onChange({ ...formData, password: value }); setErrors(e => ({...e, password: null})); }}
              />
            )}

            {formData.role === 'patient' && (
              <TextField
                label="No Telepon *"
                value={formData.phone}
                error={errors?.phone}
                onChange={(value) => { onChange({ ...formData, phone: value }); setErrors(e => ({...e, phone: null})); }}
              />
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#5E81CC] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A6BB0] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({ accountName, onCancel, onDelete, isSaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Hapus Akun</h2>
        <AlertTriangle className="mx-auto mt-6 h-16 w-16 text-red-500" strokeWidth={1.5} />
        <p className="mt-4 text-sm font-medium text-gray-600">
          Apakah Anda yakin ingin menghapus akun <b>{accountName}</b>? Tindakan ini akan memindahkan data ke daftar terhapus.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onDelete}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, disabled, type = "text", error }) {
  return (
    <div className="block space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5E81CC] ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-gray-200' : error ? 'bg-gray-50 border-red-500 focus:ring-red-500 focus:bg-white' : 'bg-gray-50 border-gray-200 focus:bg-white'}`}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function XIcon(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
