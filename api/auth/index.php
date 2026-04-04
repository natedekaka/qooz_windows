<?php
require_once __DIR__ . '/../init.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'register') {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $nama = $_POST['nama'] ?? '';
        
        if (!$email || !$password || !$nama) {
            response(['error' => 'Data tidak lengkap'], 400);
        }
        
        $id = generateUUID();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = conn()->prepare("INSERT INTO users (id, email, password_hash, nama_lengkap) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('ssss', $id, $email, $hash, $nama);
        
        if ($stmt->execute()) {
            response([
                'success' => true,
                'user' => [
                    'id' => $id,
                    'email' => $email,
                    'nama_lengkap' => $nama
                ]
            ]);
        } else {
            response(['error' => 'Email sudah terdaftar'], 400);
        }
    }
    
    if ($action === 'login') {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        
        if (!$email || !$password) {
            response(['error' => 'Data tidak lengkap'], 400);
        }
        
        $stmt = conn()->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            if (password_verify($password, $row['password_hash'])) {
                $token = generateUUID();
                response([
                    'success' => true,
                    'user' => [
                        'id' => $row['id'],
                        'email' => $row['email'],
                        'nama_lengkap' => $row['nama_lengkap']
                    ],
                    'token' => $token
                ]);
            }
        }
        
        response(['error' => 'Email atau password salah'], 401);
    }
}

response(['error' => 'Method tidak valid'], 405);
