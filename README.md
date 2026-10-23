# Akachi Travels

Landing page for **Akachi Travels**, a black-and-gold luxury travel agency: bespoke journeys, flight booking, cruise bookings, visa processing, affordable vacation packages and personalised itineraries.

## Run locally

```bash
npm install
npm run dev
```

Opens on **http://127.0.0.1:5000** (port 5000 is pinned in `vite.config.js`). On macOS, AirPlay Receiver also listens on port 5000; the dev server binds the loopback addresses directly, so use `127.0.0.1:5000` if `localhost:5000` returns a 403.

```bash
npm run build     # production build to dist/
```

## Structure

- `index.html` – all page sections and copy
- `src/style.css` – design tokens (black `#0a0a0a`, gold `#c9a55c`, ivory `#efe9dd`), layout, responsive rules
- `src/main.js` – GSAP + ScrollTrigger motion, Lenis smooth scroll, hero video reel, pinned destination Atlas, booking-form logic (child ages, validation)
- `public/media/ai/` – destination stills and videos generated with Higgsfield

## Launch video

`brag-output/` holds the 20-second vertical launch film (`brag.mp4`), its poster (`brag.jpg`), share caption and the editable HyperFrames composition (`brag-output/composition/`).

## Before launch

- Replace placeholder contact details (`+234 800 000 0000`, `hello@akachitravels.com`), prices, testimonials and trust claims with real ones.
- The booking form and newsletter have no backend yet; see the comment in `src/main.js` where the brief would be sent.
