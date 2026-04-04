-- =====================================================
-- QOOZ - Database Schema for Real-time Quiz App
-- MySQL Version
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS qooz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qooz_db;

-- =====================================================
-- USERS TABLE (Guru/Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- QUIZZES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    jumlah_soal INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    quiz_id VARCHAR(36) NOT NULL,
    nomor_soal INT NOT NULL,
    teks_soal TEXT NOT NULL,
    opsi_1 VARCHAR(255) NOT NULL,
    opsi_2 VARCHAR(255) NOT NULL,
    opsi_3 VARCHAR(255) NOT NULL,
    opsi_4 VARCHAR(255) NOT NULL,
    jawaban_benar INT NOT NULL CHECK (jawaban_benar BETWEEN 1 AND 4),
    waktu_detik INT NOT NULL DEFAULT 20,
    gambar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_id (quiz_id)
);

-- =====================================================
-- GAME SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(36) PRIMARY KEY,
    pin VARCHAR(6) UNIQUE NOT NULL,
    quiz_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'finished')),
    question_index INT DEFAULT -1,
    current_question_id VARCHAR(36),
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_pin (pin),
    INDEX idx_status (status)
);

-- =====================================================
-- PLAYERS TABLE (Siswa)
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    nama_siswa VARCHAR(100) NOT NULL,
    skor_total INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id)
);

-- =====================================================
-- ANSWERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS answers (
    id VARCHAR(36) PRIMARY KEY,
    player_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    jawaban_dipilih INT,
    waktu_respon_ms INT,
    is_correct BOOLEAN DEFAULT FALSE,
    poin_didapat INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    INDEX idx_player_id (player_id),
    INDEX idx_question_id (question_id),
    INDEX idx_session_id (session_id)
);

-- =====================================================
-- PROCEDURE: Generate 6-digit PIN
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_pin()
BEGIN
    DECLARE pin VARCHAR(6);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR SELECT LPAD(FLOOR(RAND() * 1000000), 6, '0');
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    FETCH cur INTO pin;
    CLOSE cur;
    
    SELECT pin;
END //
DELIMITER ;
