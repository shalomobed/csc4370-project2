<?php
// Returns the top leaderboard rows as JSON for loadLeaderboard() in script.js.

require 'db.php';

header('Content-Type: application/json');

// No connection -> empty array. loadLeaderboard() already renders that the
// same as an empty localStorage list, so nothing extra needed here.
if ($pdo === null) {
    echo json_encode([]);
    exit;
}

try {
    // Sorted to match saveScoreLocally()'s ordering: time first, moves as
    // the tiebreaker. `time` is backticked since it's a bit of an odd
    // column name to leave bare.
    $stmt = $pdo->query(
        "SELECT player, variant, moves, `time`, created_at
         FROM scores
         ORDER BY `time` ASC, moves ASC
         LIMIT 5"
    );
    $scores = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Rename to the keys renderLeaderboardRows() expects, since the table
    // columns (player/variant/created_at) don't match 1:1.
    foreach ($scores as &$row) {
        $row['name'] = $row['player'];
        $row['mode'] = $row['variant'];
        $row['date'] = date('n/j/Y', strtotime($row['created_at']));
        unset($row['player'], $row['variant'], $row['created_at']);
    }
    unset($row); // break the reference from the loop above

    echo json_encode($scores);
} catch (PDOException $e) {
    error_log("get_scores.php query failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Could not load scores"]);
}
// No closing tag -- avoids stray output before header() runs.
