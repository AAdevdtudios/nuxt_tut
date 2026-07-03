# GapAI / LearnHub Project Pitch Document

## 1. Cover

**Project Name:** GapAI / LearnHub  
**Category:** AI-powered study workspace and learning productivity platform  
**Frontend:** Nuxt 4, Vue 3, Nuxt UI, Tailwind CSS, Pinia  
**Backend:** REST API integration for authentication, projects, library, analytics, adaptive AI, billing, feedback, support, uploads, and subscriptions  
**Prepared For:** Company project submission / product review  
**Prepared By:** Devtherapist

**One-line pitch:** GapAI helps students turn their study materials into organized projects, AI conversations, practice questions, notes, schedules, and measurable learning progress.

> Screenshot placeholder: Login screen or dashboard overview.

## 2. Executive Summary

GapAI is a full-stack AI learning platform designed for students who manage multiple courses, documents, notes, deadlines, and revision tasks. The product provides a structured dashboard where users can upload study materials, organize them into projects, create notes, ask AI questions against their own content, generate adaptive practice questions, build study timetables, track progress, and communicate feedback or support issues.

The platform is built as a modern Nuxt application with a strong dashboard experience, reusable component structure, Pinia state management, server-side API proxy routes, authentication refresh handling, subscription-aware limits, and backend-driven analytics. It is designed to support real student workflows rather than acting as a single-purpose chatbot.

## 3. Problem

Students often use separate tools for notes, file storage, AI chat, timetable planning, revision questions, and progress tracking. This causes study context to become fragmented.

Common problems include:

- Study materials live across PDFs, websites, notes, folders, and chat history.
- AI tools answer generically when they are not grounded in the student’s actual materials.
- Students struggle to convert materials into practice questions and structured revision.
- Timetables and deadlines are difficult to keep aligned with actual project progress.
- Learning progress is often invisible until exams or assignments expose gaps.
- Feedback, support, and roadmap visibility are usually disconnected from the learning workspace.

## 4. Solution

GapAI centralizes learning into a project-based workspace. A student can create a project for a subject, attach documents, URLs, and notes, then use that project context across AI chat, adaptive practice, notes, analytics, and timetable planning.

The core idea is simple: every learning action should be connected to the material, project, and progress it belongs to.

Key solution pillars:

- **Unified study library:** documents, website links, and notes in one searchable library.
- **Project-based organization:** group materials, notes, practice, AI chat, and settings by subject or goal.
- **Adaptive AI workflows:** generate practice questions and AI answers from selected project materials.
- **Progress tracking:** use backend analytics and adaptive progress endpoints to show learning movement.
- **Study planning:** generate timetable schedules around subjects, preferences, and deadlines.
- **Student feedback loop:** built-in feedback, support tickets, and coming-soon roadmap pages.

## 5. Target Users

Primary users:

- University students
- Secondary school and exam-prep students
- Self-directed learners
- Students managing multiple subjects, PDFs, notes, and assignments

Secondary users:

- Tutors and academic coaches
- Bootcamp learners
- Professional certification candidates
- Small study groups, once collaboration features are introduced

## 6. Product Overview

GapAI is organized around a dashboard shell with the following main areas:

- Dashboard
- Library
- Projects
- Timetable
- Explore
- Settings
- Feedback
- Coming Soon
- Help & Support

Each area contributes to the learning workflow.

### Dashboard

The dashboard summarizes the user’s learning state. It displays the current project focus, project progress, total materials, notes, question usage, recent activities, and active projects.

Backend analytics power activity summaries and dashboard metrics.

> Screenshot placeholder: Dashboard home showing welcome hero, study overview, active projects, and recent activity.

### Library

The library manages all study resources. Users can add:

- PDF documents
- Website links
- Notes

The system supports grid/list views, search, filtering, pagination, delete actions, note editing, and direct opening of URL or file resources.

Document upload follows backend rules:

- `Type=Docs`
- PDF only
- `File` or `DocsUrl`, but not both

URL items follow backend rules:

- `Type=Url`
- `Url` must use `http` or `https`
- normal websites and `.pdf` links are allowed
- `.epub` links are rejected

