import RolePage from "@/components/RolePage";

export default function AdminDashboardPage() {
  return (
    <RolePage
      title="Dashboard Admin"
      description="Pantau aktivitas klinik, data pengguna, jadwal, dan laporan operasional."
      stats={[
        { label: "Pengguna aktif", value: "128", note: "Pasien, dokter, dan admin" },
        { label: "Appointment", value: "34", note: "Terjadwal minggu ini" },
        { label: "Dokter aktif", value: "12", note: "Memiliki jadwal praktik" },
      ]}
    />
  );
}
