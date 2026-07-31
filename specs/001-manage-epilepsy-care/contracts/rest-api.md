# REST API Contract (Simulated Academic Service)

## Scope

This API simulates account authentication and sharing authorization only. It is not a cloud-sync or
clinical-record API. All responses require JSON; authenticated endpoints require a bearer token.

| Method and path | Request | Success response | Rules |
| --- | --- | --- | --- |
| `POST /auth/login` | `email`, `password` | `token`, `user: { id, name, role }` | Invalid credentials return 401. |
| `GET /users/me` | none | active user profile | Requires valid token. |
| `GET /patients/{patientId}/grants` | none | grants visible to patient | Patient owner only. |
| `POST /patients/{patientId}/grants` | `medicCaretakerId` | created active grant | Patient owner only; duplicates return 409. |
| `DELETE /patients/{patientId}/grants/{grantId}` | none | revoked grant | Patient owner only; already revoked returns 404. |
| `GET /patients/{patientId}/access` | none | `{ allowed: boolean }` | Never returns clinical data. |

## Error Format

```json
{ "error": { "code": "FORBIDDEN", "message": "Access is not permitted." } }
```

Codes: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), and
`VALIDATION_ERROR` (422). Errors must not disclose another patient's clinical information.

## Contract Tests

- Invalid credentials return 401 without a token.
- A patient can create and revoke their own grant only.
- A duplicate active grant returns 409.
- After revocation, access returns `allowed: false` for that professional.
