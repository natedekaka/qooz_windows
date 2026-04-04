<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class Database {
    private static $instance = null;
    private $connection;

    private $host = 'db:3306';
    private $user = 'root';
    private $pass = 'rootpass';
    private $db = 'qooz_db';

    private function __construct() {
        $this->connection = new mysqli($this->host, $this->user, $this->pass, $this->db);
        
        if ($this->connection->connect_error) {
            http_response_code(500);
            die(json_encode(['error' => 'Koneksi gagal: ' . $this->connection->connect_error]));
        }

        $this->connection->query("SET time_zone = '+07:00'");
        $this->connection->set_charset("utf8mb4");
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    public function query($sql) {
        return $this->connection->query($sql);
    }

    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }

    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }

    public function getLastId() {
        return $this->connection->insert_id;
    }

    public function getAffectedRows() {
        return $this->connection->affected_rows;
    }
}

function db() {
    return Database::getInstance();
}

function conn() {
    return db()->getConnection();
}

function response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

function generatePIN() {
    return str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
}
