# 🏥 ClinicaLink

ClinicaLink adalah sistem manajemen janji temu klinik berbasis web yang dirancang untuk mendigitalkan proses pendaftaran pasien. Sistem ini meminimalisasi penumpukan pasien di ruang tunggu dan secara mutlak mencegah bentrok jadwal dokter (*double-booking*) melalui arsitektur penjadwalan cerdas berbasis *Time-Slot*.

## 🚀 Fitur Utama

Sistem ini melayani 3 aktor utama dengan fungsionalitas yang terisolasi berdasarkan peran (Role-Based Access Control):

* **👨‍⚕️ Pasien:** Reservasi mandiri secara *real-time*, memantau jadwal aktif, membatalkan (*reschedule*), dan meninjau riwayat medis.
* **🩺 Dokter:** Memantau daftar pasien harian, memulai sesi konsultasi, dan menginput catatan medis (*medical notes*).
* **⚙️ Admin:** Mengelola *master data* (Dokter, Jadwal, Pasien), menjadwalkan penonaktifan dokter dengan *Bulk Resolution* otomatis (membatalkan janji terdampak & notifikasi pasien), serta memantau statistik operasional klinik.

## 🧠 Automated Background Job (Database-Driven)
Aplikasi ini menggunakan kombinasi pemicu manual dari dokter dan penjadwalan database (via `pg_cron` setiap 15 menit) untuk mengelola antrean secara efisien:
* **Batal Otomatis (No-Show):** Scheduler database mendeteksi jam janji temu yang terlewati dan status masih "Menunggu", kemudian secara otomatis mengubah statusnya menjadi "Dibatalkan".
* **Sesi Interaktif:** Dokter memegang kendali penuh untuk memulai sesi dengan menekan tombol "Mulai", yang mengubah status langsung menjadi "Sedang Berlangsung" di database.
* **Menunggu Catatan Dokter (Virtual State):** Hanya untuk indikator visual di UI, jika sesi telah melewati `end_time` namun dokter belum mengisi catatan medis, sistem frontend menampilkan peringatan agar dokter segera melengkapi data.
* **Selesai Paksa (4-Hour Rule):** Cron job database mengeksekusi perpindahan status otomatis dari "Sedang Berlangsung" menjadi "Selesai" jika waktu telah melebihi 4 jam dari waktu selesai, menjaga kebersihan data dan performa aplikasi.

## 🗓️ Smart Schedule "Weekly Refresh" Mechanism
Perubahan dan penghapusan jadwal dokter menggunakan mekanisme berbasis waktu (*time-versioning*) alih-alih penghapusan langsung:
* **Tambah Jadwal Baru:** Jadwal yang baru ditambahkan Admin **TIDAK langsung aktif**. Jadwal baru di-insert dengan `effective_from = Senin minggu depan`, sehingga pasien dapat terus memesan slot di minggu berjalan tanpa gangguan.
* **Hapus Jadwal:** Menghapus jadwal **TIDAK** menghapus baris dari database. Sistem hanya meng-update `effective_until` menjadi hari Minggu di minggu berjalan. Jadwal tetap tersedia untuk booking pasien hingga hari Minggu, dan otomatis tidak muncul mulai hari Senin berikutnya.
* **Tabel `doctor_schedules`** menggunakan kolom `effective_from` dan `effective_until` untuk versioning, dan **tidak menggunakan `deleted_at`**.

## 🛠️ Tech Stack
* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
* **Backend & API:** Next.js Server Actions
* **Database & Auth:** Supabase (PostgreSQL)
* **Deployment:** Vercel

## 👥 Tim Pengembang (Kelompok 1)
- Aisyah Apriliani Putri
- Adriel Christofer Widya
- Cornelius Fransinatra Wijaya
- Muhammad Zero One Tauhida
- Yunita Dwi Ardilasari

---
*Proyek ini dikembangkan sebagai pemenuhan tugas Rekayasa Perangkat Lunak (Deliverable D3/D4) di Universitas Diponegoro.*