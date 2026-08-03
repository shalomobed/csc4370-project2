<?php
// get_scores.php
// Purpose: return the top leaderboard rows as JSON for index.html's
// loadLeaderboard() to fetch() and render into #leaderboard-body.

require 'db.php';

header('Content-Type: application/json');

// If the connection didn't come up, just hand back an empty array instead
// of a hard failure -- loadLeaderboard() already treats [] the same way
// it treats an empty localStorage array (renders the "No scores yet" row),
// so the frontend doesn't need any special-casing for this.
if ($pdo === null) {
    echo json_encode([]);
    exit;
}

try {
    // Ranked to match index.html's saveScore() sort exactly: time
    // ascending, moves as the tiebreaker.
    // `time` is backticked -- it's not a reserved word in MySQL, but some
    // strict server configs are picky about it as a bare column name.
    $stmt = $pdo->query(
        "SELECT player, variant, moves, `time`, created_at
         FROM scores
         ORDER BY `time` ASC, moves ASC
         LIMIT 5"
    );
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Reshape each row to the exact keys loadLeaderboard() reads
    // (name, mode, moves, time, date) -- the table's columns are player/
    // variant/created_at, so rename here rather than changing the schema.
    foreach ($scores as &$row) {
        $row['name'] = $row['player'];
        $row['mode'] = $row['variant'];
        $row['date'] = date('n/j/Y', strtotime($row['created_at']));
        unset($row['player'], $row['variant'], $row['created_at']);
    }
    unset($row); // break the reference from the foreach above

    // An empty table just produces $scores = [], which json_encode()s to
    // "[]" -- same "no scores yet" path as above, nothing extra to do.
    echo json_encode($scores);
} catch (PDOException $e) {
    error_log("get_scores.php query failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not load scores"]);
}
// No closing PHP tag on purpose -- see db.php.
