# Bocal a Bidouilles

> "Bocal a Bidouilles" — French for "Jar of Trinkets/Gadgets." A playful goal-tracking app for kids.

## Project Overview

A visual, touch-friendly app that helps kids track daily goals (chores, routines, habits). Each success earns a virtual bead/marble dropped into a jar. When the jar is full (target reached), the child earns a pre-set prize.

### Core Concepts

- **Goal**: A repeating task with a deadline, success criteria, target count, and prize (e.g., "Be ready for school by 8:00 AM, 20 times → ice cream sundae party")
- **Bead/Marble**: A visual token earned for each day a goal is met
- **Jar**: The visual container showing progress toward the prize
- **Child/Player**: Each child has their own progress tracked independently

### Key Features (Planned)

- Multiple concurrent goals per child
- Time-based validation (e.g., must check in before 8:00 AM)
- Touch-screen friendly UI designed for kids
- Visual jar filling up with beads/marbles
- Prize display and celebration when target is reached

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Styling**: Tailwind CSS 4 with CSS custom property design tokens
- **Font**: Nunito (via next/font/google)
- **Deployment**: Vercel
- **Supabase client**: `@supabase/ssr` (server.ts for Server Components, client.ts for Client Components)

## Development Workflow

- All work via feature branches and PRs (see global CLAUDE.md)
- GitHub Issues as backlog
- `.pen` files for UI mockups (Pencil MCP)
- Interview prep tracked in global `~/.claude/interview-prep.md`

## Project Status

**Phase 2: Check-In Flow** — Read-only dashboard is complete (Phase 1). Building the core check-in interaction next.
