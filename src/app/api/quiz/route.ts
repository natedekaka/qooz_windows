import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateUUID } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    const quizId = searchParams.get('id');

    if (action === 'list') {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ quizzes: quizzes || [] });
    }

    if (action === 'detail') {
      if (!quizId) {
        return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
      }

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error || !quiz) {
        return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 });
      }

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('nomor_soal');

      if (qError) throw qError;

      return NextResponse.json({ quiz: { ...quiz, questions: questions || [] } });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Quiz GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, user_id, quiz_id, judul, deskripsi, question_id, soal, opsi_1, opsi_2, opsi_3, opsi_4, jawaban_benar, waktu_detik } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'create') {
      if (!judul) {
        return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 });
      }

      const id = generateUUID();
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          id,
          user_id,
          judul,
          deskripsi: deskripsi || '',
          jumlah_soal: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, quiz: { id: data.id, judul: data.judul } });
    }

    if (action === 'delete') {
      if (!quiz_id) {
        return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz_id)
        .eq('user_id', user_id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'add_question') {
      if (!quiz_id || !soal || !opsi_1 || !opsi_2 || !opsi_3 || !opsi_4) {
        return NextResponse.json({ error: 'Data soal tidak lengkap' }, { status: 400 });
      }

      const { data: maxData } = await supabase
        .from('questions')
        .select('nomor_soal')
        .eq('quiz_id', quiz_id)
        .order('nomor_soal', { ascending: false })
        .limit(1)
        .single();

      const nomor = (maxData?.nomor_soal || 0) + 1;
      const id = generateUUID();

      const { data, error } = await supabase
        .from('questions')
        .insert({
          id,
          quiz_id,
          nomor_soal: nomor,
          teks_soal: soal,
          opsi_1,
          opsi_2,
          opsi_3,
          opsi_4,
          jawaban_benar: jawaban_benar || 1,
          waktu_detik: waktu_detik || 20,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('quizzes')
        .update({ jumlah_soal: 1 })
        .eq('id', quiz_id)
        .increment('jumlah_soal', 1);

      return NextResponse.json({ success: true, question: { id: data.id, nomor_soal: data.nomor_soal } });
    }

    if (action === 'update_question') {
      if (!question_id || !soal) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const { error } = await supabase
        .from('questions')
        .update({
          teks_soal: soal,
          opsi_1,
          opsi_2,
          opsi_3,
          opsi_4,
          jawaban_benar: jawaban_benar || 1,
          waktu_detik: waktu_detik || 20,
        })
        .eq('id', question_id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_question') {
      if (!question_id || !quiz_id) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', question_id);

      if (error) throw error;

      await supabase
        .from('quizzes')
        .decrement('jumlah_soal', 1)
        .eq('id', quiz_id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Quiz POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
