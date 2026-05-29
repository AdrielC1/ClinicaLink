# ClinicaLink Database Schema

This document outlines the PostgreSQL schema managed via Supabase.

## Custom Enums
* `user_role`: 'patient', 'doctor', 'admin'
* `appointment_status`: 'Menunggu', 'Check-in', 'Sedang Berlangsung', 'Selesai', 'Dibatalkan'

## Core Tables
### 1. `users`
* `id` (uuid, PK)
* `email` (varchar, UNIQUE)
* `full_name` (varchar)
* `role` (user_role)
* `created_at`, `deleted_at` (timestamptz)

### 2. `patients`
* `id` (uuid, PK) -> FK to `users.id`
* `phone_number` (varchar), `address` (text), `date_of_birth` (date)

### 3. `doctors`
* `id` (uuid, PK) -> FK to `users.id`
* `specialization_id` (int4) -> FK to `specializations.id`
* `bio` (text), `inactive_from` (date, nullable) — NULL = aktif, berisi tanggal = nonaktif mulai tanggal tsb

### 4. `specializations`
* `id` (int4, PK), `name` (varchar), `description` (text)

## Scheduling & Transactions
### 5. `doctor_schedules` (Weekly Refresh Versioning)
* `id` (int4, PK)
* `doctor_id` (uuid) -> FK to `doctors.id`
* `day_of_week` (int4, 0-6, where 0=Minggu, 1=Senin, ..., 6=Sabtu)
* `start_time`, `end_time` (time)
* `slot_duration_minutes` (int4, default: 30)
* `room_number` (varchar, nullable)
* `effective_from` (date, nullable) — Jadwal mulai berlaku. Untuk jadwal baru yang ditambahkan Admin, diset ke Senin minggu depan.
* `effective_until` (date, nullable) — Jadwal berakhir. NULL berarti aktif tanpa batas. Jika Admin "menghapus" jadwal, sistem HANYA mengisi kolom ini dengan hari Minggu pada minggu berjalan (23:59:59), sehingga jadwal tetap bisa diakses pasien yang sudah booking sampai hari Minggu tersebut.

**⚠️ PENTING - Mekanisme "Weekly Refresh":**
- **TIDAK ADA soft delete (`deleted_at`) pada tabel ini.** Penghapusan jadwal dilakukan dengan meng-update `effective_until` = akhir Minggu minggu berjalan.
- **Unique constraint `doctor_schedules_doctor_id_day_of_week_start_time_key` sudah DIHAPUS** untuk mendukung data historis (baris lama yang expired dan baris baru yang aktif boleh memiliki kombinasi `doctor_id + day_of_week + start_time` yang sama).
- **Jadwal "aktif"** = `effective_until IS NULL` ATAU `effective_until > today`. Gunakan filter ini pada semua query read.
- **Jadwal baru** selalu di-insert dengan `effective_from = Senin minggu depan` dan `effective_until = NULL`.

### 6. `appointments` (Crucial Table)
* `id` (uuid, PK)
* `patient_id` (uuid), `doctor_id` (uuid), `schedule_id` (int4)
* `appointment_date` (date)
* `start_time`, `end_time` (time)
* `status` (appointment_status, default 'Menunggu')
* `patient_complaints`, `medical_notes`, `cancellation_reason` (text, nullable)
* **CONSTRAINT `unique_doctor_slot`**: UNIQUE(`doctor_id`, `appointment_date`, `start_time`) -> Prevents double-booking.

### 7. `notifications`
* `id` (int4, PK), `user_id` (uuid), `title` (varchar), `message` (text)
* `is_read` (boolean, default false)