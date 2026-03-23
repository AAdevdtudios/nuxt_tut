# Frontend Integration

This file is the frontend contract for the current backend.

Use:
- base API URL: `http://localhost:5296`
- student frontend origin in local dev: `http://localhost:3000`
- admin frontend origin in local dev: `http://localhost:3001`
- auth header for protected routes: `Authorization: Bearer <accessToken>`

Response headers:
- `X-Request-Id`: returned on every response. If the client sends `X-Request-Id`, the server echoes it.
- `X-Trace-Id`: server-side trace id for log correlation.

Important:
- most routes use `application/json`
- library create/update with file upload use `multipart/form-data`
- direct AI routes under `/api/ai/*` are currently suspended for public use and usually return `410`
- adaptive routes under `/projects/{projectId}/adaptive/*` are the active frontend AI routes

## Common Error Shapes

All endpoints now return a consistent envelope:

```json
{
  "error": "Human-readable message",
  "code": "Validation|Unauthorized|Forbidden|NotFound|Conflict|MethodNotAllowed|UnsupportedMediaType|RateLimited|ServerError",
  "errors": {
    "fieldName": ["validation message"]
  }
}
```

Notes:
- `errors` is only included for validation issues.
- There is no `statusCode` field in error bodies. Use HTTP status.

### Unauthorized
Status: `401`
```json
{
  "error": "Missing or invalid access token.",
  "code": "Unauthorized"
}
```

### Forbidden
Status: `403`
```json
{
  "error": "Admin role required.",
  "code": "Forbidden"
}
```

### Validation / business error
Status: `400`
```json
{
  "error": "Validation failed.",
  "code": "Validation",
  "errors": {
    "email": ["Email is invalid."],
    "displayName": ["'DisplayName' must not be empty."]
  }
}
```

### Not found
Status: `404`
```json
{
  "error": "Project not found",
  "code": "NotFound"
}
```

### Method not allowed
Status: `405`
```json
{
  "error": "Method not allowed",
  "code": "MethodNotAllowed"
}
```

### Rate limited
Status: `429`
```json
{
  "error": "Too many requests",
  "code": "RateLimited"
}
```

Rate limiting applies to:
- `/api/ai/*`
- `/projects/{projectId}/adaptive/*`

Current defaults (per user per minute):
- Free: `20`
- Basic: `60`
- Pro: `120`

Override with env vars:
- `RATE_LIMIT_AI_FREE_PER_MINUTE`
- `RATE_LIMIT_AI_BASIC_PER_MINUTE`
- `RATE_LIMIT_AI_PRO_PER_MINUTE`
- `RATE_LIMIT_AI_WINDOW_SECONDS` (default `60`)

Adaptive cooldowns:
- `ADAPTIVE_EVALUATION_COOLDOWN_SECONDS` (default `45`)
- `ADAPTIVE_QUESTION_COOLDOWN_SECONDS` (default `15`)

### Unsupported media type
Status: `415`
```json
{
  "error": "Unsupported media type",
  "code": "UnsupportedMediaType"
}
```

### Direct AI route suspended
Status: `410`
```json
{
  "error": "Direct question generation endpoint is temporarily suspended.",
  "code": "Gone"
}
```

## Auth Flow

Frontend storage:
- store `accessToken`
- store `refreshToken`
- on refresh success, replace both

Refresh flow:
1. protected request returns `401`
2. call `POST /auth/refresh`
3. if refresh succeeds, retry original request once
4. if refresh fails, log user out

## Authentication

### Register
- method: `POST`
- url: `/auth/register`
- auth: none
- content type: `application/json`

Request:
```json
{
  "email": "user@example.com",
  "name": "Dev Therapist",
  "displayName": "dev_therapist",
  "password": "StrongPassword123"
}
```

Backward-compatible request:
```json
{
  "email": "user@example.com",
  "name": "Dev Therapist",
  "displayName": "Dev Therapist",
  "password": "StrongPassword123"
}
```

Success `201`:
```json
{
  "userId": "GUID",
  "email": "user@example.com",
  "name": "Dev Therapist",
  "displayName": "dev_therapist",
  "role": "user",
  "accessToken": "jwt",
  "accessTokenExpiresAtUtc": "2026-03-01T12:00:00+00:00",
  "refreshToken": "refresh-token",
  "refreshTokenExpiresAtUtc": "2026-03-08T12:00:00+00:00"
}
```

Notes:
- password must be at least 8 chars
- password must contain uppercase, lowercase, number
- `name` is the real name
- `displayName` is the username
- username allowed characters: letters, numbers, `.`, `_`, `-`

### Login
- method: `POST`
- url: `/auth/login`
- auth: none
- content type: `application/json`

Request:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

Success `200`: same shape as register

Common errors:
- `401` invalid credentials
- `423` user locked
- `403` account deleted, recover it first

### Refresh token
- method: `POST`
- url: `/auth/refresh`
- auth: none
- content type: `application/json`

Request:
```json
{
  "refreshToken": "refresh-token"
}
```

Success `200`: same shape as login/register

### Logout
- method: `POST`
- url: `/auth/logout`
- auth: required
- content type: `application/json`

Request:
```json
{
  "refreshToken": "refresh-token"
}
```

Success `200`:
```json
{
  "message": "Logged out."
}
```

### Current user
- method: `GET`
- url: `/auth/me`
- auth: required

