CREATE TABLE IF NOT EXISTS credit_card_cycle_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_cycle_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  balance REAL NOT NULL,
  paid INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(credit_card_cycle_id) REFERENCES credit_card_cycles(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY(currency_id) REFERENCES currencies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_credit_card_cycle_payments_cycle_id
ON credit_card_cycle_payments(credit_card_cycle_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_cycle_payments_currency_id
ON credit_card_cycle_payments(currency_id);
