import RolePage from "@/components/RolePage";

export default function PatientHistoryPage() {
  return (
    <RolePage
      title="Riwayat Kunjungan"
      description="Pantau catatan kunjungan, konsultasi selesai, dan tindak lanjut dari dokter."
      actions={[
        {
          title: "Riwayat masih kosong",
          description: "Kunjungan yang selesai akan tampil di sini bersama ringkasan tindak lanjut.",
        },
      ]}
    />
  );
}