Success `200`:
```json
{
  "id": "GUID",
  "email": "user@example.com",
  "name": "Dev Therapist",
  "displayName": "dev_therapist",
  "role": "user",
  "createdAtUtc": "2026-02-28T20:00:00+00:00",
  "isLocked": false,
  "isDeleted": false,
  "deletedAtUtc": null,
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

### Update profile name
- method: `PATCH`
- url: `/auth/profile/name`
- auth: required
- content type: `application/json`

Request:
```json
{
  "name": "New Name"
}
```

Success `200`:
```json
{
  "message": "Name updated.",
  "user": {
    "id": "GUID",
    "email": "user@example.com",
    "name": "New Name",
    "displayName": "dev_therapist",
    "role": "user",
    "createdAtUtc": "2026-02-28T20:00:00+00:00"
  }
}
```

Notes:
- this only updates the real name
- email and role are not editable by the user

### Update username
- method: `PATCH`
- url: `/auth/profile/username`
- auth: required
- content type: `application/json`

Request:
```json
{
  "displayName": "new_username"
}
```

Success `200`:
```json
{
  "message": "Username updated.",
  "user": {
    "id": "GUID",
    "email": "user@example.com",
    "name": "Dev Therapist",
    "displayName": "new_username",
    "role": "user",
    "createdAtUtc": "2026-02-28T20:00:00+00:00"
  }
}
```

Notes:
- username is separate from real name
- username allowed characters: letters, numbers, `.`, `_`, `-`
- duplicate usernames return `409`

### Delete account
- method: `DELETE`
- url: `/auth/account`
- auth: required
- request body: none

Success `200`:
```json
{
  "message": "Account deleted. Use account recovery to restore access.",
  "deletedAtUtc": "2026-03-04T00:40:00+00:00"
}
```

Notes:
- this is a soft delete
- refresh tokens are revoked immediately
- login and refresh are blocked until recovery

### Recover deleted account
- method: `POST`
- url: `/auth/account/recover`
- auth: none
- content type: `application/json`

Request:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

Success `200`: same shape as login/register

Common errors:
- `401` invalid credentials
- `409` account already active

## Subscriptions

### List plans
- method: `GET`
- url: `/subscription/plans`
- auth: none

Success `200`:
```json
[
  {
    "code": "free",
    "name": "Free",
    "priceUsdCents": 0,
    "marketingFeatures": ["25 questions/month", "3 documents"],
    "marketingCtaUrl": "https://your-site.com/pricing",
    "monthlyQuestionLimit": 25,
    "monthlyEssayLimit": 5,
    "documentLimit": 3,
    "monthlyProcessedPageLimit": 50,
    "hasCompetitiveFeatures": false,
    "hasDeepAnalytics": false
  }
]
```

### My subscription
- method: `GET`
- url: `/subscription/me`
- auth: required

Success `200`: same shape as `subscription` in `/auth/me`

### Quota Troubleshooting (Documents / Questions / Chat)

If a route returns `403`, first check:
- `GET /subscription/me`

Important fields:
- `planCode`
- `isUnlimitedForTesting`
- `usage.documentsUsed` vs `usage.documentLimit`
- `usage.processedPagesUsed` vs `usage.processedPagesLimit`
- `usage.questionsUsed` vs `usage.questionLimit`
- `usage.essayGradingsUsed` vs `usage.essayGradingsLimit`
- `allowedChatTiers`

Typical `403` responses:

Document limit:
```json
{
  "error": "Document limit exceeded for plan 'Basic'.",
  "code": "Forbidden"
}
```

Processed pages limit:
```json
{
  "error": "Processed page limit exceeded for plan 'Basic'.",
  "code": "Forbidden"
}
```

Chat tier not allowed:
```json
{
  "error": "Plan 'Free' does not include chat tier 'openai-standard'."
}
```

Debug order for `403` on docs:
1. confirm current plan from `/subscription/me`
2. confirm `documentsUsed < documentLimit`
3. confirm `processedPagesUsed + newFilePages <= processedPagesLimit`
4. confirm `isUnlimitedForTesting` is expected

Admin testing override:
- method: `PATCH`
- url: `/admin/subscription/users/{userId}`
- auth: admin

Request:
```json
{
  "userId": "GUID",
  "planCode": "basic",
  "discountPercent": 0,
  "unlimitedTesting": true
}
```

Notes:
- `unlimitedTesting=true` bypasses quota checks for that user
- set `unlimitedTesting=false` to test real plan limits

### Admin assign plan
- method: `PATCH`
- url: `/admin/subscription/users/{userId}`
- auth: admin only
- content type: `application/json`

Request:
```json
{
  "userId": "GUID",
  "planCode": "pro",
  "discountPercent": 0,
  "unlimitedTesting": true
}
```

Success `200`:
```json
{
  "userId": "GUID",
  "planCode": "pro",
  "discountPercent": 0,
  "unlimitedTesting": true
}
```

## Billing (Stripe)

These routes provide subscription purchase + management via Stripe.

Required env vars (API):
- `STRIPE_ENABLED=true`
- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `STRIPE_PRICE_ID_BASIC=price_...`
- `STRIPE_PRICE_ID_PRO=price_...`
- `STRIPE_SUCCESS_URL=http://localhost:3000/settings/billing?stripe=success`
- `STRIPE_CANCEL_URL=http://localhost:3000/settings/billing?stripe=cancel`
- `STRIPE_PORTAL_RETURN_URL=http://localhost:3000/settings/billing`

### Create checkout session (subscription)
- method: `POST`
- url: `/billing/checkout`
- auth: required
- content type: `application/json`

Request:
```json
{
  "planCode": "basic"
}
```

Allowed `planCode`:
- `basic`
- `pro`

