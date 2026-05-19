const scheduledPatients = [
  {
    name: "Anderson Wijaya",
    appointment: "Hari ini, 09.30",
    clinic: "Poli Umum",
    status: "Menunggu konsultasi",
    statusStyle: "bg-amber-50 text-amber-700 border-amber-200",
    note: "Keluhan demam ringan dan nyeri tenggorokan sejak dua hari terakhir.",
  },
  {
    name: "Maya Putri",
    appointment: "Hari ini, 10.15",
    clinic: "Poli Umum",
    status: "Terjadwal",
    statusStyle: "bg-blue-50 text-blue-700 border-blue-200",
    note: "Kontrol tekanan darah. Bawa hasil pemeriksaan laboratorium terakhir.",
  },
  {
    name: "Rizky Pratama",
    appointment: "Hari ini, 11.00",
    clinic: "Poli Anak",
    status: "Selesai",
    statusStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    note: "Konsultasi selesai. Disarankan kontrol ulang dalam tujuh hari.",
  },
  {
    name: "Siti Rahma",
    appointment: "Besok, 08.45",
    clinic: "Poli Umum",
    status: "Konfirmasi ulang",
    statusStyle: "bg-rose-50 text-rose-700 border-rose-200",
    note: "Pasien meminta perubahan jam jika ada slot kosong setelah pukul 13.00.",
  },
];

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-600">ClinicaLink</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Pasien Dokter
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Lihat pasien yang terjadwal, status konsultasi, dan catatan kunjungan
          sebelum atau sesudah pemeriksaan.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Aktivitas Pasien Terjadwal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pasien terjadwal tampil bersama status konsultasi dan catatan kunjungan.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {scheduledPatients.length} pasien
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[1.2fr_1fr_0.9fr_1.6fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Pasien</span>
            <span>Jadwal</span>
            <span>Status</span>
            <span>Catatan Kunjungan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {scheduledPatients.map((patient) => (
              <article
                key={`${patient.name}-${patient.appointment}`}
                className="grid gap-4 px-4 py-4 md:grid-cols-[1.2fr_1fr_0.9fr_1.6fr] md:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">{patient.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{patient.clinic}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                    Jadwal
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 md:mt-0">
                    {patient.appointment}
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${patient.statusStyle}`}
                  >
                    {patient.status}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{patient.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
