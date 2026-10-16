# Requirements: Our Forever Journey

## Overview
A GPS-powered romantic proposal treasure hunt Progressive Web App. An administrator (the boyfriend) configures a multi-checkpoint journey; the recipient (his girlfriend) follows the journey on her mobile browser, discovers personalized messages at each stop, and experiences a cinematic proposal reveal when she reaches the final destination.

---

## Functional Requirements

### FR-1: Administrator Authentication
- FR-1.1: An admin account must be created via a secure CLI seed script (no open registration).
- FR-1.2: The admin logs in with email and password; passwords are hashed with bcrypt.
- FR-1.3: Sessions use secure, HTTP-only cookies with SameSite=Strict and expiry.
- FR-1.4: Login attempts are rate-limited (max 5 per 15 minutes per IP).
- FR-1.5: All admin API routes verify the session server-side before executing.
- FR-1.6: The admin can log out, destroying the session.

### FR-2: Journey Management
- FR-2.1: Admin can create, read, update, and delete journeys.
- FR-2.2: Journey statuses: Draft → Active → Completed | Deactivated.
- FR-2.3: Only one journey per invitation token can be active at a time.
- FR-2.4: Admin can preview the recipient experience from the dashboard.
- FR-2.5: Admin can activate, deactivate, and reset a journey.
- FR-2.6: Resetting a journey clears session progress but preserves historical events and responses.

### FR-3: Checkpoint Management
- FR-3.1: Admin can add, edit, reorder, and delete checkpoints on a journey.
- FR-3.2: Each checkpoint has: name, lat/lng, geofence radius, sequence number, instruction text, romantic message, optional image, optional audio, optional clue, required/skippable flags, and active flag.
- FR-3.3: Admin can place checkpoints via map click/drag or numeric lat/lng fields.
- FR-3.4: Checkpoint coordinates are validated (lat −90 to 90, lng −180 to 180).
- FR-3.5: Draft checkpoint coordinates are not exposed to the recipient.

### FR-4: Proposal Customization
- FR-4.1: Admin can customize: proposal title, final question, main message, YES/NO button labels, YES/NO confirmation messages, background image, couple photo, theme colors, and optional music.
- FR-4.2: The proposal screen previews on common mobile viewport sizes in the dashboard.

### FR-5: Invitation Management
- FR-5.1: Admin generates a cryptographically secure (128-bit+) invitation token.
- FR-5.2: The token hash (not plaintext) is stored in the database.
- FR-5.3: The invitation URL is: `{APP_URL}/journey/{token}`.
- FR-5.4: Admin can revoke an invitation; revoked links show a friendly unavailable page.
- FR-5.5: Invitation resolution is rate-limited.
- FR-5.6: Raw tokens are never logged.

### FR-6: Recipient Session
- FR-6.1: Opening a valid invitation URL creates or resumes a JourneySession.
- FR-6.2: A secure session token is issued to the recipient via HTTP-only cookie.
- FR-6.3: The session token hash is stored in the database.
- FR-6.4: Session state persists across page refreshes.
- FR-6.5: Recipient cannot access other sessions or admin data.

### FR-7: Location and Map
- FR-7.1: The app requests geolocation permission only after user taps "Begin Our Journey" and sees an explanation.
- FR-7.2: `watchPosition` is used while navigation is active.
- FR-7.3: Location errors (denied, unavailable, timeout, poor accuracy) are handled with clear UI messages and manual navigation fallback.
- FR-7.4: The app displays the recipient's real device position on a Mapbox map.
- FR-7.5: A real route (Mapbox Directions API) is retrieved for each active checkpoint.
- FR-7.6: Route is displayed as a polyline; straight-line fallback shown if routing fails.
- FR-7.7: Distance to the next checkpoint is calculated and displayed in real time.
- FR-7.8: Routing API is not called on every GPS update; requests are debounced.
- FR-7.9: Location watching stops when the journey ends.
- FR-7.10: The app explains that GPS may pause when the browser is backgrounded.