Success `200`:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "planCode": "basic"
}
```

Frontend behavior:
- open `url` in a new tab or redirect the user
- after Stripe redirects back to your success URL, call `GET /subscription/me` to refresh plan/limits

Common errors:
- `400` Stripe is not enabled or not configured
- `401` if missing JWT

### Create billing portal session
- method: `POST`
- url: `/billing/portal`
- auth: required

Success `200`:
```json
{
  "url": "https://billing.stripe.com/session/...",
  "sessionId": "bps_..."
}
```

Common errors:
- `400` if user has no Stripe customer yet (never checked out)
- `401` if missing JWT

### Stripe webhook receiver
- method: `POST`
- url: `/billing/webhook`
- auth: none (Stripe calls this)

Notes:
- this route requires the raw request body for signature verification
- Stripe must send `Stripe-Signature` header; invalid signatures return `400`
- transient internal processing errors return `500` (Stripe will retry delivery)

## Explore Catalog

These routes are public and cached.

### List categories
- method: `GET`
- url: `/catalog/categories?search=&page=1&pageSize=20`
- auth: none
- request type: query string only

Query params:
- `search`: optional string
- `page`: optional, default `1`
- `pageSize`: optional, default `20`

Success `200`:
```json
{
  "count": 2,
  "totalCount": 12,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "name": "Biology",
      "description": "Biology notes, laboratory reports, cellular biology, ecology and genetics.",
      "createdAtUtc": "2026-03-01T00:00:00+00:00"
    }
  ]
}
```

### Get category by id
- method: `GET`
- url: `/catalog/categories/{categoryId}`
- auth: none

Success `200`:
```json
{
  "id": "GUID",
  "name": "Biology",
  "description": "Biology notes, laboratory reports, cellular biology, ecology and genetics.",
  "createdAtUtc": "2026-03-01T00:00:00+00:00"
}
```

### List explores
- method: `GET`
- url: `/catalog/explores?categoryId=&search=&page=1&pageSize=20`
- auth: none
- request type: query string only

Query params:
- `categoryId`: optional GUID
- `search`: optional string
- `page`: optional, default `1`
- `pageSize`: optional, default `20`

Success `200`:
```json
{
  "count": 20,
  "totalCount": 1200,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "title": "Computer Science algorithms study resource 1",
      "description": "Curated computer science material focused on algorithms.",
      "copyright": "docsity.com",
      "url": "https://docsity.com/computer-science/example",
      "categoryId": "GUID",
      "downloads": 55,
      "createdAtUtc": "2026-03-01T00:00:00+00:00",
      "updatedAtUtc": "2026-03-01T00:00:00+00:00"
    }
  ]
}
```

### Get explore by id
- method: `GET`
- url: `/catalog/explores/{exploreId}`
- auth: none

Success `200`: same item shape as `items[]` from list explores

## Projects

### List projects
- method: `GET`
- url: `/projects?search=&page=1&pageSize=20`
- auth: required
- request type: query string only

Query params:
- `search`: optional string
- `page`: default `1`
- `pageSize`: default `20`, max `100`

Success `200`:
```json
{
  "count": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "title": "Biology Revision",
      "description": "WAEC prep",
      "icon": 1,
      "color": "10B981",
      "start": "2026-02-22T10:00:00+00:00",
      "end": "2026-06-30T18:00:00+00:00",
      "ownerUserId": "GUID",
      "librariesCount": 2,
      "notesCount": 1,
      "libraryIds": ["GUID", "GUID"],
      "progressScore": 41.32,
      "progressLevel": 41,
      "progressCalculatedAtUtc": "2026-02-25T21:00:00+00:00",
      "updatedAtUtc": "2026-02-25T19:33:34.224083+00:00",
      "createdAtUtc": "2026-02-25T19:24:53.878909+00:00"
    }
  ]
}
```

Use:
- `progressLevel` for project card progress bars
- `libraryIds` to know currently attached libraries

### Get project by id
- method: `GET`
- url: `/projects/{projectId}`
- auth: required

Success `200`: same object shape as one item from project list

### Create project
- method: `POST`
- url: `/projects`
- auth: required
- content type: `application/json`

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

Notes:
- `description` optional
- `icon` optional, defaults internally
- `color` must be 6-char hex, `#` optional
- `libraryIds` optional

Success `201`: project object

### Update project
- method: `PATCH`
- url: `/projects/{projectId}`
- auth: required
- content type: `application/json`

Request:
```json
{
  "projectId": "GUID",
  "title": "Updated title",
  "description": "Updated description",
  "icon": 2,
  "color": "FF5733",
  "start": "2026-02-22T10:00:00Z",
  "end": "2026-07-30T18:00:00Z",
  "libraryIds": ["GUID", "GUID"],
  "replaceLibraries": false
}
```

Important:
- this is partial update
- send only fields to change
- if `libraryIds` is sent and `replaceLibraries = false`, backend merges new ids with existing attached libraries
- if `replaceLibraries = true`, backend replaces all attached libraries with the passed ids
- AI content ingestion/summary runs when a library is attached to a project (not on every library edit)
- use `ingestionStatus` to show readiness (`ready` = AI can use it, `unsupported` = format not supported)
- URL items now attempt HTML extraction; if extraction fails, `ingestionStatus` becomes `failed`.

Success `200`: updated project object

### Remove single library from project
- method: `DELETE`
- url: `/projects/{projectId}/libraries/{libraryItemId}`
- auth: required

Success `200`: updated project object

Common errors:
- `404` project not found
- `404` library not attached to that project

### Delete project
- method: `DELETE`
- url: `/projects/{projectId}`
- auth: required

Success `200`:
```json
{
  "message": "Project permanently deleted."
}
```

Delete behavior:
- project is permanently deleted
- attached libraries are detached, not deleted

### List project libraries
- method: `GET`
- url: `/projects/{projectId}/libraries?search=&filter=all&page=1&pageSize=20`
- auth: required
- request type: query string only

Query params:
- `search`: optional string
- `filter`: optional string, use values like `all`, `notes`, `exclude-notes`
- `page`: default `1`
- `pageSize`: default `20`

Success `200`:
```json
{
  "count": 3,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "title": "Chapter 1 Notes",
      "docsUrl": "",
      "url": "",
      "content": "....",
      "ownerUserId": "GUID",
      "isDeleted": false,
      "libraryItemType": "Note",
      "updatedAtUtc": "2026-03-01T00:00:00+00:00",
      "createdAtUtc": "2026-03-01T00:00:00+00:00"
    }
  ]
}
```

### List available libraries for project attachment
- method: `GET`
- url: `/projects/available-libraries?projectId=&search=&filter=exclude-notes&page=1&pageSize=20`
- auth: required

Use this endpoint when attaching libraries to projects.

Query params:
- `projectId`: optional GUID, used to exclude items already attached to that project
- `search`: optional string
- `filter`: optional string, default behavior excludes notes
- `page`: default `1`
- `pageSize`: default `20`

Success `200`: same shape as project libraries list

## Analytics

### Dashboard analytics
- method: `GET`
- url: `/analytics`
- auth: required

Success `200`:
```json
{
  "streak": 4,
  "totalLibraryItems": 12,
  "totalProjects": 3,
  "questionsAnswered": 45,
  "recentActivities": [
    {
      "name": "Uploaded document",
      "data": "Biology Lecture 1.pdf",
      "time": "2026-03-03T09:15:00+00:00"
    },
    {
      "name": "Solved questions",
      "data": "8/10 correct, average score 82",
      "time": "2026-03-03T08:55:00+00:00"
    }
  ]
}
```

Fields:
- `streak`: consecutive learning days based on study activity
- `totalLibraryItems`: current active library items
- `totalProjects`: current active projects
- `questionsAnswered`: total evaluated questions solved
- `recentActivities`: latest activity feed for the user, capped to the most recent 4 items

