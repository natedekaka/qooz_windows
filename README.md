# 🎯 Qooz

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-8B5CF6?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Built%20with-Next.js-000000?style=for-the-badge" alt="Next.js">
  <img src="https://img.shields.io/badge/Backend-PHP%208.2-777BB4?style=for-the-badge" alt="PHP">
</p>

> **Kuis Interaktif Real-Time** - Buat pengalaman belajar jadi lebih seru!

Qooz adalah platform kuis real-time yang memungkinkan guru membuat dan mengelola kuis sementara siswa bisa menjawab langsung melalui HP atau laptop mereka. Terinspirasi dari Quizizz, tapi lebih simpel dan bisa dijalankan di mana saja! 🚀

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
|-------|-----------|
| 🎮 **Real-Time** | Siswa menjawab dan skor langsung tampil |
| 📱 **Multi-Device** | Host di laptop, player di HP |
| ⚡ **Fast Response** | Skor berdasarkan kecepatan jawaban |
| 🎨 **Modern UI** | Tampilan menarik dan responsif |
| 🔒 **Anti-Duplicate** | Nama player tidak bisa sama |
| 📊 **Live Chart** | Grafik jawaban tampil langsung |
| 🔧 **Easy Install** | Install dalam hitungan menit |

---

## 🚀 Quick Start - Windows

### Opsi 1: Aplikasi Portable (MUDAH)

1. Download folder `release/win-unpacked/` dari GitHub
2. Klik dua kali `Qooz.exe`
3. Selesai! Aplikasi langsung terbuka di browser

> ⚠️ **Catatan**: Aplikasi membutuhkan server API. Gunakan Opsi A atau B di bawah.

### Opsi 2: Menggunakan Docker Desktop

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Buka terminal Command Prompt/PowerShell di folder project
3. Jalankan:
   ```powershell
   docker-compose up -d
   ```

### Opsi 3: Install Manual (XAMPP)

1. Install [XAMPP](https://www.apachefriends.org/) (pilih versi PHP 8.2)
2. Copy folder `api/` ke `C:\xampp\htdocs\qooz\api\`
3. Buka phpMyAdmin (`http://localhost/phpmyadmin`)
4. Buat database `qooz_db`
5. Import file `mysql-schema.sql`
6. Edit `.env.local` sesuai konfigurasi

### Akses Aplikasi

| Service | URL |
|---------|-----|
| 🌐 **Web App** | http://localhost:3000 |
| 🔌 **API** | http://localhost:8090/qooz/api |
| 🗄️ **Database** | http://localhost:8091 (phpMyAdmin) |

---

## 🚀 Quick Start - Linux

```bash
# Clone repository
git clone https://github.com/natedekaka/qooz.git
cd qooz

# Install dependencies
npm install

# Start semua service
./install.sh start
```

### Akses dari HP

Buka browser di HP, ketik IP laptop + port:
```
http://[IP-LAPTOP]:3000
```

Cek IP laptop dengan perintah: `hostname -I` atau `ip addr`

> 💡 Pastikan HP dan laptop terhubung ke jaringan WiFi yang sama!

---

## 📖 Cara Penggunaan

### Untuk Guru (Host)

1. Buka **http://localhost:3000/host**
2. Login atau daftar akun
3. Klik **"+ Buat Kuis Baru"**
4. Tambahkan pertanyaan (soal pilihan ganda)
5. Klik **"Mulai Kuis"**
6. Berikan **Game PIN** ke siswa
7. Klik **"Akhiri & Hitung Skor"** setiap selesai soal
8. Lihat hasilnya dan continue ke soal berikutnya!

### Untuk Siswa (Player)

1. Buka browser di HP: **http://192.168.x.x:3000**
2. Pilih **"Tampilan Siswa"**
3. Masukkan **Game PIN** dari guru
4. Masukkan nama kamu
5. Klik **"Gabung"**
6. Tunggu guru memulai kuis
7. Jawab pertanyaan dengan cepat untuk dapat skor tinggi!

---

## 🎯 Sistem Skor

| Jawaban | Poin | Penjelasan |
|---------|------|------------|
| ✅ Benar (Cepat) | ~1000 | Jawaban benar dengan waktu singkat |
| ✅ Benar (Lambat) | ~500 | Jawaban benar tapi lambat |
| ❌ Salah | 0 | Jawaban salah |

> 💡 Semakin cepat menjawab dengan benar, semakin tinggi skor!

---

## 🛠️ Commands

```bash
./install.sh start    # Start semua service
./install.sh install  # Install dependencies + start API
./install.sh api      # Start API & DB saja
./install.sh web      # Start web server saja
./install.sh stop     # Stop semua service
./install.sh status   # Cek status
```

---

## 🏗️ Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/PHP-8.2-777BB4?style=flat-square&logo=php" alt="PHP">
  <img src="https://img.shields.io/badge/MariaDB-10.11-003545?style=flat-square&logo=mariadb" alt="MariaDB">
  <img src="https://img.shields.io/badge/Docker-Podman-2496ED?style=flat-square&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Hyprland-Wayland-3D5AFE?style=flat-square" alt="Wayland">
</p>

---

## 🔧 Troubleshooting

### Windows

**Container tidak jalan?**
```powershell
docker-compose down
docker-compose up -d --build
docker logs qooz-api
```

**Port sudah terpakai?**
```powershell
# Cari proses yang pakai port
netstat -ano | findstr :3000

# Stop proses
taskkill /PID [NOMOR-PID] /F
```

**XAMPP tidak bisa start Apache?**
- Buka XAMPP Control Panel
- Klik config pada Apache
- Edit `httpd.conf`, ubah port jika diperlukan

### Linux

**HP tidak bisa akses?**
```bash
# Cek IP laptop
hostname -I

# Disable firewall sementara (Linux)
sudo ufw disable

# Atau allow port:
sudo ufw allow 3000/tcp
sudo ufw allow 8090/tcp
```

**Container tidak jalan?**
```bash
podman compose down
podman compose up -d --build
podman logs qooz-api
```

**Port sudah terpakai?**
```bash
pkill -f "next dev"
podman compose restart
```

---

## 📝 Requirements

### Windows

| Software | Versi Minimal |
|----------|--------------|
| Windows | 10/11 |
| Docker Desktop | Latest |
| ATAU XAMPP | PHP 8.2 |
| RAM | 2GB |
| Storage | 1GB |

### Linux

| Software | Versi Minimal |
|----------|--------------|
| Node.js | 20+ |
| npm | 10+ |
| Podman/Docker | Latest |
| RAM | 2GB |
| Storage | 1GB |

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

---

## 📜 License

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

---

## 👨‍💻 Dibuat dengan ❤️ oleh

**Natedekaka** - 2026

<p align="center">
  <img src="https://img.shields.io/badge/Powered%20by-Omarchy-8B5CF6?style=for-the-badge" alt="Omarchy">
</p>

---

<p align="center">
  <strong>⭐ Jika Qooz bermanfaat, jangan lupa kasih star di GitHub!</strong>
</p>
