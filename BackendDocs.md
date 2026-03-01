# Frontend Integration

## Base assumptions
- all protected routes require `Authorization: Bearer <token>`
- all request/response bodies are JSON unless multipart upload is needed
- when validation fails, API usually returns `400`
- when auth fails, API returns `401`
- when ownership/resource check fails, API returns `404` or `403`

## Common auth routes

### Register
`POST /auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123$",
  "displayName": "Dev Therapist"
}
```

Success:
```json
{
  "userId": "GUID",
  "email": "user@example.com",
  "displayName": "Dev Therapist",
  "role": "user",
  "accessToken": "...",
  "accessTokenExpiresAtUtc": "2026-02-28T21:00:00+00:00",
  "refreshToken": "...",
  "refreshTokenExpiresAtUtc": "2026-03-07T21:00:00+00:00"
}
```

### Login
`POST /auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123$"
}
```

Success:
```json
{
  "userId": "GUID",
  "email": "user@example.com",
  "displayName": "Dev Therapist",
  "role": "user",
  "accessToken": "...",
  "accessTokenExpiresAtUtc": "2026-02-28T21:00:00+00:00",
  "refreshToken": "...",
  "refreshTokenExpiresAtUtc": "2026-03-07T21:00:00+00:00"
}
```

### Refresh token
`POST /auth/refresh`

Request:
```json
{
  "refreshToken": "..."
}
```

Success:
```json
{
  "userId": "GUID",
  "email": "user@example.com",
  "displayName": "Dev Therapist",
  "role": "user",
  "accessToken": "...",
  "accessTokenExpiresAtUtc": "2026-02-28T21:00:00+00:00",
  "refreshToken": "...",
  "refreshTokenExpiresAtUtc": "2026-03-07T21:00:00+00:00"
}
```

Use this when API returns `401` because access token expired.
Recommended frontend flow:
1. intercept `401`
2. call refresh endpoint once
3. retry failed request
4. if refresh fails, log user out

Notes:
- refresh tokens are rotated
- when refresh succeeds, replace both stored `accessToken` and `refreshToken`
- do not keep using the old refresh token after a successful refresh

### Current user profile
`GET /auth/me`

Success:
```json
{
  "id": "GUID",
  "email": "user@example.com",
  "displayName": "Dev Therapist",
  "role": "user",
  "createdAtUtc": "2026-02-28T20:00:00+00:00",
  "isLocked": false,
  "subscription": {
    "planCode": "free",
    "planName": "Free",
    "priceUsdCents": 0,
    "discountPercent": 0,
    "effectivePriceUsdCents": 0,
    "status": "Active",
    "hasCompetitiveFeatures": false,
    "hasDeepAnalytics": false,
    "allowedChatTiers": ["local-basic"],
    "isUnlimitedForTesting": true,
    "periodStartUtc": "2026-02-01T00:00:00+00:00",
    "periodEndUtc": "2026-03-01T00:00:00+00:00",
    "usage": {
      "questionsUsed": 0,
      "questionLimit": 25,
      "essayGradingsUsed": 0,
      "essayGradingsLimit": 5,
      "documentsUsed": 0,
      "documentLimit": 3,
      "processedPagesUsed": 0,
      "processedPagesLimit": 50
    }
  }
}
```

## Subscription routes

### List available plans
`GET /subscription/plans`

Success:
```json
[
  {
    "code": "free",
    "name": "Free",
    "priceUsdCents": 0,
    "monthlyQuestionLimit": 25,
    "monthlyEssayLimit": 5,
    "documentLimit": 3,
    "monthlyProcessedPageLimit": 50,
    "hasCompetitiveFeatures": false,
    "hasDeepAnalytics": false
  },
  {
    "code": "basic",
    "name": "Basic",
    "priceUsdCents": 700,
    "monthlyQuestionLimit": 250,
    "monthlyEssayLimit": 40,
    "documentLimit": 10,
    "monthlyProcessedPageLimit": 1000,
    "hasCompetitiveFeatures": false,
    "hasDeepAnalytics": false
  },
  {
    "code": "pro",
    "name": "Pro",
    "priceUsdCents": 2400,
    "monthlyQuestionLimit": 2000,
    "monthlyEssayLimit": 250,
    "documentLimit": 100,
    "monthlyProcessedPageLimit": 10000,
    "hasCompetitiveFeatures": true,
    "hasDeepAnalytics": true
  }
]
```

