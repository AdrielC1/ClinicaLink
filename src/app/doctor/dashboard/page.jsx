import RolePage from "@/components/RolePage";

export default function DoctorDashboardPage() {
  return (
    <RolePage
      title="Dashboard Dokter"
      description="Ringkasan jadwal praktik, pasien hari ini, dan tugas konsultasi dokter."
      stats={[
        { label: "Pasien hari ini", value: "8", note: "Menunggu konsultasi" },
        { label: "Janji selesai", value: "4", note: "Sudah ditangani" },
        { label: "Catatan tertunda", value: "2", note: "Perlu dilengkapi" },
      ]}
    />
  );
}
