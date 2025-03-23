DROP TABLE IF EXISTS gambling;

CREATE TABLE gambling (
    user_id INTEGER PRIMARY KEY,
    nickname TEXT,
    last_gamble_date TEXT,
    gambling_count_today INTEGER NOT NULL DEFAULT 0,
    win_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_win_count_desc ON gambling (win_count DESC);