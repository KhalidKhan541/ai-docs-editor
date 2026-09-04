# AI-Powered Collaborative Document Editor

A real-time collaborative document editor with AI-powered writing assistance, built with Next.js, React, and TypeScript.

## Features

- **Real-time Collaboration** — Edit documents simultaneously with team members using Yjs and WebSocket
- **AI Writing Assistant** — Rewrite, continue, summarize, expand, and fix grammar with AI
- **Block-based Editor** — Built on BlockNote for flexible content creation
- **Comments & Suggestions** — Inline commenting and suggestion workflows
- **Version History** — Track changes and restore previous versions
- **Slash Commands** — Quick access to formatting and AI tools
- **Export** — Export to Markdown, HTML, PDF, and DOCX
- **Templates** — Pre-built templates for common document types
- **Role-based Access Control** — Admin, editor, and viewer roles

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS, Radix UI
- **Editor:** BlockNote
- **Collaboration:** Yjs, y-websocket
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js
- **State:** Zustand, React Query
- **Testing:** Jest, React Testing Library
- **CI/CD:** GitHub Actions
- **Containerization:** Docker

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis (optional, for caching)

### Installation

```bash
git clone <repository-url>
cd ai-docs-editor
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Database Setup

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Testing

```bash
npm run test            # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Linting & Formatting

```bash
npm run lint
npm run lint:fix
npm run format:check
npm run format
```

### Type Checking

```bash
npm run typecheck
```

## Docker

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── documents/     # Document CRUD
│   │   ├── comments/      # Comment CRUD
│   │   ├── templates/     # Template management
│   │   └── health/        # Health check endpoint
│   └── page.tsx           # Home page
├── components/
│   └── editor/            # Editor components
│       ├── document-editor.tsx
│       ├── editor-toolbar.tsx
│       ├── slash-menu.tsx
│       ├── ai-menu.tsx
│       ├── comments-panel.tsx
│       └── version-history.tsx
├── lib/
│   ├── ai/                # AI services
│   │   ├── writing-assistant.ts
│   │   ├── content-generator.ts
│   │   └── copilot.ts
│   ├── editor/            # Editor logic
│   │   ├── block-schema.ts
│   │   ├── block-operations.ts
│   │   ├── formatting.ts
│   │   ├── slash-commands.ts
│   │   ├── collaboration.ts
│   │   ├── versioning.ts
│   │   └── export.ts
│   ├── comments/          # Comment service
│   ├── suggestions/       # Suggestion & diff engine
│   ├── validators.ts      # Zod validators
│   ├── permissions.ts     # RBAC permissions
│   ├── monitoring.ts      # Metrics & health checks
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript types
└── stores/                # Zustand stores
tests/                     # Integration tests
├── api/
│   ├── documents.test.ts
│   ├── comments.test.ts
│   └── templates.test.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all documents |
| POST | `/api/documents` | Create a document |
| PUT | `/api/documents` | Update a document |
| DELETE | `/api/documents` | Delete a document |
| GET | `/api/comments` | List comments |
| POST | `/api/comments` | Create a comment |
| PUT | `/api/comments` | Update a comment |
| DELETE | `/api/comments` | Delete a comment |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create a template |
| GET | `/api/health` | Health check |

## CI/CD

- **CI** (`.github/workflows/ci.yml`): Lint, typecheck, test, build, Docker build on push/PR
- **CD** (`.github/workflows/cd.yml`): Test, build, push Docker image, deploy on version tags

## License

MIT
