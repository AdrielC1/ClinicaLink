import RolePage from "@/components/RolePage";

export default function AdminAppointmentsPage() {
  return (
    <RolePage
      title="Manajemen Janji Temu"
      description="Kelola appointment pasien, status konfirmasi, dan perubahan jadwal klinik."
      actions={[
        {
          title: "Daftar appointment",
          description: "Appointment pasien akan tampil dengan status konfirmasi dan jadwal praktik terkait.",
        },
      ]}
    />
  );
}
