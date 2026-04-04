import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateUUID } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, pin, nama, player_id, question_id, session_id, jawaban, waktu_ms } = body;

    if (action === 'join') {
      if (!pin || !nama) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('pin', pin)
        .neq('status', 'finished')
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Game tidak ditemukan' }, { status: 404 });
      }

      if (session.status === 'finished') {
        return NextResponse.json({ error: 'Game sudah selesai' }, { status: 400 });
      }

      const id = generateUUID();
      const { data, error } = await supabase
        .from('players')
        .insert({
          id,
          session_id: session.id,
          nama_siswa: nama,
          skor_total: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        player: {
          id: data.id,
          session_id: data.session_id,
          nama_siswa: data.nama_siswa,
          skor_total: data.skor_total,
        },
      });
    }

    if (action === 'answer') {
      if (!player_id || !question_id || !session_id) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const { data: playerCheck } = await supabase
        .from('players')
        .select('id, nama_siswa')
        .eq('id', player_id)
        .single();

      if (!playerCheck) {
        return NextResponse.json({ error: 'Player tidak ditemukan' }, { status: 404 });
      }

      const { data: sessionCheck } = await supabase
        .from('game_sessions')
        .select('id, current_question_id, status')
        .eq('id', session_id)
        .single();

      if (!sessionCheck) {
        return NextResponse.json({ error: 'Session tidak ditemukan' }, { status: 404 });
      }

      if (sessionCheck.status === 'finished') {
        return NextResponse.json({ error: 'Game sudah selesai' }, { status: 400 });
      }

      const { data: existingAnswer } = await supabase
        .from('answers')
        .select('id')
        .eq('player_id', player_id)
        .eq('question_id', question_id)
        .single();

      if (existingAnswer) {
        return NextResponse.json({ error: 'Sudah menjawab' }, { status: 400 });
      }

      const id = generateUUID();
      const { error } = await supabase
        .from('answers')
        .insert({
          id,
          player_id,
          question_id,
          session_id,
          jawaban_dipilih: parseInt(jawaban) || 0,
          waktu_respon_ms: parseInt(waktu_ms) || 0,
        });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'score') {
      if (!player_id) {
        return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      }

      const { data: player } = await supabase
        .from('players')
        .select('id, nama_siswa, skor_total, session_id')
        .eq('id', player_id)
        .single();

      if (!player) {
        return NextResponse.json({ error: 'Player tidak ditemukan' }, { status: 404 });
      }

      const { count: rankCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', player.session_id)
        .gt('skor_total', player.skor_total);

      const { count: totalCount } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', player.session_id);

      return NextResponse.json({
        player,
        rank: (rankCount || 0) + 1,
        total: totalCount || 0,
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Player POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const playerId = searchParams.get('player_id');

    if (action === 'state') {
      if (!playerId) {
        return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
      }

      const { data: player } = await supabase
        .from('players')
        .select('id, nama_siswa, skor_total, session_id, is_active')
        .eq('id', playerId)
        .single();

      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }

      const { data: session } = await supabase
        .from('game_sessions')
        .select('id, status, question_index, current_question_id')
        .eq('id', player.session_id)
        .single();

      let question = null;
      if (session?.current_question_id) {
        const { data: q } = await supabase
          .from('questions')
          .select('id, teks_soal, opsi_1, opsi_2, opsi_3, opsi_4, jawaban_benar, waktu_detik')
          .eq('id', session.current_question_id)
          .single();
        question = q;
      }

      let answered = false;
      let myAnswer = null;
      if (question) {
        const { data: a } = await supabase
          .from('answers')
          .select('id, jawaban_dipilih, is_correct')
          .eq('player_id', playerId)
          .eq('question_id', question.id)
          .single();

        if (a) {
          answered = true;
          myAnswer = a;
        }
      }

      return NextResponse.json({
        player: {
          id: player.id,
          nama_siswa: player.nama_siswa,
          skor_total: player.skor_total,
          is_active: player.is_active,
        },
        session: {
          id: session?.id,
          status: session?.status,
          question_index: session?.question_index,
          current_question_id: session?.current_question_id,
        },
        question,
        answered,
        my_answer: myAnswer,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Player GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
