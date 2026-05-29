"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  RotateCcw,
  Loader2,
  Trash2,
} from "lucide-react";

export default function DeletedAccountsPage() {
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeleted = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts?include_deleted=only");
      if (res.ok) {
        const { data } = await res.json();
        setDeletedAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch deleted accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return deletedAccounts.filter((account) => {
      return !query ||
        account.name.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query);
    });
  }, [deletedAccounts, searchQuery]);

  const openRestoreModal = (account) => {
    setSelectedAccount(account);
    setModal("restore");
  };

  const openHardDeleteModal = (account) => {
    setSelectedAccount(account);
    setModal("hard_delete");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedAccount(null);
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      if (selectedAccount) {
        const res = await fetch("/api/accounts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedAccount.id,
            action: 'restore',
          }),
        });
        if (res.ok) await fetchDeleted();
        else alert("Gagal memulihkan akun.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsProcessing(false);
      closeModal();
    }
  };

  const handleHardDelete = async () => {
    setIsProcessing(true);
    try {
      if (selectedAccount) {
        const res = await fetch(`/api/accounts?id=${selectedAccount.id}&hard=true`, {
          method: "DELETE",
        });
        if (res.ok) await fetchDeleted();
        else alert("Gagal menghapus akun secara permanen.");
      }
    } catch (error) {
      alert("Terjadi kesalahan.");
    } finally {
      setIsProcessing(false);
      closeModal();
    }
  };

  return (
    <div className="font-sans text-slate-800 pb-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/accounts"
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Daftar Akun Terhapus</h1>
          <p className="text-gray-500 text-sm">Kembalikan data akun yang sebelumnya dihapus</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search akun terhapus..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4 mb-6 relative">
        <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-orange-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-orange-500" />
            Recycle Bin
          </h2>
          <span className="bg-white border border-orange-200 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
            {deletedAccounts.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Nama Pengguna</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Dihapus Pada</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                    Memuat data akun terhapus...
                  </td>
                </tr>
              ) : filteredAccounts.map((account, index) => {
                const deletedDate = account.deleted_at 
                  ? new Date(account.deleted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : "-";
                
                return (
                  <tr
                    key={account.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{account.name}</td>
                    <td className="px-6 py-4 text-gray-600">{account.email}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{account.role}</td>
                    <td className="px-6 py-4 font-semibold text-gray-500">
                      {deletedDate}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openRestoreModal(account)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition-colors font-semibold text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Pulihkan
                        </button>
                        <button
                          onClick={() => openHardDeleteModal(account)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors font-semibold text-xs"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Permanen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Trash2 className="w-8 h-8 text-gray-300" />
                      </div>
                      <p>Tidak ada data akun yang terhapus</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === "restore" && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl border border-orange-100">
            <h2 className="text-xl font-bold text-gray-900">Pulihkan Akun</h2>
            <div className="mx-auto mt-6 h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
              <RotateCcw className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Anda akan memulihkan data <b>{selectedAccount.name}</b>. Akun ini akan kembali muncul di daftar aktif.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Pulihkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "hard_delete" && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl border border-red-100">
            <h2 className="text-xl font-bold text-red-600">Hapus Permanen</h2>
            <div className="mx-auto mt-6 h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <Trash2 className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-medium text-gray-600">
              Apakah Anda yakin ingin menghapus <b>{selectedAccount.name}</b> secara PERMANEN? Data yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleHardDelete}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
