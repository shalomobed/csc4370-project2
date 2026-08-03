<?php
// db.php
// Purpose: create ONE shared PDO connection that save_score.php and
// get_scores.php can both `require` instead of each connecting separately.

// Reminder from the assignment: no GUI DB tools (no phpMyAdmin/Workbench).
// Create the database + table from the MySQL command-line client, e.g.:
//
//   mysql -u your_user -p
//   CREATE DATABASE puzzle_project;
//   USE puzzle_project;
//   CREATE TABLE scores (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       player VARCHAR(50) NOT NULL,
//       variant VARCHAR(50) NOT NULL,
//       moves INT NOT NULL,
//       `time` INT NOT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//   );

// --- STARTER: fill these in with your real credentials ---
// Locally (XAMPP/MAMP/etc.) "root" with no password against a DB you
// created yourself is normal. On the school server, use the MySQL
// username/password/database your department actually issued you --
// it will NOT be "root", and DB_HOST is usually still "localhost" since
// the DB typically runs on the same box as the web server.
$DB_HOST = "localhost";
$DB_NAME = "puzzle_project";
$DB_USER = "root";
$DB_PASS = "";

// On the live server, PHP warnings/notices printed to the page would land
// right in the middle of the JSON body and break every fetch().then(r =>
// r.json()) call in script.js. Log errors instead of displaying them.
error_reporting(E_ALL);
ini_set('display_errors', '0');

$pdo = null; // save_score.php / get_scores.php should check this before querying

// Try to connect. If it fails, leave $pdo as null instead of crashing --
// a raw PHP error page here would (a) leak connection details to whoever
// hits the endpoint and (b) break the JSON-only contract index.html's
// fetch() calls expect back.
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS
    );
    // Bad queries should throw instead of failing silently later on.
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Log the real error server-side only -- never put it in the JSON
    // response itself.
    error_log("db.php connection failed: " . $e->getMessage());
    $pdo = null;
}

// Both save_score.php and get_scores.php check `if ($pdo === null)` before
// running any query and respond with a JSON error/fallback in that case.
// That's the server-side half of the "fallback behavior when the database
// is unavailable" rubric item -- script.js's fetch() calls already fall
// back to localStorage if these endpoints don't return a usable response.

// No closing PHP tag on purpose: a stray blank line after "?>" would be
// output immediately when this file is require'd, before the header()
// call in get_scores.php/save_score.php runs, which corrupts the JSON
// response on a live server.
