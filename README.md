# CSC 4370 Final Project – 15 Puzzle Game
 
Built by Shalom Obed and Kem Ahanonu
 
## File Directory
 
- `api/` — Contains the PHP files that handle the leaderboard.
- `audio/` — Contains the audio files played when a tile is moved and when a game is won.
- `images/` — Contains the images used for the puzzle themes.
- `index.html` — The HTML code.
- `styles.css` — The stylesheet.
- `script.js` — The JavaScript file that contains the game logic.
## How to Run
 
Run the project through a PHP server, then open `index.html` in a browser. You'll also need to run the SQL database.
 
To run the SQL database:
 
```sql
mysql -u your_user -p
CREATE DATABASE puzzle_project;
USE puzzle_project;
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player VARCHAR(50) NOT NULL,
    variant VARCHAR(50) NOT NULL,
    moves INT NOT NULL,
    `time` INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
 
Then update the last 4 lines of `db.php` with your SQL details:
 
```php
$DB_HOST = "localhost";
$DB_NAME = "puzzle_project";
$DB_USER = "root";
$DB_PASS = "";
```
