'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [namaLengkap, setNamaLengkap] = useState('')
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let response
      if (isRegister) {
        response = await api.auth.register(email, password, namaLengkap)
      } else {
        response = await api.auth.login(email, password)
      }
      
      if (response.error) {
        setError(response.error)
      } else if (response.user) {
        // Store user info in localStorage
        localStorage.setItem('qooz_user', JSON.stringify(response.user))
        if (response.token) {
          localStorage.setItem('qooz_token', response.token)
        }
        router.push('/host')
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      setError('Terjadi kesalahan: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="qooz-title text-5xl">QOOZ</Link>
          <p className="text-white/80 mt-2">
            {isRegister ? 'Buat akun baru' : 'Masuk ke akun Anda'}
          </p>
        </div>

        <div className="qooz-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="qooz-input"
                  placeholder="Nama lengkap Anda"
                  required={isRegister}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="qooz-input"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="qooz-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="qooz-btn qooz-btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Masuk')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-purple-600 hover:underline"
            >
              {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/host" className="text-white/80 hover:text-white">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
