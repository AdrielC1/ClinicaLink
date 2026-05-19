import RolePage from "@/components/RolePage";

export default function AdminReportsPage() {
  return (
    <RolePage
      title="Laporan Klinik"
      description="Lihat ringkasan operasional, tren appointment, dan performa layanan."
      stats={[
        { label: "Kunjungan bulan ini", value: "246", note: "Naik dari periode sebelumnya" },
        { label: "Pembatalan", value: "11", note: "Perlu evaluasi jadwal" },
        { label: "Tingkat hadir", value: "92%", note: "Appointment yang terpenuhi" },
      ]}
    />
  );
}
