"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Loader2
} from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
};

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const { data } = await res.json();
        setPatients(data);
      }
      
      const resDel = await fetch("/api/patients?include_deleted=only");
      if (resDel.ok) {
        const { data: delData } = await resDel.json();
        setDeletedCount(delData.length);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return patients.filter((patient) => {
      return !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query);
    });
  }, [patients, searchQuery]);

  const openAddModal = () => {
    setFormData(emptyForm);
    setModal("add");
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    });
    setModal("edit");
  };

  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setModal("delete");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedPatient(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (modal === "edit" && selectedPatient) {
        const res = await fetch("/api/patients", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedPatient.id,
            name: formData.name,
            phone: formData.phone,
          }),
        });
        if (res.ok) await fetchData();
        else alert("Gagal memperbarui data pasien.");
      }

      if (modal === "add") {
        const res = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }),
        });
        if (res.ok) await fetchData();
        else {
          const err = await res.json();
          alert(err.message || "Gagal menambah pasien.");
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
      if (selectedPatient) {
        const res = await fetch(`/api/patients?id=${selectedPatient.id}`, {
          method: "DELETE",
        });
        if (res.ok) await fetchData();
        else alert("Gagal menghapus pasien.");
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
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Pasien</h1>
        <p className="text-gray-500 text-sm">Kelola data pasien yang terdaftar di sistem</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <SummaryCard label="Total Pasien" value={patients.length} />
        {/* Placeholder for future features if needed */}
        <SummaryCard label="Menunggu" value="-" />
        <SummaryCard label="Selesai" value="-" />
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search pasien..."
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
          Tambah pasien
        </button>

        {/* Lihat Terhapus Link */}
        <Link
          href="/admin/patients/deleted"
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
          <h2 className="text-lg font-bold text-gray-900">Daftar Pasien</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Nama Pasien</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">No Telepon</th>
                <th className="px-6 py-4">Konsultasi Terakhir</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#5E81CC]" />
                    Memuat data pasien...
                  </td>
                </tr>
              ) : filteredPatients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{patient.name}</td>
                  <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                  <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{patient.lastConsultation}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(patient)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Pasien"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(patient)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Pasien"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Tidak ada pasien ditemukan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "add" || modal === "edit") && (
        <PatientFormModal
          title={modal === "add" ? "Tambah Pasien" : "Edit Pasien"}
          mode={modal}
          formData={formData}
          onChange={setFormData}
          onCancel={closeModal}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {modal === "delete" && selectedPatient && (
        <DeletePatientModal
          patientName={selectedPatient.name}
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

function PatientFormModal({ title, mode, formData, onChange, onCancel, onSave, isSaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <TextField
              label="Nama Lengkap *"
              value={formData.name}
              onChange={(value) => onChange({ ...formData, name: value })}
            />
            <TextField
              label="Email *"
              value={formData.email}
              disabled={mode === 'edit'}
              onChange={(value) => onChange({ ...formData, email: value })}
            />
            {mode === 'add' && <p className="text-xs text-indigo-500 font-medium px-1">Email tidak dapat diubah setelah ditambahkan. Password default adalah Pasien123!</p>}
            <TextField
              label="No Telepon"
              value={formData.phone}
              onChange={(value) => onChange({ ...formData, phone: value })}
            />
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

function DeletePatientModal({ patientName, onCancel, onDelete, isSaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Hapus Pasien</h2>
        <AlertTriangle className="mx-auto mt-6 h-16 w-16 text-red-500" strokeWidth={1.5} />
        <p className="mt-4 text-sm font-medium text-gray-600">
          Apakah Anda yakin ingin menghapus data <b>{patientName}</b>? Tindakan ini akan memindahkan data ke daftar terhapus.
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

function TextField({ label, value, onChange, disabled }) {
  return (
    <div className="block space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#5E81CC] ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'}`}
      />
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
