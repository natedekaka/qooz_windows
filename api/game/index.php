<?php
require_once __DIR__ . '/../init.php';

// Simple in-memory cache for game state (per-process)
$gameStateCache = [];

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Get shared game state for polling
if ($method === 'GET' && $action === 'state') {
    $sessionId = $_GET['session_id'] ?? '';
    $cacheKey = $sessionId;
    $cacheTime = 1; // Cache for 1 second
    
    if (!$sessionId) {
        response(['error' => 'Session ID required'], 400);
    }
    
    // Check cache first
    if (isset($gameStateCache[$cacheKey]) && (time() - $gameStateCache[$cacheKey]['cached_at']) < $cacheTime) {
        response($gameStateCache[$cacheKey]['data']);
    }
    
    // Get session - only essential fields
    $result = conn()->query("SELECT id, pin, quiz_id, status, question_index, current_question_id, started_at, ended_at FROM game_sessions WHERE id = '$sessionId'");
    $session = $result->fetch_assoc();

    if (!$session) {
        response(['error' => 'Session not found'], 404);
    }

    // Get players - optimized query
    $playersResult = conn()->query("SELECT id, nama_siswa, skor_total, is_active FROM players WHERE session_id = '$sessionId' ORDER BY skor_total DESC");
    $players = [];
    while ($row = $playersResult->fetch_assoc()) {
        $players[] = $row;
    }

    // Get current question if playing
    $question = null;
    if ($session['current_question_id']) {
        $qResult = conn()->query("SELECT * FROM questions WHERE id = '{$session['current_question_id']}'");
        $question = $qResult->fetch_assoc();
    }
    
    // Get answers for current question
    $answers = [];
    if ($session['current_question_id']) {
        $aResult = conn()->query("SELECT player_id, jawaban_dipilih, is_correct, poin_didapat FROM answers WHERE session_id = '$sessionId' AND question_id = '{$session['current_question_id']}'");
        while ($row = $aResult->fetch_assoc()) {
            $answers[] = $row;
        }
    }
    
    $responseData = [
        'session' => $session,
        'players' => $players,
        'question' => $question,
        'answers' => $answers,
        'timestamp' => time()
    ];
    
    // Cache the response
    $gameStateCache[$cacheKey] = [
        'data' => $responseData,
        'cached_at' => time()
    ];
    
    response($responseData);
}

