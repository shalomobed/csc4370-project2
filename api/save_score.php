<?php
// save_score.php
// Purpose: receive the JSON POST body from index.html's saveScore()
// fetch() call and insert one row into the `scores` table.

require 'db.php';

header('Content-Type: application/json');

// --- STARTER: read the raw request body ---
$raw = file_get_contents('php://input');

// STEP 1: Decode the JSON body.
$input = json_decode($raw, true);
if (!is_array($input)) {
    // Covers both malformed JSON (json_decode returns null) and valid JSON
    // that isn't an object/array (e.g. a bare number or string), which
    // would otherwise throw a fatal error on the $input['player'] access
    // below instead of a clean 400 response.
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid JSON body"]);
    exit;
}

// STEP 2: Check the connection before doing anything else.
if ($pdo === null) {
    http_response_code(503);
    echo json_encode(["success" => false, "error" => "Database unavailable"]);
    exit;
}

// STEP 3: Validate every field BEFORE touching the database.

// player: trim it, reject if empty after trimming, cap length to match
// the VARCHAR(50) column.
$player = isset($input['player']) ? trim((string) $input['player']) : '';
if ($player === '' || strlen($player) > 50) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid or missing player name"]);
    exit;
}

// variant: must be one of the modes script.js actually sends. saveScore()
// stores formatted names like "Tide Mode" / "Breeze Mode" / "Sun Mode"
// (see formatModeName()), not the raw 'tide_mode' keys, so validate
// against THOSE strings.
$validVariants = ["Tide Mode", "Breeze Mode", "Sun Mode"];
$variant = isset($input['variant']) ? $input['variant'] : '';
if (!in_array($variant, $validVariants, true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid mode"]);
    exit;
}

// moves: must be a positive integer.
$moves = $input['moves'] ?? null;
if (!is_int($moves) || $moves <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid moves value"]);
    exit;
}

// time: must be a non-negative integer. A sub-1-second solve is
// legitimately 0, so we don't require > 0 here.
$time = $input['time'] ?? null;
if (!is_int($time) || $time < 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid time value"]);
    exit;
}

// We don't accept a client-supplied date/timestamp for this row -- a
// player's browser clock isn't trustworthy for a leaderboard. MySQL's
// `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` (already in the schema
// in db.php's comment) stamps it server-side instead.

// STEP 4: Insert using a PREPARED STATEMENT -- never string-concatenate
// user input into SQL.
try {
    $stmt = $pdo->prepare(
        "INSERT INTO scores (player, variant, moves, `time`) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$player, $variant, $moves, $time]);

    // STEP 5: Consistent JSON response.
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    error_log("save_score.php insert failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not save score"]);
}
// No closing PHP tag on purpose -- see db.php.
