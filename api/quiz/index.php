<?php
require_once __DIR__ . '/../init.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper to get user from token (simplified - in production use proper auth)
function getUserFromRequest() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $_COOKIE['qooz_token'] ?? '';
    
    // For simplicity, we'll use user_id from POST
    return $_POST['user_id'] ?? null;
}

if ($method === 'GET' && $action === 'list') {
    $userId = $_GET['user_id'] ?? '';
    
    if (!$userId) {
        response(['error' => 'Unauthorized'], 401);
    }
    
    $result = conn()->query("SELECT * FROM quizzes WHERE user_id = '$userId' ORDER BY created_at DESC");
    $quizzes = [];
    
    while ($row = $result->fetch_assoc()) {
        $quizzes[] = $row;
    }
    
    response(['quizzes' => $quizzes]);
}

if ($method === 'GET' && $action === 'detail') {
    $quizId = $_GET['id'] ?? '';
    
    $result = conn()->query("SELECT * FROM quizzes WHERE id = '$quizId'");
    $quiz = $result->fetch_assoc();
    
    if (!$quiz) {
        response(['error' => 'Kuis tidak ditemukan'], 404);
    }
    
    $questionsResult = conn()->query("SELECT * FROM questions WHERE quiz_id = '$quizId' ORDER BY nomor_soal");
    $questions = [];
    
    while ($row = $questionsResult->fetch_assoc()) {
        $questions[] = $row;
    }
    
    $quiz['questions'] = $questions;
    
    response(['quiz' => $quiz]);
}

if ($method === 'POST') {
    $userId = $_POST['user_id'] ?? '';
    $action = $_POST['action'] ?? '';
    
    if (!$userId) {
        response(['error' => 'Unauthorized'], 401);
    }
    
    if ($action === 'create') {
        $judul = $_POST['judul'] ?? '';
        $deskripsi = $_POST['deskripsi'] ?? '';
        
        if (!$judul) {
            response(['error' => 'Judul wajib diisi'], 400);
        }
        
        $id = generateUUID();
        
        $stmt = conn()->prepare("INSERT INTO quizzes (id, user_id, judul, deskripsi, jumlah_soal) VALUES (?, ?, ?, ?, 0)");
        $stmt->bind_param('ssss', $id, $userId, $judul, $deskripsi);
        
        if ($stmt->execute()) {
            response(['success' => true, 'quiz' => ['id' => $id, 'judul' => $judul]]);
        } else {
            response(['error' => 'Gagal membuat kuis'], 500);
        }
    }
    
    if ($action === 'delete') {
        $quizId = $_POST['quiz_id'] ?? '';
        
        conn()->query("DELETE FROM quizzes WHERE id = '$quizId' AND user_id = '$userId'");
        
        response(['success' => true]);
    }
    
    if ($action === 'add_question') {
        $quizId = $_POST['quiz_id'] ?? '';
        $soal = $_POST['soal'] ?? '';
        $opsi1 = $_POST['opsi_1'] ?? '';
        $opsi2 = $_POST['opsi_2'] ?? '';
        $opsi3 = $_POST['opsi_3'] ?? '';
        $opsi4 = $_POST['opsi_4'] ?? '';
        $jawaban = $_POST['jawaban_benar'] ?? 1;
        $waktu = $_POST['waktu_detik'] ?? 20;
        
        // Get next question number
        $result = conn()->query("SELECT MAX(nomor_soal) as max_no FROM questions WHERE quiz_id = '$quizId'");
        $row = $result->fetch_assoc();
        $nomor = ($row['max_no'] ?? 0) + 1;
        
        $id = generateUUID();
        
        $stmt = conn()->prepare("INSERT INTO questions (id, quiz_id, nomor_soal, teks_soal, opsi_1, opsi_2, opsi_3, opsi_4, jawaban_benar, waktu_detik) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssisssssii', $id, $quizId, $nomor, $soal, $opsi1, $opsi2, $opsi3, $opsi4, $jawaban, $waktu);
        
        if ($stmt->execute()) {
            // Update quiz jumlah_soal
            conn()->query("UPDATE quizzes SET jumlah_soal = jumlah_soal + 1 WHERE id = '$quizId'");
            
            response(['success' => true, 'question' => ['id' => $id, 'nomor_soal' => $nomor]]);
        } else {
            response(['error' => 'Gagal menambahkan soal'], 500);
        }
    }
    
    if ($action === 'update_question') {
        $questionId = $_POST['question_id'] ?? '';
        $soal = $_POST['soal'] ?? '';
        $opsi1 = $_POST['opsi_1'] ?? '';
        $opsi2 = $_POST['opsi_2'] ?? '';
        $opsi3 = $_POST['opsi_3'] ?? '';
        $opsi4 = $_POST['opsi_4'] ?? '';
        $jawaban = $_POST['jawaban_benar'] ?? 1;
        $waktu = $_POST['waktu_detik'] ?? 20;
        
        $stmt = conn()->prepare("UPDATE questions SET teks_soal = ?, opsi_1 = ?, opsi_2 = ?, opsi_3 = ?, opsi_4 = ?, jawaban_benar = ?, waktu_detik = ? WHERE id = ?");
        $stmt->bind_param('sssssiis', $soal, $opsi1, $opsi2, $opsi3, $opsi4, $jawaban, $waktu, $questionId);
        
        if ($stmt->execute()) {
            response(['success' => true]);
        } else {
            response(['error' => 'Gagal update soal'], 500);
        }
    }
    
    if ($action === 'delete_question') {
        $questionId = $_POST['question_id'] ?? '';
        $quizId = $_POST['quiz_id'] ?? '';
        
        conn()->query("DELETE FROM questions WHERE id = '$questionId'");
        conn()->query("UPDATE quizzes SET jumlah_soal = jumlah_soal - 1 WHERE id = '$quizId'");
        
        response(['success' => true]);
    }
}

response(['error' => 'Method tidak valid'], 405);
