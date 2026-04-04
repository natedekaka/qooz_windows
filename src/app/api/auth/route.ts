import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateUUID } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, nama } = body;

    if (action === 'register') {
      if (!email || !password || !nama) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const id = generateUUID();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id,
          email,
          password_hash: password,
          nama_lengkap: nama,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.id,
          email: data.email,
          nama_lengkap: data.nama_lengkap,
        },
      });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (user && user.password_hash === password) {
        const token = generateUUID();
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            nama_lengkap: user.nama_lengkap,
          },
          token,
        });
      }

      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
