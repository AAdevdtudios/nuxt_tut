# Frontend Integration

Current frontend contract for the focused GapAI beta.

Use:
- base API URL: `http://localhost:5296`
- student frontend origin in local dev: `http://localhost:3000`
- admin frontend origin in local dev: `http://localhost:3001`
- auth header for protected routes: `Authorization: Bearer <accessToken>`

Response headers:
- `X-Request-Id`: returned on every response. If the client sends `X-Request-Id`, the server echoes it.
- `X-Trace-Id`: server-side trace id for log correlation.

## Current Product Direction

**2026-06-28 update: diagnostic-based placement is removed.** GapAI no longer scores a
speculative diagnostic test to guess where a student should start. The new loop is:

1. User provides study material.
2. Backend extracts topics from the material (status `topics_pending_confirmation`).
3. User reviews the extracted topics and confirms (and may rename) the ones they actually
   want to study — `PATCH /study-sessions/{sessionId}/topics/confirm`.
4. The first confirmed topic activates as the current path. Unconfirmed topics stay locked
   but are not deleted, so the student can confirm more later.
5. User practices the active path through three real stages: **Initial Practice → Targeted
   Revision → Retest**.
6. Passing all three stages on real attempt scores marks the topic **mastered** and unlocks
   the next confirmed topic. Failing keeps the current stage active.
7. A mastered topic is scheduled for spaced review (`topics[].nextReviewAtUtc`, ~3 days out)
   instead of disappearing from the plan.

There is no AI-generated score range, no 0–200 scale, and no diagnostic test anywhere in this
flow. Every status change is driven by a real `StudySessionAttempt` score.

Frontend should render backend state. Frontend should not decide path progression.

### Legacy diagnostic flow (deprecated)

`diagnostic_pending` / `diagnostic_ready` statuses and `POST /study-sessions/{sessionId}/diagnostic/answers`
still exist in the backend only so study sessions created before this change keep working.
Do not build new frontend flows against them — new sessions never enter these statuses.

## Removed Active Routes

Do not build against these old product surfaces:

- `/notes*`
- `/projects*`
- `/library*`
- `/uploads*`
- `/reports*`
- `/research*`
- `/api/ai*`
- `/analytics*`
- `/weather*`

The source-material tables still exist internally because study sessions need durable uploaded content and chunks.

## Error Shape

All errors return:

```json
{
  "error": "Human-readable message",
  "code": "Validation|Unauthorized|Forbidden|NotFound|Conflict|MethodNotAllowed|UnsupportedMediaType|RateLimited|ServerError",
  "errors": {}
}
```

Use HTTP status as the source of truth.

## Auth

### Register

`POST /auth/register`

```json
{
  "email": "user@example.com",
  "name": "Student Name",
  "displayName": "student_name",
  "password": "StrongPassword123"
}
```

Success `201`: returns user + access/refresh tokens.

### Login

`POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

Success `200`: returns user + access/refresh tokens.

### Refresh

`POST /auth/refresh`

```json
{
  "refreshToken": "refresh-token"
}
```

### Logout

`POST /auth/logout`

```json
{
  "refreshToken": "refresh-token"
}
```

### Current User

`GET /auth/me`

## Subscriptions

### List Plans

`GET /subscription/plans`

Success `200`:

```json
[
  {
    "code": "free",
    "name": "Free",
    "priceUsdCents": 0,
    "marketingFeatures": ["25 generated questions/month", "3 source documents"],
    "marketingCtaUrl": "",
    "monthlyQuestionLimit": 25,
    "documentLimit": 3,
    "monthlyProcessedPageLimit": 50,
    "hasCompetitiveFeatures": false,
    "hasDeepAnalytics": false
  }
]
```

### My Subscription

`GET /subscription/me`

Important usage fields:
- `questionsUsed` / `questionLimit`
- `documentsUsed` / `documentLimit`
- `processedPagesUsed` / `processedPagesLimit`

## Quick Practice

Quick practice is a standalone five-question assessment. It does not create a visible study stream, unlock learning paths, or change mastery.

### Create

`POST /quick-practice`

Auth: required
Content type: `multipart/form-data`

Provide exactly one usable source through `File`, `Text`, or `Url`.

Optional fields:
- `Title`
- `FocusTopic`
- `StudyLevel`, for example `GCSE`, `A-Level`, or `undergraduate`
- `QuestionStyle`, for example `UK exam-style`
- `Difficulty`: `easy|medium|hard|mixed`, defaults to `mixed`
- `QuestionType`: `mixed|multiple-choice|short-answer`, defaults to `mixed`

The backend always generates five questions and applies the user's question, document, page, and active-job limits.

Success `202`:

```json
{
  "practiceId": "GUID",
  "jobId": "GUID",
  "status": "pending",
  "numberOfQuestions": 5,
  "studyLevel": "GCSE",
  "questionStyle": "UK exam-style"
}
```

### Poll status

`GET /quick-practice/jobs/{jobId}`

Returns `status`, `progress`, `generatedCount`, `totalCount`, and `message`.

### Get questions

`GET /quick-practice/jobs/{jobId}/result`

- `202` while pending/running
- `200` when completed
- `400` with the standard error envelope when generation failed

The completed response deliberately excludes expected answers and marking points:

```json
{
  "jobId": "GUID",
  "status": "completed",
  "questions": [
    {
      "id": "1",
      "question": "Explain...",
      "type": "short-answer",
      "options": null,
      "difficulty": "medium"
    }
  ]
}
```

### Submit

`POST /quick-practice/jobs/{jobId}/submit`

```json
{
  "answers": [
    { "questionId": "1", "userAnswer": "..." }
  ]
}
```

Every question must have exactly one answer. A job can only be submitted once. The result contains the score, pass state, feedback, and expected answers, but no path or mastery changes.

### Delete

`DELETE /quick-practice/{practiceId}`

Deletes the temporary practice, generated job, attempt, and owned source material.

## Study Sessions

### Create Study Session

`POST /study-sessions`

Auth: required
Content type: `multipart/form-data`

Fields:
- `File`: optional PDF/DOCX/TXT/MD source file
- `Url`: optional source URL
- `Text`: optional pasted source text
- `Title`: optional title
- `StudyLevel`: optional, e.g. `GCSE`, `A-Level`, `undergraduate`, `masters`
- `QuestionStyle`: optional, e.g. `GCSE exam-style`, `A-Level exam-style`, `university problem-solving`

Send at least one of `File`, `Url`, or `Text`.

Example:

```ts
const form = new FormData();
form.append("File", selectedFile);
form.append("StudyLevel", "GCSE");
form.append("QuestionStyle", "GCSE exam-style");

