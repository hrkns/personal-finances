# Fetch Mock Structure

This folder contains the modularized integration `fetch` mock used by frontend integration tests.

## Layout

- `helpers.js`: shared utilities and in-memory store factory.
- `handlers/`: one module per route area.
- `../integration-fetch-mock.js`: composition root that wires handlers in evaluation order.

## Conventions

- Keep helpers generic and reusable across handlers.
- Keep handlers focused on one route pattern (collection or `/{id}`).
- Handler signature must be:

```js
(pathname, method, options, stores) => Response | null
```

- Return `null` when the handler does not match the route/method.
- Mutate only the relevant store segment in `stores`.
- Reuse helper response builders (`invalidPayload`, `notFound`, `conflict`) for consistency.

## Adding a New Endpoint Mock

1. Add/extend store fields in `helpers.js` if needed.
2. Create a handler module in `handlers/` (or split collection vs by-id).
3. Import and register the handler in `../integration-fetch-mock.js`.
4. Place handler in the array with correct priority (more specific before fallback-like handlers).
5. Run `npm run test:frontend`.