### Per-project analytics
- method: `GET`
- url: `/projects/{projectId}/analytics`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "streak": 3,
  "totalLibraryItems": 6,
  "notesCount": 2,
  "documentsCount": 3,
  "linksCount": 1,
  "questionsAnswered": 20,
  "progressLevel": 41,
  "recentActivities": [
    {
      "name": "Solved questions",
      "data": "4/5 correct, average score 80",
      "time": "2026-03-03T08:55:00+00:00"
    }
  ]
}
```

Notes:
- project `recentActivities` is also capped to the most recent 4 items

## Feedback

### Submit feedback
- method: `POST`
- url: `/feedback`
- auth: required
- content type: `application/json`

Allowed categories:
- `bug-report`
- `feature-request`
- `improvement`
- `praise`

Request:
```json
{
  "category": "bug-report",
  "title": "AI answer froze on upload",
  "description": "The upload completed but the next step failed when I tried to attach the document.",
  "overallExperienceRating": 3
}
```

Success `201`:
```json
{
  "id": "GUID",
  "category": "bug-report",
  "title": "AI answer froze on upload",
  "description": "The upload completed but the next step failed when I tried to attach the document.",
  "overallExperienceRating": 3,
  "status": "open",
  "adminResolution": "",
  "voteCount": 0,
  "hasVoted": false,
  "isOwner": true,
  "createdAtUtc": "2026-03-03T10:00:00+00:00",
  "updatedAtUtc": "2026-03-03T10:00:00+00:00"
}
```

### List feedback
- method: `GET`
- url: `/feedback?category=&status=&page=1&pageSize=20`
- auth: required

Success `200`:
```json
{
  "count": 1,
  "totalCount": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "category": "feature-request",
      "title": "Add collaboration",
      "description": "Would be useful to share projects with classmates.",
      "overallExperienceRating": 4,
      "status": "in-review",
      "adminResolution": "Planned for later roadmap review.",
      "voteCount": 2,
      "hasVoted": true,
      "isOwner": false,
      "createdAtUtc": "2026-03-03T10:00:00+00:00",
      "updatedAtUtc": "2026-03-03T11:00:00+00:00"
    }
  ]
}
```

### Toggle feedback vote
- method: `POST`
- url: `/feedback/{feedbackId}/vote`
- auth: required

Behavior:
- first click adds vote
- second click removes vote

Success `200`:
- returns the updated feedback item with new `voteCount` and `hasVoted`

### Admin update feedback status
- method: `PATCH`
- url: `/admin/feedback/{feedbackId}`
- auth: admin only
- content type: `application/json`

Allowed statuses:
- `open`
- `in-review`
- `resolved`

Request:
```json
{
  "feedbackId": "GUID",
  "status": "resolved",
  "adminResolution": "This issue has been fixed in the latest release."
}
```

Success `200`:
- returns the updated feedback item

## Features (Requests + Coming Soon)

GapAI uses the existing `FeedbackItem` + votes system for:
- **Feature requests** (user-submitted): appear in `/features/requests`
- **Coming soon** (admin-curated): appear in `/features/coming-soon`

Voting:
- use the existing vote endpoint: `POST /feedback/{feedbackId}/vote`
- votes work for both feature requests and coming-soon items

Seeding (local/dev):
- the backend seeds a default set of coming-soon items in Development if an admin user exists
- opt-in outside dev with `SEED_COMING_SOON_ENABLED=true`

### List feature requests (user-submitted)
- method: `GET`
- url: `/features/requests?page=1&pageSize=20`
- auth: none (public)

Success `200`:
```json
{
  "count": 2,
  "totalCount": 2,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "icon": "i-lucide-sparkles",
      "title": "Collaborative study rooms",
      "description": "Let students collaborate in real time.",
      "longDescription": "Let students collaborate in real time.",
      "status": "exploring",
      "eta": null,
      "category": "General",
      "upvotes": 12,
      "hasVoted": false,
      "isComingSoon": false,
      "createdAtUtc": "2026-03-16T00:00:00+00:00",
      "updatedAtUtc": "2026-03-16T00:00:00+00:00"
    }
  ]
}
```

Notes:
- user-submitted feature requests are created via `POST /feedback` with `category=feature-request`
- if the request is anonymous, `hasVoted` is always `false` (vote state is only returned for authenticated users).

### List coming soon (admin-curated)
- method: `GET`
- url: `/features/coming-soon?page=1&pageSize=20`
- auth: none (public)

Success `200`:
```json
{
  "count": 1,
  "totalCount": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "icon": "i-lucide-brain-circuit",
      "title": "AI Study Plans",
      "description": "Personalized study roadmaps generated by AI.",
      "longDescription": "Our AI will analyze your uploaded materials and progress to build a plan.",
      "status": "in-progress",
      "eta": "Q2 2026",
      "category": "AI",
      "upvotes": 342,
      "hasVoted": true,
      "isComingSoon": true,
      "createdAtUtc": "2026-03-16T00:00:00+00:00",
      "updatedAtUtc": "2026-03-16T00:00:00+00:00"
    }
  ]
}
```

Notes:
- if the request is anonymous, `hasVoted` is always `false` (vote state is only returned for authenticated users).

## Help And Support

### List support articles
- method: `GET`
- url: `/support?category=all`
- auth: none

Allowed categories:
- `all`
- `library`
- `ai-chat`
- `questions`
- `projects`
- `timetable`
- `account`
- `general`

Success `200`:
```json
{
  "categories": [
    "all",
    "library",
    "ai-chat",
    "questions",
    "projects",
    "timetable",
    "account",
    "general"
  ],
  "items": [
    {
      "id": "GUID",
      "category": "library",
      "question": "How do I upload study materials to my Library?",
      "answer": "Open Library, choose upload or create, then add a note, link, or document.",
      "sortOrder": 1,
      "updatedAtUtc": "2026-03-03T10:00:00+00:00"
    }
  ]
}
```

### Create support ticket
- method: `POST`
- url: `/support/tickets`
- auth: required
- content type: `application/json`

Request:
```json
{
  "title": "Upload failed",
  "description": "My PDF upload fails with 413.",
  "module": "library",
  "priority": "medium"
}
```

Success `201`:
```json
{
  "id": "GUID",
  "ownerUserId": "GUID",
  "title": "Upload failed",
  "description": "My PDF upload fails with 413.",
  "module": "library",
  "priority": "medium",
  "status": "open",
  "createdAtUtc": "2026-03-15T10:00:00+00:00",
  "updatedAtUtc": "2026-03-15T10:00:00+00:00"
}
```

### List my support tickets
- method: `GET`
- url: `/support/tickets?status=&module=&page=1&pageSize=20`
- auth: required

Success `200`:
```json
{
  "count": 1,
  "totalCount": 1,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "ownerUserId": "GUID",
      "title": "Upload failed",
      "description": "My PDF upload fails with 413.",
      "module": "library",
      "priority": "medium",
      "status": "open",
      "createdAtUtc": "2026-03-15T10:00:00+00:00",
      "updatedAtUtc": "2026-03-15T10:00:00+00:00"
    }
  ]
}
```

### Get support ticket by id
- method: `GET`
- url: `/support/tickets/{ticketId}`
- auth: required

Success `200`:
```json
{
  "ticket": {
    "id": "GUID",
    "ownerUserId": "GUID",
    "title": "Upload failed",
    "description": "My PDF upload fails with 413.",
    "module": "library",
    "priority": "medium",
    "status": "open",
    "createdAtUtc": "2026-03-15T10:00:00+00:00",
    "updatedAtUtc": "2026-03-15T10:00:00+00:00"
  },
  "notes": [
    { "id": "GUID", "ticketId": "GUID", "authorUserId": "GUID", "note": "We are investigating.", "isInternal": false, "createdAtUtc": "2026-03-15T11:00:00+00:00" }
  ]
}
```

### Reply to a support ticket (user message)
- method: `POST`
- url: `/support/tickets/{ticketId}/reply`
- auth: required
- content type: `application/json`

Request:
```json
{
  "message": "Any update on this issue?"
}
```

Success `201`:
```json
{
  "ticket": {
    "id": "GUID",
    "ownerUserId": "GUID",
    "title": "Upload failed",
    "description": "My PDF upload fails with 413.",
    "module": "library",
    "priority": "medium",
    "status": "open",
    "createdAtUtc": "2026-03-15T10:00:00+00:00",
    "updatedAtUtc": "2026-03-15T12:00:00+00:00"
  },
  "note": {
    "id": "GUID",
    "ticketId": "GUID",
    "authorUserId": "GUID",
    "note": "Any update on this issue?",
    "isInternal": false,
    "createdAtUtc": "2026-03-15T12:00:00+00:00"
  }
}
```

Common errors:
- `404` if ticket not found (not owned by user or invalid id)
- `409` if ticket is already `resolved` (open a new ticket)

## Library Items

This section matters because request type changes based on whether you are uploading a file.

Library type values:
- `Docs`
- `Url`
- `Note`

Ingestion status values:
- `pending` (not processed yet)
- `processing` (processing started)
- `ready` (content extracted and usable by AI)
- `failed` (processing failed)
- `unsupported` (unsupported format, e.g. EPUB)

For JSON responses the backend returns `libraryItemType`.

### List library items
- method: `GET`
- url: `/library/items?search=&type=&page=1&pageSize=20`
- auth: required
- request type: query string only

Query params:
- `search`: optional string
- `type`: optional, one of `Docs`, `Url`, `Note`
- `page`: default `1`
- `pageSize`: default `20`

Important:
- if `type` is omitted, backend returns all types
- do not send request body for this route

Success `200`:
```json
{
  "count": 5,
  "page": 1,
  "pageSize": 20,
  "items": [
    {
      "id": "GUID",
      "title": "My note",
      "docsUrl": "",
      "url": "",
      "content": "study content",
      "ingestionStatus": "ready",
      "ingestionError": "",
      "processedPageCount": 0,
      "contentProcessedAtUtc": "2026-03-01T00:00:00+00:00",
      "ownerUserId": "GUID",
      "isDeleted": false,
      "libraryItemType": "Note",
      "updatedAtUtc": "2026-03-01T00:00:00+00:00",
      "createdAtUtc": "2026-03-01T00:00:00+00:00"
    }
  ]
}
```

### Get library item by id
- method: `GET`
- url: `/library/items/{libraryItemId}`
- auth: required

Success `200`: single library item object

### Create library item
- method: `POST`
- url: `/library/create`
- auth: required
- content type: `multipart/form-data`

This route should be sent as `FormData`, not JSON.

Fields:
- `Title`: required string
- `Type`: required string enum: `Note`, `Url`, `Docs`
- `Content`: optional for `Note`
- `Url`: required for `Url`
- `File`: optional for `Docs`
- `DocsUrl`: optional for `Docs`

Docs rule:
- for `Docs`, send either `File` or `DocsUrl`
- do not send both
- `DocsUrl` must be http/https and end with `.pdf`
- `File` must be a PDF

Url rule:
- `Url` must be http/https and point to a normal website or `.pdf` link
- URLs containing `.epub` are rejected

URL ingestion notes:
- Backend probes the URL `Content-Type` (HEAD/GET headers). If the server reports a PDF, it ingests it as a document even if the URL does not end with `.pdf`.
- For HTML pages, backend extracts a readable text version (prefers `<article>`/`<main>` and removes boilerplate).
Examples:

Create note:
```ts
const form = new FormData();
form.append("Title", "Cell Biology Notes");
form.append("Type", "Note");
form.append("Content", "Introduction to cells...");
```

Create link:
```ts
const form = new FormData();
form.append("Title", "Research article");
form.append("Type", "Url");
form.append("Url", "https://researchhub.com/example");
```

Create document:
```ts
const form = new FormData();
form.append("Title", "Lecture PDF");
form.append("Type", "Docs");
form.append("File", selectedFile);
```

Success `201`:
```json
{
  "id": "GUID",
  "title": "Lecture PDF",
  "docsUrl": "/uploads/....pdf",
  "url": "",
  "content": "",
  "ownerUserId": "GUID",
  "isDeleted": false,
  "libraryItemType": "Docs",
  "updatedAtUtc": "2026-03-01T00:00:00+00:00",
  "createdAtUtc": "2026-03-01T00:00:00+00:00"
}
```

Common `400` causes on `/library/create`:
- sent JSON instead of `multipart/form-data`
- sent `type` in lowercase or wrong field casing for form-data
- `Type=Url` without valid `Url`
- `Type=Docs` without `File` or `DocsUrl`
- sent both `File` and `DocsUrl`

Common `403` causes on `/library/create` for `Type=Docs`:
- document limit exceeded for current plan
- processed pages monthly limit exceeded
- user expected `basic/pro` limits but account is still on `free`

### Update library item
- method: `PATCH`
- url: `/library/items/{libraryItemId}`
- auth: required
- content type: `multipart/form-data`

This route is also `FormData` if a file may be included.

Fields:
- `LibraryItemId`: required GUID
- `Title`: optional
- `Type`: optional `Docs|Url|Note`
- `Content`: optional
- `Url`: optional
- `DocsUrl`: optional
- `File`: optional

Example:
```ts
const form = new FormData();
form.append("LibraryItemId", libraryId);
form.append("Content", "Updated note content");
```

Success `200`: updated library item object

## Uploads

Use this route to upload note images or documents first and then save the returned URL inside note content or a docs library item.

### Upload file
- method: `POST`
- url: `/uploads`
- auth: required
- content type: `multipart/form-data`

Fields:
- `Purpose`: optional, `note-image` or `library-document`
- `LibraryItemId`: optional, use when uploading directly for an existing library item
- `File`: required

Default:
- if `Purpose` is omitted, backend assumes `note-image`

Example note image upload:
```ts
const form = new FormData();
form.append("Purpose", "note-image");
form.append("File", file);
```

Example document upload:
```ts
const form = new FormData();
form.append("Purpose", "library-document");
form.append("File", file);
```

Success `201`:
```json
{
  "key": "USER_GUID/images/abc123.png",
  "url": "http://localhost:5296/uploads/USER_GUID/images/abc123.png",
  "fileName": "diagram.png",
  "contentType": "image/png",
  "size": 12345,
  "purpose": "note-image"
}
```

Use cases:
- note editor uploads image to `/uploads`, then inserts returned `url` into note content
- docs library item can be created with `DocsUrl` equal to the returned `url`

### Delete upload
- method: `DELETE`
- url: `/uploads?key=...` or `/uploads?url=...`
- auth: required

Query params:
- `key`: upload key returned by `/uploads`
- `url`: upload URL returned by `/uploads`

Send either `key` or `url`.

Restriction:
- user can only delete uploads inside their own upload namespace

Success `200`:
```json
{
  "message": "Upload deleted permanently."
}
```

### Delete library item
- method: `DELETE`
- url: `/library/items/{libraryItemId}`
- auth: required

Current implementation:
- library item is permanently deleted
- docs files stored locally are also deleted when the library item is deleted
- note-image uploads linked to that note are also deleted automatically when the note is deleted

Success `200`:
```json
{
  "message": "Library item permanently deleted.",
  "deletedLibraryItemId": "GUID",
  "affectedProjectId": "GUID or null"
}
```

Notes:
- if `affectedProjectId` is present, refresh project details/list in UI

## Adaptive AI Flow

These are the routes the frontend should use for learning features.

### Step 1: submit adaptive question job
- method: `POST`
- url: `/projects/{projectId}/adaptive/questions`
- auth: required
- content type: `application/json`

Request:
```json
{
  "projectId": "GUID",
  "numberOfQuestions": 10,
  "focusArea": "Scientific Method and Experimental Design",
  "additionalInstructions": "Focus on weak areas",
  "sourceMode": "random",
  "libraryItemId": null
}
```

Rules:
- `numberOfQuestions` allowed: `5, 10, 15, 20, 25, 30`
- `sourceMode` allowed: `random`, `single`
- if `sourceMode = "single"`, `libraryItemId` is required

Success `202`:
```json
{
  "projectId": "GUID",
  "jobId": "GUID",
  "status": "pending",
  "sourceMode": "random",
  "sourceLibraryCount": 3,
  "sourceLibraryIds": ["GUID", "GUID"],
  "inferredDifficulty": "medium",
  "complexityLevel": 42,
  "distributionProfile": "mixed:mcq=5,short=2,essay=2,reasoning=1",
  "progressScore": 37.2,
  "progressLevel": 37,
  "modelVersion": "adaptive-progress-v2"
}
```

Possible errors:
- `429` if question generation cooldown is active.
- `400` if no library content in the project is ready yet (example message: `No ready library content found in this project yet... wait for ingestion to complete.`)
- `400` if `sourceMode=single` and the selected library is not ready (example message: `Library content is not ready (status: processing).`)

### Step 2: poll job status
- method: `GET`
- url: `/projects/{projectId}/adaptive/questions/status/{jobId}`
- auth: required

Success `200`:
```json
{
  "jobId": "GUID",
  "status": "running",
  "progress": 60,
  "message": "Generating questions",
  "createdAtUtc": "2026-03-01T11:00:00+00:00",
  "completedAtUtc": null
}
```

### Step 3: get job result
- method: `GET`
- url: `/projects/{projectId}/adaptive/questions/result/{jobId}`
- auth: required

If still processing:
- status `202`

If finished:
- status `200`

Finished response:
```json
{
  "jobId": "GUID",
  "status": "completed",
  "questions": [
    {
      "id": "1",
      "question": "What is a hypothesis?",
      "type": "multiple-choice",
      "options": ["A", "B", "C", "D"],
      "answer": "A",
      "difficulty": "medium",
      "reason": "A hypothesis is a testable explanation based on observations.",
      "correctAnswers": null,
      "rubric": null
    },
    {
      "id": "2",
      "question": "State one purpose of a control group.",
      "type": "short-answer",
      "options": null,
      "answer": null,
      "difficulty": "medium",
      "reason": "A control group provides a baseline for comparison.",
      "correctAnswers": ["baseline comparison", "comparison standard"],
      "rubric": null
    }
  ],
  "message": "Questions generated successfully."
}
```

Question rendering rules:
- `multiple-choice`:
  - render `options`
  - `answer` may exist in result payload, but do not show it to user before submission
- `short-answer`:
  - no options
  - `correctAnswers` may be present
- `essay`:
  - no options
  - `rubric` may be present
- `reason`:
  - explanation of why the answer is correct

### Step 4: submit all answers for grading
- method: `POST`
- url: `/projects/{projectId}/adaptive/questions/evaluate`
- auth: required
- content type: `application/json`

This is the main grading route. Use it after user finishes the whole set.

Request:
```json
{
  "projectId": "GUID",
  "libraryItemId": null,
  "jobId": "GUID",
  "attempts": [
    {
      "question": {
        "id": "1",
        "question": "What is a hypothesis?",
        "type": "multiple-choice",
        "options": ["A", "B", "C", "D"],
        "answer": "A",
        "difficulty": "medium",
        "reason": "A hypothesis is a testable explanation.",
        "correctAnswers": null,
        "rubric": null
      },
      "userAnswer": "A"
    },
    {
      "question": {
        "id": "2",
        "question": "State one purpose of a control group.",
        "type": "short-answer",
        "options": null,
        "answer": null,
        "difficulty": "medium",
        "reason": "A control group provides a baseline for comparison.",
        "correctAnswers": ["baseline comparison", "comparison standard"],
        "rubric": null
      },
      "userAnswer": "It gives a baseline for comparison."
    }
  ]
}
```

Notes:
- `jobId` should be the job id returned from `/adaptive/questions` submission.
- Each job id can be evaluated only once.
- Cooldown between evaluations is enforced (currently 45s, 429 if too frequent).

Success `200`:
```json
{
  "projectId": "GUID",
  "libraryItemId": null,
  "totalQuestions": 2,
  "correctCount": 2,
  "averageScore": 90,
  "results": [
    {
      "questionId": "1",
      "questionType": "multiple-choice",
      "difficulty": "medium",
      "userAnswer": "A",
      "correct": true,
      "score": 100,
      "feedback": "Correct."
    },
    {
      "questionId": "2",
      "questionType": "short-answer",
      "difficulty": "medium",
      "userAnswer": "It gives a baseline for comparison.",
      "correct": true,
      "score": 85,
      "feedback": "Correct. Good concise explanation."
    }
  ],
  "progress": {
    "modelVersion": "adaptive-progress-v2",
    "progressScore": 38.54,
    "progressLevel": 39,
    "activityComponent": 0.22,
    "masteryComponent": 0.41,
    "contributingSignalsCount": 12,
    "calculatedAtUtc": "2026-03-01T11:20:00+00:00"
  }
}
```

Use:
- `results[]` to show per-question feedback
- `progress.progressLevel` to update the project progress bar
- `averageScore` for summary card

Possible errors:
- `409` if the same `jobId` is submitted more than once.
- `429` if cooldown is active.

### Current progress snapshot
- method: `GET`
- url: `/projects/{projectId}/adaptive/progress`
- auth: required

Success `200`:
```json
{
  "modelVersion": "adaptive-progress-v2",
  "progressScore": 38.54,
  "progressLevel": 39,
  "activityComponent": 0.22,
  "masteryComponent": 0.41,
  "contributingSignalsCount": 12,
  "calculatedAtUtc": "2026-03-01T11:20:00+00:00"
}
```

### Progress report
- method: `GET`
- url: `/projects/{projectId}/adaptive/progress/report`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "current": {
    "modelVersion": "adaptive-progress-v2",
    "progressScore": 38.54,
    "progressLevel": 39,
    "activityComponent": 0.22,
    "masteryComponent": 0.41,
    "contributingSignalsCount": 12,
    "calculatedAtUtc": "2026-03-01T11:20:00+00:00"
  },
  "attemptsInLast30Days": 12,
  "averageScoreInLast30Days": 81.4,
  "correctAnswersInLast30Days": 20,
  "totalAnswersInLast30Days": 27,
  "recentSnapshots": []
}
```

