'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { GameSession, Player, Question, Answer } from '@/types'

export default function GameHostPage() {
  const [session, setSession] = useState<GameSession | null>(null)
  const [quiz, setQuiz] = useState<{ id: string; judul: string; jumlah_soal: number } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [gamePhase, setGamePhase] = useState<'lobby' | 'countdown' | 'playing' | 'result' | 'finished'>('lobby')
  const contentRef = useRef<HTMLDivElement>(null)
  
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const fetchGameState = useCallback(async () => {
    if (!sessionId) return

    try {
      const response = await api.game.state(sessionId)
      
      // Set loading to false after first successful fetch
      setIsLoading(false)
      
      if (response.error) {
        console.error('fetchGameState error:', response.error)
        return
      }
      
      if (response.session) {
        setSession(response.session)
        
        if (response.session.quiz_id) {
          const quizResponse = await api.quiz.detail(response.session.quiz_id)
          if (quizResponse.quiz) {
            setQuiz({ id: quizResponse.quiz.id, judul: quizResponse.quiz.judul, jumlah_soal: quizResponse.quiz.jumlah_soal })
            setQuestions(quizResponse.quiz.questions || [])
          }
        }
        
        setPlayers(response.players || [])
        
        if (response.answers) {
          setAnswers(response.answers)
        }
        
        if (response.question && response.question.id !== currentQuestion?.id && gamePhase !== 'result') {
          setCurrentQuestion(response.question)
        }
        
        if (response.session.status === 'finished') {
          setGamePhase('finished')
        } else if (response.session.question_index >= 0 && response.question) {
          if (gamePhase === 'lobby' || gamePhase === 'countdown') {
            setGamePhase('playing')
          }
        }
      }
    } catch (err) {
      console.error('fetchGameState exception:', err)
      setIsLoading(false)
    }
  }, [sessionId, currentQuestion, gamePhase])

  const startGame = async () => {
    if (!sessionId) return

    setGamePhase('countdown')
    
    try {
      const response = await api.game.start(sessionId)
      if (response.question) {
        setCurrentQuestion(response.question)
        setTimeLeft(response.question.waktu_detik)
      }
      
      setTimeout(() => {
        setGamePhase('playing')
        if (response.question) {
          setTimeLeft(response.question.waktu_detik)
        }
      }, 3000)
    } catch (err) {
      console.error(err)
      setGamePhase('lobby')
    }
  }

  const nextQuestion = async () => {
    if (!sessionId) return

    setGamePhase('countdown')
    setCurrentQuestion(null)

    try {
      const response = await api.game.next(sessionId)
      
      if (response.finished) {
        setGamePhase('finished')
        setCurrentQuestion(null)
      } else if (response.question) {
        setCurrentQuestion(response.question)
        setTimeLeft(response.question.waktu_detik || 20)
        
        setTimeout(() => {
          setGamePhase('playing')
        }, 3000)
      } else {
        setGamePhase('result')
      }
    } catch (err) {
      console.error('nextQuestion error:', err)
      setGamePhase('result')
    }
  }

  const endQuestion = async () => {
    if (!sessionId || !currentQuestion) return

    setGamePhase('result')

    try {
      const response = await api.game.endQuestion(sessionId)
      if (response.players) {
        setPlayers(response.players)
      }
    } catch (err) {
      console.error('endQuestion error:', err)
    }
  }

  useEffect(() => {
    if (gamePhase !== 'playing' || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          endQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase, timeLeft])

  useEffect(() => {
    if (sessionId) {
      fetchGameState()
      const pollInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '2000')
      const interval = setInterval(fetchGameState, pollInterval)
      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
    }
  }, [sessionId, fetchGameState])

  const optionLabels = ['A', 'B', 'C', 'D']
  const optionColors = ['bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <div className="text-white text-xl">Memuat game...</div>
        <p className="text-white/60 text-sm mt-2">Menghubungkan ke server...</p>
      </div>
    )
  }

  // Lobby Phase
  if (gamePhase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="qooz-title text-6xl md:text-8xl mb-4">QOOZ</h1>
          <p className="text-2xl text-white mb-2">{quiz?.judul}</p>
          <p className="text-white/80">{quiz?.jumlah_soal} soal</p>
        </div>

        <div className="qooz-card text-center py-12 px-16 animate-pulse-glow mb-8">
          <p className="text-gray-500 mb-2 text-sm">Game PIN</p>
          <p className="text-7xl md:text-9xl font-black text-purple-600 tracking-widest">
            {session?.pin}
          </p>
        </div>

        <div className="qooz-card w-full max-w-md mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>👥</span> Player ({players.length})
          </h2>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium text-center animate-slide-up"
              >
                {player.nama_siswa}
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-gray-400 text-center py-4">Menunggu player join...</p>
            )}
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={players.length === 0}
          className="qooz-btn qooz-btn-green text-xl px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-md"
        >
          ▶ Mulai Kuis
        </button>
      </div>
    )
  }

  // Countdown Phase
  if (gamePhase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="qooz-title text-6xl mb-4">Siap?</h1>
        <p className="text-white text-2xl">Soal berikutnya segera dimulai...</p>
      </div>
    )
  }

  // Playing Phase - Fixed layout with sticky bottom
  if (gamePhase === 'playing' && currentQuestion) {
    const currentAnswers = answers.filter(a => a.question_id === currentQuestion.id)
    const answerCounts = [0, 0, 0, 0]
    currentAnswers.forEach(a => {
      const pilihan = Number(a.jawaban_dipilih)
      if (pilihan >= 1 && pilihan <= 4) {
        answerCounts[pilihan - 1]++
      }
    })

    return (
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 md:px-4 md:py-2">
              <span className="text-white/80 text-sm">PIN:</span>
              <span className="font-bold text-white ml-2">{session?.pin}</span>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 md:px-4 md:py-2">
              <span className="text-white/80 text-sm">Soal:</span>
              <span className="font-bold text-white ml-2">
                {(session?.question_index ?? 0) + 1}/{questions.length}
              </span>
            </div>
            <div className={`rounded-lg px-4 py-2 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/20 backdrop-blur'}`}>
              <span className={`text-2xl md:text-3xl font-black ${timeLeft <= 5 ? 'text-white' : 'text-white'}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto" ref={contentRef}>
          <div className="max-w-4xl mx-auto">
            {/* Question - auto scale based on content length */}
            <div className="qooz-card mb-4 md:mb-6">
              <div className="bg-purple-100 rounded-xl px-3 py-2 md:px-4 md:py-3">
                <h1 className={`host-question text-center ${currentQuestion.teks_soal.length > 100 ? 'text-sm md:text-xl lg:text-2xl' : currentQuestion.teks_soal.length > 50 ? 'text-lg md:text-2xl lg:text-3xl' : 'text-xl md:text-3xl lg:text-4xl'}`}>
                  {currentQuestion.teks_soal}
                </h1>
              </div>
            </div>

            {/* Options Grid - scrollable */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 max-h-[35vh] overflow-y-auto">
              {[currentQuestion.opsi_1, currentQuestion.opsi_2, currentQuestion.opsi_3, currentQuestion.opsi_4].map((opt, idx) => (
                <div key={idx} className="relative">
                  <div className={`host-option ${optionColors[idx]} ${opt.length > 80 ? 'text-xs md:text-sm lg:text-base h-28 md:h-32 lg:h-36' : opt.length > 40 ? 'text-sm md:text-lg lg:text-xl h-24 md:h-28 lg:h-32' : 'text-base md:text-xl lg:text-2xl h-24 md:h-28 lg:h-32'} flex items-start justify-start`}>
                    <span className="mr-2 md:mr-3 shrink-0">{optionLabels[idx]}.</span>
                    <span className="flex-1">{opt}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg px-2 py-1 font-bold text-gray-800 text-sm">
                    {answerCounts[idx]}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="text-center text-white/80 text-sm md:text-base">
              {currentAnswers.length} / {players.length} menjawab
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="p-4 bg-white/10 backdrop-blur-sm sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={endQuestion}
              className="w-full qooz-btn qooz-btn-green text-lg py-4"
            >
              ✓ Akhiri & Hitung Skor
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Result Phase - Fixed layout
  if (gamePhase === 'result' && currentQuestion) {
    const currentAnswers = answers.filter(a => a.question_id === currentQuestion.id)
    const correctCount = currentAnswers.filter(a => a.is_correct).length
    
    const answerCounts = [0, 0, 0, 0]
    currentAnswers.forEach(a => {
      const pilihan = Number(a.jawaban_dipilih)
      if (pilihan >= 1 && pilihan <= 4) {
        answerCounts[pilihan - 1]++
      }
    })

    const totalAnswered = currentAnswers.length

    return (
      <div className="min-h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 md:px-4 md:py-2">
              <span className="text-white/80 text-sm">PIN:</span>
              <span className="font-bold text-white ml-2">{session?.pin}</span>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 md:px-4 md:py-2">
              <span className="text-white/80 text-sm">Soal:</span>
              <span className="font-bold text-white ml-2">
                {(session?.question_index ?? 0) + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Correct Answer */}
            <div className="qooz-card text-center animate-bounce-in">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">Jawaban Benar</h2>
              {(() => {
                const correctOpt = ['opsi_1', 'opsi_2', 'opsi_3', 'opsi_4'].map(k => currentQuestion[k as keyof typeof currentQuestion])[currentQuestion.jawaban_benar - 1] as string
                const fontSize = correctOpt.length > 80 ? 'text-sm md:text-base' : correctOpt.length > 40 ? 'text-base md:text-lg' : 'text-lg md:text-2xl'
                return (
                  <div className={`host-option ${optionColors[currentQuestion.jawaban_benar - 1]} inline-block ${fontSize} text-left w-full`}>
                    {optionLabels[currentQuestion.jawaban_benar - 1]}. {correctOpt}
                  </div>
                )
              })()}
              <p className="text-gray-500 mt-3 text-sm md:text-base">
                {totalAnswered > 0 
                  ? `${correctCount} dari ${totalAnswered} benar`
                  : 'Belum ada yang menjawab'}
              </p>
            </div>

            {/* Bar Chart */}
            <div className="qooz-card">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Grafik Jawaban</h3>
              <div className="space-y-3">
                {optionLabels.map((label, idx) => {
                  const count = answerCounts[idx]
                  const percentage = totalAnswered > 0 ? (count / totalAnswered) * 100 : 0
                  const isCorrect = Number(idx + 1) === Number(currentQuestion.jawaban_benar)

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white ${optionColors[idx]}`}>
                        {label}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-5 md:h-6 overflow-hidden">
                        <div
                          className={`h-full ${isCorrect ? 'bg-green-500' : 'bg-gray-400'} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 md:w-12 text-right font-bold text-gray-600">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="qooz-card">
              <h3 className="text-lg font-bold text-gray-800 mb-3">🏆 Peringkat</h3>
              <div className="space-y-2">
                {players.slice(0, 5).map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-3 p-2 md:p-3 bg-gray-50 rounded-xl">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-semibold text-gray-800 truncate">{player.nama_siswa}</span>
                    <span className="font-bold text-purple-600">{player.skor_total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="p-4 bg-white/10 backdrop-blur-sm sticky bottom-0">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={nextQuestion}
              className="w-full qooz-btn qooz-btn-primary text-lg py-4"
            >
              {((session?.question_index ?? 0) + 1) >= questions.length ? '🎉 Selesai' : 'Soal Berikutnya →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Finished Phase - Podium
  if (gamePhase === 'finished') {
    const top3 = players.slice(0, 3)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="qooz-title text-4xl md:text-6xl mb-6 md:mb-8">🎉 Pemenang!</h1>
        
        <div className="flex items-end gap-3 md:gap-6 mb-8 md:mb-12">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                <span className="text-2xl md:text-4xl">🥈</span>
              </div>
              <p className="font-bold text-gray-800 text-sm md:text-lg">{top3[1].nama_siswa}</p>
              <p className="text-purple-600 font-bold text-sm md:text-base">{top3[1].skor_total}</p>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 md:w-32 md:h-32 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-2xl">
                <span className="text-3xl md:text-5xl">👑</span>
              </div>
              <p className="font-bold text-gray-800 text-base md:text-xl">{top3[0].nama_siswa}</p>
              <p className="text-purple-600 font-bold text-base md:text-xl">{top3[0].skor_total}</p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3">
                <span className="text-2xl md:text-4xl">🥉</span>
              </div>
              <p className="font-bold text-gray-800 text-sm md:text-lg">{top3[2].nama_siswa}</p>
              <p className="text-purple-600 font-bold text-sm md:text-base">{top3[2].skor_total}</p>
            </div>
          )}
        </div>

        <Link href="/host" className="qooz-btn qooz-btn-primary px-8 py-3">
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return null
}
