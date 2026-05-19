import RolePage from "@/components/RolePage";

export default function AdminDoctorsPage() {
  return (
    <RolePage
      title="Manajemen Dokter"
      description="Kelola data dokter, spesialisasi, jadwal praktik, dan status ketersediaan."
      actions={[
        {
          title: "Direktori dokter",
          description: "Data dokter dapat dikelola berdasarkan spesialisasi dan jadwal praktik.",
        },
      ]}
    />
  );
}
