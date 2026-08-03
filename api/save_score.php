<?php
// Receives the JSON POST from saveScore() in script.js and inserts a row
// into the scores table.

require 'db.php';

header('Content-Type: application/json');

$raw = file_get_contents('php://input');

$input = json_decode($raw, true);
if (!is_array($input)) {
    // Covers bad JSON and valid JSON that isn't an object (e.g. a bare
    // number), which would otherwise blow up on $input['player'] below.
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON body"]);
    exit;
}

if ($pdo === null) {
    http_response_code(503);
    echo json_encode(["success" => false, "error" => "Database unavailable"]);
    exit;
}

// Validate everything before touching the database.

$player = isset($input['player']) ? trim((string) $input['player']) : '';
if ($player === '' || strlen($player) > 50) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid or missing player name"]);
    exit;
}

// saveScore() sends the formatted mode name ("Tide Mode"), not the raw
// 'tide_mode' key, so that's what gets checked here.
$validVariants = ["Tide Mode", "Sunset Mode", "Galaxy Mode"];
$variant = isset($input['variant']) ? $input['variant'] : '';
if (!in_array($variant, $validVariants, true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid mode"]);
    exit;
}

$moves = $input['moves'] ?? null;
if (!is_int($moves) || $moves <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid moves value"]);
    exit;
}

// time can legitimately be 0 on a very fast solve, so no > 0 check here.
$time = $input['time'] ?? null;
if (!is_int($time) || $time < 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid time value"]);
    exit;
}

// created_at is stamped by MySQL (see schema) -- not taking a client date.

try {
    $stmt = $pdo->prepare(
        "INSERT INTO scores (player, variant, moves, `time`) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$player, $variant, $moves, $time]);

    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    error_log("save_score.php insert failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not save score"]);
}
// No closing tag -- avoids stray output before header() runs.
