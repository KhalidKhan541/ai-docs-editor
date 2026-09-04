# Contributing to AI Docs Editor

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env.local`
4. Set up the database: `npm run db:generate && npm run db:push`
5. Start the dev server: `npm run dev`

## Development Workflow

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `refactor/description` — Code refactoring
- `test/description` — Adding tests
- `docs/description` — Documentation changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature`
- `fix: resolve bug`
- `refactor: improve code structure`
- `test: add unit tests`
- `docs: update documentation`
- `chore: maintenance tasks`

### Code Style

- **TypeScript** — Strict mode enabled
- **Formatting** — Prettier with Tailwind plugin
- **Linting** — ESLint with Next.js config
- **Components** — Functional components with hooks
- **Testing** — Jest + React Testing Library

### Running Checks

```bash
npm run lint          # Check linting
npm run typecheck     # Check types
npm run test          # Run tests
npm run test:coverage # Check coverage
```

### Before Submitting a PR

1. Run the full test suite: `npm run test`
2. Run linting: `npm run lint`
3. Run type checking: `npm run typecheck`
4. Format code: `npm run format`
5. Update documentation if needed

## Testing Guidelines

### Unit Tests

- Place in `__tests__/` directories next to the source files
- Name files as `*.test.ts` or `*.test.tsx`
- Test one concept per `describe` block
- Use descriptive test names

### Component Tests

- Use `data-testid` attributes for element selection
- Test user interactions with `fireEvent`
- Mock external dependencies
- Test both happy paths and edge cases

### Integration Tests

- Place in `tests/` directory at project root
- Test API routes end-to-end
- Use real HTTP requests where possible

## Project Architecture

### Editor Layer

- `block-schema.ts` — Block type definitions and validation
- `block-operations.ts` — CRUD operations on blocks
- `formatting.ts` — Text formatting utilities
- `slash-commands.ts` — Slash command system
- `collaboration.ts` — Yjs-based real-time sync
- `versioning.ts` — Document version management
- `export.ts` — Export to various formats

### AI Layer

- `writing-assistant.ts` — Rewrite, continue, summarize
- `content-generator.ts` — Generate content from templates
- `copilot.ts` — Inline suggestions and completions

### Data Layer

- Prisma ORM with PostgreSQL
- Zod validators for API inputs
- Role-based access control

## Questions?

Open an issue or start a discussion on GitHub.
