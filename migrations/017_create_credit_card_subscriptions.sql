CREATE TABLE IF NOT EXISTS credit_card_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_card_id INTEGER NOT NULL,
  currency_id INTEGER NOT NULL,
  concept TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(credit_card_id) REFERENCES credit_cards(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY(currency_id) REFERENCES currencies(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_credit_card_subscriptions_concept_not_empty CHECK(length(trim(concept)) > 0),
  CONSTRAINT chk_credit_card_subscriptions_amount_positive CHECK(amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_credit_card_subscriptions_credit_card_id
ON credit_card_subscriptions(credit_card_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_subscriptions_currency_id
ON credit_card_subscriptions(currency_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_card_subscriptions_card_currency_concept_unique
ON credit_card_subscriptions(credit_card_id, currency_id, concept);