### Adaptive chat
- method: `POST`
- url: `/projects/{projectId}/adaptive/chat`
- auth: required
- content type: `application/json`

Request:
```json
{
  "projectId": "GUID",
  "libraryItemId": "GUID",
  "sessionId": null,
  "message": "Explain chapter two in simpler terms",
  "aiTier": "local-basic",
  "includeWeb": true
}
```

Notes:
- `aiTier` optional
- if omitted, backend uses default configured tier
- allowed values depend on subscription and backend key/model configuration
- examples: `local-basic`, `openai-standard`, `openai-premium`, `google-standard`, `google-premium`
- `includeWeb` optional (default `true`): when true, backend adds web snippets and returns source links in response

Success `200`:
```json
{
  "projectId": "GUID",
  "libraryItemId": "GUID",
  "chat": {
    "sessionId": "GUID",
    "answer": "Explanation...",
    "citations": [
      {
        "chunkId": "GUID",
        "snippet": "Relevant excerpt"
      }
    ],
    "aiTier": "local-basic",
    "sources": [
      {
        "sourceId": "GUID",
        "url": "https://example.com/article",
        "title": "Example Article",
        "snippet": "Useful web snippet used by the assistant"
      }
    ],
    "toolsUsed": [
      {
        "name": "datetime",
        "status": "ok",
        "detail": "utc=2026-03-06T10:00:00.0000000+00:00"
      },
      {
        "name": "web-search",
        "status": "ok",
        "detail": "results=5"
      }
    ]
  },
  "aiTier": "local-basic",
  "progressScore": 38.54,
  "progressLevel": 39,
  "modelVersion": "adaptive-progress-v2"
}
```

