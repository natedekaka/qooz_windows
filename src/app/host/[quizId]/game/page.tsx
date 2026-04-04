'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [showResults, setShowResults] = useState(false)
  const [gamePhase, setGamePhase] = useState<'lobby' | 'countdown' | 'playing' | 'result' | 'finished'>('lobby')
  const [lastUpdate, setLastUpdate] = useState(0)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const fetchGameState = useCallback(async () => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      const response = await api.game.state(sessionId)
      
      if (response.error) {
        console.error('fetchGameState error:', response.error)
        setIsLoading(false)
        return
      }
      
      console.log('fetchGameState response, question_index:', response.session?.question_index, 'current_question_id:', response.question?.id)
      
      if (response.session) {
        setSession(response.session)
        
        // Get quiz info
        if (response.session.quiz_id) {
          const quizResponse = await api.quiz.detail(response.session.quiz_id)
          if (quizResponse.quiz) {
            setQuiz({ id: quizResponse.quiz.id, judul: quizResponse.quiz.judul, jumlah_soal: quizResponse.quiz.jumlah_soal })
            setQuestions(quizResponse.quiz.questions || [])
          }
        }
        
        // Update players
        setPlayers(response.players || [])
        
        // Update answers
        if (response.answers) {
          setAnswers(response.answers)
        }
        
        // Update current question - only if changed and we're not in result phase
        if (response.question && response.question.id !== currentQuestion?.id && gamePhase !== 'result') {
          console.log('Updating currentQuestion to:', response.question.id)
          setCurrentQuestion(response.question)
        }
        
        // Determine game phase - be more careful about transitions
        if (response.session.status === 'finished') {
          setGamePhase('finished')
        } else if (response.session.question_index >= 0 && response.question) {
          // Only transition to playing from lobby/countdown, not from result
          if (gamePhase === 'lobby' || gamePhase === 'countdown') {
            setGamePhase('playing')
          }
        }
        
        setLastUpdate(response.timestamp)
      }
    } catch (err) {
      console.error('fetchGameState exception:', err)
    }
    setIsLoading(false)
  }, [sessionId, currentQuestion, gamePhase])

  useEffect(() => {
    if (sessionId) {
      fetchGameState()
      
      const pollInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '2000')
      // Poll every 2 seconds (configurable via env)
      const interval = setInterval(fetchGameState, pollInterval)
      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
    }
  }, [sessionId, fetchGameState])

  const startGame = async () => {
    if (!sessionId) return

    setGamePhase('countdown')
    
    try {
      const response = await api.game.start(sessionId)
      if (response.question) {
        setCurrentQuestion(response.question)
        setTimeLeft(response.question.waktu_detik)
      }
      
      // Start countdown
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

  // Timer effect
  useEffect(() => {
    if (gamePhase !== 'playing' || !currentQuestion || timeLeft <= 0) return

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
  }, [gamePhase, timeLeft, currentQuestion])

  const endQuestion = async () => {
    if (!sessionId || !currentQuestion) return

    setGamePhase('result')
    setShowResults(true)

    try {
      const response = await api.game.endQuestion(sessionId)
      if (response.players) {
        setPlayers(response.players)
      }
    } catch (err) {
      console.error('endQuestion error:', err)
    }
  }

  const nextQuestion = async () => {
    if (!sessionId) return

    console.log('nextQuestion called, sessionId:', sessionId, 'current question_index:', session?.question_index)
    setGamePhase('countdown')
    setShowResults(false)
    setCurrentQuestion(null)

    try {
      const response = await api.game.next(sessionId)
      console.log('nextQuestion response:', response)
      console.log('response.finished:', response.finished)
      console.log('response.question:', response.question)
      
      if (response.finished) {
        console.log('Setting gamePhase to finished')
        setGamePhase('finished')
        setCurrentQuestion(null)
      } else if (response.question) {
        console.log('Setting new question:', response.question.id, 'waktu:', response.question.waktu_detik)
        setCurrentQuestion(response.question)
        setTimeLeft(response.question.waktu_detik || 20)
        
        // Force update by using a small timeout
        setTimeout(() => {
          console.log('Setting gamePhase to playing after 3s')
          setGamePhase('playing')
        }, 3000)
      } else {
        console.warn('No question in response, response:', response)
        setGamePhase('result')
      }
    } catch (err) {
      console.error('nextQuestion error:', err)
      setGamePhase('result')
    }
  }

  const optionLabels = ['A', 'B', 'C', 'D']
  const optionColors = ['bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Memuat game...</div>
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
          <p className="text-gray-500 mb-2">Game PIN</p>
          <p className="text-7xl md:text-9xl font-black text-purple-600 tracking-widest">
            {session?.pin}
          </p>
        </div>

        <div className="qooz-card w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Player joined ({players.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium text-center animate-slide-up"
              >
                {player.nama_siswa}
              </div>
            ))}
          </div>
          {players.length === 0 && (
            <p className="text-gray-400 text-center py-4">Menunggu player join...</p>
          )}
        </div>

        <button
          onClick={startGame}
          disabled={players.length === 0}
          className="qooz-btn qooz-btn-green text-2xl px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Playing Phase
  if (gamePhase === 'playing' && currentQuestion) {
    const answerCounts = [0, 0, 0, 0]
    answers.forEach(a => {
      if (a.jawaban_dipilih !== null && a.jawaban_dipilih >= 1 && a.jawaban_dipilih <= 4) {
        answerCounts[a.jawaban_dipilih - 1]++
      }
    })

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="qooz-card py-2 px-4">
              <span className="text-gray-500">PIN:</span>
              <span className="font-bold text-purple-600 ml-2">{session?.pin}</span>
            </div>
            <div className="qooz-card py-2 px-4">
              <span className="text-gray-500">Soal:</span>
              <span className="font-bold text-gray-800 ml-2">
                {(session?.question_index ?? 0) + 1}/{questions.length}
              </span>
            </div>
            <div className={`qooz-card py-2 px-6 ${timeLeft <= 5 ? 'bg-red-100 animate-pulse' : 'bg-purple-100'}`}>
              <span className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-600' : 'text-purple-600'}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="qooz-card mb-6">
            <h1 className="host-question text-center">
              {currentQuestion.teks_soal}
            </h1>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[currentQuestion.opsi_1, currentQuestion.opsi_2, currentQuestion.opsi_3, currentQuestion.opsi_4].map((opt, idx) => (
              <div key={idx} className="relative">
                <div className={`host-option ${optionColors[idx]}`}>
                  <span className="mr-4">{optionLabels[idx]}</span>
                  {opt}
                </div>
                {/* Answer count badge */}
                <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg px-3 py-1 font-bold text-gray-800">
                  {answerCounts[idx]}
                </div>
              </div>
            ))}
          </div>

          {/* Players answered */}
          <div className="text-center text-white/80">
            {answers.length} / {players.length} answered
          </div>
        </div>
      </div>
    )
  }

  // Result Phase
  if (gamePhase === 'result' && currentQuestion) {
    const correctCount = answers.filter(a => 
      a.question_id === currentQuestion.id && a.is_correct
    ).length
    
    const answerCounts = [0, 0, 0, 0]
    answers.filter(a => a.question_id === currentQuestion.id).forEach(a => {
      if (a.jawaban_dipilih !== null && a.jawaban_dipilih >= 1 && a.jawaban_dipilih <= 4) {
        answerCounts[a.jawaban_dipilih - 1]++
      }
    })

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Correct Answer */}
          <div className="qooz-card text-center mb-6 animate-bounce-in">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Jawaban Benar</h2>
            <div className={`host-option ${optionColors[currentQuestion.jawaban_benar - 1]} inline-block text-2xl`}>
              {optionLabels[currentQuestion.jawaban_benar - 1]}. {['opsi_1', 'opsi_2', 'opsi_3', 'opsi_4'].map(k => currentQuestion[k as keyof typeof currentQuestion])[currentQuestion.jawaban_benar - 1]}
            </div>
            <p className="text-gray-500 mt-4">
              {correctCount} dari {answers.filter(a => a.question_id === currentQuestion.id).length} benar
            </p>
          </div>

          {/* Bar Chart */}
          <div className="qooz-card mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Grafik Jawaban</h3>
            <div className="space-y-3">
              {optionLabels.map((label, idx) => {
                const count = answerCounts[idx]
                const total = answers.filter(a => a.question_id === currentQuestion.id).length
                const percentage = total > 0 ? (count / total) * 100 : 0
                const isCorrect = Number(idx + 1) === Number(currentQuestion.jawaban_benar)

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white ${optionColors[idx]}`}>
                      {label}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full ${isCorrect ? 'bg-green-500' : 'bg-gray-400'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-bold text-gray-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="qooz-card mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Peringkat Sementara</h3>
            <div className="space-y-2">
              {players.slice(0, 5).map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                    idx === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-semibold text-gray-800">{player.nama_siswa}</span>
                  <span className="font-bold text-purple-600">{player.skor_total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Debug: Show game phase and states */}
          <div className="qooz-card mb-4 text-left text-sm bg-yellow-100">
            <p>gamePhase: <strong>{gamePhase}</strong></p>
            <p>session.question_index: <strong>{session?.question_index}</strong></p>
            <p>questions.length: <strong>{questions.length}</strong></p>
            <p>currentQuestion?.id: <strong>{currentQuestion?.id}</strong></p>
          </div>

          {/* Next Button */}
          <div className="text-center">
            <button
              onClick={nextQuestion}
              className="qooz-btn qooz-btn-primary text-xl px-12"
              disabled={questions.length === 0}
            >
              {((session?.question_index ?? 0) + 1) >= questions.length ? 'Selesai' : 'Soal Berikutnya →'}
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
        <h1 className="qooz-title text-5xl md:text-7xl mb-8">Pemenang!</h1>
        
        <div className="flex items-end gap-4 md:gap-8 mb-12">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 md:w-32 md:h-32 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl md:text-5xl">🥈</span>
              </div>
              <p className="font-bold text-gray-800 text-lg md:text-xl">{top3[1].nama_siswa}</p>
              <p className="text-purple-600 font-bold">{top3[1].skor_total}</p>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>
              <div className="w-24 h-24 md:w-40 md:h-40 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <span className="text-4xl md:text-6xl">👑</span>
              </div>
              <p className="font-bold text-gray-800 text-xl md:text-2xl">{top3[0].nama_siswa}</p>
              <p className="text-purple-600 font-bold text-lg md:text-xl">{top3[0].skor_total}</p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 md:w-32 md:h-32 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl md:text-5xl">🥉</span>
              </div>
              <p className="font-bold text-gray-800 text-lg md:text-xl">{top3[2].nama_siswa}</p>
              <p className="text-purple-600 font-bold">{top3[2].skor_total}</p>
            </div>
          )}
        </div>

        <Link href="/host" className="qooz-btn qooz-btn-primary">
          Kembali ke Dashboard
        </Link>
      </div>
    )
  }

  return null
}
