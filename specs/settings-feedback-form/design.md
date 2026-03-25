# Design — In-App Feedback Form (issue #70)

## API Route

### POST /api/feedback
- **File:** `src/app/api/feedback/route.ts`
- **Auth:** None (anonymous)
- **Request body:** `{ message: string }`
- **Validation schema:** `feedbackSchema` (Zod) — `message`: string, trim, min 1, max 2000
- **Behavior:**
  1. Parse + validate body with Zod
  2. Fire-and-forget: `fetch(process.env.N8N_WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ message }) })`
  3. Return `200 { success: true }` immediately (do not await the webhook fetch)
- **Error responses:**
  - `400 { error: "..." }` — Zod validation failure
  - No `500` paths exposed — webhook errors are swallowed server-side

## Domain Schema

**File:** `src/domain/schemas/feedback.ts`
```ts
export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;
```

## Components

### FeedbackSection
- **File:** `src/components/settings/FeedbackSection.tsx`
- Uses React Hook Form + Zod resolver
- Fields: `message` (Textarea, maxLength=2000, shows remaining chars)
- Submit calls `POST /api/feedback` via fetch (not TanStack Query — one-shot mutation)
- On success: toast `t("settings.feedback.success")`, reset form
- On error: toast `t("settings.feedback.error")`
- Integrated into `SettingsPage` at the bottom, after StaffSection

## i18n Keys

```json
"settings.feedback": {
  "title": "Feedback",
  "placeholder": "Tell us what's working well, what's broken, or what you wish existed…",
  "submit": "Submit feedback",
  "submitting": "Submitting…",
  "success": "Thank you! Your feedback has been submitted.",
  "error": "Something went wrong. Please try again.",
  "charsRemaining": "{{count}} characters remaining"
}
```

## .env.example Addition
```
N8N_WEBHOOK_URL="https://your-n8n-instance/webhook/..."
```

## n8n Workflow Notes
The n8n workflow (external) receives `{ message: string }` and:
1. Calls Claude API to classify: `{ actionable: boolean, type: "bug"|"enhancement"|"ux", title: string, body: string }`
2. If `actionable: true` → creates GitHub issue via GitHub API using the appropriate template format
3. Claude prompt should instruct to return JSON with those exact fields

### Suggested Claude prompt (for n8n HTTP Request node):
```
You are a product feedback classifier for a rental management app called E-Kost.

Classify this user feedback and respond with ONLY valid JSON — no markdown, no extra text.

Feedback: "{{$json.message}}"

Respond with:
{
  "actionable": true or false,
  "type": "bug" | "enhancement" | "ux",
  "title": "short issue title (max 60 chars)",
  "body": "full GitHub issue body in markdown"
}

- actionable: false if the message is spam, gibberish, too vague, or not constructive
- type: bug = something broken, enhancement = new feature/improvement, ux = usability/flow issue
- title: clear, specific, imperative (e.g. "Fix payment date not saving on mobile")
- body: include a Description section and Steps to reproduce (for bugs) or Proposed solution (for enhancements)
```
