CREATE TABLE IF NOT EXISTS credit_card_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_id INTEGER NOT NULL,
  closing_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(credit_card_id, closing_date, due_date),
  FOREIGN KEY(credit_card_id) REFERENCES credit_cards(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credit_card_cycles_credit_card_id
ON credit_card_cycles(credit_card_id);