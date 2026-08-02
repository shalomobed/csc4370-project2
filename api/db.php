<?php
// Shared PDO connection -- save_score.php and get_scores.php both require
// this instead of connecting separately.

// Set up the DB from the MySQL CLI:
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

// Fill in real credentials here. Locally this is usually root/no password;
// on the school server use whatever was issued (host is still "localhost").
$DB_HOST = "localhost";
$DB_NAME = "puzzle_project";
$DB_USER = "root";
$DB_PASS = "";

// Suppress PHP errors from printing -- they'd land in the JSON body and
// break every fetch() call in script.js. Log them instead.
error_reporting(E_ALL);
ini_set('display_errors', '0');

$pdo = null;

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("db.php connection failed: " . $e->getMessage());
    $pdo = null;
}

// save_score.php / get_scores.php check `if ($pdo === null)` before
// querying and fall back gracefully if the DB isn't reachable.

// No closing tag -- avoids stray output before header() runs.
