import AppSidebarLayout from "@/components/AppSidebarLayout";

export default function AdminLayout({ children }) {
  return <AppSidebarLayout role="admin">{children}</AppSidebarLayout>;
}
