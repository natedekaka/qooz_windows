-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Waktu pembuatan: 14 Mar 2026 pada 09.40
-- Versi server: 8.0.45
-- Versi PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Basis data: `qooz_db`
--

DELIMITER $$
--
-- Prosedur
--
CREATE DEFINER=`root`@`%` PROCEDURE `generate_pin` ()   BEGIN
    DECLARE pin VARCHAR(6);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR SELECT LPAD(FLOOR(RAND() * 1000000), 6, '0');
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    FETCH cur INTO pin;
    CLOSE cur;
    
    SELECT pin;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `answers`
--

CREATE TABLE `answers` (
  `id` varchar(36) NOT NULL,
  `player_id` varchar(36) NOT NULL,
  `question_id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `jawaban_dipilih` int DEFAULT NULL,
  `waktu_respon_ms` int DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `poin_didapat` int DEFAULT '0',
  `answered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `game_sessions`
--

CREATE TABLE `game_sessions` (
  `id` varchar(36) NOT NULL,
  `pin` varchar(6) NOT NULL,
  `quiz_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'lobby',
  `question_index` int DEFAULT '-1',
  `current_question_id` varchar(36) DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data untuk tabel `game_sessions`
--

INSERT INTO `game_sessions` (`id`, `pin`, `quiz_id`, `user_id`, `status`, `question_index`, `current_question_id`, `started_at`, `ended_at`, `created_at`) VALUES
('2747e04e-621e-4463-884a-eb1beb2a8743', '316321', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'lobby', -1, NULL, NULL, NULL, '2026-03-14 08:05:50'),
('3e308780-7f00-433a-ab4f-ff8de60548a7', '820600', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'lobby', -1, NULL, NULL, NULL, '2026-03-14 08:36:34'),
('61a42529-f4fa-4199-a2da-b49749a5766f', '413717', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'finished', 1, '481dca44-614b-41e2-9c3f-c25ab328e5e1', '2026-03-14 08:49:30', '2026-03-14 08:50:27', '2026-03-14 08:48:50'),
('a3b2a94f-c137-4d75-bffa-17d45e5f62fd', '598503', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'finished', 1, '481dca44-614b-41e2-9c3f-c25ab328e5e1', '2026-03-14 08:55:28', '2026-03-14 08:59:14', '2026-03-14 08:54:54'),
('d174a1b5-a01e-4d2c-811f-9075032e622d', '298308', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'lobby', -1, NULL, NULL, NULL, '2026-03-14 04:48:05'),
('dba6d98a-a409-4c43-85f9-f4ff0c8a5eba', '840102', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'lobby', -1, NULL, NULL, NULL, '2026-03-14 08:03:11'),
('e5f1588f-30ec-4883-ae8e-c1f081eb465c', '224820', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'finished', 1, '481dca44-614b-41e2-9c3f-c25ab328e5e1', '2026-03-14 08:41:40', '2026-03-14 08:42:45', '2026-03-14 08:41:09'),
('e90bf0b2-ad5e-4aed-9a76-559ffa549d28', '095880', '0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'finished', 1, '481dca44-614b-41e2-9c3f-c25ab328e5e1', '2026-03-14 09:00:22', '2026-03-14 09:01:23', '2026-03-14 08:59:48');

-- --------------------------------------------------------

--
-- Struktur dari tabel `players`
--

CREATE TABLE `players` (
  `id` varchar(36) NOT NULL,
  `session_id` varchar(36) NOT NULL,
  `nama_siswa` varchar(100) NOT NULL,
  `skor_total` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `players`
--

INSERT INTO `players` (`id`, `session_id`, `nama_siswa`, `skor_total`, `is_active`, `joined_at`) VALUES
('05c9886b-5b31-474b-ab1d-d914670a5b8d', '61a42529-f4fa-4199-a2da-b49749a5766f', 'nate', 0, 1, '2026-03-14 08:49:23'),
('201d9830-4ec6-40de-8e7c-961057f55308', 'e5f1588f-30ec-4883-ae8e-c1f081eb465c', 'dani', 0, 1, '2026-03-14 08:41:20'),
('276c36ab-46e0-4776-82fa-890c0f08614a', 'a3b2a94f-c137-4d75-bffa-17d45e5f62fd', 'dani', 0, 1, '2026-03-14 08:55:09'),
('3c255e1e-fcce-45f3-a170-862aad5ce16f', 'a3b2a94f-c137-4d75-bffa-17d45e5f62fd', 'nate', 0, 1, '2026-03-14 08:55:21'),
('537e31a8-0fd2-445b-9546-788fdcff7656', 'e5f1588f-30ec-4883-ae8e-c1f081eb465c', 'nate', 0, 1, '2026-03-14 08:41:32'),
('63bd83ab-e440-47e0-b028-756f864171d7', '3e308780-7f00-433a-ab4f-ff8de60548a7', 'nate', 0, 1, '2026-03-14 08:36:46'),
('6e32c20d-3ec0-42dd-af9d-61a47ef41a0a', '61a42529-f4fa-4199-a2da-b49749a5766f', 'dani', 0, 1, '2026-03-14 08:49:06'),
('7e4c08e3-a33f-4355-908a-dd9d166b3e84', 'e90bf0b2-ad5e-4aed-9a76-559ffa549d28', 'nate', 0, 1, '2026-03-14 09:00:13'),
('d535297d-6c4c-4223-bafd-74f1cb159d71', 'e90bf0b2-ad5e-4aed-9a76-559ffa549d28', 'dani', 0, 1, '2026-03-14 09:00:04');

-- --------------------------------------------------------

--
-- Struktur dari tabel `questions`
--

CREATE TABLE `questions` (
  `id` varchar(36) NOT NULL,
  `quiz_id` varchar(36) NOT NULL,
  `nomor_soal` int NOT NULL,
  `teks_soal` text NOT NULL,
  `opsi_1` varchar(255) NOT NULL,
  `opsi_2` varchar(255) NOT NULL,
  `opsi_3` varchar(255) NOT NULL,
  `opsi_4` varchar(255) NOT NULL,
  `jawaban_benar` int NOT NULL,
  `waktu_detik` int NOT NULL DEFAULT '20',
  `gambar_url` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data untuk tabel `questions`
--

INSERT INTO `questions` (`id`, `quiz_id`, `nomor_soal`, `teks_soal`, `opsi_1`, `opsi_2`, `opsi_3`, `opsi_4`, `jawaban_benar`, `waktu_detik`, `gambar_url`, `created_at`) VALUES
('481dca44-614b-41e2-9c3f-c25ab328e5e1', '0c33796c-2d52-46a8-9c55-8a10d64dd612', 2, 'idih siapa', 'sapa ', 'sipi', 'supu', 'sopo', 1, 20, NULL, '2026-03-14 04:48:02'),
('af1129e2-b36c-449f-87b2-dab0d7e24817', '0c33796c-2d52-46a8-9c55-8a10d64dd612', 1, 'inet', 'ada', 'idi', 'idu', 'ido', 1, 20, NULL, '2026-03-14 04:47:36');

-- --------------------------------------------------------

--
-- Struktur dari tabel `quizzes`
--

CREATE TABLE `quizzes` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text,
  `jumlah_soal` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `quizzes`
--

INSERT INTO `quizzes` (`id`, `user_id`, `judul`, `deskripsi`, `jumlah_soal`, `created_at`, `updated_at`) VALUES
('0c33796c-2d52-46a8-9c55-8a10d64dd612', '64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'Informatika', 'BAB JKI', 2, '2026-03-14 04:42:41', '2026-03-14 04:48:02');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `nama_lengkap`, `created_at`, `updated_at`) VALUES
('64df5a3f-1226-4e95-9ffd-1fa06baa2850', 'guru@test.com', '$2y$12$CR4GPoQC8BPrzp0Z7KKfsOZldmZdnUH4hWCxzkmKufgl.TkH6WvaG', 'Guru Test', '2026-03-14 04:31:45', '2026-03-14 04:31:45');

--
-- Indeks untuk tabel yang dibuang
--

--
-- Indeks untuk tabel `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player_id` (`player_id`),
  ADD KEY `idx_question_id` (`question_id`),
  ADD KEY `idx_session_id` (`session_id`);

--
-- Indeks untuk tabel `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pin` (`pin`),
  ADD KEY `quiz_id` (`quiz_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_pin` (`pin`),
  ADD KEY `idx_status` (`status`);

--
-- Indeks untuk tabel `players`
--
ALTER TABLE `players`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_id` (`session_id`);

--
-- Indeks untuk tabel `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz_id` (`quiz_id`);

--
-- Indeks untuk tabel `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `answers_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `answers_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD CONSTRAINT `game_sessions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_sessions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ketidakleluasaan untuk tabel `players`
--
ALTER TABLE `players`
  ADD CONSTRAINT `players_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
