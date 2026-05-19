import AppSidebarLayout from "@/components/AppSidebarLayout";

export default function PatientLayout({ children }) {
  return <AppSidebarLayout role="patient">{children}</AppSidebarLayout>;
}
