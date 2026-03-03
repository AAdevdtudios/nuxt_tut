# Frontend Integration

This file is the frontend contract for the current backend.

Use:
- base API URL: `http://localhost:5296`
- frontend origin in local dev: `http://localhost:3000`
- auth header for protected routes: `Authorization: Bearer <accessToken>`

Important:
- most routes use `application/json`
- library create/update with file upload use `multipart/form-data`
- direct AI routes under `/api/ai/*` are currently suspended for public use and usually return `410`
- adaptive routes under `/projects/{projectId}/adaptive/*` are the active frontend AI routes

## Common Error Shapes

### Unauthorized
Status: `401`
```json
{
  "error": "Unauthorized"
}
```

or:
```json
{
  "error": "Missing or invalid access token."
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
  "error": "Provide at least one field to update.",
  "code": "Validation"
}
```

### FastEndpoints validation error
Status: `400`
```json
{
  "statusCode": 400,
  "message": "One or more errors occurred!",
  "errors": {
    "fieldName": [
      "validation message"
    ]
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

### Direct AI route suspended
Status: `410`
```json
{
  "error": "Direct question generation endpoint is temporarily suspended."
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
  "displayName": "Dev Therapist",
  "password": "StrongPassword123"
}
```

Success `201`:
```json
{
  "userId": "GUID",
  "email": "user@example.com",
  "displayName": "Dev Therapist",
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

Success `200`: updated project object

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
- `recentActivities`: latest activity feed for the user

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

## Library Items

This section matters because request type changes based on whether you are uploading a file.

Library type values:
- `Docs`
- `Url`
- `Note`

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
  "message": "Library item permanently deleted."
}
```

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
  "message": "Explain chapter two in simpler terms"
}
```

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
    ]
  },
  "progressScore": 38.54,
  "progressLevel": 39,
  "modelVersion": "adaptive-progress-v2"
}
```

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
