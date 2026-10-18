# Our Forever Journey: UI Prompt for Google Stitch / Claude Design

> **How to use:**
> - **Google Stitch:** paste **Part 1 (Global Context)** first, then paste screens from **Part 3** one at a time (or in small groups).
> - **Claude Design:** paste the whole file at once, then ask for screens in batches (e.g. "Start with screens 12–18").
>
> Screen names and routes match the existing codebase exactly. Keep them unchanged so the designs map 1:1 to the code.

---

## Part 1: Global Context (paste this first)

**This is a redesign of an existing Next.js + Tailwind app. Keep every screen name, field, button label and piece of copy exactly as written; change only the visual design.**

Design a clean, elegant, romantic web app called **Our Forever Journey**. One person (the **Admin**) privately plans a marriage proposal experience. Their partner (the **Recipient**, referred to as "her" in the copy) receives a private link, goes through a personal journey on her phone, and ends at a proposal screen with the question "Will you marry me?".

**Two sides of the app:**
1. **Admin app** (`/admin/...`): a dashboard used on desktop and mobile to create journeys, write content, generate the invitation link and watch progress.
2. **Recipient experience** (`/journey/[token]/...`): mobile-first, full-screen, cinematic and emotional. She uses it on her phone, often outdoors.

**Two journey types** (the admin picks one per journey):
- **Route & destination:** she follows GPS checkpoints on a live map. Each checkpoint unlocks a romantic message, photo or voice note. At the final destination the proposal appears.
- **Memory questions:** no travel. She answers 3–5 questions about moments the couple shared, picking a feeling and optionally writing how it made her feel. Then the proposal appears.

After she answers **Yes**, she can take selfies, add photos and leave a message ("Capture this moment"). The admin sees them in a gallery.

**Visual style:** romantic, refined, modern. Lots of breathing room, soft shadows, rounded shapes, gentle motion. Avoid clutter and corporate "SaaS" aesthetics.

**Brand palette (keep these exact values):**
| Token | Hex | Use |
|---|---|---|
| Burgundy (primary) | `#7A2038` | Primary buttons, headings accents, recipient backgrounds |
| Burgundy dark | `#4A1322` / `#62192D` | Gradients, hover |
| Burgundy light | `#F9EEF1` / `#F0D0D8` | Tints, selected states |
| Cream (app background) | `#FFF8F0` | Admin page background, light recipient screens |
| Blush | `#F4DDE3` (light `#FCF0F3`, mid `#E8BAC5`) | Borders, dividers, subtle fills |
| Gold (accent) | `#D8B46A` (deep `#C49A40`) | Celebration, final destination, "YES" highlights |
| Charcoal (text) | `#242126` | Body text (use 60–70% opacity for secondary text) |
| Success | Emerald green | "Unlocked", "Saved" |
| Error | Soft red | Alerts |

**Typography:**
- Headings and romantic copy: **Playfair Display** (serif), often italic for messages.
- UI and body text: **Inter** (sans-serif).

**Shapes and components:** cards with `rounded-2xl` (16px) corners, white or white/70 with a blush border and soft shadow. Recipient cards use `rounded-3xl` (24px) frosted glass (white at 10% opacity, backdrop blur, white/20 border) on burgundy gradients. Buttons are rounded-xl/2xl. Primary is solid burgundy with white text; on dark recipient screens the primary is white with burgundy text. Inputs are rounded-xl with a blush border. Status badges are pills.

**Status badges** (journeys): `draft` (grey), `active` (green), `completed` (gold), `deactivated` (muted). Response badges: "💍 YES!" (gold/green) and "No" (grey).

**Icons:** Lucide line icons (Heart, Map, MapPin, Camera, MessageCircleHeart, Link, Activity, Pencil, etc.).

**Accessibility:** WCAG AA contrast, large tap targets (min 44px) on recipient screens, visible focus states, respect reduced motion.

---

## Part 2: Shared Layouts