Common errors:
- `403` if the requested `aiTier` is not allowed by the user subscription
- `400` if the selected library content is not processed yet (example message: `Library content is not ready (status: processing).`)
- `400` if no processed library context exists and `includeWeb=false`

### Adaptive chat: list accessible AIs for current user
- method: `GET`
- url: `/projects/{projectId}/adaptive/chat/ais`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "items": [
    {
      "tier": "local-basic",
      "provider": "ollama",
      "model": "qwen2.5:7b-instruct",
      "isDefault": true
    },
    {
      "tier": "openai-standard",
      "provider": "openai",
      "model": "gpt-4o-mini",
      "isDefault": false
    }
  ]
}
```

### Adaptive chat: list chat sessions in a project
- method: `GET`
- url: `/projects/{projectId}/adaptive/chat/sessions`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "count": 2,
  "items": [
    {
      "sessionId": "GUID",
      "libraryItemId": "GUID",
      "libraryTitle": "Cell Biology Notes",
      "title": "Explain chapter two in simpler terms",
      "updatedAtUtc": "2026-03-05T12:00:00+00:00",
      "createdAtUtc": "2026-03-05T11:58:00+00:00"
    }
  ]
}
```

### Adaptive chat: list messages in a session
- method: `GET`
- url: `/projects/{projectId}/adaptive/chat/sessions/{sessionId}/messages`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "sessionId": "GUID",
  "count": 2,
  "items": [
    {
      "messageId": "GUID",
      "role": "user",
      "content": "Hello",
      "createdAtUtc": "2026-03-06T10:00:00+00:00"
    },
    {
      "messageId": "GUID",
      "role": "assistant",
      "content": "Hi, how can I help?",
      "createdAtUtc": "2026-03-06T10:00:03+00:00"
    }
  ]
}
```

### Adaptive chat: delete session permanently
- method: `DELETE`
- url: `/projects/{projectId}/adaptive/chat/sessions/{sessionId}`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "sessionId": "GUID",
  "deleted": true
}
```

