import RolePage from "@/components/RolePage";

export default function PatientDashboardPage() {
  return (
    <RolePage
      title="Dashboard Pasien"
      description="Ringkasan akun pasien, jadwal konsultasi, dan informasi penting untuk kunjungan berikutnya."
      stats={[
        { label: "Janji temu aktif", value: "2", note: "Termasuk konsultasi mendatang" },
        { label: "Dokter tersedia", value: "12", note: "Siap menerima reservasi" },
        { label: "Notifikasi baru", value: "3", note: "Perlu ditinjau hari ini" },
      ]}
      actions={[
        {
          title: "Konsultasi berikutnya",
          description: "Dr. Andi Saputra, Poli Umum, pukul 09.30.",
        },
        {
          title: "Lengkapi profil",
          description: "Pastikan nomor telepon dan data kontak darurat sudah benar.",
        },
      ]}
    />
  );
}