### Admin Shell (wraps every `/admin/*` page except Admin Login)
- **Desktop:** fixed left sidebar (240px, white/70 with blur, blush right border). Top: Heart icon (burgundy, filled) and the word "Admin" in Playfair. Nav items: **Dashboard** (`/admin`) and **Journeys** (`/admin/journeys`), with an icon and label; the active item has a burgundy/10 background, burgundy text and a small chevron. Bottom: "Sign out" (turns red on hover).
- **Mobile:** sticky top bar (56px) with Heart + "Admin" and a hamburger menu that opens a dropdown drawer with the same nav items and Sign out.
- Content area: cream background, max-width container, generous padding.
- Loading state while checking login: centered pulsing burgundy heart.

### Recipient screens (all `/journey/[token]/*`)
- Full-screen, mobile-first (design at 390×844), no app chrome.
- Default background: diagonal gradient burgundy `#7A2038` → `#4A1322` → charcoal, with white text. Light screens (Start Journey, No) use cream.
- Decorative floating emoji (💕 ❤️ ✨ 🌸 💫) at low opacity drifting slowly.
- Optional music toggle: circular frosted button, top-right (Music / mute icon).

---

## Part 3: Screens

### ADMIN SCREENS

#### 1. Admin Login (`/admin/login`)
Centered card on a cream background, max width ~380px.
- Top: round burgundy/10 badge with a filled burgundy Heart; title "Our Forever Journey" (Playfair); subtitle "Administrator Portal".
- Card (white/80, blur, blush border, rounded-2xl): "Email address" input with Mail icon (placeholder "you@example.com"); "Password" input with Lock icon and an eye toggle to show/hide; full-width burgundy "Sign in" button with loading state.
- Error alert at the top of the card (soft red), e.g. "Invalid email or password." or "Too many login attempts. Please try again later."

#### 2. Dashboard (`/admin`)
- Header: "Dashboard" (Playfair, large), subtitle "Welcome back. Here's what's happening." Right side: primary button "+ New Journey".
- Three stat cards in a row: **Total Journeys** (Map icon, burgundy tint), **Active** (Activity icon, green tint), **Completed** (Heart icon, gold tint). Big number + label.
- Section "Recent Journeys": list of journey cards. Each shows the title, status badge, optional response badge ("💍 YES!" / "No"), a meta row ("3 checkpoints" or "4 questions", and "last activity 2 hours ago"), and an outline "Manage" button.
- Empty state: large blush heart, "No journeys yet", "Create your first journey to begin planning the perfect proposal.", button "+ Create Journey".

#### 3. Journeys (`/admin/journeys`)
- Header "Journeys" with a "+ New Journey" button.
- Full list of journey cards (same card design as the Dashboard: title, status badge, response badge, count, "Manage").
- Empty state: "No journeys yet. Create your first one." with a "Create Journey" button.

#### 4. New Journey (`/admin/journeys/new`)
- Back arrow, title "New Journey", subtitle "Set up the basics to get started."
- Card "Journey Details": "Journey title *" (placeholder "Our Forever Journey").
- Card "Welcome Message": "Greeting" (placeholder "Hey, my love."), "Introduction" textarea (placeholder "I've planned a little adventure for you…").
- Actions: "Cancel" (outline) and "Create Journey" (primary).

#### 5. Journey Overview (`/admin/journeys/[id]`)
The hub for a single journey.
- Header: back arrow, journey title (Playfair), status badge, optional response badge ("💍 She said YES!" / "Response: No"), "Created 3 days ago".
- **Journey Status Controls** row: "▶ Activate Journey" (primary; shown for draft/deactivated), "⏸ Deactivate" (secondary; shown when active), "↺ Reset" (outline). An error alert can appear above the row.
  - **Reset confirmation dialog:** title "Reset this journey?"; body "This sets the journey back to Draft and permanently deletes all of its history: progress, checkpoint unlocks, the event timeline and the yes/no response. Shared photos and messages are kept."; buttons "Cancel" and "Reset Journey".
- **Journey type selector** (label "Journey type"): two large selectable cards side by side (radio behaviour):
  - **Route & destination** (Map icon): "She follows GPS checkpoints to a final location, then the proposal appears."
  - **Memory questions** (MessageCircleHeart icon): "She answers 3–5 questions about your moments together, then the proposal appears. No travel needed."
  - Selected card: burgundy border, burgundy/5 fill, check icon. While the journey is active both cards are locked, with the hint "Deactivate or reset the journey to change its type."
