# Qooz - Kuis Interaktif Real-time

Qooz adalah aplikasi kuis interaktif mirip Kahoot untuk pembelajaran di kelas. Guru membuat kuis dan siswa menjawab melalui HP/laptop secara real-time dengan koneksi lokal (tanpa internet).

## Fitur

- Buat kuis dengan pertanyaan pilihan ganda
- Game PIN untuk siswa join
- Skor berdasarkan kecepatan jawaban
- Leaderboard real-time
- Kapasitas tinggi ( hingga 48+ siswa sekalian)
- Cocok untuk pembelajaran di kelas tanpa internet

---

# Cara Install di Server Debian

## Opsi 1: Menggunakan Docker/Podman (Disarankan)

### 1.1 Install Docker

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable dan start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Test Docker
sudo docker --version
```

**Catatan**: Jika menggunakan Podman (bukan Docker), lewati langkah di atas dan langsung install podman-compose:
```bash
sudo apt install -y podman podman-compose
```

### 1.2 Clone Repository

```bash
# Clone project
git clone https://github.com/natedekaka/qooz.git
cd qooz
```

### 1.3 Jalankan Aplikasi

```bash
# Gunakan config khusus qooz
podman-compose -f podman-compose-qooz.yml up -d

# Atau jika pakai Docker biasa
docker-compose -f podman-compose-qooz.yml up -d
```

### 1.4 Cek Status

```bash
# Lihat container yang running
podman ps

# Atau
docker ps
```

Jika berhasil, akan ada 4 container:
- `qooz-web` - Frontend Next.js (port 3000)
- `qooz-api` - Backend PHP (port 8090)
- `qooz-db` - Database MariaDB (port 3306)
- `qooz-pma` - phpMyAdmin (port 8091)

### 1.5 Setup Database via phpMyAdmin

1. Buka browser, akses: **http://localhost:8091**
2. Login:
   - Username: `root`
   - Password: `qooz_root_pass` (sesuai di config)
3. Buat database:
   - Klik "New Database"
   - Nama: `qooz_db`
   - Collation: `utf8mb4_unicode_ci`
   - Klik "Create"
4. Import schema:
   - Klik database `qooz_db`
   - Pilih tab **Import**
   - Pilih file: `src/qooz/mysql-schema.sql`
   - Klik "Go"

### 1.6 Konfigurasi dan Akses

#### Cari IP Server
```bash
ip addr show | grep "inet "
```

Contoh output: `inet 192.168.1.100/24`

#### Edit Konfigurasi API
```bash
nano src/qooz/.env.local
```

Ubah sesuai IP server:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8090/qooz/api
NEXT_PUBLIC_POLL_INTERVAL=2000
NEXT_PUBLIC_GAME_TIMEOUT=30000
```

#### Buka Port Firewall
```bash
# Jika menggunakan ufw
sudo ufw allow 3000/tcp
sudo ufw allow 8090/tcp
sudo ufw allow 8091/tcp
sudo ufw reload

# Cek status
sudo ufw status
```

---

## Opsi 2: Install Langsung di Debian (Tanpa Docker)

### 2.1 Install PHP, MariaDB, dan Nginx

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install PHP
sudo apt install -y php php-fpm php-mysql php-curl php-gd php-mbstring php-xml php-zip

# Install MariaDB
sudo apt install -y mariadb-server mariadb-client

# Install Nginx
sudo apt install -y nginx

# Install Node.js untuk Next.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git
```

### 2.2 Konfigurasi MariaDB

```bash
# Start MariaDB
sudo systemctl enable mariadb
sudo systemctl start mariadb

# Aman kan instalasi
sudo mysql_secure_installation

# Login ke MariaDB
sudo mysql -u root -p
```

Buat database dan user:
```sql
CREATE DATABASE qooz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qooz_user'@'localhost' IDENTIFIED BY 'qooz_pass_2024';
GRANT ALL PRIVILEGES ON qooz_db.* TO 'qooz_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import schema:
```bash
mysql -u qooz_user -p qooz_db < /path/to/my-php-app/src/qooz/mysql-schema.sql
```

### 2.3 Konfigurasi PHP-FPM

```bash
# Edit php-fpm pool
sudo nano /etc/php/8.2/fpm/pool.d/www.conf
```

Cari dan ubah:
```ini
listen = /run/php/php8.2-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.2-fpm
```

### 2.4 Konfigurasi Nginx

```bash
# Buat config untuk qooz
sudo nano /etc/nginx/sites-available/qooz
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name _;

    # Frontend Next.js (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend PHP API
    location /qooz/api/ {
        alias /var/www/html/qooz/api/;
        try_files $uri $uri/ /qooz/api/index.php?$query_string;
        
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location /qooz/ {
        alias /var/www/html/qooz/;
        try_files $uri $uri/ /qooz/index.html;
    }
}
```

Aktifkan config:
```bash
sudo ln -s /etc/nginx/sites-available/qooz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2.5 Setup Next.js

```bash
# Copy folder qooz ke /var/www
sudo cp -r /path/to/my-php-app/src/qooz /var/www/html/

# Install dependencies
cd /var/www/html/qooz
npm install

# Build Next.js
npm run build

# Jalankan Next.js
npm run start
```

Atau jalankan di background dengan PM2:
```bash
# Install PM2
sudo npm install -g pm2

# Jalankan Next.js
cd /var/www/html/qooz
pm2 start npm --name "qooz" -- start

