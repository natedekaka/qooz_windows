# Cara Install Qooz di Windows

## Opsi 1: Aplikasi Portable (Tanpa Install)

### Cara Pakai:
1. Buka folder `release/win-unpacked/`
2. Klik dua kali pada `Qooz.exe`
3. Aplikasi akan terbuka di browser

### Catatan:
- Aplikasi portable ini membutuhkan server API eksternal (PHP + MySQL)
- Untuk menjalankan server, gunakan Docker atau install manual

---

## Opsi 2: Build Installer (Membutuhkan Wine)

Jika ingin membuat installer `.exe`, install wine terlebih dahulu:

```bash
# Install wine di Linux
sudo apt install wine

# Build installer
npm run electron:dist
```

Installer akan berada di `release/`

---

## Setup Server (Diperlukan)

Aplikasi Qooz membutuhkan backend API. Berikut opsinya:

### Opsi A: Menggunakan Docker (Recommended)

1. Install Docker Desktop for Windows
2. Buka terminal di folder `qooz_windows`
3. Jalankan:
   ```bash
   docker-compose -f podman-compose-qooz.yml up -d
   ```

### Opsi B: Install Manual (XAMPP)

1. Install XAMPP dari https://www.apachefriends.org/
2. Copy folder `api/` ke `C:\xampp\htdocs\qooz\api\`
3. Import `mysql-schema.sql` ke MySQL
4. Edit `.env.local` sesuai konfigurasi

---

## Konfigurasi

Edit file `.env.local` untuk mengatur API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8090/qooz/api
NEXT_PUBLIC_POLL_INTERVAL=2000
NEXT_PUBLIC_GAME_TIMEOUT=30000
```

---

## Cara Pakai Qooz

### Sebagai Guru (Host)
1. Buka aplikasi Qooz
2. Buka halaman **http://localhost:3000/host**
3. Login dengan: `guru@test.com` / `guru123`
4. Buat kuis baru
5. Mulai kuis dan berikan PIN ke siswa

### Sebagai Siswa (Player)
1. Buka aplikasi Qooz di HP/laptop
2. Buka **http://localhost:3000/play**
3. Masukkan PIN dari guru
4. Masukkan nama dan klik "Gabung"
