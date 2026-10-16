# Design: Our Forever Journey

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js 14 App Router                   │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │   Admin Area        │    │   Recipient Area              │   │
│  │   /admin/*          │    │   /journey/[token]/*          │   │
│  │   (auth-gated)      │    │   (session-token-gated)       │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              API Routes  /api/*                          │   │
│  │  /api/auth/*  /api/admin/*  /api/journey/*              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                              │
     ┌─────▼──────┐               ┌───────▼──────┐
     │  MongoDB   │               │  Cloudinary  │
     │  (Mongoose)│               │  (Media)     │
     └────────────┘               └──────────────┘
           │
     ┌─────▼──────┐
     │  Mapbox    │
     │  (Maps +   │
     │  Routing)  │
     └────────────┘
```

## Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 App Router | SSR, API routes, edge middleware, Vercel-native |
| Language | TypeScript strict | Type safety across full stack |
| Styling | Tailwind CSS + CSS variables | Utility-first, design-token-friendly |
| Components | shadcn/ui (selective) | Accessible primitives, no lock-in |
| Animation | Framer Motion | Declarative, reduced-motion-aware |
| Forms | React Hook Form + Zod | Co-located validation |
| Database | MongoDB + Mongoose | Flexible schema, managed Atlas |
| Auth | Custom session (iron-session) | HTTP-only cookies, no OAuth complexity |
| Maps | Mapbox GL JS | Better styling control, generous free tier |
| Routing | Mapbox Directions API | Real turn-by-turn, same provider |
| Media | Cloudinary | Upload presets, signed URLs, image transforms |
| Email | Resend (optional) | Simple API, transactional |
| Deployment | Vercel | Next.js-native, edge functions |

## Directory Structure

```
our_forever_journey/
├── .kiro/
│   └── specs/our-forever-journey/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx          # Admin shell with nav
│   │   │   │   ├── page.tsx            # Dashboard overview
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── journeys/
│   │   │   │   │   ├── page.tsx        # Journey list
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx    # Journey overview
│   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │       ├── checkpoints/page.tsx
│   │   │   │   │       ├── proposal/page.tsx
│   │   │   │   │       └── invitation/page.tsx
│   │   ├── journey/
│   │   │   └── [token]/
│   │   │       ├── page.tsx            # Invitation landing
│   │   │       ├── start/page.tsx      # Location permission
│   │   │       ├── navigate/page.tsx   # Live navigation
│   │   │       ├── checkpoint/[id]/page.tsx  # Checkpoint reveal
│   │   │       ├── proposal/page.tsx   # Final reveal
│   │   │       ├── yes/page.tsx
│   │   │       ├── no/page.tsx
│   │   │       └── complete/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── session/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── journeys/route.ts
│   │   │   │   ├── journeys/[id]/route.ts
│   │   │   │   ├── journeys/[id]/activate/route.ts
│   │   │   │   ├── journeys/[id]/deactivate/route.ts
│   │   │   │   ├── journeys/[id]/reset/route.ts
│   │   │   │   ├── journeys/[id]/checkpoints/route.ts
│   │   │   │   ├── journeys/[id]/checkpoints/reorder/route.ts
│   │   │   │   ├── journeys/[id]/invitation/route.ts
│   │   │   │   ├── journeys/[id]/invitation/revoke/route.ts
│   │   │   │   └── checkpoints/[id]/route.ts
│   │   │   └── journey/
│   │   │       └── [token]/
│   │   │           ├── session/route.ts
│   │   │           ├── state/route.ts
│   │   │           ├── active-checkpoint/route.ts
│   │   │           ├── checkpoints/[id]/complete/route.ts
│   │   │           ├── final-destination/verify/route.ts
│   │   │           ├── response/route.ts
│   │   │           └── completion/route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn primitives
│   │   ├── admin/                      # Admin-specific components
│   │   ├── journey/                    # Recipient-specific components
│   │   └── shared/                     # Cross-cutting components
│   ├── lib/
│   │   ├── db/
│   │   │   ├── connect.ts
│   │   │   └── models/
│   │   │       ├── AdminUser.ts
│   │   │       ├── Journey.ts
│   │   │       ├── Checkpoint.ts
│   │   │       ├── JourneySession.ts
│   │   │       ├── JourneyEvent.ts
│   │   │       └── ProposalResponse.ts
│   │   ├── auth/
│   │   │   ├── session.ts              # iron-session config
│   │   │   └── middleware.ts
│   │   ├── geo/
│   │   │   ├── distance.ts             # Haversine, geofence
│   │   │   └── types.ts
│   │   ├── map/
│   │   │   ├── mapbox.ts               # Mapbox service abstraction
│   │   │   └── types.ts
│   │   ├── tokens.ts                   # Invitation/session token utils
│   │   ├── validation/
│   │   │   └── schemas.ts              # Shared Zod schemas
│   │   └── env.ts                      # Validated env vars
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useJourneyState.ts
│   │   └── useGeofence.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts                   # Security headers, auth guard
├── scripts/
│   └── seed-admin.ts                   # CLI admin account creation
├── public/
│   ├── manifest.json
│   └── icons/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

### AdminUser
```typescript
{
  _id: ObjectId,
  email: string (unique, lowercase),
  passwordHash: string,
  role: 'admin',
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Journey
```typescript
{
  _id: ObjectId,
  adminId: ObjectId (ref: AdminUser),
  title: string,
  status: 'draft' | 'active' | 'completed' | 'deactivated',
  welcomeContent: {
    greeting: string,
    introduction: string,
    backgroundImageUrl: string | null,
    musicUrl: string | null
  },
  theme: {
    primaryColor: string,   // default #7A2038
    accentColor: string,    // default #D8B46A
    backgroundColor: string // default #FFF8F0
  },
  proposalContent: {
    title: string,
    mainMessage: string,
    finalQuestion: string,
    yesLabel: string,
    noLabel: string,
    yesMessage: string,
    noMessage: string,
    backgroundImageUrl: string | null,
    couplePhotoUrl: string | null,
    musicUrl: string | null
  },
  finalDestination: {
    name: string,           // hidden until reveal
    latitude: number,
    longitude: number,
    geofenceRadius: number, // meters
    approachingRadius: number, // meters, for suspense message
    approachingMessage: string,
    finalClue: string | null,
    manualFallbackEnabled: boolean
  },
  invitationTokenHash: string | null,
  invitationToken: string | null,  // plaintext, returned once on generation
  invitationExpiresAt: Date | null,
  invitationRevokedAt: Date | null,
  activatedAt: Date | null,
  completedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: adminId, invitationTokenHash
```

### Checkpoint
```typescript
{
  _id: ObjectId,
  journeyId: ObjectId (ref: Journey),
  sequence: number,
  title: string,
  coordinates: { latitude: number, longitude: number },
  geofenceRadius: number,  // default 50
  required: boolean,       // default true
  skippable: boolean,      // default false
  content: {
    instructionText: string,
    romanticMessage: string,
    imageUrl: string | null,
    audioUrl: string | null,
    clue: string | null,
    unlockAnimation: string | null
  },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: journeyId + sequence
```

### JourneySession
```typescript
{
  _id: ObjectId,
  journeyId: ObjectId,
  sessionTokenHash: string,
  status: 'active' | 'completed' | 'abandoned',
  startedAt: Date,
  lastActivityAt: Date,
  currentCheckpointIndex: number,
  completedCheckpointIds: ObjectId[],
  finalDestinationUnlockedAt: Date | null,
  responseStatus: 'pending' | 'yes' | 'no' | null,
  responseSubmittedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: sessionTokenHash (unique), journeyId
```

### JourneyEvent
```typescript
{
  _id: ObjectId,
  journeyId: ObjectId,
  sessionId: ObjectId,
  eventType: 'journey_started' | 'checkpoint_unlocked' | 'checkpoint_skipped' 
           | 'final_destination_unlocked' | 'proposal_response_submitted' 
           | 'journey_completed' | 'journey_reset',
  checkpointId: ObjectId | null,
  metadata: Record<string, unknown>, // no raw tokens, no precise coordinates
  timestamp: Date
}
// Indexes: journeyId, sessionId, eventType
```

### ProposalResponse
```typescript
{
  _id: ObjectId,
  journeyId: ObjectId,
  sessionId: ObjectId,
  response: 'yes' | 'no',
  submittedAt: Date
}
// Unique index: journeyId + sessionId
```

## Security Architecture

### Token Flow
1. Admin generates invitation → server creates `crypto.randomBytes(32)` token
2. Token returned to admin once (plaintext)
3. `SHA-256(token)` stored in Journey.invitationTokenHash
4. Recipient opens `/journey/{token}` → server hashes token, looks up journey
5. Session created → `crypto.randomBytes(32)` session token
6. `SHA-256(sessionToken)` stored in JourneySession
7. Session token in HTTP-only cookie (`session_token`)

### Reveal State Machine (Server-Controlled)
```
journey_started
  → checkpoints 1..N unlock (geofence + server validation)
  → final_destination_approaching (approaching radius, suspense message only)
  → final_destination_unlocked (arrival radius + accuracy check)
  → proposal_revealed (server sets flag; content returned only now)
  → response_submitted (idempotency enforced)
  → journey_completed
```

### API Authorization Layers
- **Admin routes**: `requireAdminSession()` middleware checks session cookie
- **Recipient routes**: `requireRecipientSession()` checks session cookie + journey ownership
- **Checkpoint coordinates**: Only active checkpoint coordinates returned to recipient
- **Proposal content**: Only returned when `finalDestinationUnlockedAt` is set on session

## UI Design System

### Color Tokens
```css
--color-burgundy: #7A2038;
--color-cream: #FFF8F0;
--color-blush: #F4DDE3;
--color-gold: #D8B46A;
--color-charcoal: #242126;
--color-white: #FFFFFF;
```

### Typography
- Headings: `Playfair Display` (Google Fonts, serif, elegant)
- Body: `Inter` (system-ui fallback, readable)
- Sizes: Mobile-first, minimum 16px body text

### Animation Principles
- Page transitions: fade + slight upward translate (0.3s ease)
- Checkpoint unlock: scale in + fade (0.5s spring)
- Proposal reveal: cinematic fade sequence (2s+, orchestrated)
- Floating elements: subtle, CSS keyframes, `prefers-reduced-motion` disables
- All Framer Motion variants respect `useReducedMotion()`
