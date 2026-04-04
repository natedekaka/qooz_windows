'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Quiz, Question } from '@/types'

export default function QuizEditorPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    teks_soal: '',
    opsi_1: '',
    opsi_2: '',
    opsi_3: '',
    opsi_4: '',
    jawaban_benar: 1,
    waktu_detik: 20
  })
  
  const router = useRouter()
  const params = useParams()
  const quizId = params.quizId as string

  useEffect(() => {
    if (quizId) {
      fetchQuiz()
    }
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await api.quiz.detail(quizId)
      if (response.quiz) {
        setQuiz(response.quiz)
        setQuestions(response.quiz.questions || [])
      } else {
        router.push('/host')
      }
    } catch (err) {
      console.error(err)
      router.push('/host')
    }
    setIsLoading(false)
  }

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    const userStr = localStorage.getItem('qooz_user')
    if (!userStr) return
    const user = JSON.parse(userStr)

    try {
      if (editingQuestion) {
        await api.quiz.updateQuestion(
          user.id,
          editingQuestion.id,
          newQuestion.teks_soal,
          newQuestion.opsi_1,
          newQuestion.opsi_2,
          newQuestion.opsi_3,
          newQuestion.opsi_4,
          String(newQuestion.jawaban_benar),
          String(newQuestion.waktu_detik)
        )
        
        setQuestions(questions.map(q => 
          q.id === editingQuestion.id ? { ...q, ...newQuestion } : q
        ))
      } else {
        const response = await api.quiz.addQuestion(
          user.id,
          quizId,
          newQuestion.teks_soal,
          newQuestion.opsi_1,
          newQuestion.opsi_2,
          newQuestion.opsi_3,
          newQuestion.opsi_4,
          String(newQuestion.jawaban_benar),
          String(newQuestion.waktu_detik)
        )
        
        if (response.success && response.question) {
          setQuestions([...questions, { ...response.question, ...newQuestion }])
        }
      }

      setShowQuestionModal(false)
      setEditingQuestion(null)
      setNewQuestion({
        teks_soal: '',
        opsi_1: '',
        opsi_2: '',
        opsi_3: '',
        opsi_4: '',
        jawaban_benar: 1,
        waktu_detik: 20
      })
      
      // Refresh quiz to get updated jumlah_soal
      fetchQuiz()
    } catch (err) {
      console.error(err)
    }
  }

  const editQuestion = (question: Question) => {
    setEditingQuestion(question)
    setNewQuestion({
      teks_soal: question.teks_soal,
      opsi_1: question.opsi_1,
      opsi_2: question.opsi_2,
      opsi_3: question.opsi_3,
      opsi_4: question.opsi_4,
      jawaban_benar: question.jawaban_benar,
      waktu_detik: question.waktu_detik
    })
    setShowQuestionModal(true)
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return

    const userStr = localStorage.getItem('qooz_user')
    if (!userStr) return
    const user = JSON.parse(userStr)

    try {
      await api.quiz.deleteQuestion(user.id, quizId, id)
      const updatedQuestions = questions.filter(q => q.id !== id)
      setQuestions(updatedQuestions)
      
      // Refresh quiz
      fetchQuiz()
    } catch (err) {
      console.error(err)
    }
  }

  const startGame = async () => {
    const userStr = localStorage.getItem('qooz_user')
    if (!userStr) return
    const user = JSON.parse(userStr)
    
    try {
      const response = await api.game.create(quizId, user.id)
      if (response.success && response.session) {
        router.push(`/host/${quizId}/game?session=${response.session.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Memuat...</div>
      </div>
    )
  }

  const optionLabels = ['A', 'B', 'C', 'D']
  const optionColors = ['bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/host" className="text-white hover:text-white/80">
            ← Kembali
          </Link>
        </div>

        <div className="qooz-card mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{quiz?.judul}</h1>
          <p className="text-gray-500">{quiz?.deskripsi || 'Tidak ada deskripsi'}</p>
          <p className="text-purple-600 font-medium mt-2">{questions.length} soal</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setEditingQuestion(null)
              setNewQuestion({
                teks_soal: '',
                opsi_1: '',
                opsi_2: '',
                opsi_3: '',
                opsi_4: '',
                jawaban_benar: 1,
                waktu_detik: 20
              })
              setShowQuestionModal(true)
            }}
            className="qooz-btn qooz-btn-primary"
          >
            + Tambah Soal
          </button>
          
          {questions.length > 0 && (
            <button
              onClick={startGame}
              className="qooz-btn qooz-btn-green"
            >
              ▶ Mulai Game
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="qooz-card text-center py-12">
            <p className="text-gray-500">Belum ada soal</p>
            <button
              onClick={() => setShowQuestionModal(true)}
              className="qooz-btn qooz-btn-primary mt-4"
            >
              Tambah Soal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {questions.map((q, idx) => (
              <div key={q.id} className="qooz-card group relative">
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <button
                  onClick={() => editQuestion(q)}
                  className="absolute top-4 right-14 w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✎
                </button>
                
                <div className="flex items-start gap-4">
                  <span className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-3">{q.teks_soal}</p>
                    <div className="grid md:grid-cols-2 gap-2">
                      {[q.opsi_1, q.opsi_2, q.opsi_3, q.opsi_4].map((opt, i) => (
                        <div
                          key={i}
                          className={`${optionColors[i]} text-white px-3 py-2 rounded-lg flex items-center gap-2`}
                        >
                          <span className="font-bold">{optionLabels[i]}</span>
                          <span className="text-sm">{opt}</span>
                          {q.jawaban_benar === i + 1 && <span className="ml-auto">✓</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Waktu: {q.waktu_detik} detik
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="qooz-card w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingQuestion ? 'Edit Soal' : 'Tambah Soal'}
            </h2>
            <form onSubmit={saveQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pertanyaan
                </label>
                <textarea
                  value={newQuestion.teks_soal}
                  onChange={(e) => setNewQuestion({ ...newQuestion, teks_soal: e.target.value })}
                  className="qooz-input"
                  placeholder="Tulis pertanyaan..."
                  rows={2}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {['opsi_1', 'opsi_2', 'opsi_3', 'opsi_4'].map((key, idx) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`${optionColors[idx]} text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold`}>
                      {optionLabels[idx]}
                    </span>
                    <input
                      type="text"
                      value={newQuestion[key as keyof typeof newQuestion]}
                      onChange={(e) => setNewQuestion({ ...newQuestion, [key]: e.target.value })}
                      className="qooz-input flex-1"
                      placeholder={`Opsi ${optionLabels[idx]}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jawaban Benar
                  </label>
                  <select
                    value={newQuestion.jawaban_benar}
                    onChange={(e) => setNewQuestion({ ...newQuestion, jawaban_benar: parseInt(e.target.value) })}
                    className="qooz-input"
                  >
                    <option value={1}>Opsi A</option>
                    <option value={2}>Opsi B</option>
                    <option value={3}>Opsi C</option>
                    <option value={4}>Opsi D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu (detik)
                  </label>
                  <input
                    type="number"
                    value={newQuestion.waktu_detik}
                    onChange={(e) => setNewQuestion({ ...newQuestion, waktu_detik: parseInt(e.target.value) })}
                    className="qooz-input"
                    min={5}
                    max={120}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionModal(false)
                    setEditingQuestion(null)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 qooz-btn qooz-btn-primary"
                >
                  {editingQuestion ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
