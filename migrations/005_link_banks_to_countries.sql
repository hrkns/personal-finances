CREATE TABLE IF NOT EXISTS banks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE,
  country TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, country),
  FOREIGN KEY (country) REFERENCES countries(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

INSERT INTO banks_new (id, name, country, created_at, updated_at)
SELECT id, name, country, created_at, updated_at
FROM banks;

DROP TABLE banks;
ALTER TABLE banks_new RENAME TO banks;
