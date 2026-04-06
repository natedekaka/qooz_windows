# Cara Install Qooz di Windows

## Opsi 1: Aplikasi Portable (MUDAH - RECOMMENDED)

### Cara Pakai:
1. Download folder `release/win-unpacked/` dari GitHub
2. Klik dua kali pada `Qooz.exe`
3. Aplikasi akan terbuka di browser

### Catatan:
- Aplikasi portable ini membutuhkan server API (PHP + MySQL)
- Ikuti panduan setup server di bawah

---

## Opsi 2: Menggunakan Docker Desktop

### Install Docker Desktop:
1. Download Docker Desktop dari https://www.docker.com/products/docker-desktop
2. Install dan jalankan Docker Desktop
3. Tunggu hingga status "Running"

### Jalankan Qooz:
1. Buka terminal (Command Prompt atau PowerShell)
2. Masuk ke folder project:
   ```powershell
   cd C:\path\ke\qooz_windows
   ```
3. Jalankan container:
   ```powershell
   docker-compose up -d
   ```
4. Tunggu hingga semua service running

### Cek Status:
```powershell
docker ps
```

Akan muncul 4 container:
- `qooz-web` - Frontend Next.js (port 3000)
- `qooz-api` - Backend PHP (port 8090)
- `qooz-db` - Database MariaDB (port 3306)
- `qooz-pma` - phpMyAdmin (port 8091)

---

## Opsi 3: Install Manual (XAMPP)

### Install XAMPP:
1. Download XAMPP dari https://www.apachefriends.org/
2. Pilih versi dengan PHP 8.2
3. Install seperti biasa

### Setup Database:
1. Buka XAMPP Control Panel
2. Start Apache dan MySQL
3. Buka browser, akses http://localhost/phpmyadmin
4. Buat database baru:
   - Nama: `qooz_db`
   - Collation: `utf8mb4_unicode_ci`
5. Klik tab **Import**
6. Pilih file `mysql-schema.sql`
7. Klik **Go**

### Setup API:
1. Copy folder `api/` ke `C:\xampp\htdocs\qooz\api\`
2. Edit file `C:\xampp\htdocs\qooz\api\init.php`
3. Sesuaikan konfigurasi database:
   ```php
   $host = "localhost";
   $user = "root";
   $pass = ""; // atau password XAMPP Anda
   $db   = "qooz_db";
   ```

### Setup Frontend:
1. Install Node.js dari https://nodejs.org/
2. Buka terminal:
   ```powershell
   cd C:\path\ke\qooz_windows
   npm install
   npm run build
   npm run start
   ```
3. Buka browser, akses http://localhost:3000

---

## Konfigurasi .env.local

Edit file `.env.local` untuk mengatur API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8090/qooz/api
NEXT_PUBLIC_POLL_INTERVAL=2000
NEXT_PUBLIC_GAME_TIMEOUT=30000
```

---

## Cara Pakai Qooz

### Sebagai Guru (Host)
1. Buka browser, akses **http://localhost:3000/host**
2. Login dengan:
   - Email: `guru@test.com`
   - Password: `guru123`
3. Klik **"+ Buat Kuis Baru"**
4. Isi judul kuis dan tambahkan soal
5. Klik **"Mulai Kuis"**
6. Berikan **Game PIN** ke siswa

### Sebagai Siswa (Player)
1. Buka browser di HP/laptop
2. Akses **http://[IP-KOMPUTER]:3000/play**
3. Masukkan **Game PIN** dari guru
4. Masukkan nama dan klik **"Gabung"**

---

## Troubleshooting

### Port 3000 sudah terpakai?
```powershell
netstat -ano | findstr :3000
taskkill /PID [NOMOR-PID] /F
```

### Docker tidak bisa start?
- Pastikan Virtualization enabled di BIOS
- Restart Docker Desktop

### Tidak bisa akses dari HP?
- Pastikan firewall mengizinkan akses
- Cek IP komputer: `ipconfig`
- Gunakan IP lokal, bukan localhost
