'use client'

import Link from 'next/link'

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-950 p-4 md:p-8 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Tutorial Qooz</h1>
          <Link href="/" className="text-white underline hover:text-purple-200">
            ← Kembali
          </Link>
        </div>

        <div className="space-y-6">
          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🚀 Cara Menjalankan Qooz</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-purple-700">Langkah 1: Jalankan Perintah</h3>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm mt-2">
{`# Buka terminal, ketik:
qooz start

# Atau jika pertama kali:
./install.sh start`}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-purple-700">Langkah 2: Akses Aplikasi</h3>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong>Di Laptop:</strong> http://localhost:3000</li>
                  <li><strong>Di HP:</strong> http://[IP-LAPTOP]:3000</li>
                  <li className="text-sm text-gray-500">Cek IP laptop dengan perintah: <code className="bg-gray-100 px-1">hostname -I</code> atau <code className="bg-gray-100 px-1">ip addr</code></li>
                  <li className="text-sm text-gray-500">Pastikan HP & laptop satu jaringan WiFi yang sama</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Apa itu Qooz?</h2>
            <p className="text-gray-600">
              Qooz adalah aplikasi kuis interaktif terinspirasi dari Quizizz untuk pembelajaran di kelas. 
              Guru membuat kuis dan siswa menjawab melalui HP/laptop secara real-time.
            </p>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">📺 Cara Jadi Guru (Host)</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">1.</span>
                <span>Buka <Link href="/host" className="text-purple-600 underline">http://localhost:3000/host</Link> di browser</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">2.</span>
                <span>Login dengan email & password (hubungi admin untuk akun)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">3.</span>
                <span>Klik <strong>&quot;+ Buat Kuis Baru&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">4.</span>
                <span>Masukkan judul kuis (contoh: &quot;Kuis IPA Kelas 5&quot;)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">5.</span>
                <span>Klik <strong>&quot;+ Tambah Soal&quot;</strong> untuk menambah pertanyaan</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">6.</span>
                <span>Isi pertanyaan dan pilihan jawaban (A, B, C, D)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">7.</span>
                <span>Pilih jawaban yang benar</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">8.</span>
                <span>Tentukan waktu per soal (dalam detik)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">9.</span>
                <span>Klik <strong>&quot;Simpan&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">10.</span>
                <span>Klik <strong>&quot;Mulai Kuis&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">11.</span>
                <span>Berikan <strong>Game PIN</strong> kepada siswa</span>
              </li>
            </ol>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">📱 Cara Jadi Siswa (Player)</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Pastikan HP terhubung ke WiFi yang sama dengan laptop server</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Buka browser di HP, ketik: <strong>http://[IP-LAPTOP]:3000</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Klik <strong>&quot;Tampilan Siswa&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Masukkan <strong>Game PIN</strong> dari guru</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">5.</span>
                <span>Masukkan nama kamu</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">6.</span>
                <span>Klik <strong>&quot;Gabung&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">7.</span>
                <span>Tunggu guru memulai kuis</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">8.</span>
                <span>Klik salah satu opsi (A/B/C/D) untuk menjawab</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">9.</span>
                <span>Lihat hasil: &quot;BENAR!&quot; atau &quot;SALAH!&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">10.</span>
                <span>Selesai, lihat skor dan peringkat!</span>
              </li>
            </ol>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🏆 Cara Kerja Skor</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">BENAR</span>
                <span className="text-gray-700">+ <strong>1000 poin</strong> (回答 cepat = skor lebih tinggi)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">BENAR</span>
                <span className="text-gray-700">+ <strong>500 poin</strong> (回答 lambat = skor lebih rendah)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">SALAH</span>
                <span className="text-gray-700">= <strong>0 poin</strong></span>
              </div>
            </div>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🎮 Cara Memulai Game</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">1.</span>
                <span>Siswa sudah bergabung (lihat di daftar pemain)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">2.</span>
                <span>Klik <strong>&quot;Mulai Kuis&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">3.</span>
                <span>Ada hitung mundur 3 detik</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">4.</span>
                <span>Soal pertama muncul, siswa menjawab</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">5.</span>
                <span>Setelah waktu habis, klik <strong>&quot;Akhiri & Hitung Skor&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">6.</span>
                <span>Lihat hasil siapa benar/salah</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">7.</span>
                <span>Klik <strong>&quot;Soal Berikutnya&quot;</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">8.</span>
                <span>Ulangi hingga semua soal selesai</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-purple-600">9.</span>
                <span>Klik <strong>&quot;Selesai&quot;</strong> untuk lihat podium/leaderboard</span>
              </li>
            </ol>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🔧 Troubleshooting</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800">⚠️ Skor selalu 0</h3>
                <p className="text-gray-600 mt-1">
                  <strong>Wajib klik tombol &quot;Akhiri & Hitung Skor&quot;</strong> setelah waktu soal habis! 
                  Tanpa ini, skor siswa tidak akan dihitung.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">📱 Tidak bisa akses dari HP</h3>
                <ul className="text-gray-600 mt-1 list-disc list-inside space-y-1">
                  <li>Pastikan HP & laptop satu jaringan WiFi</li>
                  <li>Coba buka: <strong>http://[IP-LAPTOP]:3000</strong></li>
                  <li>Cek firewall: <code className="bg-gray-100 px-1">sudo ufw disable</code></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">❌ Siswa tidak bisa gabung</h3>
                <p className="text-gray-600 mt-1">
                  Pastikan Game PIN benar dan game belum selesai. Refresh halaman jika perlu.
                </p>
              </div>
            </div>
          </div>

          <div className="qooz-card">
            <h2 className="text-xl font-bold text-gray-800 mb-3">📊 Command Qooz</h2>
            <div className="bg-gray-800 text-green-400 p-4 rounded-lg font-mono text-sm">
              <p className="mb-2">qooz start     <span className="text-gray-500"># Start semua service</span></p>
              <p className="mb-2">qooz stop      <span className="text-gray-500"># Stop semua service</span></p>
              <p className="mb-2">qooz status    <span className="text-gray-500"># Cek status</span></p>
              <p>qooz install   <span className="text-gray-500"># Install dependencies</span></p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-white underline hover:text-purple-200">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  )
}
