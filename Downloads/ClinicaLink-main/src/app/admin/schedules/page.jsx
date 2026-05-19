import RolePage from "@/components/RolePage";

export default function AdminSchedulesPage() {
  return (
    <RolePage
      title="Manajemen Jadwal"
      description="Atur jadwal praktik dokter dan slot appointment yang tersedia bagi pasien."
      actions={[
        {
          title: "Jadwal praktik",
          description: "Slot praktik dokter dapat dipantau berdasarkan hari, poli, dan ketersediaan.",
        },
      ]}
    />
  );
}
