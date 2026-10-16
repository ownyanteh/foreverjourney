# Our Forever Journey

A GPS-powered romantic proposal treasure hunt — a private Progressive Web App that guides a recipient through a series of personalized checkpoints, culminating in an animated proposal reveal.

---

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free M0 tier is sufficient)
- An [OpenRouteService](https://openrouteservice.org) API key (free, no credit card). Map tiles come from [OpenFreeMap](https://openfreemap.org) and need no account
- A [Cloudinary](https://cloudinary.com) account (free tier)

### 2. Clone and install

```bash
cd our_forever_journey
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

See `.env.example` for every required variable and an explanation of each.

### 4. Create the admin account

```bash
npm run seed:admin
```

Enter your email and a strong password (minimum 12 characters). This creates the admin account in MongoDB. There is no open registration — the admin account can only be created via this script.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the admin dashboard.

---

## Admin Workflow

1. **Create a journey** at `/admin/journeys/new`
2. **Add checkpoints** — click a location on the map or enter lat/lng manually
3. **Customize the proposal** screen (message, question, button labels)
4. **Configure the final destination** coordinates and arrival radius
5. **Activate the journey**
6. **Generate an invitation link** and send it to your partner

---

## Recipient Experience

The recipient opens the invitation URL on her phone. The app:

1. Shows a personalized welcome screen
2. Explains why location access is needed, then requests it
3. Displays a live MapLibre map with a route to the first checkpoint
4. Unlocks romantic messages as she arrives at each location
5. Reveals a cinematic proposal screen at the final destination
6. Records her YES or NO response securely

---

## Deployment (Vercel)

1. Push to a GitHub/GitLab repo
2. Import the project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example` in Vercel's project settings
4. Deploy — Vercel auto-detects Next.js

**Important:** The app requires HTTPS for the browser Geolocation API. Vercel provides HTTPS on all deployments including previews.

---

## Environment Variables

See `.env.example` for the full list with descriptions.

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `AUTH_SECRET` | ✅ | Session encryption (32+ random chars) |
| `APP_URL` | ✅ | Public URL for generating invitation links |
| `ORS_API_KEY` | ✅ | OpenRouteService Directions API key, server-side only (keep secret) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Media uploads |
| `CLOUDINARY_API_KEY` | ✅ | Media uploads |
| `CLOUDINARY_API_SECRET` | ✅ | Media uploads |
| `RESEND_API_KEY` | Optional | Admin email notifications |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | Email address to notify |

---

## Security Notes

- Invitation tokens are hashed with SHA-256 — only the hash is stored in MongoDB
- Session tokens are encrypted with iron-session (AES-256-CBC)
- All admin routes verify the session server-side
- Proposal content is **never** returned by any API until the server has confirmed the recipient reached the final destination
- Future checkpoint coordinates are not returned to the recipient until needed
- Rate limiting is applied to login (5/15 min), invitation resolution (20/min), checkpoint completion (10/min), and response submission (3/hr)
- Login attempts use timing-safe password comparison to prevent email enumeration
- All API inputs are validated with Zod

---

## Known Limitations

- Background GPS tracking may pause when the phone is locked or the browser is backgrounded (iOS Safari limitation — this is communicated to the recipient in the UI)
- GPS geofence verification is approximate — browser coordinates can be spoofed; the app uses server-side checks but cannot guarantee physical presence
- The OpenRouteService free tier allows 2,000 directions requests/day (40/min); OpenFreeMap tiles have no limits
- Media uploads currently use Cloudinary's direct REST API; a production setup should use signed upload presets
- PWA icons at `/public/icons/` need real PNG files; placeholder paths are included in `manifest.json`

---

## Manual Device Testing Checklist

- [ ] Open invitation link on Android (Chrome)
- [ ] Open invitation link on iPhone (Safari)
- [ ] Deny location permission — verify fallback message and manual navigation option
- [ ] Grant location permission — verify live position appears on map
- [ ] Walk to a checkpoint location — verify unlock triggers correctly
- [ ] Verify checkpoint card shows message, clue, and audio controls
- [ ] Revoke invitation link — verify "unavailable" page shows
- [ ] Complete full journey to final destination — verify proposal screen appears
- [ ] Tap YES — verify confirmation screen and admin dashboard update
- [ ] Refresh page after response — verify correct screen is restored
- [ ] Test on slow network (airplane mode + reconnect) — verify error states

---

## Architecture

See `.kiro/specs/our-forever-journey/design.md` for the full architecture document including the database schema, security model, and UI design system.