- **Section navigation grid** (5 tiles, icon above label; 2 columns on mobile, 5 on desktop): **Edit Welcome** · **Checkpoints** (route type) *or* **Questions** (memory questions type) · **Proposal** · **Invitation** · **Progress**.
- Two stat cards: "Active checkpoints" or "Memory questions" (count), and "Journey events" (count).
- Card "Recent Events": list rows with an emoji label (🚀 Journey started, 📍 Checkpoint unlocked, ⏭️ Checkpoint skipped, ✨ Final destination reached, 💬 Memory questions answered, 📸 Memory shared, 💍 Response submitted, 🎉 Journey completed) and a relative time on the right.

#### 6. Edit Journey (`/admin/journeys/[id]/edit`), opened from the "Edit Welcome" tile
- Back arrow, title "Edit Journey", subtitle "Update the title and welcome message."
- Card "Journey Details": "Journey title *".
- Card "Welcome Message": "Greeting", "Introduction" (textarea).
- Card "Theme Colors": three inputs "Primary" (#7A2038), "Accent" (#D8B46A), "Background" (#FFF8F0), each with a color swatch preview.
- "Save Changes" button; inline success "Saved successfully." / error "Failed to save."

#### 7. Checkpoints (`/admin/journeys/[id]/checkpoints`), route type only
- Header: back arrow, "Checkpoints", subtitle "3 checkpoints", "+ Add Checkpoint" button.
- **Checkpoint Map Editor:** an interactive map (rounded-2xl, ~256px tall) showing numbered pins for each checkpoint; clicking the map sets the coordinates in the form.
- List of checkpoint cards: drag handle, numbered burgundy circle, title, a meta line "5.60370, -0.18700 · 50m radius", and Edit (pencil) and Delete (trash, red) icon buttons.
- Empty state: "No checkpoints yet. They're optional: with none, the journey goes straight to the final destination."
- **Add/Edit Checkpoint dialog** (scrollable modal): title "Add Checkpoint" / "Edit Checkpoint", description "Configure this stop on the journey."
  - "Name *" (placeholder "The Coffee Shop Where We Met")
  - **Paste from Google Maps** field (MapPin icon, placeholder "Google Maps link or 5.6037, -0.1870"), with a status line below: green "Set to 5.603700, -0.187000", grey "Reading link…", or red error text.
  - "Latitude *" and "Longitude *" side by side; helper "Or click the map above, or type them in."
  - "Geofence radius (metres)" (number)
  - "Instruction text (shown during navigation)" (placeholder "Head to the corner table by the window…")
  - "Romantic message (revealed on arrival)" textarea
  - "Clue to next stop (optional)"
  - Buttons: "Add Checkpoint" / "Save Changes" (primary) and "Cancel".

#### 8. Memory Questions (`/admin/journeys/[id]/questions`), memory questions type only
- Header: back arrow, "Memory Questions", subtitle "3–5 moments you've shared. She'll answer each with how it made her feel, then the proposal appears."
- If the journey type is still Route: amber notice "This journey is set to **Route & destination**. To use these questions, choose **Memory questions** as the journey type on the journey overview."
- A stack of **Moment cards** (3 by default, up to 5). Each card has a numbered burgundy circle, the label "Moment 1", and up/down/remove icon buttons. Fields: "The moment *" (placeholder "The night we first met") and "A little note (optional, shown under the moment)" textarea (placeholder "Do you remember what you thought of me?").
- "+ Add a moment" outline button (hidden at 5).
- Progress line with an icon: "2 of 3–5 moments written (add 1 more before activating)", which turns green once 3+ are written.
- "Save Questions" primary button with a "Saved" confirmation.

#### 9. Proposal Customization (`/admin/journeys/[id]/proposal`), opened from the "Proposal" tile
- Header: back arrow, "Proposal Customization", subtitle "Design the moment she reaches the final destination."
- Card **Final Destination** (MapPin icon, gold), **route type only**:
  - "Location name (shown only after reveal)" (placeholder "The Rooftop Garden")
  - **Paste from Google Maps** field (same as on Checkpoints)
  - "Latitude *" / "Longitude *"
  - "Arrival radius (m)" / "Suspense radius (m)"
  - "Approaching message" (placeholder "You're almost there…")
  - "Save Destination" button
- Card **Proposal Screen** (Heart icon, burgundy):
  - "Screen title" (placeholder "You made it, my love.")
  - "Main romantic message" textarea
  - "The question" (placeholder "Will you marry me?")
  - "YES button label" / "NO button label" side by side
  - "YES confirmation message" textarea / "NO confirmation message" textarea
  - "Save Proposal" button; inline "Saved successfully." / "Failed to save. Please try again."

#### 10. Invitation Link (`/admin/journeys/[id]/invitation`)
- Header: back arrow, "Invitation Link", subtitle "Generate a private link to send to your partner."
- If the journey isn't active: warning card "Journey is not active" / "Activate the journey before generating an invitation link."
- Link card: label "Your invitation link", read-only URL field with a Copy button (changes to a check mark and "Copied"). Actions: "Regenerate" (RefreshCw) and "Revoke" (X, red). Empty state: "No invitation link generated yet." and a primary "Generate Invitation Link" button.
- Card "How it works" (numbered steps):
  1. Generate a unique, private invitation link.
  2. Copy and send the link to your partner via text or email.
  3. She opens the link on her phone to begin the journey.
  4. ⚠ Revoking the link immediately invalidates it: she won't be able to open the journey again.

#### 11. Progress & Response (`/admin/journeys/[id]/progress`), opened from the "Progress" tile
- Header: back arrow, "Progress & Response", journey title as subtitle.
- **Response card:**
  - Yes: gold-tinted card with a large gold Heart, "💍 She said YES!", "Submitted October 18, 2026 at 7:42 PM".
  - No: neutral card, "Response recorded: No".
  - Pending: muted card with a Clock icon, "Waiting for the proposal response…"
- **Her answers** card (memory questions type; MessageCircleHeart icon, "Her answers (4)"): an ordered list. Each item shows "Moment 1" (small label), the moment text (Playfair, bold), a feeling pill (e.g. "🥰 Loved"), her written answer in italic serif quotes, and a timestamp.
- **Memories** card (Camera icon, "Memories (6)"): a photo grid (2 columns on mobile, 3 on desktop). Each tile is a square photo (click to open full size, with a download icon on hover) and a caption with her message in italic serif plus a timestamp. Message-only memories show just the text.
- **Sessions** card ("Sessions (1)"): rows with a status badge (active/completed), "2/3 checkpoints" or "3/4 questions answered", and "Started 1 hour ago".
- **Checkpoints** card (route type): rows with a numbered circle that turns into a green check plus "Unlocked" once reached.
- **Event Timeline** card: rows with an emoji label, optional checkpoint name below, and a relative time.

---

### RECIPIENT SCREENS (mobile-first, full-screen)

#### 12. Invitation Landing (`/journey/[token]`)
The first thing she sees when she opens the link. Cinematic.
- Background: the admin's background photo with a burgundy-to-charcoal overlay, or the burgundy gradient if there's no photo. Floating emoji drift slowly.
- Optional music toggle (top-right).
- Centered content (max ~360px), animating in step by step: a frosted circle with a large white filled Heart; small caps "A MESSAGE FOR YOU"; the journey title (Playfair, 3xl–4xl, white); the greeting in italic serif ("Hey, my love."); the introduction paragraph (white/70).
- CTA: large white rounded-2xl button with burgundy text, "♥ Begin Our Journey ›", with a subtle scale on hover/press and a loading state.
- Inline error pill (red/30): "Unable to start journey. Please try again."
- **Journey Unavailable state** (same route): cream background, 💌 emoji, "This link is unavailable", "This invitation link may have expired or been revoked. Please check with the sender." (or "This journey has already been completed.").

#### 13. Start Journey (`/journey/[token]/start`), route type only (location permission)
Cream background, centered.
- Burgundy/10 circle with a MapPin icon; title "One last thing before we begin" (Playfair); text "This journey uses your device's location to guide you along the route and unlock surprises as you arrive at each special place."
- Privacy card (white/70, blush border) with two rows: Shield icon, "Your location is only used to guide you. It's never stored as a detailed trail."; Navigation icon, "Location updates may pause if your phone is locked or the browser is backgrounded."
- Primary button "Allow Location Access" (loading: "Getting your location…").
- Alert states: **denied** (red card, "Location access denied", steps to enable it, plus an outline "Continue without GPS" button and an "Open in Google Maps instead" link); **unsupported** ("Your browser doesn't support location services…"); **timeout** ("Location timed out. Please ensure you're outside…").

#### 14. Navigate (`/journey/[token]/navigate`), route type only
A full-screen map experience, like a romantic Google Maps.
- Top ~60% of the screen: live map with the user's dot, the target pin and the route line. A thin gold progress bar along the very top edge. A GPS status pill floats at the top center ("Getting your location…" with a spinning compass, or "GPS unavailable").
- **Bottom sheet** (white, rounded-t-3xl, drag handle):
  - Current target: numbered burgundy circle, checkpoint title (Playfair), instruction text. Or, for the final leg, a gold star circle and "Head to the final destination".
  - Distance card (cream): Navigation icon, large distance "350 m" and the next turn instruction.
  - Low accuracy warning (amber): "GPS accuracy is low (120m). Checkpoint detection may be delayed."
  - Progress line: "2 of 3 checkpoints complete" (hidden when there are no checkpoints).
  - Actions: "Open in Maps" (outline, external link icon) and a "Clue ▾" toggle.
- **Checkpoint Reveal modal** (appears on arrival): dark blurred overlay; card slides up from the bottom. Burgundy gradient header with a ✨ emoji, small caps "YOU FOUND IT!" and the checkpoint title. Body: optional photo (rounded-2xl), romantic message (italic serif), optional "▶ Play voice message" control, and an optional gold-tinted "Your next clue" box. Full-width button "Continue Journey".

#### 15. Memory Questions (`/journey/[token]/questions`), memory questions type only
Burgundy-to-charcoal gradient, white text, one question at a time with horizontal slide transitions.
- **Intro step:** frosted heart circle; "A few of our moments" (Playfair 3xl); "I want to remember some moments we've shared, through your eyes. There are 4 of them. Tell me how each one made you feel."; white button "Let's begin ›".
- **Question step:**
  - Progress dots at the top (the current dot is a wide white pill, answered dots white/70, upcoming white/25).
  - Small caps "MOMENT 2 OF 4".
  - The moment (Playfair, 2xl–3xl, centered), e.g. "Our first trip together", with the admin's note below in italic white/65.
  - Frosted card containing:
    - "How did it make you feel?": a 3×2 grid of feeling chips, each with a big emoji above a label: 🥰 Loved · 😊 Happy · 😂 Laughed · 🥹 Touched · 😌 Peaceful · 🤩 Excited. Selected chip: solid white with burgundy text and a shadow. Unselected: white/10 with a white/20 border.
    - "Tell me more (optional)" textarea (white/90, rounded-2xl, placeholder "What do you remember most about it…").
    - Error pill: "Pick a feeling or write a few words."
    - Buttons: square outline back button (‹, hidden on the first question) and a wide white "Next ›" / "Finish ›".
- **Finishing step:** pulsing heart; "Thank you, my love." (Playfair); "Every one of those moments led here. There's just one more question…". Then it auto-advances to the Proposal.
- Unavailable state: "This page isn't available" / "Please open your invitation link again."

#### 16. Proposal (`/journey/[token]/proposal`)
The emotional climax. A cinematic sequence in stages that fade in one after another.
- Background: the admin's proposal background photo with a dark romantic overlay, or a deep burgundy gradient. Optional music toggle.
- Stage 1: the title fades in ("You made it, my love.").
- Stage 2: optional circular couple photo with a soft white ring; the main romantic message in italic serif.
- Stage 3: the question appears large and centered (Playfair, 4xl): "Will you marry me?". Falling petals (🌸 ❤️ ✨ 💕 🌹).
- Two buttons: a large glowing primary "YES! ❤️" (white or gold, prominent, gentle pulse) and a smaller, understated "No" (text/outline style).

#### 17. Yes (`/journey/[token]/yes`)
Pure celebration.
- Background: vivid burgundy-to-rose gradient (`#7A2038` → `#A03050` → `#7A2038`) with ❤️ hearts falling continuously.
- A frosted circle with a large white heart that beats; "YOU SAID YES!" (Playfair, 4xl, bold); the admin's yes message in italic serif; a 💍 emoji below.
- **Capture this moment** section (frosted rounded-3xl card, appears after the celebration):
  - Title "Capture this moment" (Playfair) and subtitle "Take a selfie, snap some photos, or leave a message."
  - Two big tiles side by side: **"Take a selfie"** (solid white tile, burgundy Camera icon; opens the front camera) and **"Add photos"** (frosted tile, ImagePlus icon; camera or gallery, multiple photos).
  - A 3-column grid of selected photo previews, each with a small round × remove button.
  - Textarea "Write something to remember this moment… (optional)".
  - Full-width white button "➤ Share" / "Share 3 photos" (uploading: "Sharing 2 of 3…").
  - Confirmation: "✓ Shared. Add as many as you like." Error pill in red/40.
- **Your memories (5)** gallery below: small caps label, then a 2-column grid of rounded cards with square photos and italic captions.

#### 18. No (`/journey/[token]/no`)
Gentle and respectful, with no drama.
- Cream background; blush circle with a muted burgundy outline heart.
- "Thank you for your honesty." (Playfair, 2xl); the admin's no message in italic serif, charcoal/70.

---

## Part 4: User Flows (for prototyping links)

**Admin setup flow:**
Admin Login → Dashboard → New Journey → Journey Overview → choose Journey type →
- *Route & destination:* Checkpoints → Proposal Customization (Final Destination + Proposal Screen)
- *Memory questions:* Memory Questions (admin) → Proposal Customization (Proposal Screen only)

→ Activate Journey → Invitation Link (Generate → Copy → send) → Progress & Response (watch live, see answers, photos and the response).

**Recipient flow, Route & destination:**
Invitation Landing → Start Journey (allow location) → Navigate (Checkpoint Reveal at each stop → final leg) → Proposal → Yes (Capture this moment) **or** No.

**Recipient flow, Memory questions:**
Invitation Landing → Memory Questions (intro → moments 1…N → finishing) → Proposal → Yes (Capture this moment) **or** No.

---

## Part 5: Screen Name ↔ Route Reference

| # | Screen name | Route | Side |
|---|---|---|---|
| 1 | Admin Login | `/admin/login` | Admin |
| 2 | Dashboard | `/admin` | Admin |
| 3 | Journeys | `/admin/journeys` | Admin |
| 4 | New Journey | `/admin/journeys/new` | Admin |
| 5 | Journey Overview | `/admin/journeys/[id]` | Admin |
| 6 | Edit Journey ("Edit Welcome") | `/admin/journeys/[id]/edit` | Admin |
| 7 | Checkpoints | `/admin/journeys/[id]/checkpoints` | Admin (route type) |
| 8 | Memory Questions (admin) | `/admin/journeys/[id]/questions` | Admin (questions type) |
| 9 | Proposal Customization | `/admin/journeys/[id]/proposal` | Admin |
| 10 | Invitation Link | `/admin/journeys/[id]/invitation` | Admin |
| 11 | Progress & Response | `/admin/journeys/[id]/progress` | Admin |
| 12 | Invitation Landing (+ Journey Unavailable state) | `/journey/[token]` | Recipient |
| 13 | Start Journey | `/journey/[token]/start` | Recipient (route type) |
| 14 | Navigate (+ Checkpoint Reveal modal) | `/journey/[token]/navigate` | Recipient (route type) |
| 15 | Memory Questions (recipient) | `/journey/[token]/questions` | Recipient (questions type) |
| 16 | Proposal | `/journey/[token]/proposal` | Recipient |
| 17 | Yes (+ Capture this moment) | `/journey/[token]/yes` | Recipient |
| 18 | No | `/journey/[token]/no` | Recipient |

Shared components to design once and reuse: **Admin Shell** (sidebar + mobile header), **Journey Status Controls**, **Journey type selector**, **Paste from Google Maps** field, **Checkpoint Reveal** modal, **Capture this moment** card, status and response **badges**, stat cards, journey cards, frosted recipient card, feeling chips.