> Screenshot placeholder: Library page with grid/list materials and Add Content modal.

### Projects

Projects are the central unit of organization. A project contains:

- Title, description, icon, color, start date, end date
- Attached library materials
- Attached notes
- Project analytics
- Adaptive AI tutor
- Practice question generation
- Settings and delete/update controls

The project detail page has tab-based navigation:

- Overview
- Materials
- Notes
- Practice
- AI Tutor
- Settings

> Screenshot placeholder: Project detail page showing header, progress, due date, and tabs.

### Materials and Notes Attachment

Project materials and notes use a shared attachment flow. Users can select existing library items from modals and attach or remove them from a project. The UI refreshes immediately after mutations so project counts and lists remain in sync with backend state.

Notes are handled separately from regular materials where needed, using project library filters such as:

- `/projects/{projectId}/libraries?filter=notes`
- `/projects/available-libraries?projectId={projectId}&filter=notes`

> Screenshot placeholder: Attach material modal and attached material card view.

### Note Editor

GapAI includes a note editor page for rich note writing. It supports:

- Editable title
- Autosave behavior
- Rich text editing
- Sticky formatting controls
- Markdown-aware paste behavior
- Image attachment through upload endpoints
- Image deletion support
- 10,000 character limit

The note upload flow uses:

- `POST /uploads`
- `Purpose=note-image`
- returned image URL inserted into note content

> Screenshot placeholder: Rich note editor with formatting toolbar and image inserted.

### Adaptive Practice

The Practice tab helps students generate questions from attached project materials. It supports:

- number of questions
- random project material mode
- single source material mode
- focus area
- additional instructions
- background job tracking
- progress polling
- generated question preview
- practice session page
- answer submission and grading
- answer review with correct answers and reasons

Backend flow:

1. Submit question job: `POST /projects/{projectId}/adaptive/questions`
2. Poll status: `GET /projects/{projectId}/adaptive/questions/status/{jobId}`
3. Fetch result: `GET /projects/{projectId}/adaptive/questions/result/{jobId}`
4. Submit answers: `POST /projects/{projectId}/adaptive/questions/evaluate`

The UI prevents generating another job while one is already pending or running.

> Screenshot placeholder: Practice tab generating questions and practice session answer page.

### AI Chat

AI Chat is project-based and context-aware. The user selects:

- project
- AI tier
- web inclusion toggle
- one library item as source context

The chat supports:

- project-scoped chat
- chat sessions
- message history
- session loading
- session deletion
- markdown-rendered AI responses
- source links
- selected library restoration from session metadata

Backend routes include:

- `POST /projects/{projectId}/adaptive/chat`
- `GET /projects/{projectId}/adaptive/chat/ais`
- `GET /projects/{projectId}/adaptive/chat/sessions`
- `GET /projects/{projectId}/adaptive/chat/sessions/{sessionId}/messages`
- `DELETE /projects/{projectId}/adaptive/chat/sessions/{sessionId}`
- `GET /projects/{projectId}/adaptive/chat/libraries`

> Screenshot placeholder: AI Chat page with project selector, library selector, chat bubbles, and markdown answer.

### Timetable

The timetable feature helps users generate a study schedule. It includes:

- subject selection
- deadlines
- preferences
- generated calendar-like schedule
- month switching
- selected day task view
- calendar export support

The backend route is:

- `POST /api/ai/timetable`

> Screenshot placeholder: Timetable calendar view with selected day tasks.

### Explore

Explore lets users browse categories and study resources from a catalog. It includes:

- category filtering
- search
- resource cards
- backend catalog integration

Backend routes include:

- `GET /catalog/categories`
- `GET /catalog/explores`

> Screenshot placeholder: Explore page with category filters and resource cards.

### Feedback

The feedback page lets users submit and vote on product feedback. It supports:

- bug reports
- feature requests
- improvements
- praise
- voting
- filtering
- status display
- sorting

Backend routes include:

- `POST /feedback`
- `GET /feedback`
- `POST /feedback/{feedbackId}/vote`

> Screenshot placeholder: Feedback page with feedback form, filters, and cards.

### Help & Support