### Get my subscription
`GET /subscription/me`

Response shape matches the `subscription` object from `/auth/me`.

### Admin: assign plan manually
`PATCH /admin/subscription/users/{userId}`

Request:
```json
{
  "userId": "GUID",
  "planCode": "pro",
  "discountPercent": 0,
  "unlimitedTesting": true
}
```

Use this because payment provider integration is not wired yet.

## Project routes

### List projects
`GET /projects?page=1&pageSize=20&search=`

Success:
```json
{
  "items": [
    {
      "id": "GUID",
      "title": "Project title",
      "description": "...",
      "icon": 2,
      "color": "FF5733",
      "start": "2026-02-22T10:00:00+00:00",
      "end": "2026-06-30T18:00:00+00:00",
      "ownerUserId": "GUID",
      "librariesCount": 2,
      "notesCount": 3,
      "libraryIds": ["GUID", "GUID"],
      "progressScore": 41.32,
      "progressLevel": 41,
      "progressCalculatedAtUtc": "2026-02-25T21:00:00+00:00",
      "updatedAtUtc": "2026-02-25T19:33:34.224083+00:00",
      "createdAtUtc": "2026-02-25T19:24:53.878909+00:00"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 20
}
```

Use `progressLevel` for progress bars on project cards.
No extra per-project progress request is needed for list views.

### Get project by id
`GET /projects/{projectId}`

Success shape matches a single item from list response.

### Create project
`POST /projects`

Request:
```json
{
  "title": "Biology Revision",
  "description": "WAEC prep",
  "icon": 1,
  "color": "10B981",
  "start": "2026-02-22T10:00:00Z",
  "end": "2026-06-30T18:00:00Z",
  "libraryIds": ["GUID", "GUID"]
}
```

### Update project
`PATCH /projects/{projectId}`

Merge libraries by default:
```json
{
  "title": "Updated title",
  "libraryIds": ["NEW-LIBRARY-GUID"]
}
```

Replace libraries explicitly:
```json
{
  "libraryIds": ["ONLY-THIS-GUID"],
  "replaceLibraries": true
}
```

### Delete project
`DELETE /projects/{projectId}`

## Project library helper routes

### List libraries already in a project
`GET /projects/{projectId}/libraries?page=1&pageSize=20&search=&filter=All`

`filter` values:
- `All`
- `NotesOnly`
- `ExcludeNotes`

### List available libraries for attaching
`GET /projects/available-libraries?projectId={projectId}&page=1&pageSize=20&search=&filter=All`

## Explore catalog routes

Purpose:
- students can search external learning resources by title/description
- examples include resource links shaped around sites like `docsity.com`, `edubirdie.com`, `researchhub.com`, `studocu.com`, `academia.edu`
- catalog is pre-seeded on startup with a large default dataset

### List categories
`GET /catalog/categories?page=1&pageSize=20&search=`

Success:
```json
{
  "count": 12,
  "totalCount": 12,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "name": "Biology",
      "description": "Biology notes, laboratory reports, cellular biology, ecology and genetics.",
      "createdAtUtc": "2026-02-28T20:00:00+00:00"
    }
  ]
}
```

### Get category by id
`GET /catalog/categories/{categoryId}`

### List explores
`GET /catalog/explores?page=1&pageSize=20&search=&categoryId=`

Success:
```json
{
  "count": 20,
  "totalCount": 1200,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "title": "Biology cell biology study resource 1",
      "description": "Curated biology material focused on cell biology, unit 1, exam prep, revision, and assignment support.",
      "copyright": "docsity.com",
      "url": "https://docsity.com/biology/biology-cell-biology-study-resource-1",
      "categoryId": "GUID",
      "downloads": 231,
      "createdAtUtc": "2026-02-28T20:00:00+00:00",
      "updatedAtUtc": "2026-02-28T20:00:00+00:00"
    }
  ]
}
```

