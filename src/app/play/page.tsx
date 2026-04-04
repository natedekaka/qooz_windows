'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PlayPage() {
  const [pin, setPin] = useState('')
  const [nama, setNama] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()

  const joinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await api.player.join(pin, nama)
      
      if (response.error) {
        setError(response.error)
      } else if (response.player) {
        // Store player info
        localStorage.setItem('qooz_player_id', response.player.id)
        localStorage.setItem('qooz_session_id', response.player.session_id)
        
        // Navigate to game
        router.push(`/play/${pin}`)
      }
    } catch (err) {
      setError('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="qooz-title text-5xl">QOOZ</Link>
          <p className="text-white/80 mt-2">Masuk ke Game</p>
        </div>

        <div className="qooz-card">
          <form onSubmit={joinGame} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game PIN
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="qooz-input text-center text-3xl font-bold tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="qooz-input"
                placeholder="Nama kamu"
                required
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || pin.length !== 6 || !nama}
              className="qooz-btn qooz-btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Memasuki...' : 'Masuk Game'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-white/80 hover:text-white">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
