CREATE TABLE IF NOT EXISTS expense_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(expense_id) REFERENCES expenses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY(currency_id) REFERENCES currencies(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id
ON expense_payments(expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_payments_currency_id
ON expense_payments(currency_id);

CREATE INDEX IF NOT EXISTS idx_expense_payments_payment_date
ON expense_payments(payment_date);