### Adaptive chat: list project libraries usable in chat
- method: `GET`
- url: `/projects/{projectId}/adaptive/chat/libraries`
- auth: required

Success `200`:
```json
{
  "projectId": "GUID",
  "count": 3,
  "items": [
    {
      "libraryItemId": "GUID",
      "title": "Cell Biology Notes",
      "type": "Note",
      "ingestionStatus": "ready",
      "updatedAtUtc": "2026-03-05T10:45:00+00:00"
    }
  ]
}
```

## Reports (Research + Academic Notes)

These endpoints create a long-form academically written report/note for a project, grounded in:
- a selected library item (optional)
- optional user-provided URLs
- optional web research sources (DuckDuckGo + page/PDF extraction)

### Create report
- method: `POST`
- url: `/projects/{projectId}/reports`
- auth: required
- content type: `application/json`

Request:
```json
{
  "topic": "Cell respiration report",
  "instructions": "Write a WAEC-level academic report with headings and citations.",
  "libraryItemId": "GUID or null",
  "urls": ["https://example.com/source.pdf"],
  "includeWeb": true
}
```

Success `201`:
- returns `{ reportId, version, title, markdown, sources[], charts[], validation? }`

### Get report (latest version)
- method: `GET`
- url: `/projects/{projectId}/reports/{reportId}`
- auth: required

