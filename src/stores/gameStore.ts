import { create } from 'zustand'
import { GameSession, Player, Question, LeaderboardEntry, Answer } from '@/types'

interface GameState {
  // Session
  session: GameSession | null
  setSession: (session: GameSession | null) => void
  
  // Players
  players: Player[]
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  updatePlayerScore: (playerId: string, score: number) => void
  
  // Current Question
  currentQuestion: Question | null
  setCurrentQuestion: (question: Question | null) => void
  questionIndex: number
  setQuestionIndex: (index: number) => void
  
  // Answers for current question
  answers: Answer[]
  setAnswers: (answers: Answer[]) => void
  addAnswer: (answer: Answer) => void
  
  // Timer
  timeLeft: number
  setTimeLeft: (time: number) => void
  
  // Game status
  isHost: boolean
  setIsHost: (isHost: boolean) => void
  
  // Player (for student view)
  playerId: string | null
  setPlayerId: (id: string | null) => void
  
  // Leaderboard
  leaderboard: LeaderboardEntry[]
  setLeaderboard: (entries: LeaderboardEntry[]) => void
  
  // Reset
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  
  players: [],
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  updatePlayerScore: (playerId, score) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, skor_total: score } : p
    )
  })),
  
  currentQuestion: null,
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  questionIndex: -1,
  setQuestionIndex: (index) => set({ questionIndex: index }),
  
  answers: [],
  setAnswers: (answers) => set({ answers }),
  addAnswer: (answer) => set((state) => ({ answers: [...state.answers, answer] })),
  
  timeLeft: 0,
  setTimeLeft: (time) => set({ timeLeft: time }),
  
  isHost: false,
  setIsHost: (isHost) => set({ isHost }),
  
  playerId: null,
  setPlayerId: (id) => set({ playerId: id }),
  
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  
  reset: () => set({
    session: null,
    players: [],
    currentQuestion: null,
    questionIndex: -1,
    answers: [],
    timeLeft: 0,
    isHost: false,
    playerId: null,
    leaderboard: []
  })
}))
