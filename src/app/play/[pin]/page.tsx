'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GameSession, Question, Player } from '@/types'

export default function PlayerGamePage() {
  const params = useParams()
  const pin = params.pin as string
  const router = useRouter()

  const [session, setSession] = useState<GameSession | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'answering' | 'correct' | 'result' | 'finished'>('waiting')
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [myScore, setMyScore] = useState(0)
  const [rank, setRank] = useState(0)
  const [totalPlayers, setTotalPlayers] = useState(0)

  const questionStartRef = useRef<number>(0)

  const fetchInitialData = async (playerId: string) => {
    try {
      const response = await api.player.state(playerId)
      
      if (response.player) {
        setPlayer(response.player)
        setSession(response.session)
        setMyScore(response.player.skor_total)
        
        if (response.session.status === 'finished') {
          setGamePhase('finished')
        } else if (response.question) {
          setCurrentQuestion(response.question)
          
          if (response.answered) {
            setGamePhase('waiting')
            setHasAnswered(true)
          } else {
            setGamePhase('answering')
            questionStartRef.current = Date.now()
          }
        } else {
          setGamePhase('waiting')
        }
        
        const scoreResponse = await api.player.score(playerId)
        if (scoreResponse.player) {
          setRank(scoreResponse.rank)
          setTotalPlayers(scoreResponse.total)
        }
      }
    } catch (err) {
      console.error(err)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const playerId = localStorage.getItem('qooz_player_id')

    if (!playerId) {
      router.push('/play')
      return
    }

    fetchInitialData(playerId)
  }, [])

  useEffect(() => {
    const playerId = localStorage.getItem('qooz_player_id')
    if (!playerId) return

    const pollState = async () => {
      try {
        const response = await api.player.state(playerId)
        
        if (response.session.status === 'finished') {
          setGamePhase('finished')
          const scoreResponse = await api.player.score(playerId)
          if (scoreResponse.player) {
            setMyScore(scoreResponse.player.skor_total)
            setRank(scoreResponse.rank)
            setTotalPlayers(scoreResponse.total)
          }
          return
        }
        
        if (response.question && response.question.id !== currentQuestion?.id && gamePhase !== 'answering' && gamePhase !== 'correct') {
          setCurrentQuestion(response.question)
          setGamePhase('countdown')
          setHasAnswered(false)
          setSelectedAnswer(null)
          setTimeLeft(response.question.waktu_detik || 20)
          
          setTimeout(() => {
            setGamePhase('answering')
            questionStartRef.current = Date.now()
          }, 3000)
        } else if (!response.question && gamePhase === 'answering') {
        }
        
        if (response.player) {
          setMyScore(response.player.skor_total)
        }
        
        const scoreResponse = await api.player.score(playerId)
        if (scoreResponse.player) {
          setRank(scoreResponse.rank)
          setTotalPlayers(scoreResponse.total)
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    }

    const pollInterval = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '2000')
    const interval = setInterval(pollState, pollInterval)
    return () => clearInterval(interval)
  }, [currentQuestion, gamePhase])

  useEffect(() => {
    if (gamePhase !== 'answering' || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase, timeLeft])

  const submitAnswer = async (answer: number) => {
    if (hasAnswered || !currentQuestion || !player || !session) return

    const responseTime = Date.now() - questionStartRef.current
    setSelectedAnswer(answer)
    setHasAnswered(true)

    try {
      await api.player.answer(
        player.id,
        currentQuestion.id,
        session.id,
        String(answer),
        String(responseTime)
      )
      
      setGamePhase('correct')
      
      setTimeout(() => {
        setGamePhase('waiting')
      }, 2000)
    } catch (err) {
      console.error('Answer submit error:', err)
      setHasAnswered(false)
    }
  }

  const optionColors = [
    'bg-blue-500',
    'bg-yellow-500', 
    'bg-purple-500',
    'bg-red-500'
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Memuat...</div>
      </div>
    )
  }

  // Waiting Phase
  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-5xl">⏳</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Menunggu soal...
        </h1>
        <p className="text-gray-500 mb-6 text-center">
          Game PIN: <span className="font-bold text-purple-600">{pin}</span>
        </p>
        <div className="qooz-card text-center">
          <p className="text-gray-500 text-sm">Skor kamu</p>
          <p className="text-3xl font-black text-purple-600">{myScore}</p>
        </div>
      </div>
    )
  }

  // Countdown Phase
  if (gamePhase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-black text-purple-600 animate-pulse">
          S I A P
        </h1>
      </div>
    )
  }

  // Answering Phase - Full screen mobile-first
  if (gamePhase === 'answering' && currentQuestion) {
    const maxTime = currentQuestion.waktu_detik || 20
    const progressPercent = (timeLeft / maxTime) * 100

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
        {/* Top bar */}
        <div className="p-3 md:p-4 shrink-0">
          <div className="flex justify-between items-center text-white/80 text-sm md:text-base">
            <span>PIN: <span className="font-bold text-white">{pin}</span></span>
            <span className="font-bold text-xl md:text-2xl text-white">{timeLeft}s</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-purple-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question - auto scale based on content length */}
        <div className="px-3 md:px-6 py-2 min-h-[15vh] max-h-[30vh] overflow-y-auto">
          <div className="bg-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3">
            <p className={`text-white font-bold text-center leading-tight ${currentQuestion.teks_soal.length > 100 ? 'text-base md:text-lg' : currentQuestion.teks_soal.length > 50 ? 'text-lg md:text-xl' : 'text-lg md:text-2xl'}`}>
              {currentQuestion.teks_soal}
            </p>
          </div>
        </div>

        {/* Answer buttons - 2x2 grid - scrollable for long options */}
        <div className="p-2 md:p-4 grid grid-cols-2 gap-2 md:gap-3 overflow-y-auto content-start">
          {optionColors.map((color, idx) => {
            const opt = [currentQuestion.opsi_1, currentQuestion.opsi_2, currentQuestion.opsi_3, currentQuestion.opsi_4][idx] as string
            const isLong = opt.length > 50
            return (
              <button
                key={idx}
                onClick={() => submitAnswer(idx + 1)}
                disabled={hasAnswered}
                className={`
                  ${color} 
                  rounded-2xl md:rounded-3xl 
                  flex flex-col items-center justify-center
                  font-black text-white
                  transition-all duration-150 active:scale-95
                  shadow-2xl
                  h-28 md:h-36 lg:h-40
                  ${hasAnswered ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'}
                `}
              >
                <span className={`text-white ${isLong ? 'text-xl md:text-2xl lg:text-3xl' : 'text-3xl md:text-5xl lg:text-6xl'} mb-1 md:mb-2`}>{optionLabels[idx]}</span>
                <span className={`text-white text-center px-1 ${isLong ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}>{opt}</span>
                {hasAnswered && selectedAnswer === idx + 1 && (
                  <span className="text-4xl md:text-6xl">✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom status */}
        {hasAnswered && (
          <div className="p-4 bg-green-500 text-white text-center font-bold text-lg">
            ✓ Jawaban terkirim!
          </div>
        )}
      </div>
    )
  }

  // Correct Answer Feedback
  if (gamePhase === 'correct') {
    const isCorrect = Number(selectedAnswer) === Number(currentQuestion?.jawaban_benar)
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className={`text-center ${isCorrect ? 'animate-bounce-in' : 'animate-slide-up'}`}>
          <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isCorrect ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <span className="text-6xl md:text-7xl">{isCorrect ? '✓' : '✗'}</span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? 'BENAR!' : 'SALAH!'}
          </h1>
          <p className="text-white/80 mt-4 text-lg">Menunggu soal berikutnya...</p>
        </div>
      </div>
    )
  }

  // Finished Phase
  if (gamePhase === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="qooz-title text-4xl mb-6 md:mb-8">🎉 Game Selesai!</h1>
          
          <div className="qooz-card mb-4">
            <p className="text-gray-500 mb-1 text-sm">Skor Akhir</p>
            <p className="text-5xl md:text-6xl font-black text-purple-600">{myScore}</p>
          </div>

          <div className="qooz-card">
            <p className="text-gray-500 mb-1 text-sm">Peringkat</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-800">
              #{rank} <span className="text-gray-400">dari {totalPlayers}</span>
            </p>
          </div>
        </div>

        <Link href="/play" className="qooz-btn qooz-btn-primary mt-8 px-8 py-3">
          Main Lagi
        </Link>
      </div>
    )
  }

  return null
}

const optionLabels = ['A', 'B', 'C', 'D']