Success `200`:
- returns `{ reportId, version, title, status, markdown, sources[], charts[], validation?, createdAtUtc, updatedAtUtc }`

### Edit report (creates a new version)
- method: `POST`
- url: `/projects/{projectId}/reports/{reportId}/edit`
- auth: required
- content type: `application/json`

Request:
```json
{
  "instruction": "Add a clearer introduction and include a simple chart if helpful."
}
```

Success `200`:
- returns the updated version payload (same shape as create).

## Direct AI Routes

These routes still exist, but public frontend should not depend on them right now:
- `POST /api/ai/questions`
- `GET /api/ai/questions/status/{jobId}`
- `GET /api/ai/questions/result/{jobId}`
- `POST /api/ai/chat`

They are usually blocked with `410 Gone`.

### Verify answer
- method: `POST`
- url: `/api/ai/questions/verify`
- auth: required
- content type: `application/json`

This route still works for direct single-answer verification.

Request:
```json
{
  "projectId": "GUID",
  "libraryItemId": "GUID",
  "question": {
    "id": "1",
    "question": "What is a hypothesis?",
    "type": "multiple-choice",
    "options": ["A", "B", "C", "D"],
    "answer": "A",
    "difficulty": "easy",
    "reason": "A hypothesis is a testable explanation.",
    "correctAnswers": null,
    "rubric": null
  },
  "userAnswer": "A"
}
```

Success `200`:
```json
{
  "correct": true,
  "score": 100,
  "feedback": "Correct."
}
```

### Generate timetable
- method: `POST`
- url: `/api/ai/timetable`
- auth: required
- content type: `application/json`

Request:
```json
{
  "subjects": [
    { "name": "Math", "priority": "high" },
    { "name": "Physics", "priority": "medium" }
  ],
  "studyHoursPerDay": 6,
  "breakMinutes": 15,
  "studyStyle": "balanced",
  "unavailableSlots": [
    { "day": "Mon", "start": "18:00", "end": "20:00" }
  ],
  "deadlines": [
    { "type": "exam", "subject": "Math", "date": "2026-03-01" }
  ],
  "startDate": "2026-02-23",
  "endDate": "2026-03-02"
}
```

Success `200`:
```json
{
  "schedule": [
    {
      "date": "2026-02-23",
      "day": "Sun",
      "blocks": [
        { "subject": "Math", "start": "09:00", "end": "10:30", "type": "study" },
        { "subject": null, "start": "10:30", "end": "10:45", "type": "break" }
      ]
    }
  ],
  "notes": "Deadline-aware schedule generated.",
  "validation": {
    "isValid": true,
    "daysValidated": 8,
    "failedRules": 0,
    "allocationDeviationPercent": 0.0,
    "repairAttempts": 0
  }
}
```

## Frontend Request Examples

### JSON request helper
```ts
async function apiJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`http://localhost:5296${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw error ?? { error: `Request failed with ${res.status}` };
  }

  return res.json();
}
```

### Multipart request helper for library upload
```ts
async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`http://localhost:5296${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw error ?? { error: `Request failed with ${res.status}` };
  }

  return res.json();
}
```

Important:
- do not manually set `Content-Type` for `FormData`
- browser will set the proper multipart boundary

## Known Backend Behaviors

- `GET /library/items` expects query params, not request body
- `POST /library/create` expects `multipart/form-data`, not JSON
- `PATCH /library/items/{id}` is partial update
- direct AI question/chat routes are suspended
- adaptive question flow is job-based:
  1. submit job
  2. poll status
  3. fetch result
  4. submit all answers once for grading

## Admin Dashboard Contract

For complete admin contracts, enums, mutation behavior, and implementation-status notes, use:
- `Core/Docs/backend.md`

Quick integration notes:
- all `/admin/*` routes require admin JWT
- list endpoints use:

```json
{
  "count": 0,
  "totalCount": 0,
  "page": 1,
  "pageSize": 20,
  "items": []
}
```

- common admin table endpoints:
  - `GET /admin/users`
  - `GET /admin/projects`
  - `GET /admin/library/items`
  - `GET /admin/subscription/users`
  - `GET /admin/support/tickets`
  - `GET /admin/system/errors`
  - `GET /admin/system/errors/stream` (SSE)
  - `GET /admin/audit`

- after successful admin mutations (`PATCH/POST/DELETE`), frontend should refetch relevant list/detail pages.

Realtime system error stream (admin-only)
- Use Server-Sent Events (SSE)
- Event name: `systemError`
- Payload matches `/admin/system/errors` item fields plus `statusCode`, `requestId`, `createdAtUtc`