# Setup auto-start
pm2 startup
pm2 save
```

### 2.6 Konfigurasi API

```bash
# Edit .env.local
sudo nano /var/www/html/qooz/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://192.168.1.100/qooz/api
NEXT_PUBLIC_POLL_INTERVAL=2000
NEXT_PUBLIC_GAME_TIMEOUT=30000
```

Ganti `192.168.1.100` dengan IP server Anda.

### 2.7 Buka Port Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
sudo ufw reload
```

---

# Cara Akses Aplikasi

## Dari Komputer Guru

Buka browser dan akses:
- **http://localhost:3000** (jika di server sama)
- **http://192.168.x.x:3000** (dari komputer lain di jaringan)

## Dari HP Siswa

Siswa buka browser dan akses:
- **http://192.168.x.x:3000/play**
- Masukkan Game PIN dari guru
- Masukkan nama
- Klik "Gabung"

---

# Cara Pakai

##Sebagai Guru (Host)

1. Buka **http://192.168.x.x:3000/host**
2. Login dengan akun guru:
   - Email: `guru@test.com`
   - Password: `guru123`
3. Klik **"+ Buat Kuis Baru"**
4. Isi:
   - Judul kuis
   - Deskripsi (opsional)
5. Klik **"+ Tambah Soal"**
6. Isi pertanyaan:
   - Teks soal
   - Opsi A, B, C, D
   - Jawaban benar (1=A, 2=B, 3=C, 4=D)
   - Waktu per soal (detik)
7. Klik **"Simpan"**
8. Ulangi untuk soal lainnya
9. Klik **"Mulai Kuis"**
10. Berikan **Game PIN** ke siswa
11. Klik **"Akhiri Setiap Soal"** setelah waktu habis untuk hitung skor
12. Klik **"Soal Berikutnya"** untuk lanjut
13. Selesai, klik **"Selesai"** untuk lihat podium

## Sebagai Siswa (Player)

1. Buka **http://192.168.x.x:3000/play** dari HP/laptop
2. Masukkan **Game PIN** dari guru
3. Masukkan **nama** kamu
4. Klik **"Gabung"**
5. Tunggu guru memulai kuis
6. Saat soal muncul, klik jawaban (A/B/C/D)
7. Lihat hasil: "BENAR!" atau "SALAH!"
8. Tunggu soal berikutnya
9. Selesai, lihat skor dan peringkat

---

# Mengelola Server

## Restart Services

```bash
# Jika menggunakan Docker
docker-compose -f podman-compose-qooz.yml restart

# Jika install langsung
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mariadb
pm2 restart qooz
```

## Backup Database

```bash
# Backup
mysqldump -u qooz_user -p qooz_db > backup_qooz_$(date +%Y%m%d).sql

# Restore
mysql -u qooz_user -p qooz_db < backup_qooz_20240101.sql
```

## Logs

```bash
# Docker logs
docker logs qooz-web
docker logs qooz-api
docker logs qooz-db

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs qooz
```

---

# Troubleshooting

## Error "Connection Refused"

1. Cek apakah container/service running:
   ```bash
   podman ps
   ```

2. Cek port sudah benar:
   ```bash
   ss -tlnp | grep -E '3000|8090|3306'
   ```

## Tidak Bisa Akses dari HP

1. Pastikan IP di `.env.local` sesuai IP server:
   ```bash
   ip addr show
   ```

2. Buka firewall:
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 8090/tcp
   sudo ufw reload
   ```

## Skor Selalu 0

1. Pastikan klik **"Akhiri Setiap Soal"** setelah waktu habis
2. Cek database `qooz_db` sudah diimport
3. Cek di phpMyAdmin - tabel `answers` harus ada data

## Port 3000 Sudah Dipakai

```bash
# Cari proses yang pakai port 3000
sudo lsof -i :3000

# Kill proses
sudo kill -9 <PID>
```

## Buat User Guru Baru

Via phpMyAdmin:
1. Buka **http://server:8091**
2. Login: root / qooz_root_pass
3. Klik database `qooz_db`
4. Klik tabel `users`
5. Klik tab **Insert**
6. Isi:
   - `id`: (biarkan kosong)
   - `email`: `guru@sekolah.sch.id`
   - `password_hash`: `$2y$12$...` (hash dari password yang diinginkan)
   - `nama_lengkap`: `Budi Guru`
7. Klik **Go**

Untuk生成 password hash, bisa pakai PHP:
```php
<?php
echo password_hash('password_baru', PASSWORD_DEFAULT);
?>
```

---

# Specifikasi Server Minimum

| Jumlah Siswa | CPU | RAM | Penyimpanan |
|--------------|-----|-----|--------------|
| 10-20 | 1 core | 1 GB | 10 GB |
| 30-50 | 2 core | 2 GB | 20 GB |
| 50+ | 4 core | 4 GB | 40 GB |

---

# Struktur Project

```
my-php-app/
├── podman-compose-qooz.yml    # Config Docker/Podman
├── src/qooz/
│   ├── api/                  # Backend PHP
│   │   ├── auth/             # Login/register
│   │   ├── game/             # Game logic
│   │   ├── player/           # Player actions
│   │   └── quiz/             # Quiz management
│   ├── src/app/              # Frontend Next.js
│   │   ├── host/             # Halaman guru
│   │   └── play/             # Halaman siswa
│   ├── mysql-schema.sql      # Database schema
│   ├── package.json          # Dependencies
│   └── .env.local            # Konfigurasi
└── docs/
    └── QOOZ-INSTALL.md        # Dokumen ini
```

---

# Credit

- Frontend: Next.js 16 + React 19 + TailwindCSS
- Backend: PHP 8.2 + MySQL/MariaDB
- Container: Podman/Docker
- Inspiration: Kahoot
