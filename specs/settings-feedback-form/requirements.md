# Requirements — In-App Feedback Form (issue #70)

## Acceptance Criteria

### AC-1: Feedback section on Settings page
- A "Feedback" section appears at the bottom of the Settings page
- Contains a labelled `<Textarea>` and a "Submit" button
- The textarea has a visible character counter (max 2000)

### AC-2: Validation
- Submitting an empty message shows a validation error inline (does not POST)
- Message exceeding 2000 characters is rejected inline (does not POST)
- Whitespace-only message treated as empty

### AC-3: Submit behavior
- On valid submit, POSTs `{ message: string }` to `POST /api/feedback`
- Button enters loading state during the request
- On success (any 2xx) → show success toast, clear textarea
- On network error or non-2xx → show error toast (feedback still "submitted" from user POV)

### AC-4: API route — POST /api/feedback
- Validates `message`: required, trimmed, 1–2000 chars
- Returns `400` with `{ error: "..." }` on validation failure
- Fires n8n webhook (fire-and-forget): POST to `N8N_WEBHOOK_URL` with `{ message }`
- Returns `200 { success: true }` immediately after firing — does not wait for n8n
- If `N8N_WEBHOOK_URL` is not set, logs a warning and still returns `200`
- No user identity attached to the payload

### AC-5: Anonymous
- No session check on the API route — feedback is anonymous
- No user data in the n8n payload

### AC-6: i18n
- All UI strings use i18n keys under `settings.feedback.*`
- Keys present in both `locales/en.json` and `locales/id.json`