### FR-8: Checkpoint Detection and Unlocking
- FR-8.1: Geofence entry is evaluated using distance + GPS accuracy on the client.
- FR-8.2: Unlock is confirmed server-side; client cannot self-authorize an unlock.
- FR-8.3: A stable or repeated reading near the checkpoint is required before triggering unlock.
- FR-8.4: Server rate-limits checkpoint completion attempts.
- FR-8.5: Duplicate completion events for the same checkpoint are rejected.
- FR-8.6: On unlock: navigation pauses, content card/modal appears with message, image, audio, and clue.
- FR-8.7: Progress is persisted; refreshing the page does not reset completed checkpoints.
- FR-8.8: Future checkpoint coordinates are not returned to the recipient until needed.

### FR-9: Final Destination and Proposal Reveal
- FR-9.1: Final destination is configured separately from regular checkpoints.
- FR-9.2: The proposal message and final reveal content are not returned by any API until the server authorizes the reveal.
- FR-9.3: A suspense message appears when the recipient is within a configurable "approaching" radius.
- FR-9.4: Arrival is validated server-side with GPS accuracy consideration.
- FR-9.5: The proposal screen is a cinematic full-screen experience with smooth animations.
- FR-9.6: The screen shows: personalized message, final question, YES and NO buttons.
- FR-9.7: Optional background music requires explicit user interaction to play.
- FR-9.8: Reduced-motion OS preference is respected.

### FR-10: Proposal Response
- FR-10.1: Both YES and NO are genuine, accessible, equally-easy-to-tap buttons.
- FR-10.2: The NO button must not be moved, hidden, or made difficult to tap.
- FR-10.3: Response is submitted to the server and stored in ProposalResponse.
- FR-10.4: Duplicate submissions are rejected (one response per session).
- FR-10.5: YES displays a joyful confirmation animation and personalized message.
- FR-10.6: NO displays a gentle, respectful confirmation message.
- FR-10.7: Journey is marked Completed after a response is recorded.
- FR-10.8: Page refresh after response restores the correct confirmation screen.
- FR-10.9: Admin sees the response in the dashboard.

### FR-11: Progress Monitoring
- FR-11.1: Admin dashboard shows journey status, checkpoint completion counts, last event, and proposal response.
- FR-11.2: Journey events (started, checkpoint unlocked, final unlocked, response submitted, completed) are stored in JourneyEvent.
- FR-11.3: No continuous location trail is stored; only progress events.

### FR-12: Media Uploads
- FR-12.1: Images and audio accepted for checkpoint content and proposal screen.
- FR-12.2: Validation: file type (magic bytes), file size limits (images ≤10 MB, audio ≤25 MB).
- FR-12.3: Files stored in object storage (Cloudinary or compatible S3-style service).
- FR-12.4: Private proposal assets accessed via signed URLs where needed.

---

## Non-Functional Requirements

### NFR-1: Security
- All secrets in environment variables; none hardcoded or committed.
- Environment variables validated at startup.
- HTTPS required in production.
- Content Security Policy and security headers via Next.js middleware.
- Input validated with Zod on all API routes.
- Invitation and session tokens hashed in the database.
- No secret content in client bundles, source maps, or API responses before reveal.

### NFR-2: Performance
- Map tiles and routing load within acceptable time on a mobile LTE connection.
- Geofence checks run on the client; only confirmation requests go to the server.
- Images served at appropriate resolution; lazy-loaded where possible.

### NFR-3: Accessibility
- WCAG 2.2 AA principles applied throughout.
- Keyboard-accessible controls.
- Visible focus indicators.
- Sufficient color contrast.
- Semantic HTML and ARIA labels.
- Screen-reader announcements for checkpoint unlocks and proposal state changes.
- Text alternatives for images; play/pause controls for audio.
- `prefers-reduced-motion` respected.

### NFR-4: Reliability
- Journey progress survives page refresh via server-persisted session state.
- Offline: locally available state preserved; retries on reconnect.
- Clear loading, empty, and error states throughout.

### NFR-5: Privacy
- Explicit consent before geolocation is requested.
- Minimum location data stored (no detailed movement trail by default).
- Admin can delete unnecessary location records.
- No third-party analytics collecting location or proposal data by default.
