CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_date TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK(amount > 0),
  notes TEXT,
  person_id INTEGER NOT NULL,
  bank_account_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY(bank_account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY(category_id) REFERENCES transaction_categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date
ON transactions(transaction_date);
