"use client";

import RolePage from "@/components/RolePage";
import { useEffect } from "react";

export default function PatientNotificationsPage() {
  useEffect(() => {
    localStorage.setItem("notifications_read", "true");
    window.dispatchEvent(new Event("storage"));
  }, []);

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
