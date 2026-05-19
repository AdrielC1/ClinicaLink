import AppSidebarLayout from "@/components/AppSidebarLayout";

export default function DoctorLayout({ children }) {
  return <AppSidebarLayout role="doctor">{children}</AppSidebarLayout>;
}
