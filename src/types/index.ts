export interface User {
  id: string
  email: string
  nama_lengkap: string
  created_at: string
}

export interface Quiz {
  id: string
  user_id: string
  judul: string
  deskripsi: string | null
  jumlah_soal: number
  created_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  quiz_id: string
  nomor_soal: number
  teks_soal: string
  opsi_1: string
  opsi_2: string
  opsi_3: string
  opsi_4: string
  jawaban_benar: number
  waktu_detik: number
  gambar_url: string | null
}

export interface GameSession {
  id: string
  pin: string
  quiz_id: string
  user_id: string
  status: 'lobby' | 'playing' | 'finished'
  question_index: number
  current_question_id: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  quiz?: Quiz
}

export interface Player {
  id: string
  session_id: string
  nama_siswa: string
  skor_total: number
  is_active: boolean
  joined_at: string
}

export interface Answer {
  id: string
  player_id: string
  question_id: string
  session_id: string
  jawaban_dipilih: number | null
  waktu_respon_ms: number | null
  is_correct: boolean
  poin_didapat: number
  answered_at: string
}

export type GameStatus = 'lobby' | 'playing' | 'finished'

export interface LeaderboardEntry extends Player {
  rank: number
}
