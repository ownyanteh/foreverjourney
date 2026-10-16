# Implementation Tasks: Our Forever Journey

## Phase 1: Foundation
- [x] T-01: Scaffold Next.js 14 project (TypeScript strict, App Router, Tailwind)
- [x] T-02: Configure tsconfig paths, eslint, prettier
- [x] T-03: Set up environment variable validation (lib/env.ts)
- [x] T-04: Establish MongoDB connection with Mongoose (lib/db/connect.ts)
- [x] T-05: Create all Mongoose models with validation and indexes
- [x] T-06: Implement iron-session admin authentication
- [x] T-07: Build UI design token system and shared components
- [x] T-08: Create CLI seed script for initial admin account
- [x] T-09: Configure Next.js middleware for security headers

## Phase 2: Journey Administration
- [x] T-10: Admin login page and authentication API
- [x] T-11: Admin dashboard layout (shell, nav)
- [x] T-12: Dashboard overview page (status cards, recent events)
- [x] T-13: Journey list, create, and delete
- [x] T-14: Journey editor (title, welcome content, theme)
- [x] T-15: Checkpoint CRUD API routes
- [x] T-16: Map-based checkpoint editor (Mapbox, drag markers)
- [x] T-17: Checkpoint content editor (messages, media upload)
- [x] T-18: Proposal customization page
- [x] T-19: Invitation generation and revocation
- [x] T-20: Journey activate/deactivate/reset

## Phase 3: Recipient Experience
- [x] T-21: Invitation landing page (welcome, start button)
- [x] T-22: Recipient session creation API
- [x] T-23: Location permission explanation and request flow
- [x] T-24: GPS service layer (useGeolocation hook, error handling)
- [x] T-25: Mapbox map integration for recipient (live position)
- [x] T-26: Route retrieval and display (Directions API)
- [x] T-27: Active checkpoint API (coordinates, instructions)
- [x] T-28: Distance calculation and real-time update
- [x] T-29: Geofence detection hook (client-side evaluation)

## Phase 4: Checkpoint and Proposal
- [x] T-30: Checkpoint unlock API (server validation, dedup)
- [x] T-31: Checkpoint reveal UI (card, media player)
- [x] T-32: Journey progress persistence and restore
- [x] T-33: Final destination verify API (server-controlled reveal)
- [x] T-34: Approaching radius suspense message
- [x] T-35: Animated proposal reveal screen
- [x] T-36: YES response handler and confirmation screen
- [x] T-37: NO response handler and confirmation screen
- [x] T-38: Journey completion and state restoration on refresh

## Phase 5: Monitoring and Hardening
- [x] T-39: Admin progress monitoring page (events timeline)
- [x] T-40: Admin response view
- [x] T-41: Unit tests (geo, tokens, state machine)
- [x] T-42: Integration tests (auth, journey API, checkpoint API)
- [x] T-43: PWA manifest and offline fallback
- [x] T-44: .env.example and documentation
- [x] T-45: Production build verification
