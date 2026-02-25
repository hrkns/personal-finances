CREATE TABLE IF NOT EXISTS credit_card_cycle_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_cycle_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  paid INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(credit_card_cycle_id) REFERENCES credit_card_cycles(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY(currency_id) REFERENCES currencies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_credit_card_cycle_balances_cycle_id
ON credit_card_cycle_balances(credit_card_cycle_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_cycle_balances_currency_id
ON credit_card_cycle_balances(currency_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_card_cycle_balances_cycle_currency_unique
ON credit_card_cycle_balances(credit_card_cycle_id, currency_id);
