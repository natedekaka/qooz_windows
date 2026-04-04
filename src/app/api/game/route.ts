import { NextRequest, NextResponse } from 'next/server';
import { supabase, generatePIN } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('session_id');
    const pin = searchParams.get('pin');

    if (action === 'state') {
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('id, pin, quiz_id, status, question_index, current_question_id, started_at, ended_at, created_at')
        .eq('id', sessionId)
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const { data: players } = await supabase
        .from('players')
        .select('id, nama_siswa, skor_total, is_active')
        .eq('session_id', sessionId)
        .order('skor_total', { ascending: false });

      let question = null;
      if (session.current_question_id) {
        const { data: q } = await supabase
          .from('questions')
          .select('*')
          .eq('id', session.current_question_id)
          .single();
        question = q;
      }

      let answers: any[] = [];
      if (session.current_question_id) {
        const { data: a } = await supabase
          .from('answers')
          .select('player_id, jawaban_dipilih, is_correct, poin_didapat')
          .eq('session_id', sessionId)
          .eq('question_id', session.current_question_id);
        answers = a || [];
      }

      return NextResponse.json({
        session,
        players: players || [],
        question,
        answers,
        timestamp: Date.now(),
      });
    }

    if (action === 'by_pin') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN required' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('pin', pin)
        .neq('status', 'finished')
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }

      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Game GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, quiz_id, user_id, session_id } = body;

    if (action === 'create') {
      if (!quiz_id || !user_id) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      let pin: string;
      let existing = true;
      while (existing) {
        pin = generatePIN();
        const { data: check } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('pin', pin)
          .neq('status', 'finished')
          .single();
        existing = !!check;
      }

      const id = generateUUID();
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          id,
          pin,
          quiz_id,
          user_id,
          status: 'lobby',
          question_index: -1,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, session: { id: data.id, pin: data.pin } });
    }

    if (action === 'start') {
      if (!session_id) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('quiz_id')
        .eq('id', session_id)
        .single();

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', session.quiz_id)
        .order('nomor_soal');

      const question = questions?.[0] || null;

      await supabase
        .from('game_sessions')
        .update({ status: 'playing', started_at: new Date().toISOString(), question_index: 0, current_question_id: question?.id || null })
        .eq('id', session_id);

      return NextResponse.json({ success: true, question });
    }

    if (action === 'next') {
      if (!session_id) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('quiz_id, question_index')
        .eq('id', session_id)
        .single();

      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', session.quiz_id)
        .order('nomor_soal');

      const nextIndex = session.question_index + 1;

      if (nextIndex >= (questions?.length || 0)) {
        await supabase
          .from('game_sessions')
          .update({ status: 'finished', ended_at: new Date().toISOString() })
          .eq('id', session_id);

        return NextResponse.json({ success: true, finished: true });
      }

      const nextQuestion = questions?.[nextIndex];

      await supabase
        .from('game_sessions')
        .update({ question_index: nextIndex, current_question_id: nextQuestion?.id })
        .eq('id', session_id);

      return NextResponse.json({ success: true, question: nextQuestion, finished: false });
    }

    if (action === 'end_question') {
      if (!session_id) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('current_question_id')
        .eq('id', session_id)
        .single();

      if (!session?.current_question_id) {
        return NextResponse.json({ error: 'No active question' }, { status: 400 });
      }

      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', session.current_question_id)
        .single();

      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('session_id', session_id)
        .eq('question_id', session.current_question_id);

      for (const answer of answers || []) {
        const jawabanDipilih = parseInt(answer.jawaban_dipilih);
        const jawabanBenar = parseInt(question.jawaban_benar);
        const isCorrect = jawabanDipilih === jawabanBenar;
        let points = 0;

        if (isCorrect) {
          const waktuMs = Math.max(0, Math.min(answer.waktu_respon_ms || 0, question.waktu_detik * 1000));
          const maxPoints = 1000;
          const minPoints = 500;
          const ratio = 1 - waktuMs / (question.waktu_detik * 1000);
          points = Math.round(Math.max(minPoints, maxPoints - (maxPoints - minPoints) * ratio));
        }

        await supabase
          .from('answers')
          .update({ is_correct: isCorrect, poin_didapat: points })
          .eq('id', answer.id);

        if (points > 0) {
          await supabase
            .from('players')
            .update({ skor_total: points })
            .eq('id', answer.player_id)
            .increment('skor_total', points);
        }
      }

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', session_id)
        .order('skor_total', { ascending: false });

      return NextResponse.json({ success: true, players: players || [], question });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Game POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