The Help & Support page includes:

- FAQ articles
- guide cards
- contact/support ticket form

Support articles use:

- `GET /support?category=all`

Support tickets use:

- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/{ticketId}`
- support ticket reply endpoint where available

> Screenshot placeholder: Help page contact tab with ticket submission form.

### Coming Soon

The Coming Soon page presents the product roadmap in a user-friendly format. It includes:

- in-progress features
- planned features
- exploring features
- category filters
- local upvote and notify interactions
- CTA to feedback

Planned roadmap areas include:

- AI study plans
- collaborative study rooms
- advanced analytics
- mobile app
- voice-powered AI tutor
- video lecture summarizer
- multi-language support
- community marketplace
- spaced repetition
- assignment auto-checker
- certifications and badges
- smart note-taking

> Screenshot placeholder: Coming Soon roadmap page.

## 7. Core User Journeys

### Journey 1: First-time student setup

1. User registers or logs in.
2. User lands on dashboard.
3. User creates a project for a subject.
4. User uploads a PDF or adds a website link.
5. User attaches materials to the project.
6. User asks the AI Tutor about the project content.
7. User generates practice questions.
8. User answers questions and reviews explanations.

### Journey 2: Revision workflow

1. User opens a project.
2. User reviews materials and notes.
3. User selects a source material.
4. User generates 10 to 30 adaptive questions.
5. User completes the practice session.
6. Backend evaluates answers and updates progress.
7. Dashboard and project analytics reflect activity.

### Journey 3: Planning workflow

1. User opens Timetable.
2. User enters subjects, deadlines, and preferences.
3. AI generates a calendar-like study schedule.
4. User selects a date to view tasks.
5. User exports schedule to an external calendar.

### Journey 4: Product feedback workflow

1. User opens Feedback.
2. User submits a bug, feature request, improvement, or praise.
3. User votes on existing requests.
4. Admin/backend can update statuses later.

## 8. Technical Architecture

The frontend is built with Nuxt and uses a server route layer to proxy backend calls. This keeps browser-facing requests consistent while preserving auth, refresh token handling, error normalization, and multipart/form-data conversion.

### Frontend stack

- Nuxt 4
- Vue 3
- Nuxt UI
- Tailwind CSS
- Pinia
- Pinia persisted state
- VueUse
- Tiptap / editor tooling
- Zod and VeeValidate
- Nuxt color mode
- Lucide icons

### State management

Pinia stores manage:

- authentication
- projects
- libraries
- practice jobs
- library preferences
- system preferences

Examples:

- `app/stores/auth.ts`
- `app/stores/projects.ts`
- `app/stores/libraries.ts`
- `app/stores/practiceJobs.ts`

### API layer

Nuxt server routes under `server/api` proxy backend endpoints. This provides:

- centralized auth forwarding
- refresh token support
- request normalization
- error handling
- form-data conversion
- backend response normalization

Examples:

- `server/api/libraries.post.ts`
- `server/api/projects/[documentId]/adaptive/chat.post.ts`
- `server/api/projects/[documentId]/adaptive/questions.post.ts`
- `server/api/support/tickets.post.ts`
- `server/api/feedback.post.ts`

### Authentication

The app supports:

- login
- register
- refresh token
- logout
- current user retrieval
- profile name update
- password reset

Unauthorized requests redirect users to the login flow.

### Subscription awareness

Backend subscription plans define:

- question limits
- essay limits
- document limits
- processed page limits
- competitive features
- deep analytics access

The UI normalizes limit errors into user-friendly messages such as:

- document limit exceeded
- question limit exceeded
- plan does not include selected AI tier

## 9. Data Model Summary

### User

Includes identity, display name, account metadata, and subscription usage.

### Project

Fields include:

- id
- title
- description
- icon
- color
- start
- end
- ownerUserId
- librariesCount
- notesCount
- libraryIds
- progressScore
- progressLevel
- timestamps

### Library Item

Library items support:

- Docs
- Url
- Note

Important fields include:

- id
- title
- docsUrl
- url
- content
- ingestionStatus
- ingestionError
- processedPageCount
- libraryItemType
- timestamps

### Feedback Item

Feedback supports:

- category
- title
- description
- rating
- vote count
- status

### Support Ticket

Support ticket fields include:

- title
- description
- module
- priority
- status
- ownerUserId
- timestamps

## 10. Security and Reliability Notes

Implemented or supported safeguards:

- authenticated backend routes
- refresh token flow
- redirect to login on unauthorized responses
- server-side API proxy
- file upload validation
- PDF-only document uploads
- `.epub` URL rejection
- normalized API error messages
- subscription quota handling
- project and library refresh after mutation
- prevention of duplicate practice generation jobs

## 11. Product Differentiation

GapAI is not only an AI chat interface. Its value comes from connecting the full study lifecycle:

- materials become project context
- project context powers AI chat
- AI generates practice questions
- completed practice updates progress
- analytics summarize activity
- timetable planning connects study time to goals
- feedback and support are embedded in the product

This makes the platform closer to an AI study operating system than a standalone note app or chatbot.

## 12. Current Strengths

- Strong project-based learning model
- Real backend integration across major workflows
- Adaptive practice generation with job polling
- Chat sessions with markdown output and history
- Library supports documents, URLs, and notes
- Support tickets and feedback are wired to backend
- Dashboard uses analytics rather than static mock data
- Roadmap page communicates product direction
- Nuxt server routes keep backend contracts isolated from UI components

## 13. Known Gaps and Future Improvements

Potential improvements:

- Admin dashboard for support, feedback, users, plans, and feature requests
- Real persisted coming-soon upvotes and notification subscriptions
- Collaboration and shared projects
- More detailed analytics visualizations
- Mobile-first optimizations for note editing and practice sessions
- Better onboarding walkthrough
- Automated end-to-end tests for auth, library, project, AI chat, and practice flows
- Exportable project reports and study summaries
- More granular permissions and team roles

## 14. Suggested Screenshots for Submission

Capture these screens in order:

1. Login page
2. Dashboard overview
3. Library page with Add Content modal
4. Project list
5. Project detail overview
6. Project materials attachment modal
7. Note editor
8. Project AI Tutor or global AI Chat
9. Practice generation tab
10. Practice session review page
11. Timetable calendar view
12. Feedback page
13. Help & Support contact tab
14. Coming Soon roadmap
15. Settings page with profile/subscription/system settings

## 15. Demo Script

Use this sequence for a live or recorded demo:

1. Log in and show the dashboard summary.
2. Create or open a project.
3. Add a PDF or URL to the library.
4. Attach the material to the project.
5. Open AI Tutor and ask a question about the material.
6. Generate practice questions from the project.
7. Open the practice session and answer a question.
8. Show the evaluation and explanations.
9. Open the timetable calendar.
10. Show feedback and support ticket submission.
11. End on Coming Soon to show roadmap direction.

## 16. Company-Facing Project Summary

GapAI is a modern AI learning platform built with Nuxt, Vue, Pinia, and a backend-driven REST architecture. It helps students manage study materials, organize them into projects, ask AI questions grounded in their own content, generate adaptive practice questions, track learning progress, plan timetables, and interact with support and feedback workflows.

The project demonstrates practical frontend engineering, backend integration, state management, auth handling, multipart uploads, async job polling, markdown rendering, dashboard UI design, and product thinking around real student study workflows.

## 17. Appendix: Key Routes

Frontend pages:

- `/`
- `/auth/login`
- `/auth/register`
- `/dashboard`
- `/dashboard/library`
- `/dashboard/projects`
- `/dashboard/projects/{projectId}`
- `/dashboard/projects/{projectId}/practice`
- `/dashboard/notes/{noteId}`
- `/dashboard/ai_chat`
- `/dashboard/timetable`
- `/dashboard/explore`
- `/dashboard/feedback`
- `/dashboard/help`
- `/dashboard/coming-soon`
- `/dashboard/settings`

Backend domains integrated:

- Auth
- Subscription
- Billing
- Explore catalog
- Projects
- Library items
- Uploads
- Analytics
- Feedback
- Support tickets
- Adaptive questions
- Adaptive chat
- Timetable generation

