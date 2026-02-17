CREATE TABLE IF NOT EXISTS transaction_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE,
  parent_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(parent_id) REFERENCES transaction_categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_categories_unique_root_name
ON transaction_categories(name)
WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transaction_categories_unique_child_name
ON transaction_categories(parent_id, name)
WHERE parent_id IS NOT NULL;