const res = await fetch(`${apiBase}/study-sessions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form
});
```

Success `202`:

```json
{
  "sessionId": "GUID",
  "sourceLibraryItemId": "GUID",
  "status": "analyzing",
  "message": "Study session created. Topic analysis has started in the background."
}
```

Frontend should route to the study stream page and poll `GET /study-sessions/{sessionId}`. Once
the session reaches `topics_pending_confirmation`, stop polling and show the topic-confirmation
screen (see below).

Possible beta limit errors:
- `403`: document count, processed-page, or question quota exceeded
- `409`: too many active test jobs or a previously submitted job is submitted again

### List Study Sessions

`GET /study-sessions?search=&page=1&pageSize=20`

Success `200`:

```json
{
  "count": 1,
  "totalCount": 1,
  "page": 1,
  "pageSize": 20,
  "items": []
}
```

### Get Study Session

`GET /study-sessions/{sessionId}`

Success `200` includes:
- `status`
- `sourceLibraryItemId`
- `studyLevel`
- `questionStyle`
- `activePathKey`
- `topics[]`
- `topics[].subPaths[]`
- `topics[].isConfirmed`: whether the student has confirmed this topic into their study plan
- `topics[].isMastered`: true once every stage of this topic has been passed on real attempts
- `topics[].nextReviewAtUtc`: set once a topic is mastered; when this date has passed, the
  frontend may surface the topic again as a spaced-review prompt (backend does not yet auto-push this)

`studyLevel` and `questionStyle` are persisted on the study session. Values returned by this endpoint are authoritative; frontend should not fall back to `auto` after refresh when a saved value exists.
- `recommendation`

Important statuses:
- `analyzing`: show loading state
- `topics_pending_confirmation`: show the topic-confirmation screen; call the confirm endpoint before any practice can start
- `in_progress`: show active path and actions
- `completed`: all current paths completed
- `failed`: show failure state
- `diagnostic_pending` / `diagnostic_ready`: legacy only, see deprecation note above

Cost-control behavior:
- topic path generation is deterministic by default; backend does not call paid AI for topic maps unless `AI_STUDY_TOPIC_AI_ENABLED=true`
- prepare slides are deterministic by default; backend does not call paid AI for slides unless `AI_STUDY_SLIDE_AI_ENABLED=true`
- paid/strict question generation uses `AI_STRICT_QUESTION_GENERATION_MAX_ATTEMPTS` and defaults to `1` total model call per generated test job
- if generation quality fails in strict mode, backend returns a failed job instead of making repeated paid model calls

### Confirm Topics

`PATCH /study-sessions/{sessionId}/topics/confirm`

Call this when session `status` is `topics_pending_confirmation`. Send one entry per topic the
student decided on (topics omitted from the array are left unconfirmed/locked, not deleted).

```json
{
  "topics": [
    { "key": "cell-biology", "confirmed": true },
    { "key": "diffusion", "confirmed": true, "topic": "Diffusion and osmosis" },
    { "key": "photosynthesis", "confirmed": false }
  ]
}
```

- `key`: required, matches `topics[].key` from `GET /study-sessions/{sessionId}`
- `confirmed`: required
- `topic`: optional rename, only applied when `confirmed` is `true`

Success `200` returns the full updated `StudySessionDto` with `status` now `in_progress`, the
first confirmed topic unlocked as `activePathKey`, and `recommendation` explaining the start
point in plain language (no diagnostic score involved). At least one topic must be confirmed or
the backend returns `400`.

### Test Job Status

`GET /study-sessions/{sessionId}/tests/{jobId}`

Success `200`:

```json
{
  "jobId": "GUID",
  "status": "pending|running|completed|failed",
  "progress": 60,
  "generatedCount": 3,
  "totalCount": 5,
  "message": "Generating questions",
  "createdAtUtc": "2026-06-16T12:00:00+00:00",
  "completedAtUtc": null
}
```

Poll every 2-4 seconds while status is `pending` or `running`. Avoid aggressive polling because `429` rate limits apply.

### Test Job Result

`GET /study-sessions/{sessionId}/tests/{jobId}/result`

If still running: `202`.

If completed: `200`:

```json
{
  "jobId": "GUID",
  "status": "completed",
  "questions": [
    {
      "id": "1",
      "question": "State what is meant by diffusion.",
      "type": "short-answer",
      "options": null,
      "answer": null,
      "difficulty": "easy",
      "reason": "Diffusion is a core transport process.",
      "correctAnswers": ["Net movement of particles from high concentration to low concentration"],
      "rubric": null
    }
  ],
  "message": "Questions generated successfully."
}
```

If failed: error envelope. Stop polling and show retry action.

### Save Draft Answers

`PATCH /study-sessions/{sessionId}/tests/{jobId}/draft`

```json
{
  "currentQuestionIndex": 2,
  "answers": {
    "1": "Diffusion is movement from high to low concentration.",
    "2": "Water moves through a partially permeable membrane."
  }
}
```

### Resume Draft Answers

`GET /study-sessions/{sessionId}/tests/{jobId}/draft`

### Submit Diagnostic Answers (legacy, deprecated)

New sessions never reach `diagnostic_ready`, so new frontend code should not call this. Kept
only for study sessions created before the topic-confirmation redesign.

`POST /study-sessions/{sessionId}/diagnostic/answers`

```json
{
  "jobId": "GUID",
  "attempts": [
    {
      "question": {},
      "userAnswer": "My answer"
    }
  ]
}
```

Success `200` returns:
- `diagnosticScore`
- `scoreScale: { min: 0, max: 200 }`
- answer review results
- updated session with full path state

Answer review fields:
- `results[].score`: backend mark from `0-100`
- `results[].performanceLabel`: backend-owned display label: `strong`, `mostly_correct`, `developing`, or `needs_revision`
- `results[].correct`: legacy/backend threshold boolean; do not render this as the main student-facing label
- `results[].feedback`: feedback to show to the student
- `results[].correctAnswer` / `results[].correctAnswers`: expected answer(s) to show after submission
- if `correctAnswer` already contains the full model answer, `correctAnswers` may be `null` to avoid duplicate display
- the result object also contains top-level `performanceLabel` for the overall `averageScore`

Result display rules:
- render the text for `performanceLabel`; do not derive labels from `correct`
- recommended UI copy: `strong` → “Strong”, `mostly_correct` → “Mostly correct”, `developing` → “Developing”, `needs_revision` → “Needs revision”
- never display combinations such as “Correct — 75%”
- use `recommendation.reason` exactly as the backend explanation for the current path/stage

Calculation marking:
- frontend must not mark numeric answers itself
- backend handles calculation/numeric short answers when the expected answer has one clear numeric value
- examples like `5`, `5x`, and equivalent numeric formatting are normalized by the backend
- if a calculation question has multi-step reasoning, backend may still use semantic marking for explanation quality
- generated calculation expected answers should be shown as returned by backend and should include `Formula`, `Substitution`, and `Result`
- frontend should not invent or rewrite calculation working; if the returned expected answer looks wrong, show backend feedback/error state instead of client-side correction

Path rules:
- placement is student-confirmed, not AI-guessed; see "Confirm Topics" above — there is no diagnostic score driving which path opens first for new sessions
- backend marks paths as `review`, `unlocked`, `locked`, or `completed`
- only one path/sub-path should be active at a time
- display each stage score from `topics[].subPaths[].score`; do not reuse a diagnostic score for sub-path cards (legacy sessions may still show one)
- the three stages are now named **Initial Practice**, **Targeted Revision**, and **Retest** (previously "Map the ground" / "Training drills" / "Boss check" — rename any hardcoded labels)
- backend currently chooses stage question counts: `Initial Practice = 5`, `Targeted Revision = 10`, `Retest = 5`
- frontend must render `numberOfQuestions` returned by the test-start response and must not hardcode `15` for Retest
- `masteryScore` is stream-wide completion on a `0-1` scale; frontend displays `masteryScore * 100`
- each path contributes equally; within a path, completed stages contribute: `Initial Practice = 20%`, `Targeted Revision = 30%`, `Retest = 50%`
- attempt scores are shown separately and must not be used by frontend to recalculate mastery
- once a topic is mastered (`topics[].isMastered`), it carries a `nextReviewAtUtc` for spaced review instead of disappearing from the plan

### Prepare Path

`POST /study-sessions/{sessionId}/paths/{pathKey}/prepare`

Returns slide-style prep content for the active path.

### Start Path Practice

`POST /study-sessions/{sessionId}/paths/{pathKey}/practice`

Optional body:

```json
{
  "studyLevel": "A-Level",
  "questionStyle": "A-Level exam-style"
}
```

Success `202` returns a test job id. Poll status/result like diagnostic.

Job rules:
- backend chooses and returns `numberOfQuestions`
- backend may reduce the stage count when the active source section cannot support the larger set without repetition or invention
- while polling, treat `totalCount` from the latest job status and the completed `questions.length` as authoritative
- if an equivalent job for the same active stage is already pending/running, backend returns that stable job instead of creating another
- each user may have at most two pending/running test jobs during private beta
- quota failures return `403`; active-job saturation returns `409`

### Submit Path Practice Answers

`POST /study-sessions/{sessionId}/paths/{pathKey}/answers`

```json
{
  "jobId": "GUID",
  "attempts": [
    {
      "question": {},
      "userAnswer": "My answer"
    }
  ]
}
```

If passed:
- backend marks the current stage/path completed

Submission rules:
- `questionJobId` is required
- submit exactly one answer for each generated question ID
- backend loads the canonical questions and expected answers from the saved job; frontend question payload is not trusted for marking
- the same question job can be evaluated only once; replay returns `409`
- unlocks the next valid stage/path

If failed:
- current path remains open
- next path remains locked

### Attempt History

`GET /study-sessions/{sessionId}/attempts?page=1&pageSize=20`

`GET /study-sessions/{sessionId}/attempts/{attemptId}`

### Delete Study Session

`DELETE /study-sessions/{sessionId}?deleteSource=true`

Use `deleteSource=true` when the source material was created only for that session.

## Frontend Rules

- Do not set `Content-Type` manually for `FormData`.
- Do not decide path unlocks client-side.
- Store and reuse returned `jobId`.
- Poll status/result slowly.
- Stop polling on `failed` or error status.
- Keep question list in memory for previous/next buttons.
- Use draft endpoints if users can leave and return to an unfinished test.
- Treat `LibraryItems` IDs as internal source IDs only, not as a public library feature.

## Admin Notes

Admin surface currently remains for:
- subscription plans
- Stripe webhook receipts
- feature roadmap / coming soon
- feedback and support moderation
- system logs and permissions where still registered

Do not build admin pages for removed project/library/report moderation routes.
