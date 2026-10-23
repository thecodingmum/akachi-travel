# Hyperframes Composition Brief: Akachi Travels

## Objective
Create a 20-second vertical launch film for Akachi Travels in the motion grammar of the reference Short (PANAMA TRAVEL CO., studied frame by frame), rebuilt in Akachi's black-and-gold identity, ending with the real booking flow and a boxed end card.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical — 1080x1920 @ 30 fps
- Duration: 20 s

## Source Material
- Project root: `/Users/olatokunboogunlade/Projects/akachi-travel`
- Primary files read: `index.html`, `src/style.css`, `src/main.js`
- Product name: Akachi Travels
- Tagline / strongest claim: "Journeys, composed by hand." · "The world is waiting."
- Key UI moment to recreate: the trip-brief form (real screenshots of the running site, 1080x1920): chips Santorini, Maldives, Dubai, Flight booking, Vacation package turn gold; success state "YOUR MAP IS BEING DRAWN."
- Copy that must appear verbatim (re-cased allowed):
  - THE WORLD IS WAITING.
  - AKACHI TRAVELS
  - JOURNEYS, COMPOSED BY HAND.
  - BESPOKE TRAVEL ATELIER
  - 4,800+ / JOURNEYS COMPOSED
  - 72H / TO YOUR FIRST ITINERARY
  - FLIGHTS / CRUISES / VISAS / PACKAGES (from "Flight booking", "Cruise bookings", "Visa processing", "Affordable vacation packages")
  - PLAN MY TRIP →
  - +234 800 000 0000 · hello@akachitravels.com (site placeholders)
  - Destination names and coordinates from the Atlas cards
- Framing words (invented, assert nothing): WANDER · UNWIND · INDULGE

## Creative Direction
- Tone preset: cinematic
- Creative direction: vertical luxury travel-agency launch reel, kinetic one-word typography over cinematic destination footage
- Interpretation: one word at a time, dead-still once landed; cuts on every beat in the montage; two real holds (title, end card); 4–5 transition kinds, each with a cause.
- Angle / hook / outro: see `brag-plan.md`.
- Avoid: generic SaaS language, abstract filler, glow-orb decoration, everything fading up the same way.

## Visual Identity
- Background: `#0a0a0a`; secondary `#121212`
- Text: `#efe9dd` ivory; hook words in `#0a0a0a` on bright sky
- Accent: `#c9a55c` gold (`#e2c98f` light, `#9c7b3b` deep)
- Display font: Anton (`assets/fonts/Anton-normal.woff2`)
- Accent font: Instrument Serif italic (`assets/fonts/InstrumentSerif-italic.woff2`)
- Label font: JetBrains Mono (bundled)
- References from the project: star mark (site logo SVG path), gold solid chips, outlined gold buttons, coordinates on Atlas cards.

## Storyboard
Contract: `brag-plan.md`.
1. Hook — 0.0–2.5 s — Santorini footage; THE / WORLD / IS / WAITING. one per beat.
2. Title — 2.5–5.0 s — gold iris into Singapore; AKACHI / TRAVELS fill → outline; tagline bar.
3. Montage — 5.0–9.0 s — 8 destinations on the beat; WANDER / UNWIND / INDULGE; coordinates ticker.
4. Proof — 9.0–13.5 s — 4,800+ (Dubai), 72H (sandbar), FLIGHTS/VISAS/PACKAGES (Amalfi).
5. Product — 13.5–17.0 s — gold flood → real form; 5 chip taps; success screen.
6. End card — 17.0–20.0 s — squeeze to line → boxed lockup, tagline, PLAN MY TRIP, contacts.

## Audio
- Audio role: rhythmic bed with cinematic accents
- Audio arc: groove from frame 0, fade out over the final 1.2 s
- Music: `assets/music/afrobeats-heygen-c3c5baa8.mp3` (HeyGen music library, user-requested Afrobeats), volume ~0.6
- Music cue guidance: 120 BPM, beats every 0.5 s from ~0.0, downbeats every 2 s. Locks: 2.5 (title), 9.0 (stat), 13.5 (flood), 18.0 (logo).
- Audio-reactive treatment: subtle; RMS may warm the end-card ground if extraction is available, else skipped.
- Audio-coupled moments: hook slams (soft impact on THE and WAITING), iris (bell), count-ups (chips stack), service boxes (card place), chip taps (clicks), success (soft impact), CTA typing (keypresses), logo (bell).
- SFX analysis guidance: `~/.claude/skills/brag/assets/sfx/sfx-analysis.md`; prefer low-HF-risk picks.

## Hyperframes Instructions
Follow the bundled `hyperframes` / `hyperframes-cli` skills (v0.8.185): root `index.html`, one scene per `compositions/*.html`, paused GSAP timelines registered on `window.__timelines`, local assets only, `npx hyperframes check` as the gate, snapshot review before render. Keep creation and rendering local.
