'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { GameSession, Question, Answer, Player } from '@/types'

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

  useEffect(() => {
    const playerId = localStorage.getItem('qooz_player_id')
    const sessionId = localStorage.getItem('qooz_session_id')

    if (!playerId || !sessionId) {
      router.push('/play')
      return
    }

    fetchInitialData(playerId, sessionId)
  }, [])

  const fetchInitialData = async (playerId: string, sessionId: string) => {
    try {
      const response = await api.player.state(playerId)
      
      if (response.player) {
        setPlayer(response.player)
        setSession(response.session)
        setMyScore(response.player.skor_total)
        
        // Check game status
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
        
        // Get rank
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

  // Polling for updates
  useEffect(() => {
    const playerId = localStorage.getItem('qooz_player_id')
    if (!playerId) return

    const pollState = async () => {
      try {
        const response = await api.player.state(playerId)
        
        if (response.error) {
          console.error('Poll error:', response.error)
          return
        }
        
        console.log('Player poll - gamePhase:', gamePhase, 'question:', response.question?.id)
        
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
        
        // Check if new question started - only if not already answering
        if (response.question && response.question.id !== currentQuestion?.id && gamePhase !== 'answering' && gamePhase !== 'correct') {
          console.log('New question detected:', response.question.id, 'current:', currentQuestion?.id, 'waktu_detik:', response.question.waktu_detik)
          setCurrentQuestion(response.question)
          setGamePhase('countdown')
          setHasAnswered(false)
          setSelectedAnswer(null)
          setTimeLeft(response.question.waktu_detik || 20)
          
          // Start answering after countdown
          setTimeout(() => {
            console.log('Student: switching to answering phase')
            setGamePhase('answering')
            questionStartRef.current = Date.now()
          }, 3000)
        } else if (!response.question && gamePhase === 'answering') {
          // Question was cleared, but player was answering - stay in waiting
          console.log('Question cleared but was answering, staying in waiting')
        }
        
        // Update score
        if (response.player) {
          setMyScore(response.player.skor_total)
        }
        
        // Get rank
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
    
    // Poll every 2 seconds (configurable via env)
    const interval = setInterval(pollState, pollInterval)
    return () => clearInterval(interval)
  }, [currentQuestion, gamePhase])

  // Timer for answering
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
      console.log('Submitting answer:', { playerId: player.id, questionId: currentQuestion.id, sessionId: session.id, answer, responseTime })
      const result = await api.player.answer(
        player.id,
        currentQuestion.id,
        session.id,
        String(answer),
        String(responseTime)
      )
      console.log('Answer API result:', result)

      // Show result briefly
      setGamePhase('correct')
      console.log('Answer submitted, showing correct phase')
      
      setTimeout(() => {
        console.log('Transitioning to waiting phase')
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
        <div className="text-center">
          <div className="bg-blue-500 text-white text-xs p-1 mb-2">
            DEBUG: gamePhase={gamePhase}, currentQuestion={currentQuestion?.id || 'null'}
          </div>
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-5xl">⏳</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Menunggu soal...
          </h1>
          <p className="text-gray-500 mb-6">
            Game PIN: <span className="font-bold text-purple-600">{pin}</span>
          </p>
          <div className="qooz-card inline-block">
            <p className="text-gray-500 text-sm">Skor kamu</p>
            <p className="text-3xl font-black text-purple-600">{myScore}</p>
          </div>
        </div>
      </div>
    )
  }

  // Countdown Phase
  if (gamePhase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-blue-500 text-white text-xs p-1 mb-2">
          DEBUG: gamePhase={gamePhase}, question={currentQuestion?.id || 'null'}
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-purple-600 animate-pulse">
          S I A P
        </h1>
      </div>
    )
  }

  // Answering Phase
  if (gamePhase === 'answering' && currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-yellow-500 text-white text-xs p-1 text-center">
          Question ID: {currentQuestion.id}
        </div>
        {/* Timer bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(timeLeft / currentQuestion.waktu_detik) * 100}%` }}
          />
        </div>

        <div className="flex-1 p-2">
          <div className="grid grid-cols-2 gap-2 h-full">
            {optionColors.map((color, idx) => (
              <button
                key={idx}
                onClick={() => submitAnswer(idx + 1)}
                disabled={hasAnswered}
                className={`${color} player-option rounded-2xl disabled:opacity-50 ${
                  hasAnswered ? 'cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                {hasAnswered && selectedAnswer === idx + 1 ? '✓' : ''}
              </button>
            ))}
          </div>
        </div>

        {hasAnswered && (
          <div className="p-4 text-center">
            <p className="text-white font-bold">Jawaban terkirim!</p>
          </div>
        )}
      </div>
    )
  }

  // Correct Answer Feedback
  if (gamePhase === 'correct') {
    // Use loose equality or convert to number to handle string vs number comparison
    const isCorrect = Number(selectedAnswer) === Number(currentQuestion?.jawaban_benar)
    
    console.log('Correct phase: selectedAnswer=', selectedAnswer, 'jawaban_benar=', currentQuestion?.jawaban_benar, 'isCorrect=', isCorrect)
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-blue-500 text-white text-xs p-1 mb-2">
          DEBUG: selectedAnswer={selectedAnswer} jawaban_benar={currentQuestion?.jawaban_benar}
        </div>
        <div className={`text-center ${isCorrect ? 'animate-bounce-in' : 'animate-slide-up'}`}>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isCorrect ? 'bg-green-500' : 'bg-red-500'
          }`}>
            <span className="text-6xl">{isCorrect ? '✓' : '✗'}</span>
          </div>
          <h1 className={`text-4xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? 'BENAR!' : 'SALAH!'}
          </h1>
          <p className="text-white mt-4">Menunggu soal berikutnya...</p>
        </div>
      </div>
    )
  }

  // Finished Phase
  if (gamePhase === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="qooz-title text-4xl mb-8">Game Selesai!</h1>
          
          <div className="qooz-card mb-6">
            <p className="text-gray-500 mb-2">Skor Akhir</p>
            <p className="text-5xl font-black text-purple-600">{myScore}</p>
          </div>

          <div className="qooz-card">
            <p className="text-gray-500 mb-2">Peringkat</p>
            <p className="text-3xl font-bold text-gray-800">
              #{rank} dari {totalPlayers}
            </p>
          </div>
        </div>

        <Link href="/play" className="qooz-btn qooz-btn-primary mt-8">
          Main Lagi
        </Link>
      </div>
    )
  }

  return null
}
