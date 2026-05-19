import RolePage from "@/components/RolePage";

export default function AdminPatientsPage() {
  return (
    <RolePage
      title="Manajemen Pasien"
      description="Pantau data pasien terdaftar dan aktivitas appointment di ClinicaLink."
      actions={[
        {
          title: "Direktori pasien",
          description: "Data pasien terdaftar akan tampil bersama ringkasan aktivitas appointment.",
        },
      ]}
    />
  );
}
