CREATE TABLE IF NOT EXISTS credit_card_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_id INTEGER NOT NULL,
  concept TEXT NOT NULL,
  amount REAL NOT NULL,
  start_date TEXT NOT NULL,
  count INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(credit_card_id) REFERENCES credit_cards(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_credit_card_installments_concept_not_empty CHECK(length(trim(concept)) > 0),
  CONSTRAINT chk_credit_card_installments_amount_positive CHECK(amount > 0),
  CONSTRAINT chk_credit_card_installments_count_positive CHECK(count > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_card_installments_card_concept_unique
ON credit_card_installments(credit_card_id, concept);

CREATE INDEX IF NOT EXISTS idx_credit_card_installments_credit_card_id
ON credit_card_installments(credit_card_id);
