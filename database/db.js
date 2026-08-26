const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// ============================================
// DATABASE DIRECTORY
// ============================================

const databaseDirectory =
    path.join(__dirname);


// ============================================
// DATABASE FILE
// ============================================

const databasePath =
    path.join(
        databaseDirectory,
        "cbt.db"
    );


// ============================================
// CONNECT TO DATABASE
// ============================================

const db =
    new Database(databasePath);


// ============================================
// ENABLE FOREIGN KEYS
// ============================================

db.pragma("foreign_keys = ON");


// ============================================
// CREATE TABLES
// ============================================

db.exec(`

    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        email TEXT NOT NULL UNIQUE,

        password_hash TEXT NOT NULL,

        created_at TEXT
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP

    );


    CREATE TABLE IF NOT EXISTS test_attempts (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,

        course TEXT NOT NULL,

        topic TEXT NOT NULL,

        score INTEGER NOT NULL,

        total_questions INTEGER NOT NULL,

        percentage REAL NOT NULL,

        time_taken INTEGER,

        completed_at TEXT
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            user_id
        )
        REFERENCES users(id)
        ON DELETE CASCADE

    );


    CREATE TABLE IF NOT EXISTS attempt_questions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        attempt_id INTEGER NOT NULL,

        question_id TEXT,

        selected_answer TEXT,

        correct_answer TEXT,

        is_correct INTEGER NOT NULL,

        FOREIGN KEY (
            attempt_id
        )
        REFERENCES test_attempts(id)
        ON DELETE CASCADE

    );

`);


console.log(
    `SQLite database ready: ${databasePath}`
);


module.exports = db;