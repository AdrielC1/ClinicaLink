import RolePage from "@/components/RolePage";

export default function PatientNotificationsPage() {
  return (
    <RolePage
      title="Notifikasi"
      description="Pusat pemberitahuan untuk perubahan jadwal, pengingat konsultasi, dan informasi klinik."
      actions={[
        {
          title: "Pengingat appointment",
          description: "Aktifkan pengingat agar tidak melewatkan jadwal konsultasi.",
        },
      ]}
    />
  );
}
