"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

const statusClass = {
  aktif: "bg-[#E5FFE6] text-[#05B705]",
  "Non aktif": "bg-[#FFD7D7] text-[#E85656]",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  lastConsultation: "",
  status: "Aktif",
};

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState(initialPatients);
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

  const activePatients = patients.filter((patient) => patient.status === "aktif").length;

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
      status: patient.status === "aktif" ? "Aktif" : "Nonaktif",
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
      setPatients((current) =>
        current.map((patient) =>
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
        )
      );
    }

    if (modal === "add") {
      setPatients((current) => [
        ...current,
        {
          id: current.length + 1,
          name: formData.name || "Pasien Baru",
          email: formData.email || "pasien@email.com",
          phone: formData.phone || "0xxxxxxxxxx",
          lastConsultation: formData.lastConsultation || "-",
          status: normalizedStatus,
        },
      ]);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (selectedPatient) {
      setPatients((current) => current.filter((patient) => patient.id !== selectedPatient.id));
    }
    closeModal();
  };

  return (
    <section className="min-h-full border border-[#D8EDF4] bg-[#F0FBFF] px-4 py-6 sm:px-6 lg:px-10 xl:px-[60px]">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_226px] lg:items-start">
          <header>
            <h1 className="text-[24px] font-extrabold leading-tight text-black sm:text-[26px]">
              Kelola Pasien
            </h1>
            <p className="mt-1 text-[15px] font-bold leading-snug text-[#646464] sm:text-[16px]">
              Kelola data pasien yang terdaftar di sistem
            </p>
          </header>

          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7D7D7D]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search pasien"
              className="h-[42px] w-full rounded-[7px] border border-[#D8D8D8] bg-white pl-12 pr-4 text-[15px] font-semibold text-black outline-none transition-shadow placeholder:text-[#757575] focus:ring-2 focus:ring-[#C8D7FF]"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 xl:w-[640px] xl:gap-11">
          <SummaryCard label="Total pasien" value={patients.length} />
          <SummaryCard label="pasien aktif" value={activePatients} />
          <SummaryCard label="pasien baru" value={1} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <div className="relative">
            <button
              onClick={() => setFilterOpen((open) => !open)}
              className="flex h-[34px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#5E81CC] bg-white px-4 text-[14px] font-extrabold text-[#5E81CC] shadow-[0_2px_5px_rgba(15,23,42,0.18)] sm:w-[90px]"
            >
              {statusFilter === "Semua" ? (
                <Funnel className="h-4 w-4" />
              ) : (
                <span className="text-[13px]">{statusFilter}</span>
              )}
              {statusFilter === "Semua" ? "Filter" : ""}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-[38px] z-20 w-full rounded-[4px] border border-[#D6D6D6] bg-white py-2 shadow-sm sm:h-[102px] sm:w-[140px]">
                {["Semua", "Aktif", "Nonaktif"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setStatusFilter(option);
                      setFilterOpen(false);
                    }}
                    className="block w-full px-4 py-1.5 text-left text-[13px] font-bold text-black hover:bg-[#F0FBFF]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openAddModal}
            className="flex h-[34px] items-center justify-center gap-2 rounded-[6px] bg-[#5E81CC] px-5 text-[14px] font-extrabold text-white shadow-[0_2px_5px_rgba(15,23,42,0.22)] transition-colors hover:bg-[#4D6FB5]"
          >
            <Plus className="h-4 w-4" />
            Tambah pasien
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[10px] bg-white">
          <div className="px-5 py-5">
            <h2 className="text-[17px] font-extrabold leading-none text-black">Daftar Pasien</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="bg-[#EEF3FB] text-[12px] font-extrabold text-black">
                  <th className="w-[70px] px-6 py-3 text-center">No</th>
                  <th className="px-4 py-3">Nama Pasien</th>
                  <th className="px-4 py-3">Konsultasi terakhir</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">No Telepon</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className="border-b border-[#E4E4E4] text-[12px] font-extrabold text-black last:border-b"
                  >
                    <td className="px-6 py-3 text-center">{index + 1}</td>
                    <td className="px-4 py-3">{patient.name}</td>
                    <td className="px-4 py-3">{patient.lastConsultation}</td>
                    <td className="px-4 py-3">{patient.email}</td>
                    <td className="px-4 py-3">{patient.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-[76px] justify-center rounded-[6px] px-3 py-1 text-[12px] font-extrabold leading-none ${statusClass[patient.status]}`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditModal(patient)}
                          className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-[#5E81CC] transition-colors hover:bg-[#E5E7EB]"
                          aria-label={`Edit ${patient.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(patient)}
                          className="rounded-[6px] bg-[#F3F4F6] p-1.5 text-[#FF5252] transition-colors hover:bg-[#E5E7EB]"
                          aria-label={`Hapus ${patient.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-7 py-8">
            <button className="text-[#8A8A8A]" aria-label="Halaman sebelumnya">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#7EA1EF] text-[12px] font-extrabold leading-none text-white">
              1
            </button>
            <button className="text-[12px] font-extrabold text-black">2</button>
            <button className="text-[12px] font-extrabold text-black">3</button>
            <button className="text-[#8A8A8A]" aria-label="Halaman berikutnya">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
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
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center rounded-[6px] bg-[#F7FDFF] px-4 text-center shadow-[0_4px_10px_rgba(15,23,42,0.14)]">
      <p className="text-[12px] font-extrabold leading-tight text-black">{label}</p>
      <p className="mt-4 text-[20px] font-extrabold leading-none text-black">{value}</p>
    </div>
  );
}

function PatientFormModal({ title, mode, formData, onChange, onCancel, onSave }) {
  const compact = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className={`w-full rounded-[6px] bg-white ${
          compact ? "max-w-[374px] px-8 py-6" : "max-w-[780px] px-6 py-8 sm:px-10"
        }`}
      >
        <h2 className={`${compact ? "mb-4 text-[18px]" : "mb-7 text-[20px]"} font-extrabold text-black`}>
          {title}
        </h2>

        <div className={compact ? "space-y-3" : "grid gap-x-[78px] gap-y-4 md:grid-cols-2"}>
          <TextField
            label={compact ? "Nama pasien" : "Nama Lengkap"}
            value={formData.name}
            onChange={(value) => onChange({ ...formData, name: value })}
          />
          {compact ? (
            <TextField
              label="konsultasi terakhir"
              value={formData.lastConsultation}
              onChange={(value) => onChange({ ...formData, lastConsultation: value })}
            />
          ) : (
            <SelectField
              label="Status"
              value={formData.status}
              onChange={(value) => onChange({ ...formData, status: value })}
            />
          )}
          <TextField
            label="Email"
            value={formData.email}
            onChange={(value) => onChange({ ...formData, email: value })}
          />
          {!compact && (
            <TextField
              label="Konsultasi terakhir"
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
              label="Status"
              value={formData.status}
              onChange={(value) => onChange({ ...formData, status: value })}
            />
          )}
        </div>

        <div
          className={`mt-8 flex flex-col gap-4 sm:flex-row ${
            compact ? "sm:justify-center" : "sm:justify-end sm:gap-[56px]"
          }`}
        >
          <button
            onClick={onCancel}
            className="h-[36px] rounded-[6px] border border-[#5E81CC] px-12 text-[16px] font-extrabold text-[#5E81CC] transition-colors hover:bg-[#F0FBFF]"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="h-[36px] rounded-[6px] bg-[#5E81CC] px-12 text-[16px] font-extrabold text-white transition-colors hover:bg-[#4D6FB5]"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function DeletePatientModal({ patientName, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-[482px] rounded-[6px] bg-white px-8 py-9 text-center">
        <h2 className="text-[20px] font-extrabold text-black">Hapus Permanen Pasien</h2>
        <AlertTriangle className="mx-auto mt-7 h-[64px] w-[64px] text-[#F15959]" strokeWidth={1.8} />
        <p className="mt-5 text-[15px] font-extrabold text-black">
          Apakah anda yakin ingin menghapus {patientName}?
        </p>
        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row sm:gap-7">
          <button
            onClick={onCancel}
            className="h-[44px] rounded-[6px] border border-[#F15959] px-12 text-[20px] font-extrabold text-[#F15959] transition-colors hover:bg-[#FFF0F0]"
          >
            Batal
          </button>
          <button
            onClick={onDelete}
            className="h-[44px] rounded-[6px] bg-[#F15959] px-8 text-[20px] font-extrabold text-white transition-colors hover:bg-[#E24848]"
          >
            Hapus Permanen
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-extrabold text-black">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[27px] w-full rounded-[7px] border border-[#D8D8D8] bg-white px-3 text-[13px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#C8D7FF]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-extrabold text-black">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-[27px] w-full appearance-none rounded-[7px] border border-[#D8D8D8] bg-white px-3 pr-8 text-[13px] font-extrabold text-black outline-none focus:ring-2 focus:ring-[#C8D7FF]"
        >
          <option>Aktif</option>
          <option>Nonaktif</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
      </span>
    </label>
  );
}
