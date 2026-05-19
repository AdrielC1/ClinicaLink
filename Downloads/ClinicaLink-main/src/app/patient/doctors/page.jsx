import RolePage from "@/components/RolePage";

export default function PatientDoctorsPage() {
  return (
    <RolePage
      title="Daftar Dokter"
      description="Temukan dokter berdasarkan spesialisasi, jadwal praktik, dan ketersediaan konsultasi."
      stats={[
        { label: "Dokter umum", value: "5", note: "Praktik minggu ini" },
        { label: "Spesialis", value: "7", note: "Tersedia untuk reservasi" },
        { label: "Poli aktif", value: "4", note: "Menerima pasien baru" },
      ]}
    />
  );
}
