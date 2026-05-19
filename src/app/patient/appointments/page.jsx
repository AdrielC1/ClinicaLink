import RolePage from "@/components/RolePage";

export default function PatientAppointmentsPage() {
  return (
    <RolePage
      title="Janji Temu Pasien"
      description="Lihat, buat, dan pantau status janji temu dengan dokter pilihan Anda."
      actions={[
        {
          title: "Belum ada janji temu baru",
          description: "Janji temu yang sudah dibuat akan tampil bersama status konfirmasinya.",
        },
      ]}
    />
  );
}
