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
- Installments: `/?view=credit-cards&creditCards=installments`
- Subscriptions: `/?view=credit-cards&creditCards=subscriptions`

Within Expenses, `expenses` query parameter controls which subsection is open:

- List of expenses: `/?view=expenses&expenses=expenses`
- Payments: `/?view=expenses&expenses=payments`

Within Settings, `settings` query parameter controls which management section is open:

- Transaction Categories: `/?view=settings&settings=transaction-categories`
- People: `/?view=settings&settings=people`
- Bank Accounts: `/?view=settings&settings=bank-accounts`
- Banks: `/?view=settings&settings=banks`
- Currency: `/?view=settings&settings=currency`

Invalid `view` values are normalized to Home.
