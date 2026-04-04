-- =====================================================
-- QOOZ - Database Schema for Real-time Quiz App
-- Supabase SQL Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (Guru/Admin)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- QUIZZES TABLE
-- =====================================================
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    jumlah_soal INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    nomor_soal INTEGER NOT NULL,
    teks_soal TEXT NOT NULL,
    opsi_1 VARCHAR(255) NOT NULL,
    opsi_2 VARCHAR(255) NOT NULL,
    opsi_3 VARCHAR(255) NOT NULL,
    opsi_4 VARCHAR(255) NOT NULL,
    jawaban_benar INTEGER NOT NULL CHECK (jawaban_benar BETWEEN 1 AND 4),
    waktu_detik INTEGER NOT NULL DEFAULT 20,
    gambar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GAME SESSIONS TABLE
-- =====================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin VARCHAR(6) UNIQUE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
    question_index INTEGER DEFAULT -1,
    current_question_id UUID REFERENCES questions(id),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for PIN lookup
CREATE INDEX idx_game_sessions_pin ON game_sessions(pin);

-- =====================================================
-- PLAYERS TABLE (Siswa)
-- =====================================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    nama_siswa VARCHAR(100) NOT NULL,
    skor_total INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for session players lookup
CREATE INDEX idx_players_session ON players(session_id);

-- =====================================================
-- ANSWERS TABLE
-- =====================================================
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    jawaban_dipilih INTEGER,
    waktu_respon_ms INTEGER,
    is_correct BOOLEAN DEFAULT FALSE,
    poin_didapat INTEGER DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for answers lookup
CREATE INDEX idx_answers_player ON answers(player_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_session ON answers(session_id);

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================
-- Enable realtime for game_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;

-- Enable realtime for players
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Enable realtime for answers
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Users: User can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Quizzes: Owner can do all operations
CREATE POLICY "Quizzes full access for owner" ON quizzes
    FOR ALL USING (auth.uid() = user_id);

-- Questions: Owner can do all operations via quiz
CREATE POLICY "Questions full access for owner" ON questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM quizzes WHERE id = questions.quiz_id AND user_id = auth.uid())
    );

-- Game Sessions: Owner can do all, public can read by PIN
CREATE POLICY "Game sessions owner full access" ON game_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Players: Anyone can insert, session participants can read
CREATE POLICY "Anyone can join game" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can read own session" ON players
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM game_sessions WHERE id = players.session_id)
    );

-- Answers: Anyone can insert, session participants can read
CREATE POLICY "Anyone can submit answer" ON answers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Answers readable by session" ON answers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM game_sessions WHERE id = answers.session_id)
    );

-- =====================================================
-- FUNCTION: Generate 6-digit PIN
-- =====================================================
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS TEXT AS $$
DECLARE
    pin TEXT;
BEGIN
    LOOP
        pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        IF NOT EXISTS (SELECT 1 FROM game_sessions WHERE pin = pin AND status != 'finished') THEN
            RETURN pin;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Calculate points
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_points(
    p_waktu_respon_ms INTEGER,
    p_waktu_soal_detik INTEGER,
    p_is_correct BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
    max_points CONSTANT INTEGER := 1000;
    min_points CONSTANT INTEGER := 500;
    waktu_ms INTEGER;
    ratio NUMERIC;
    points INTEGER;
BEGIN
    IF NOT p_is_correct THEN
        RETURN 0;
    END IF;

    waktu_ms := p_waktu_respon_ms;
    IF waktu_ms IS NULL OR waktu_ms < 0 THEN
        waktu_ms := p_waktu_soal_detik * 1000;
    END IF;

    ratio := 1 - (waktu_ms::NUMERIC / (p_waktu_soal_detik * 1000));
    ratio := GREATEST(0, LEAST(1, ratio));
    
    points := (max_points - (max_points - min_points) * ratio)::INTEGER;
    RETURN points;
END;
$$ LANGUAGE plpgsql;
