CREATE TABLE IF NOT EXISTS credit_card_currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(credit_card_id, currency_id),
  FOREIGN KEY(credit_card_id) REFERENCES credit_cards(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY(currency_id) REFERENCES currencies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_credit_card_currencies_credit_card_id
ON credit_card_currencies(credit_card_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_currencies_currency_id
ON credit_card_currencies(currency_id);