Search behavior:
- `search` matches `title` and `description`
- `categoryId` filters explores to one category
- frontend can combine both

### Get explore by id
`GET /catalog/explores/{exploreId}`

### Admin create category
`POST /catalog/categories`

### Admin update category
`PATCH /catalog/categories/{categoryId}`

### Admin delete category
`DELETE /catalog/categories/{categoryId}`

### Admin create explore
`POST /catalog/explores`

### Admin update explore
`PATCH /catalog/explores/{exploreId}`

### Admin delete explore
`DELETE /catalog/explores/{exploreId}`

Admin mutation routes require admin role.

## Library routes

### Create library item
For notes/urls, JSON body is used.
For docs, multipart upload is typically required.

Common create fields:
- `title`
- `type`
- `content` for notes
- `url` for urls
- `file` for docs upload

Important:
- docs creation/update is now plan-limited
- if the user exceeds document/page quota, API returns `403`

### List library items
`GET /library/items?page=1&pageSize=20&search=&type=`

If `type` is omitted, all types are returned.

### Get library item
`GET /library/items/{libraryId}`

### Update library item
`PATCH /library/items/{libraryId}`

Partial update is supported.

### Delete library item
`DELETE /library/items/{libraryId}`

## Adaptive AI routes
These are the routes frontend should use for learning features.

### 1. Start question generation
`POST /projects/{projectId}/adaptive/questions`

Random source selection:
```json
{
  "numberOfQuestions": 10,
  "sourceMode": "random",
  "focusArea": "Scientific Method",
  "additionalInstructions": "Focus on weak areas"
}
```

Single library source:
```json
{
  "numberOfQuestions": 10,
  "sourceMode": "single",
  "libraryItemId": "GUID",
  "focusArea": "Scientific Method"
}
```

Success (`202 Accepted`):
```json
{
  "projectId": "GUID",
  "jobId": "GUID",
  "status": "pending",
  "sourceMode": "random",
  "sourceLibraryCount": 3,
  "sourceLibraryIds": ["GUID", "GUID"],
  "inferredDifficulty": "medium",
  "complexityLevel": 6,
  "distributionProfile": "multiple-choice=5;short-answer=3;essay=2",
  "progressScore": 31.5,
  "progressLevel": 32,
  "modelVersion": "adaptive-progress-v2"
}
```

Important:
- question generation is quota-limited by subscription
- if `sourceMode = "single"`, `libraryItemId` is required

### 2. Poll question generation status
`GET /projects/{projectId}/adaptive/questions/status/{jobId}`

Success:
```json
{
  "jobId": "GUID",
  "status": "running",
  "progress": 10,
  "message": "Generating questions",
  "createdAtUtc": "2026-02-25T21:00:00+00:00",
  "completedAtUtc": null
}
```

Important:
- essay grading quota is enforced here
- this is the recommended route for grading all answers once

### 3. Fetch question generation result
`GET /projects/{projectId}/adaptive/questions/result/{jobId}`

Pending/running may return `202` with same shape.
Completed response:
```json
{
  "jobId": "GUID",
  "status": "completed",
  "questions": [
    {
      "id": "1",
      "question": "What is osmosis?",
      "type": "short-answer",
      "options": null,
      "answer": "movement of water across a semipermeable membrane",
      "reason": "This definition matches the source concept.",
      "difficulty": "easy",
      "correctAnswers": [
        "movement of water across a semipermeable membrane"
      ],
      "rubric": null
    }
  ],
  "message": "Completed"
}
```

### 4. Submit all answers for grading
Recommended approach: keep answers in frontend state, submit once at the end.

`POST /projects/{projectId}/adaptive/questions/evaluate`

