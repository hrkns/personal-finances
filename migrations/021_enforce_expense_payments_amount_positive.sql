CREATE TABLE expense_payments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  currency_id INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY(currency_id) REFERENCES currencies(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO expense_payments_new (id, expense_id, amount, currency_id, payment_date, created_at, updated_at)
SELECT id, expense_id, amount, currency_id, payment_date, created_at, updated_at
FROM expense_payments;

DROP TABLE expense_payments;
ALTER TABLE expense_payments_new RENAME TO expense_payments;

CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id
ON expense_payments(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_payments_currency_id
ON expense_payments(currency_id);

CREATE INDEX IF NOT EXISTS idx_expense_payments_payment_date
ON expense_payments(payment_date);
