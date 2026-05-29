"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  Funnel,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

const initialPatients = [
  {
    id: 1,
    name: "Mila",
    lastConsultation: "12 Mei 2030",
    email: "Mila@gmail.com",
    phone: "0xxxxxxxxxx",
    status: "Non aktif",
  },
  {
    id: 2,
    name: "Kimmy",
    lastConsultation: "12 Mei 2030",
    email: "Kimmy@gmail.com",
    phone: "0xxxxxxxxxx",
    status: "aktif",
  },
  {
    id: 3,
    name: "Sila",
    lastConsultation: "12 Mei 2030",
    email: "Sila@gmail.com",
    phone: "0xxxxxxxxxx",
    status: "aktif",
  },
  {
    id: 4,
    name: "Nina",
    lastConsultation: "14 Mei 2030",
    email: "Nina@gmail.com",
    phone: "0xxxxxxxxxx",
    status: "aktif",
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  lastConsultation: "",
  status: "Aktif",
};

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("clinicalink:patients");
      if (stored) {
        try { setPatients(JSON.parse(stored)); } catch (e) { setPatients(initialPatients); }
      } else {
        setPatients(initialPatients);
        localStorage.setItem("clinicalink:patients", JSON.stringify(initialPatients));
      }

      const storedDeleted = localStorage.getItem("clinicalink:deleted_patients");
      if (storedDeleted) {
        try { setDeletedCount(JSON.parse(storedDeleted).length); } catch (e) {}
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [modal, setModal] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesSearch =
        !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "Semua" ||
        patient.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [patients, searchQuery, statusFilter]);

  const activePatients = patients.filter((patient) => patient.status.toLowerCase() === "aktif").length;

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
      lastConsultation: patient.lastConsultation,
      status: patient.status.toLowerCase() === "aktif" ? "Aktif" : "Nonaktif",
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

  const handleSave = () => {
    const normalizedStatus = formData.status === "Aktif" ? "aktif" : "Non aktif";

    if (modal === "edit" && selectedPatient) {
      const updated = patients.map((patient) =>
        patient.id === selectedPatient.id
          ? {
              ...patient,
              name: formData.name || patient.name,
              email: formData.email || patient.email,
              phone: formData.phone || patient.phone,
              lastConsultation: formData.lastConsultation || patient.lastConsultation,
              status: normalizedStatus,
            }
          : patient
      );
      setPatients(updated);
      localStorage.setItem("clinicalink:patients", JSON.stringify(updated));
    }

    if (modal === "add") {
      const updated = [
        ...patients,
        {
          id: patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1,
          name: formData.name || "Pasien Baru",
          email: formData.email || "pasien@email.com",
          phone: formData.phone || "0xxxxxxxxxx",
          lastConsultation: formData.lastConsultation || "-",
          status: normalizedStatus,
        },
      ];
      setPatients(updated);
      localStorage.setItem("clinicalink:patients", JSON.stringify(updated));
    }

    closeModal();
  };

  const handleDelete = () => {
    if (selectedPatient) {
      const updated = patients.filter((patient) => patient.id !== selectedPatient.id);
      setPatients(updated);
      localStorage.setItem("clinicalink:patients", JSON.stringify(updated));

      // Simpan ke daftar terhapus di localStorage
      const storedDeleted = localStorage.getItem("clinicalink:deleted_patients");
      let deletedList = [];
      if (storedDeleted) {
        try { deletedList = JSON.parse(storedDeleted); } catch (e) {}
      }
      deletedList.push({
        ...selectedPatient,
        deleted_at: new Date().toISOString(),
      });
      localStorage.setItem("clinicalink:deleted_patients", JSON.stringify(deletedList));
      setDeletedCount(deletedList.length);
    }
    closeModal();
  };

  return (
    <div className="font-sans text-slate-800 pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Pasien</h1>
        <p className="text-gray-500 text-sm">Kelola data pasien yang terdaftar di sistem</p>
      </div>

      <div className="flex gap-4 mb-6 flex-wrap">
        <SummaryCard label="Total pasien" value={patients.length} />
        <SummaryCard label="Pasien aktif" value={activePatients} />
        <SummaryCard label="Pasien baru" value={1} />
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

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((open) => !open)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#5E81CC] font-semibold rounded-lg text-sm shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Funnel className="w-4 h-4" />
            Filter {statusFilter !== "Semua" && <span className="text-xs ml-1 bg-[#5E81CC] text-white px-1.5 py-0.5 rounded-full">{statusFilter}</span>}
          </button>
          
          {filterOpen && (
            <div className="absolute top-12 left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-40 p-1">
              {["Semua", "Aktif", "Nonaktif"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setStatusFilter(option);
                    setFilterOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors rounded-lg ${statusFilter === option ? "bg-[#E6EDFF] text-[#5E81CC]" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
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
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Daftar Pasien</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F3F6FB] text-gray-700 font-semibold text-xs border-y border-gray-100">
              <tr>
                <th className="px-6 py-4 text-center w-12">No</th>
                <th className="px-6 py-4">Nama Pasien</th>
                <th className="px-6 py-4">Konsultasi Terakhir</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">No Telepon</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{patient.name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{patient.lastConsultation}</td>
                  <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                  <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                  <td className="px-6 py-4 text-center">
                    {patient.status.toLowerCase() === "aktif" ? (
                      <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600 border border-green-200">Aktif</span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-bold bg-red-100 text-red-500 border border-red-200">Non aktif</span>
                    )}
                  </td>
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
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">Tidak ada pasien ditemukan</td>
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
        />
      )}

      {modal === "delete" && selectedPatient && (
        <DeletePatientModal
          patientName={selectedPatient.name}
          onCancel={closeModal}
          onDelete={handleDelete}
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

function PatientFormModal({ title, mode, formData, onChange, onCancel, onSave }) {
  const compact = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`w-full rounded-2xl bg-white shadow-xl ${compact ? "max-w-md" : "max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          <div className={compact ? "space-y-4" : "grid gap-4 md:grid-cols-2"}>
            <TextField
              label={compact ? "Nama Pasien *" : "Nama Lengkap *"}
              value={formData.name}
              onChange={(value) => onChange({ ...formData, name: value })}
            />
            {compact ? (
              <TextField
                label="Konsultasi Terakhir"
                value={formData.lastConsultation}
                onChange={(value) => onChange({ ...formData, lastConsultation: value })}
              />
            ) : (
              <SelectField
                label="Status *"
                value={formData.status}
                onChange={(value) => onChange({ ...formData, status: value })}
              />
            )}
            <TextField
              label="Email *"
              value={formData.email}
              onChange={(value) => onChange({ ...formData, email: value })}
            />
            {!compact && (
              <TextField
                label="Konsultasi Terakhir"
                value={formData.lastConsultation}
                onChange={(value) => onChange({ ...formData, lastConsultation: value })}
              />
            )}
            <TextField
              label="No Telepon"
              value={formData.phone}
              onChange={(value) => onChange({ ...formData, phone: value })}
            />
            {compact && (
              <SelectField
                label="Status *"
                value={formData.status}
                onChange={(value) => onChange({ ...formData, status: value })}
              />
            )}
          </div>

          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={onSave}
              className="flex-1 rounded-xl bg-[#5E81CC] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4A6BB0]"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeletePatientModal({ patientName, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white px-8 py-9 text-center shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Hapus Permanen Pasien</h2>
        <AlertTriangle className="mx-auto mt-6 h-16 w-16 text-red-500" strokeWidth={1.5} />
        <p className="mt-4 text-sm font-medium text-gray-600">
          Apakah Anda yakin ingin menghapus data <b>{patientName}</b>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onDelete}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <div className="block space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E81CC]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange }) {
  return (
    <div className="block space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5E81CC]"
        >
          <option>Aktif</option>
          <option>Nonaktif</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  );
}
