# JSON Export Contract

## Scope

The export is a local file generated from an authorized report. It demonstrates a documented,
structured mapping for RNDS/e-SUS compatibility; it does not submit data to any external service.

## Shape

```json
{
  "formatVersion": "1.0",
  "generatedAt": "2026-07-31T12:00:00Z",
  "reportPeriod": { "start": "2026-07-01", "end": "2026-07-31" },
  "patient": { "id": "patient-123", "birthDate": "1980-01-01" },
  "seizures": [{ "occurredAt": "2026-07-10T12:00:00Z", "occurrenceType": "GENERALIZED" }],
  "triggers": [{ "recordedAt": "2026-07-10T13:00:00Z", "cause": "SLEEP", "sleepQuality": 2, "mood": 3 }],
  "adherence": { "finalDoses": 20, "takenDoses": 18, "rate": 90 },
  "alerts": [{ "severity": "MEDIUM", "reason": "Prototype rule reference" }]
}
```

## Rules

- Include only selected-period data belonging to the authorized patient.
- Include `formatVersion` and `generatedAt` in every export.
- Omit optional fields rather than emitting invalid placeholder values.
- Validate required fields and JSON serialization before enabling local share/save.
- Never include passwords, access tokens, or unrelated patients' data.