Request:
```json
{
  "projectId": "GUID",
  "libraryItemId": "GUID",
  "attempts": [
    {
      "question": {
        "id": "1",
        "question": "What is osmosis?",
        "type": "short-answer",
        "options": null,
        "answer": "movement of water across a semipermeable membrane",
        "reason": "This definition matches the source concept.",
        "difficulty": "easy",
        "correctAnswers": [
          "movement of water across a semipermeable membrane"
        ],
        "rubric": null
      },
      "userAnswer": "movement of water across a semipermeable membrane"
    },
    {
      "question": {
        "id": "2",
        "question": "Explain why controlled variables matter.",
        "type": "essay",
        "options": null,
        "answer": null,
        "reason": "Evaluate explanation quality",
        "difficulty": "medium",
        "correctAnswers": null,
        "rubric": ["Accuracy", "Depth", "Clarity"]
      },
      "userAnswer": "Controlled variables reduce confounding factors..."
    }
  ]
}
```

Success:
```json
{
  "projectId": "GUID",
  "libraryItemId": "GUID",
  "totalQuestions": 2,
  "correctCount": 2,
  "averageScore": 92.5,
  "results": [
    {
      "questionId": "1",
      "questionType": "short-answer",
      "difficulty": "easy",
      "userAnswer": "movement of water across a semipermeable membrane",
      "correct": true,
      "score": 100,
      "feedback": "Correct answer"
    },
    {
      "questionId": "2",
      "questionType": "essay",
      "difficulty": "medium",
      "userAnswer": "Controlled variables reduce confounding factors...",
      "correct": true,
      "score": 85,
      "feedback": "Good explanation, include one concrete experiment example."
    }
  ],
  "progress": {
    "modelVersion": "adaptive-progress-v2",
    "progressScore": 43.12,
    "progressLevel": 43,
    "activityComponent": 0.31,
    "masteryComponent": 0.44,
    "contributingSignalsCount": 9,
    "calculatedAtUtc": "2026-02-25T21:00:00+00:00"
  }
}
```

Frontend use:
- show `results[]` for each answer row
- show `averageScore` for summary
- update project progress bar from `progress.progressLevel`

### 5. Get current progress report
`GET /projects/{projectId}/adaptive/progress/report`

Success:
```json
{
  "projectId": "GUID",
  "current": {
    "modelVersion": "adaptive-progress-v2",
    "progressScore": 43.12,
    "progressLevel": 43,
    "activityComponent": 0.31,
    "masteryComponent": 0.44,
    "contributingSignalsCount": 9,
    "calculatedAtUtc": "2026-02-25T21:00:00+00:00"
  },
  "attemptsInLast30Days": 12,
  "averageScoreInLast30Days": 74.8,
  "correctAnswersInLast30Days": 8,
  "totalAnswersInLast30Days": 12,
  "recentSnapshots": []
}
```

### 6. Lightweight progress read
`GET /projects/{projectId}/adaptive/progress`

Use this only when you need just the current score without analytics.

## Error response patterns

### Validation / business rule error
Usually `400`:
```json
{
  "error": "libraryItemId is required when sourceMode is 'single'."
}
```

### Forbidden / subscription limit
`403`:
```json
{
  "error": "Question quota exceeded for plan 'Free'.",
  "code": "Forbidden"
}
```

Or for some feature slices:
```json
{
  "error": "Project not found.",
  "code": "NotFound"
}
```

### Unauthorized
`401`:
```json
{
  "error": "Unauthorized"
}
```

### Not found
`404`:
```json
{
  "error": "Project not found"
}
```

### Question job not ready
`202` from result endpoint:
```json
{
  "jobId": "GUID",
  "status": "running",
  "questions": null,
  "message": "Generating questions"
}
```

## Recommended frontend polling strategy
For question generation:
1. submit generation request
2. save `jobId`
3. poll `/status/{jobId}` every 2 to 3 seconds
4. when status is `completed`, call `/result/{jobId}` once
5. stop polling on `completed` or `failed`

## Recommended frontend state strategy
For quizzes:
1. fetch generated questions
2. store full question objects client-side
3. store user answers locally as they type/select
4. do not call backend per answer by default
5. call evaluate endpoint once on submit
6. update dashboard/project cards from returned progress or refetch `/projects`

## Development/testing behavior
Current config enables unlimited access in development by default.

That means:
- your local test account will not be throttled
- plan metadata still exists and can still be shown in UI
- production can disable this with config
