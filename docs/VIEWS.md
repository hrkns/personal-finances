# Views

Frontend views are tab-based and route through the `view` query parameter:

- Home: `/?view=home` (or `/`)
- Transactions: `/?view=transactions`
- Credit Cards: `/?view=credit-cards`
- Expenses: `/?view=expenses`
- Settings: `/?view=settings`

Within Credit Cards, `creditCards` query parameter controls which subsection is open:

- Cards: `/?view=credit-cards&creditCards=cards`
- Cycles: `/?view=credit-cards&creditCards=cycles`
- Balances: `/?view=credit-cards&creditCards=balances`
- Installments: `/?view=credit-cards&creditCards=installments`
- Subscriptions: `/?view=credit-cards&creditCards=subscriptions`

Within Expenses, `expenses` query parameter controls which subsection is open:

- List of expenses: `/?view=expenses&expenses=expenses`
- Payments: `/?view=expenses&expenses=payments`

Within Settings, `settings` query parameter controls which management section is open:

- Currency: `/?view=settings&settings=currency`
- People: `/?view=settings&settings=people`
- Transaction Categories: `/?view=settings&settings=transaction-categories`
- Banks: `/?view=settings&settings=banks`
- Bank Accounts: `/?view=settings&settings=bank-accounts`

Invalid `view` values are normalized to Home.
