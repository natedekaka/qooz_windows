const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchAPI(endpoint: string, data?: Record<string, any>) {
  const url = `${API_BASE}/${endpoint}`;

  try {
    let response;
    if (data) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } else {
      response = await fetch(url);
    }

    return await response.json();
  } catch (err) {
    console.error('API fetch error:', err);
    return { error: 'Network error' };
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchAPI('auth', { action: 'login', email, password }),
    register: (email: string, password: string, nama: string) =>
      fetchAPI('auth', { action: 'register', email, password, nama }),
  },

  quiz: {
    list: (userId: string) =>
      fetchAPI('quiz?action=list&user_id=' + userId),
    detail: (id: string) =>
      fetchAPI('quiz?action=detail&id=' + id),
    create: (userId: string, judul: string, deskripsi: string) =>
      fetchAPI('quiz', { action: 'create', user_id: userId, judul, deskripsi }),
    delete: (userId: string, quizId: string) =>
      fetchAPI('quiz', { action: 'delete', user_id: userId, quiz_id: quizId }),
    addQuestion: (userId: string, quizId: string, soal: string, opsi1: string, opsi2: string, opsi3: string, opsi4: string, jawaban: number, waktu: number) =>
      fetchAPI('quiz', { action: 'add_question', user_id: userId, quiz_id: quizId, soal, opsi_1: opsi1, opsi_2: opsi2, opsi_3: opsi3, opsi_4: opsi4, jawaban_benar: jawaban, waktu_detik: waktu }),
    updateQuestion: (userId: string, questionId: string, soal: string, opsi1: string, opsi2: string, opsi3: string, opsi4: string, jawaban: number, waktu: number) =>
      fetchAPI('quiz', { action: 'update_question', user_id: userId, question_id: questionId, soal, opsi_1: opsi1, opsi_2: opsi2, opsi_3: opsi3, opsi_4: opsi4, jawaban_benar: jawaban, waktu_detik: waktu }),
    deleteQuestion: (userId: string, quizId: string, questionId: string) =>
      fetchAPI('quiz', { action: 'delete_question', user_id: userId, quiz_id: quizId, question_id: questionId }),
  },

  game: {
    create: (quizId: string, userId: string) =>
      fetchAPI('game', { action: 'create', quiz_id: quizId, user_id: userId }),
    state: (sessionId: string) =>
      fetchAPI('game?action=state&session_id=' + sessionId),
    byPin: (pin: string) =>
      fetchAPI('game?action=by_pin&pin=' + pin),
    start: (sessionId: string) =>
      fetchAPI('game', { action: 'start', session_id: sessionId }),
    next: (sessionId: string) =>
      fetchAPI('game', { action: 'next', session_id: sessionId }),
    endQuestion: (sessionId: string) =>
      fetchAPI('game', { action: 'end_question', session_id: sessionId }),
  },

  player: {
    join: (pin: string, nama: string) =>
      fetchAPI('player', { action: 'join', pin, nama }),
    answer: (playerId: string, questionId: string, sessionId: string, jawaban: number, waktuMs: number) =>
      fetchAPI('player', { action: 'answer', player_id: playerId, question_id: questionId, session_id: sessionId, jawaban, waktu_ms: waktuMs }),
    score: (playerId: string) =>
      fetchAPI('player', { action: 'score', player_id: playerId }),
    state: (playerId: string) =>
      fetchAPI('player?action=state&player_id=' + playerId),
  },
}
