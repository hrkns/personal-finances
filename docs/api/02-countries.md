# Countries API

Countries are stored in database (`countries` table) and seeded through migrations.

### Country Object

```json
{
  "code": "US",
  "name": "United States"
}
```

### `GET /api/countries`

Returns all countries ordered by code.

#### Success (`200 OK`)

```json
[
  { "code": "AD", "name": "Andorra" },
  { "code": "AE", "name": "United Arab Emirates" }
]
```

### Method Not Allowed (`405`)

Any non-`GET` method returns:

```json
{
  "error": {
    "code": "method_not_allowed",
    "message": "method not allowed"
  }
}
```