// Get session by PIN (for player join)
if ($method === 'GET' && $action === 'by_pin') {
    $pin = $_GET['pin'] ?? '';
    
    $result = conn()->query("SELECT * FROM game_sessions WHERE pin = '$pin' AND status != 'finished'");
    $session = $result->fetch_assoc();
    
    if (!$session) {
        response(['error' => 'Game not found'], 404);
    }
    
    response(['session' => $session]);
}

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    
    // Create game session
    if ($action === 'create') {
        $quizId = $_POST['quiz_id'] ?? '';
        $userId = $_POST['user_id'] ?? '';
        
        if (!$quizId || !$userId) {
            response(['error' => 'Data tidak lengkap'], 400);
        }
        
        // Generate unique PIN
        do {
            $pin = generatePIN();
            $check = conn()->query("SELECT id FROM game_sessions WHERE pin = '$pin' AND status != 'finished'");
        } while ($check->num_rows > 0);
        
        $id = generateUUID();
        
        $stmt = conn()->prepare("INSERT INTO game_sessions (id, pin, quiz_id, user_id, status, question_index) VALUES (?, ?, ?, ?, 'lobby', -1)");
        $stmt->bind_param('ssss', $id, $pin, $quizId, $userId);
        
        if ($stmt->execute()) {
            response(['success' => true, 'session' => ['id' => $id, 'pin' => $pin]]);
        } else {
            response(['error' => 'Gagal membuat sesi'], 500);
        }
    }
    
    // Start game
    if ($action === 'start') {
        $sessionId = $_POST['session_id'] ?? '';
        
        conn()->query("UPDATE game_sessions SET status = 'playing', started_at = NOW() WHERE id = '$sessionId'");
        
        // Get first question
        $quizResult = conn()->query("SELECT quiz_id FROM game_sessions WHERE id = '$sessionId'");
        $quiz = $quizResult->fetch_assoc();
        
        $qResult = conn()->query("SELECT * FROM questions WHERE quiz_id = '{$quiz['quiz_id']}' ORDER BY nomor_soal LIMIT 1");
        $question = $qResult->fetch_assoc();
        
        if ($question) {
            conn()->query("UPDATE game_sessions SET question_index = 0, current_question_id = '{$question['id']}' WHERE id = '$sessionId'");
        }
        
        response(['success' => true, 'question' => $question]);
    }
    
    // Next question
    if ($action === 'next') {
        $sessionId = $_POST['session_id'] ?? '';
        
        // Get current session
        $result = conn()->query("SELECT * FROM game_sessions WHERE id = '$sessionId'");
        $session = $result->fetch_assoc();
        
        // Get quiz questions
        $qResult = conn()->query("SELECT * FROM questions WHERE quiz_id = '{$session['quiz_id']}' ORDER BY nomor_soal");
        $questions = [];
        while ($row = $qResult->fetch_assoc()) {
            $questions[] = $row;
        }
        
        $nextIndex = $session['question_index'] + 1;
        
        if ($nextIndex >= count($questions)) {
            // Game finished
            conn()->query("UPDATE game_sessions SET status = 'finished', ended_at = NOW() WHERE id = '$sessionId'");
            response(['success' => true, 'finished' => true]);
        } else {
            $nextQuestion = $questions[$nextIndex];
            conn()->query("UPDATE game_sessions SET question_index = $nextIndex, current_question_id = '{$nextQuestion['id']}' WHERE id = '$sessionId'");
            response(['success' => true, 'question' => $nextQuestion, 'finished' => false]);
        }
    }
    
    // End question (calculate scores)
    if ($action === 'end_question') {
        $sessionId = $_POST['session_id'] ?? '';
        
        $result = conn()->query("SELECT * FROM game_sessions WHERE id = '$sessionId'");
        $session = $result->fetch_assoc();
        
        if (!$session['current_question_id']) {
            response(['error' => 'No active question'], 400);
        }
        
        // Get question
        $qResult = conn()->query("SELECT * FROM questions WHERE id = '{$session['current_question_id']}'");
        $question = $qResult->fetch_assoc();
        
        // Debug: log what's being compared
        error_log("end_question: session_id=$sessionId, question_id={$session['current_question_id']}, jawaban_benar={$question['jawaban_benar']}");
        
        // Get answers for THIS question (current_question_id)
        $aResult = conn()->query("SELECT * FROM answers WHERE session_id = '$sessionId' AND question_id = '{$session['current_question_id']}'");
        
        // Debug: log each answer
        while ($answer = $aResult->fetch_assoc()) {
            error_log("Checking answer: jawaban_dipilih={$answer['jawaban_dipilih']}, jawaban_benar={$question['jawaban_benar']}, match=" . ($answer['jawaban_dipilih'] == $question['jawaban_benar']));
        }
        
        // Reset pointer for actual processing
        $aResult = conn()->query("SELECT * FROM answers WHERE session_id = '$sessionId' AND question_id = '{$session['current_question_id']}'");
        
        // Debug: log what's being compared
        error_log("end_question: session_id=$sessionId, question_id={$session['current_question_id']}, jawaban_benar={$question['jawaban_benar']}");
        
        while ($answer = $aResult->fetch_assoc()) {
            // Explicitly cast to integers for comparison
            $jawabanDipilih = intval($answer['jawaban_dipilih']);
            $jawabanBenar = intval($question['jawaban_benar']);
            $isCorrect = ($jawabanDipilih === $jawabanBenar);
            $points = 0;
            
            if ($isCorrect) {
                $waktuMs = $answer['waktu_respon_ms'] ?? ($question['waktu_detik'] * 1000);
                $waktuMs = max(0, min($waktuMs, $question['waktu_detik'] * 1000));
                
                $maxPoints = 1000;
                $minPoints = 500;
                $ratio = 1 - ($waktuMs / ($question['waktu_detik'] * 1000));
                $ratio = max(0, min(1, $ratio));
                $points = round($maxPoints - ($maxPoints - $minPoints) * $ratio);
                $points = max($minPoints, $points);
            }
            
            // Update answer
            conn()->query("UPDATE answers SET is_correct = " . ($isCorrect ? 1 : 0) . ", poin_didapat = $points WHERE id = '{$answer['id']}'");
            
            // Update player score
            if ($points > 0) {
                conn()->query("UPDATE players SET skor_total = skor_total + $points WHERE id = '{$answer['player_id']}'");
            }
        }
        
        // Get updated players
        $pResult = conn()->query("SELECT * FROM players WHERE session_id = '$sessionId' ORDER BY skor_total DESC");
        $players = [];
        while ($row = $pResult->fetch_assoc()) {
            $players[] = $row;
        }
        
        response(['success' => true, 'players' => $players, 'question' => $question]);
    }
}

response(['error' => 'Method tidak valid'], 405);
