import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-slide-up">
        <h1 className="qooz-title text-6xl md:text-8xl mb-4">
          QOOZ
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-medium">
          Kuis Interaktif Real-time
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full stagger-children">
        {/* Host Card */}
        <Link href="/host" className="qooz-card hover:scale-105 transition-transform group">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
              <span className="text-5xl">📺</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tampilan Guru</h2>
            <p className="text-gray-600">
              Buat dan-hosted kuis untuk kelas Anda
            </p>
          </div>
        </Link>

        {/* Player Card */}
        <Link href="/play" className="qooz-card hover:scale-105 transition-transform group">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
              <span className="text-5xl">📱</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tampilan Siswa</h2>
            <p className="text-gray-600">
              Masuk dengan Game PIN untuk menjawab
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12 text-center text-white/70 text-sm">
        <p>Butuh bantuan? <a href="#" className="underline hover:text-white">Pelajari cara menggunakan Qooz</a></p>
      </div>
    </div>
  )
}
