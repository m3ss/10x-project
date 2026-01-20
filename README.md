# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Project: AI-Powered Flashcard Generator

This application uses AI to generate educational flashcards from user-provided text.

### ✅ Implemented Features

- **POST /api/generations** - AI flashcard generation endpoint
  - Input validation (1000-10000 characters)
  - Mock AI service with automatic retry logic (up to 3 attempts)
  - Generation metadata tracking (hash, duration, count)
  - Comprehensive error logging
  - Performance monitoring
  - 60-second timeout for AI calls
  - Exponential backoff for retries

### 🚧 In Progress

- Frontend UI for flashcard generation
- Flashcard management endpoints (CRUD)
- User authentication with Supabase
- Real AI service integration (OpenAI/Claude)

### 📚 API Documentation

See `src/pages/api/README.md` for detailed API documentation.
See `src/pages/api/TESTING.md` for test examples and scenarios.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

### Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)
- Docker (required for Supabase local development)

### Quick Start

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase local instance:

```bash
# Start Supabase (first time will download Docker images)
npx supabase start

# Get connection details
npx supabase status
```

4. Configure environment variables:

Create `.env` file with values from `npx supabase status`:

```bash
SUPABASE_URL=http://127.0.0.1:15431
SUPABASE_KEY=<your-anon-key>
```

5. Run the development server:

```bash
npm run dev
```

6. Access the application:

- **Frontend & API**: http://localhost:4321
- **Supabase Studio**: http://127.0.0.1:15434

### Documentation

- **API Documentation**: See `src/pages/api/README.md`
- **Testing Guide**: See `src/pages/api/TESTING.md`
- **Quick Start**: See `QUICKSTART.md`
- **Supabase Setup**: See `SUPABASE.md`
- **Implementation Details**: See `IMPLEMENTATION.md`

## Available Scripts

- `npm run dev` - Start development server (http://localhost:4321)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npx supabase start` - Start Supabase local instance
- `npx supabase stop` - Stop Supabase
- `npx supabase status` - Check Supabase status and get connection details

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
