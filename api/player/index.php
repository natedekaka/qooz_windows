<?php
require_once __DIR__ . '/../init.php';

$method = $_SERVER['REQUEST_METHOD'];

// Join game
if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'join') {
        $pin = $_POST['pin'] ?? '';
        $nama = $_POST['nama'] ?? '';
        
        if (!$pin || !$nama) {
            response(['error' => 'Data tidak lengkap'], 400);
        }
        
        // Find session
        $result = conn()->query("SELECT * FROM game_sessions WHERE pin = '$pin' AND status != 'finished'");
        $session = $result->fetch_assoc();
        
        if (!$session) {
            response(['error' => 'Game tidak ditemukan'], 404);
        }
        
        if ($session['status'] === 'finished') {
            response(['error' => 'Game sudah selesai'], 400);
        }
        
        $id = generateUUID();
        
        $stmt = conn()->prepare("INSERT INTO players (id, session_id, nama_siswa, skor_total) VALUES (?, ?, ?, 0)");
        $stmt->bind_param('sss', $id, $session['id'], $nama);
        
        if ($stmt->execute()) {
            response([
                'success' => true,
                'player' => [
                    'id' => $id,
                    'session_id' => $session['id'],
                    'nama_siswa' => $nama,
                    'skor_total' => 0
                ]
            ]);
        } else {
            response(['error' => 'Gagal join game'], 500);
        }
    }
    
    // Submit answer
    if ($action === 'answer') {
        $playerId = $_POST['player_id'] ?? '';
        $questionId = $_POST['question_id'] ?? '';
        $sessionId = $_POST['session_id'] ?? '';
        $jawaban = $_POST['jawaban'] ?? 0;
        $waktuMs = $_POST['waktu_ms'] ?? 0;
        
        error_log("answer action: player_id=$playerId, question_id=$questionId, session_id=$sessionId, jawaban=$jawaban, waktuMs=$waktuMs");
        
        if (!$playerId || !$questionId || !$sessionId) {
            error_log("answer error: Data tidak lengkap");
            response(['error' => 'Data tidak lengkap'], 400);
        }
        
        // Check if player exists
        $playerCheck = conn()->query("SELECT id, nama_siswa FROM players WHERE id = '$playerId'");
        if ($playerCheck->num_rows === 0) {
            error_log("answer error: Player tidak ditemukan, id=$playerId");
            response(['error' => 'Player tidak ditemukan'], 404);
        }
        $playerData = $playerCheck->fetch_assoc();
        
        // Check if session exists and is active
        $sessionCheck = conn()->query("SELECT id, current_question_id, status FROM game_sessions WHERE id = '$sessionId'");
        if ($sessionCheck->num_rows === 0) {
            error_log("answer error: Session tidak ditemukan, id=$sessionId");
            response(['error' => 'Session tidak ditemukan'], 404);
        }
        $sessionData = $sessionCheck->fetch_assoc();
        
        // Check if game is still active
        if ($sessionData['status'] === 'finished') {
            error_log("answer error: Game sudah selesai");
            response(['error' => 'Game sudah selesai'], 400);
        }
        
        // Check if already answered for this question
        $check = conn()->query("SELECT id FROM answers WHERE player_id = '$playerId' AND question_id = '$questionId'");
        if ($check->num_rows > 0) {
            error_log("answer error: Sudah menjawab untuk soal ini");
            response(['error' => 'Sudah menjawab'], 400);
        }
        
        $id = generateUUID();
        
        // Use direct query instead of prepared statement to debug
        $jawabanInt = intval($jawaban);
        $waktuMsInt = intval($waktuMs);
        
        $sql = "INSERT INTO answers (id, player_id, question_id, session_id, jawaban_dipilih, waktu_respon_ms) VALUES ('$id', '$playerId', '$questionId', '$sessionId', $jawabanInt, $waktuMsInt)";
        error_log("answer: Executing SQL: $sql");
        
        $result = conn()->query($sql);
        
        if ($result) {
            error_log("Answer inserted successfully: id=$id, jawaban=$jawaban");
            response(['success' => true]);
        } else {
            error_log("Answer insert failed: " . conn()->error);
            response(['error' => 'Gagal submit jawaban', 'details' => conn()->error], 500);
        }
    }
    
    // Get my score
    if ($action === 'score') {
        $playerId = $_POST['player_id'] ?? '';
        
        $result = conn()->query("SELECT id, nama_siswa, skor_total, session_id FROM players WHERE id = '$playerId'");
        $player = $result->fetch_assoc();
        
        if (!$player) {
            response(['error' => 'Player tidak ditemukan'], 404);
        }
        
        // Optimized: calculate rank with subquery
        $rankResult = conn()->query("
            SELECT COUNT(*) + 1 as rank 
            FROM players 
            WHERE session_id = '{$player['session_id']}' AND skor_total > {$player['skor_total']}
        ");
        $rankData = $rankResult->fetch_assoc();
        $rank = intval($rankData['rank']);
        
        $totalResult = conn()->query("SELECT COUNT(*) as total FROM players WHERE session_id = '{$player['session_id']}'");
        $total = $totalResult->fetch_assoc()['total'];
        
        response([
            'player' => $player,
            'rank' => $rank,
            'total' => $total
        ]);
    }
}

// Get player state (for polling)
if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'state') {
        $playerId = $_GET['player_id'] ?? '';
        
        if (!$playerId) {
            response(['error' => 'Player ID required'], 400);
        }
        
        // Optimized: single query with JOIN for player + session
        $result = conn()->query("
            SELECT p.id, p.nama_siswa, p.skor_total, p.session_id, p.is_active,
                   s.status, s.question_index, s.current_question_id
            FROM players p
            JOIN game_sessions s ON p.session_id = s.id
            WHERE p.id = '$playerId'
        ");
        $player = $result->fetch_assoc();
        
        if (!$player) {
            response(['error' => 'Player not found'], 404);
        }
        
        // Get current question - only essential fields
        $question = null;
        if ($player['current_question_id']) {
            $qResult = conn()->query("SELECT id, teks_soal, opsi_1, opsi_2, opsi_3, opsi_4, jawaban_benar, waktu_detik FROM questions WHERE id = '{$player['current_question_id']}'");
            $question = $qResult->fetch_assoc();
        }
        
        // Check if already answered - optimized
        $answered = false;
        $myAnswer = null;
        if ($question) {
            $aResult = conn()->query("SELECT id, jawaban_dipilih, is_correct FROM answers WHERE player_id = '$playerId' AND question_id = '{$question['id']}'");
            if ($aResult->num_rows > 0) {
                $answered = true;
                $myAnswer = $aResult->fetch_assoc();
            }
        }
        
        // Build session object for response
        $session = [
            'id' => $player['session_id'],
            'status' => $player['status'],
            'question_index' => $player['question_index'],
            'current_question_id' => $player['current_question_id']
        ];
        
        // Remove session fields from player object
        unset($player['session_id'], $player['status'], $player['question_index'], $player['current_question_id']);
        
        response([
            'player' => $player,
            'session' => $session,
            'question' => $question,
            'answered' => $answered,
            'my_answer' => $myAnswer,
            'timestamp' => time()
        ]);
    }
}

response(['error' => 'Method tidak valid'], 405);
