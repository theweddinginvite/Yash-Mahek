# Design Spec

This file is the source of truth for the site's visual design. Edit any
value here and tell me to apply it — I'll update the actual CSS/components
to match. (This file is documentation only; changing it doesn't change the
site by itself.)

Content — names, date, venue, FAQ text, RSVP link — lives separately in
`src/content.js`, not here. This file is about how things *look*, not what
they *say*.

---

## 1. Color Palette

| Token | Hex | Used for |
|---|---|---|
| `--color-bg` | `#faf7f2` (soft ivory) | Page background, RSVP form background |
| `--color-surface` | `#ffffff` | Alternate section background (Details, Gallery) |
| `--color-text` | `#2e2b28` (warm near-black) | Headings, body text |
| `--color-text-muted` | `#6f6a63` | Secondary text — dates, addresses, FAQ answers, nav eyebrow labels |
| `--color-accent` | `#b08968` (muted gold / terracotta) | Links, event times, FAQ +/− icons, hover states, `&` connectors, dividers |
| `--color-burgundy` | `#8f3350` (royal burgundy) | Couple names, scratch card border, nav trigger, drawer highlights |
| `--color-border` | `#e6ddd2` | Hairline borders, section dividers, card frames |

Design intent: warm, neutral, editorial — luxury royal Indian wedding aesthetic. Rich burgundy and muted gold accents used intentionally across typography, frames, and icons.

## 2. Typography

| Role | Font | Notes |
|---|---|---|
| Couple Names | **Alex Brush** | Cursive script (`var(--font-cursive)`), used for bride & groom names on the Invitation, Nav drawer, and Footer |
| Headings (h1/h2/h3) & Accents | **Playfair Display** | Serif (`var(--font-heading)`). Weight 400/600, used for titles, `&` connector, and revealed date |
| Body & Lineage | **Cormorant Garamond** | Classic editorial serif (`var(--font-body)`), used for translations, parentage, and body text |
| Sanskrit shloka (Shree Ganesh) | **Tiro Devanagari Sanskrit** | Falls back to `--font-heading`, serif — see Shree Ganesh below |
| Numeric / Date Figures | **Lining Figures (`lining-nums`)** | Applied globally (`font-variant-numeric: lining-nums`) so all digits (0–9), dates, event times, and countdown counters sit on a uniform baseline with equal cap-height proportions |

Loaded via Google Fonts `<link>` in `index.html` (no npm font package).

### Global Responsive Typography Scale
- **Root `html` Font Size**: Universal `16px` across desktop and mobile, with body font size `1.15rem` (`line-height: 1.55`) for balanced vertical rhythm and viewport stability.
- **Section Titles (`h2`)**: Anchored to `clamp(29.6px, 3.5vh, 38.4px)` to preserve their classic refined visual scale across all devices.
- **Section Taglines (`.eyebrow`)**: Scaled at `0.82rem` (`13.12px` on mobile) with `0.28em` tracking in muted gold (`--color-accent`).

### Invitation Typography Scale
- **Tagline**: `0.95 rem` (`Playfair Display`, uppercase, tracked)
- **Intro text**: `1.25 rem` (`Playfair Display`, italic)
- **Couple Names**: `4.20 rem` (`Alex Brush`, cursive, burgundy `#8f3350`)
- **Connector `&`**: `2.40 rem` (`Playfair Display`, italic, gold `#b08968`)
- **Revealed Date**: `1.85 rem` (`Playfair Display`, serif)
- **Countdown Numbers**: `1.35 rem` (`Playfair Display`)
- **Countdown Unit Labels**: `0.70 rem` (uppercase, tracked)

*(Note: Parents' names and lineage are featured exclusively on the "Meet the Families" screen (`#couple`) rather than the standalone invitation card, maintaining an uncluttered, balanced hierarchy on both mobile and desktop.)*

## 3. Spacing Scale

A single scale used everywhere via CSS variables — no ad-hoc pixel values:

| Token | Value |
|---|---|
| `--space-1` | 0.5rem (8px) |
| `--space-2` | 1rem (16px) |
| `--space-3` | 2rem (32px) |
| `--space-4` | 4rem (64px) |
| `--space-5` | 6rem (96px) |

## 4. Layout Foundations

- **Content max-width**: `1000px`, centered (`--max-width`)
- **Full-Screen Coverage & Viewport Height Stability**: Every section (`.section`, `.shree-ganesh`, `.invitation`, `.footer`, etc.) occupies a full viewport screen (`min-height: 100vh; min-height: 100lvh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;`).
  - Standardized strictly to `100vh` and `100lvh` (large viewport height). `100dvh` and `100svh` are deliberately excluded because dynamic mobile URL bar resizing (expanding/collapsing during scroll in iOS Safari and Android Chrome) caused disruptive layout shifts, canvas re-renders, and scroll repositioning.
- **Mobile Scroll Anchoring Immunity**: `overflow-anchor: none !important;` is enforced globally in `src/index.css` on `html`, `body`, and all section containers, completely preventing browser scroll anchoring from jumping or resetting scroll position when asynchronous resources or canvases load.
- **Smooth Free Scrolling**: Natural, fluid browser scrolling across all screen sizes with `scroll-snap-type: none !important;` (no CSS scroll-snapping jitter, rubber-banding, or forced page snapping), with smooth section jumping provided by the floating SectionNav controls (`SectionNav.jsx`) and drawer nav (`Nav.jsx`).
- **Section Spacing**: Balanced internal padding (`1.75rem 1rem` on desktop, tailored clamp on mobile) and compact component margins ensure all headings, cards, and interactive widgets fit completely within the viewport height without unnecessary scrollbar spillover.
- **Section Alternation**: Alternating sections (Event Details, Gallery, Blessings) use `.section--surface` — white background with a hairline top/bottom border — to contrast gracefully with the ivory page sections.
- **Section Headings**: Centered eyebrow label above an `h2`, `1.25rem` margin below.

## 5. Page Structure (top to bottom)

0. **Envelope Intro** — full-screen gate shown once per session, before everything else is interactive (see §6 for detail)
1. **Shree Ganesh** (`#shree-ganesh`) — full-height sacred invocation screen with Lord Ganesh crest & shlokas
2. **Invitation** (`#invitation`) — standalone wedding invitation, lineage, and scratch card date reveal
3. **Meet the Couple** (`#couple`)
4. **Event Details** (`#details`) — 5 interactive flip cards grid + three unified action buttons ("Save Events Details", "Get Venue Directions", & "View Live Updates") with modal dialogs
5. **Gallery** (`#gallery`) — 3D coverflow carousel
6. **Blessings** (`#blessings`) — guest blessings display
7. **Blessings and RSVP** (`#blessings-rsvp`) — interactive RSVP & blessing form
8. **Best Compliments** (`#compliments`) — royal luxury card with family compliments & awaiting eyes
9. **FAQ & Footer** (`#faq`) — frequently asked questions accordion with the footer signature (`Mahek & Yash` and wedding date) integrated at the bottom of the final page

Each section is a full-screen "frame" you can jump to directly — every section above has a stable `id`, used both by the Nav links and by the section frame-nav (below).

### Floating Controls Cluster (Envelope, Notice Board, Event Details & Music Player)

The bottom-right floating control cluster (`FloatingControls.jsx`), top to bottom: an **Envelope button** (`HomeButton.jsx`) with an envelope icon — reopens the interactive 3D Envelope invitation intro (also resets the entire page to a fresh state: clears sessionStorage, scrolls to top, and resets the scratch card); a **Live Notice Board button** (`MegaphoneIcon`) with a pulsing badge indicator — opens the live announcement feed with instant updates from hosts; an **Event Details & Itinerary button** (`CalendarIcon`) — opens the Save Event Details popup with 2x2 grid itinerary, PDF downloads, and WhatsApp sharing; then the music mute/unmute button (`MusicPlayer.jsx`). All buttons share the unified `.icon-button` circular ivory/gold styling: **44×44px on desktop**, **42×42px on mobile** (≤680px), with SVG icons 22px desktop / 20px mobile, and responsive safe-area offset.

---

## 6. Section-by-Section Detail

### Envelope Intro
- Full-viewport scene (`EnvelopeIntro.jsx`, `position: fixed`, `z-index: 1000`) shown once per browser session before any content is interactive; page scroll is locked (`body { overflow: hidden }`, toggled in `App.jsx` off of `opened` state) while it's up. Persisted via `sessionStorage`, so it doesn't replay when navigating to/from the Blessings Wall page.
- Opens with realistic 3D flap rotation (`rotateX(150deg)`), card emergence, 180° flip to the monogrammed back face, and smooth fly-in animation to the invitation.
- **Envelope Specifications**: Width `min(19rem, 84vw)` (`304px`), Height `14rem` (`224px`), Lord Ganesh crest `165px`, Monogram wax seal `72px`.
- **Revealed Card Specifications**: Inset `10px`, Width `284px`, Height `144px`, Top offset `-32px`, Names: **Alex Brush cursive** (`--font-cursive`) `1.55rem` in deep wine burgundy (`#6b1d33`) tightly grouped across 3 lines (*Bride Name* / *&* in styled italic / *Groom Name* with `line-height: 0.88`), Divider spacing `3px`, Venue: `0.48rem` uppercase across two lines (*Winsome Resorts and Spa* / *Jim Corbett*) in crisp black (`#000000`), generous top & bottom edge padding (`0.65rem`), Back face monogram seal `54%`. Aspect ratio ~1.97:1 landscape rectangle.

### Navigation Drawer (Nav)
- **Top bar is completely hidden** across all pages for a clean, distraction-free aesthetic.
- **Floating Hamburger Button**: Appears smoothly at the top-left of the viewport (`top: 1.25rem; left: 1.25rem; position: fixed`) starting from the 2nd screen (`#invitation`) onwards when scrolled past Shree Ganesh. Styled as a glassmorphic circular icon button with gold border.
- **Slide-out Navigation Drawer**:
  - Compact, tailored width (`min(240px, 80vw)` on desktop, `min(230px, 80vw)` on mobile) with glassmorphic surface styling and soft drop shadow.
  - Header displays the circular monogram logo (`38px`), couple title formatted across two stacked lines in Alex Brush cursive (**Mahek &** on line 1 with styled gold italic ampersand, and **Yashoratna** on line 2 in royal burgundy), and a circular close button (`30px`).
  - Links list with gold chevron indicators:
    1. **Shree Ganesh** (`#shree-ganesh`)
    2. **Invitation** (`#invitation`)
    3. **The Couple** (`#couple`)
    4. **Events** (`#details`)
    5. **Gallery** (`#gallery`)
    6. **Wall of Blessings** (`#blessings`)
    7. **RSVP** (`#blessings-rsvp`)
    8. **FAQ** (`#faq`)
  - Clicking any link smoothly scrolls to the target with zero offset and auto-closes the drawer.

### Shree Ganesh (`#shree-ganesh`, `ShreeGanesh.jsx`)
- **Sacred Invocation Screen**: Pure spiritual focus on Lord Ganesha and Lord Vishnu blessings with balanced vertical layout and generous breathing room.
- **Top Clearance & Ganesh Crest**: After comfortable top spacing, Lord Ganesha's sacred emblem (`clamp(185px, 24vh, 230px)` on mobile, `230px` on desktop, `public/images/lordganesh/ganeshWithoutBackground.png`) is prominently displayed.
- **Glow Aura**: `🌸 Golden Rose` halo (`.shree-ganesh__ganesh-glow`, `inset: -20%`, radial gradient with `rgba(230, 155, 165, 0.75)` core and `rgba(216, 150, 76, 0.5)` mid, `filter: blur(5px)`), pulsing softly with a tranquil `5.5s` breathing rhythm (`opacity: 0.75`, `scale: 1.0`).
- **Devanagari Shlokas & Readable Typography**:
  1. Ganesha shloka (*Vakratunda Mahakaya...*) in `Tiro Devanagari Sanskrit` (`clamp(1.2rem, 2.35vh, 1.35rem)`) with readable English translation (`clamp(0.92rem, 1.6vh, 1.02rem)`) styled in **royal burgundy (`var(--color-burgundy)`) on all screen sizes**.
  2. Ornamental gold diamond divider line (`.shree-ganesh__shlok-divider`).
  3. Vishnu Mangalam verse (*Mangalam Bhagwan Vishnuh...* without trailing commas for clean Sanskrit metre) in `Tiro Devanagari Sanskrit` with readable English translation, also in **royal burgundy (`var(--color-burgundy)`)** on all screen sizes.
- **Bouncing Gold Scroll-Down Button**: Centered circular button (`clamp(2.55rem, 5.2vh, 2.85rem)`) that smoothly scrolls directly to the Invitation screen (`#invitation`). Verified visible with balanced bottom clearance on all mobile viewports.

### Invitation (`#invitation`)
- **Dedicated 2nd View**: Extracted as a standalone component (`Invitation.jsx`) top-aligned with no dead space.
- **Header**: Tagline (`hero.tagline`, "With All The Blessings").
- **Body**:
  - Invitation phrase: *"We cordially invite you on the auspicious union of"*
  - Bride block: **Mahek** (`4.2rem` Alex Brush cursive in royal burgundy).
  - Center connector: **`&`** (`2.4rem` Playfair Display italic in gold accent `#b08968`).
  - Groom block: **Yashoratna** (`4.2rem` Alex Brush cursive in royal burgundy).
  *(Parents' names and lineage are featured exclusively in "Meet the Families" (`#couple`), keeping this invitation view clean, elegant, and balanced).*
- **Divider**: Thin gold lines with centered diamond marker.
- **Scratch-to-Reveal Card**: Covers the wedding date and live countdown.

### Scratch Reveal (`ScratchReveal.jsx`)
- **Unrevealed Canvas View**:
  - Deep crimson paper-grain texture with fine diagonal fibers and speckles.
  - Delicate gold inner border frame.
  - **Couple's Initials Monogram Logo** (`public/images/monogram/monogramCircularWithoutBg.png`) rendered in the center (`78px` × `78px` desktop, `68px` × `68px` mobile).
  - **"SAVE THE DATE"** title (`17px`, `Playfair Display` 600 with `0.14em` letter-spacing) and **"Scratch to reveal"** subtitle (`17px`, `Cormorant Garamond` italic 400) below the logo.
  - **Glass Shine Animation**: A continuous, elegant linear-gradient light sheen sweeps smoothly across the "SAVE THE DATE" lettering and card face every 5.2s cycle (2.6s sweep eased via `easeInOutCubic` followed by a 2.6s rest pause). Pure reflective glass shimmer with star glints removed.
  - **Mobile Dimension Guarding**: Canvas drawing dimensions are cached (`lastSizeRef`) to prevent redundant canvas resizing and redraw flickering during mobile address bar transitions.
  - **Scratch Physics**: Scratching clears both the paper texture and monogram logo with organic debris particle flakes falling away.
- **Revealed Card View**:
  - Framed with an elegant **burgundy border** (`1.5px solid var(--color-burgundy)`), `0.75rem` rounded corners, glassmorphic ivory background (`rgba(255, 255, 255, 0.95)`), and soft burgundy elevation shadow.
  - **Wedding Date**: Strictly formatted on a single line via `white-space: nowrap` and scaled `clamp(1.18rem, 3.4vw, 1.45rem)` mobile / `1.85rem` desktop (`DECEMBER 6, 2026`).
  - **Live Countdown**: Days, Hours, Minutes, Seconds in a single row with balanced unit label spacing so labels remain legible without colliding.
  - Automatically triggers celebratory **Confetti Burst** on reveal.

### Meet the Couple / Family Section (`#couple`, `MeetFamilies.jsx` / `MeetCouple.jsx`)
- **Sacred Family Shloka & Quote Header**:
  - Sanskrit Shloka (`॥ ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं । भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥`) rendered in `var(--color-burgundy)` in `Tiro Devanagari Sanskrit` (`clamp(0.92rem, 1.8vh, 1.08rem)` mobile / `clamp(0.98rem, 1.9vh, 1.18rem)` desktop).
  - Editorial translation quote below in `Cormorant Garamond` italic (`0.8rem` mobile / `clamp(0.78rem, 1.35vh, 0.88rem)` desktop), styled in **`var(--color-text)` (warm near-black)** — not muted gray.
  - Heading-to-content spacing uses `var(--space-heading-to-content, clamp(2rem, 4.2vh, 3rem))`, consistent with EventDetails and Gallery sections.
- **Two Side-by-Side Royal Indian Family Cards**:
  - Left: Bride's Family Card (The Gupta Family in royal burgundy `var(--color-burgundy)`, location `Moradabad · The City of Brass`, invite phrases, parents in burgundy bold, bride name in Alex Brush cursive, relation tagline in muted text).
  - Right: Groom's Family Card (The Gupta Family in royal burgundy `var(--color-burgundy)`, location `Moradabad · The City of Brass`, invite phrases, parents in burgundy bold, groom name in Alex Brush cursive, relation tagline in muted text).
- **Typography Consistency & Standardization**:
  - City origin standardized to `Moradabad · The City of Brass` (`पीतल नगरी` removed).
  - Family titles (`THE GUPTA FAMILY`) colored in royal burgundy (`var(--color-burgundy)` / `#8f3350`), matching parents' names, couple cursive names, and Hindi initial accents.
  - Relation lines `Their beloved daughter` and `Their beloved son` styled in `var(--color-text-muted)` matching `with their family and loved ones` in `Cormorant Garamond` italic.
  - Unified typography across all 6 descriptive/connective card lines: *Auspicious Beginning*, *Moradabad · The City of Brass*, *Under the divine grace & blessings of revered grandparents*, *with their family and loved ones*, *request the pleasure of your company on the auspicious wedding of*, and *Their beloved daughter/son* — all using `font-family: var(--font-body)` (*Cormorant Garamond*), `font-style: italic`, synchronized clamp sizing `clamp(0.9rem, 1.6vh, 1rem)`, and unified muted color palette.
- **Luxury Double Border & Corner Flourishes**:
  - Outer rounded border (`1.2px solid rgba(176, 137, 104, 0.45)` with `1.25rem` radius).
  - Inset dashed gold inner border (`inset: 8px`).
  - Delicate SVG corner flourish ornaments at all 4 corners (TL, TR, BL, BR) with smooth corner arc loops and decorative ticks.
- **Center Divider with Sacred ॐ**:
  - Vertical golden hairline divider with gold `ॐ` (Om) symbol centered between the cards on desktop.
  - Smoothly converts to horizontal divider with centered `ॐ` when stacked on mobile screens.
- **Compact Proportions & Generous Bottom Clearance**:
  - Card top padding streamlined to `clamp(0.9rem, 1.8vh, 1.35rem)` (mobile `1.15rem–1.25rem`), eliminating awkward empty space above `॥ मंगलम् ॥` and `॥ युग्म ॥`.
  - Section header margin tightened to `clamp(0.75rem, 1.5vh, 1.15rem)` and cursive name scaled to `clamp(2.6rem, 4.6vh, 3.4rem)`.
  - Added bottom clearance margin (`clamp(1.5rem, 3.5vh, 2.5rem)`) to `.family-cards-container`, guaranteeing ~100px+ of comfortable breathing space below the cards on laptop and desktop screens.
- **Cross-Platform Sanskrit Symbol Typography with Two-Layer Initial Highlights (`॥ मंगलम् ॥` & `॥ युग्म ॥`)**:
  - Implemented in semantic HTML (`.family-card__symbol-title`) using `Tiro Devanagari Sanskrit` (`clamp(1.45rem, 2.8vh, 1.85rem)`).
  - Uses a **Two-Layer Ghost-Matched Overlay Architecture** (`.family-card__symbol-layered`):
    - **Base Layer** (`.family-card__symbol-base`): Contains the entire, unsegmented Sanskrit word (`मंगलम्` / `युग्म`) in antique gold (`#b08968`), ensuring complete typographic context, unbroken shirorekha, and standard text selection / clipboard copying (`॥ मंगलम् ॥` and `॥ युग्म ॥`).
    - **Overlay Layer** (`.family-card__symbol-overlay`, `aria-hidden="true"`): Absolutely positioned (`inset: 0`, `pointer-events: none`, `user-select: none`). Contains strictly the highlighted Hindi initial consonant—**`म`** (for **M**ahek, `.family-card__symbol-initial`) and **`य`** (for **Y**ash, `.family-card__symbol-initial`)—in bold royal burgundy (`#8f3350`), followed by an invisible ghost span (`.family-card__symbol-ghost`, `visibility: hidden; opacity: 0; color: transparent`) containing the rest of the word (`ंगलम्` / `ुग्म`).
    - **Zero Metric Drift & Continuous Shirorekha**: The invisible ghost ensures both layers share identical ascenders, descenders, and font bounding boxes, perfectly aligning the burgundy consonant over the base while letting the antique gold diacritics (*anusvara* `ं` and *u-matra* `ु`), subsequent letters (`गलम्` and `ग्म`), and double dandas (`॥`) shine through seamlessly without dotted circles (`◌`) or stair-step displacement across all mobile and desktop devices.

### Event Details
- White/surface section (visually distinct from the ivory sections around it)
- Events shown as interactive **3D Flip Cards** arranged in a centered 2-column grid (`.events-grid`, 5 event cards in Mahek-Yash, 6 in Yash-Mahek):
  - Row 1: **Haldi** (Sat, Dec 5, 12:30 PM) &amp; **Engagement &amp; Sangeet** (Sat, Dec 5, 5:00 PM)
  - Row 2: **Godh Bharai &amp; Sagai** (Sat, Dec 5, 7:00 PM) &amp; **Jaimaal** (Sun, Dec 6, 1:00 PM)
  - Row 3: **Phere** (Sun, Dec 6, 5:00 PM) — centered across the grid (or paired in Yash-Mahek).
- **Single-Screen Mobile Grid Fit**: On mobile (`≤680px`), the events grid uses `grid-template-rows: repeat(3, minmax(0, 1fr))` with cards dynamically occupying 100% of available height (`min-height: 0; height: 100%`). This guarantees all cards and the action buttons appear together in a single viewport without overflowing.
- **Card Front**: Centered event title (`Playfair Display`, Burgundy `#8f3350`), signature gold gradient divider line with center jewel dot, event day (`SATURDAY` / `SUNDAY`), date, and event time (`Playfair Display`, Gold `#b08968`), with a "Tap for details" hint icon. Food/meal details are cleanly excluded from the front face to keep it uncluttered.
- **Card Back**: Flips 180° to reveal event name, date, time, description, meal line (*Dinner to follow* / *Lunch to follow*), and Attire theme — **Shades of Pink** (Haldi), **Glam and Glitter** (Engagement & Sangeet, Godh Bharai & Sagai), **Ethnic Wear** (all Dec 6 events: Jaimaal, Phere). Signature gold gradient divider with center jewel dot matches the front face. Back face includes scroll protection if text length varies.
- **Action Buttons Row & 10% Viewport Clearance**:
  - Positioned beneath the cards with a guaranteed **10% bottom viewport spacing** (`max(10vh, 10lvh)`).
  - Button 1: **"Save Events Details"** (`.event-details__action-btn`, burgundy text with bookmark/calendar icon).
  - Button 2: **"Get Venue Directions"** (`.event-details__action-btn`, burgundy text with map-pin icon).
  - Button 3: **"View Live Updates"** (`.event-details__action-btn`, burgundy text with megaphone icon).
- **"Save Event Details" Popup Modal (`SaveEventsModal.jsx`)**:
  - Opens on clicking "Save Event Details". Includes backdrop dismiss, `Escape` key support, body scroll lock, and close button.
  - **2x2 Grid Layout**:
    ```
    Event details:    [Description]
                      [Meal without highlight]
    Attire details:   [Theme / Dress Code]
    ```
  - Displays event name and timings cleanly separated without leader dots.
  - **Three Modal Action Buttons**:
    1. **Share as text (WhatsApp)**: Uses Web Share API — on mobile, triggers native share sheet with the **M&Y monogram card image** (`/images/monogram/monogram-share-card.jpg`) + full formatted text (no URL length truncation). Falls back to text-only Web Share, then `wa.me` URL. Message format: `*The wedding of Mahek & Yash*`, `*December 5-6, 2026*`, `✨ *Events & Itinerary*` header, each event in **bold name**, date · time, description, attire — venue in **bold labels** (`*Venue:*`, `*Helpdesk:*`, `*Google Search Resort:*`, `*Maps Direction:*`), no emoji prefixes.
    2. **Share as pdf**: Invokes native Web Share API (`navigator.share({ files: [file] })`) on supported mobile devices to share PDF directly to WhatsApp/AirDrop; falls back to download on desktop.
    3. **Download pdf**: Directly downloads the themed vector PDF (`The_Wedding_Events_Mahek_Yash.pdf`).
- **Themed Vector PDF Generator (`generateEventPdf.js`)**:
  - Generated client-side using `jspdf`.
  - Styled with soft ivory background (`#faf7f2`), double warm gold border (`#b08968`) with corner diamonds, burgundy headings (`#8f3350`), dotted line event separators, and generous line spacing.
- **Venue & Travel Popup Modal (`VenueModal.jsx`)**:
  - Opens on clicking "How to reach the venue?".
  - **Auto-Close**: Closes automatically after **30 seconds** (visualized via a subtle top progress timer bar), or immediately when tapping the top-right `✕` close button, clicking the backdrop overlay, or pressing `Escape`.
  - **Content**:
    - Header with venue resort name & address.
    - **QR Code** (`qrcode.react` SVG, scanning navigates to Google Maps location `https://share.google/xZAuCAlAAjEHdfEsY`).
    - **"Get Directions" Button** (opens Google Maps turn-by-turn navigation in a new tab).
    - **Travel Options Guide**: Detailed instructions for **By Road / Cab**, **By Train** (Ramnagar Railway Station), and **By Air** (Pantnagar / Delhi airports).

### Gallery
- White/surface section (`#gallery`), occupying its own whole view (`min-height: 100vh; min-height: 100lvh;`), cleanly isolating the Gallery from the Blessings Wall (`#blessings`). Vertically distributed with the section heading anchored at the top, the photo stage in the vertical middle, and controls directly underneath.
- **3D Coverflow Perspective**: Centered active photo sits prominent, while neighbors fan out with calculated `rotateY`, `translateZ`, and `scale`. Distance-to-center wraps the "short way around" so cycling past the last photo turns in whichever direction is closer.
- **Burgundy Frame & Theme Matting**: Each card features a clean **2px solid Burgundy border (`var(--color-burgundy)`)** with a warm ivory/cream background fill (`#ffffff` to `#faf7f2`), perfectly matching the website aesthetic without black borders.
- **Adaptive Image Scaling**: Large DSLR / 4K phone photos in portrait, landscape, or square orientation are scaled down with `object-fit: contain; max-width: 96%; max-height: 96%;` without clipping faces or distortion.
- **Zero-Error Caricature Fallback**: If any image fails to load or while photos are being added, the card seamlessly renders an Indian wedding caricature artwork card (Couple, Mandap, or Sacred Hands) with a decorative caption.
- **Navigation Controls Below Gallery View**: Pill-shaped **‹ Prev** and **Next ›** buttons with SVG chevrons alongside interactive capsule-style pagination dots sit tightly grouped directly underneath the photos.
- **Auto-Advance**: Cycles automatically every 4.5s; user interaction or opening the fullscreen Lightbox pauses the timer.
- **Upload CTA Subtext**: Positioned directly above the upload button: *"Share your captured memories with us"* (`.gallery-upload-action__subtext`), set in `Cormorant Garamond` italic, `0.95rem`, `--color-text-muted`, centered.
- **Guest Upload Action Button**: Centered burgundy pill button (`.gallery-upload-btn`) with camera icon (**`📸 Upload Photos & Videos`**).
- **Guest Upload Modal (`GalleryUploadModal.jsx`)**:
  - Glassmorphic backdrop (`rgba(0, 0, 0, 0.6)`) with blur.
  - Burgundy framed container with ivory surface, gold accents, and close button.
  - Side-by-side Ceremony selector dropdown (Haldi, Engagement & Sangeet, etc.) and Guest Name input (placeholder: `Rahul & Sunita Gupta`).
  - File picker supporting multiple photos/videos and mobile camera capture.
  - Live upload progress bar with animated gold striping, progress counter (`Uploading photo 2 of 5 (40%)`), and file checkmarks (`✓`).

### Blessings
- Ivory/surface section (`#blessings`), occupying a full viewport view (`min-height: 100vh; min-height: 100lvh;`).
- **Compact 3-Tab Filter Bar**: "Bride's Side", "All Wishes", and "Groom's Side" filter pills with active burgundy indicator and streamlined 15px icons.
- **Curated 2x3 Grid (6 Cards)**: Displays 6 curated wish cards in a clean 2-column, 3-row layout (`--grid-gap: 0.5rem` desktop / `0.45rem` mobile).
- **Strict 3-Line Message Display**: Guaranteed 3-line max height cap with `...` (ellipsis) truncation and 2-line author name wrapping.
- **Interactive Heart Reaction (❤️)**: Guests can click the heart button on any card to increment reactions in real-time, instantly synchronized with Firebase and Google Sheets.
- **Full Text Lightbox**: Tapping on any card opens a centered reading modal with full blessing message.
- **"Tap Card to See Full Message" Hint**: Positioned directly above the bottom action button.
- **"Send Blessings & RSVP" Action Button**: Positioned at the bottom of the section with comfortable breathing room, navigating smoothly to the RSVP section.
- **Dedicated Blessings Wall Page** (`#/blessings-wall`): Reached via the "View All Blessings" link, displaying the complete chronological blessings wall.

### Blessings and RSVP
- White/surface section (`#blessings-rsvp`), occupying a dedicated whole view (`min-height: 100vh; min-height: 100lvh; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; box-sizing: border-box;`).
- **Top-Anchored Heading**: Section heading and subtitle remain firmly anchored at the top of the viewport.
- **Vertically Centered Form Card**: The interactive form card (`.blessings-rsvp-card`) uses `margin: auto auto;` to automatically center itself in the remaining viewport space, ensuring a perfectly centered, balanced presentation on all mobile devices and desktop monitors rather than sinking to the bottom.
- A custom-built form with 2 tabs — "Send Blessings" and "RSVP" — connected directly to Firebase Firestore for 0-latency live updates and Google Sheets ('Wedding Admin System').
- Both tabs include Bride Side / Groom Side selection.
- RSVP fields: Name, Side, Attending (Joyfully accept / Unable to Join), Guests count, and "Parking required?" (Yes/No).
- **Centered Confirmation Card**: On submission, a burgundy-framed luxury confirmation card is rendered directly in the center of the screen without causing header layout shift.
- **Instant Telegram Bot Integration**: Triggers real-time alerts to the wedding admin Telegram group with a native inline `🗑️ Delete from Live Wall` button.
- On successful RSVP: Confirmation message plus a **"Share via WhatsApp"** button pre-filled with the guest's RSVP details.
- **Confetti Burst**: Fires a celebratory burst of confetti on successful submission.

### Best Compliments
- Positioned between Blessings & RSVP (`#blessings-rsvp`) and FAQ (`#faq`), accessible via `#compliments`.
- **Top-Anchored Heading**: Section heading with tagline (`.eyebrow`, `With Love & Blessings`) and section title (`h2`, `With Best Compliments From`) inheriting the site-wide standard typographic scale.
- **Upper-Balanced Royal Luxury Card**: A warm ivory surface card (`.compliments-card`) with a `1.2px` gold perimeter border, inset dashed burgundy inner border, and soft elevation. Styled with balanced top clearance (`margin-top: clamp(3.8rem, 8vh, 5.5rem)` on desktop, `clamp(2.8rem, 6vh, 4.2rem)` on mobile) to eliminate excessive blank space while keeping generous, comfortable breathing room below the title.
- **Single-Column Compliments List**: Displays names in a clean, centered single-column layout without bullets, each couple/member on their own line (with Muskan, Paras, and Arpita each on individual lines).
- **1st-Page Sacred Divider**: Features a 1px gold gradient line with a centered 5px circular gold pearl/dot (`linear-gradient(to right, transparent, var(--color-accent) 50%, transparent)`), identical to the sacred invocation divider in Shree Ganesh.
- **Awaiting Eyes Row**: Sub-heading `AWAITING EYES` in uppercase gold serif, followed by the children's names (*Amulya*, *Amogh*, *Shriyan*) in a generous space-separated single horizontal row.
- **Line Separator to FAQ**: A full-width `1px solid var(--color-border)` dividing line cleanly separates Best Compliments from FAQ.

### FAQ
- Ivory section, content narrowed to 40rem and centered (narrower than the 1000px page max-width, since Q&A reads better in a tighter column)
- Accordion: each question is a full-width button with a +/− indicator (accent color) on the right; only the answer for the clicked question is shown, clicking again collapses it
- Hairline divider under each question

### Footer
- Simple centered sign-off: couple's names (`Alex Brush` cursive in burgundy `#8f3350`, with `Playfair Display` italic gold `&`) + wedding date (`Playfair Display` serif `#2e2b28`)
- Generous top/bottom padding (`--space-4`)

---

## 7. Responsive Behavior

- Mobile-first breakpoints, primarily at `480px`, `600px`, and `700px` — since most guests are expected to open this on a phone, mobile is treated as the primary layout, not an afterthought
- Nav collapses to a hamburger menu ≤700px (see Nav section above)
- Event Details maintains a centered 2-column flip card grid (5 cards with 5th centered in Mahek-Yash) across mobile, tablet, and desktop, with calibrated heights (`min-height: 162px; height: 162px;` on desktop) ensuring the bottom venue button remains fully in view without text crowding
- Gallery's coverflow shrinks its stage height/perspective and widens covers slightly on narrow screens, but keeps the same fan-out mechanic (no reflow to a stacked column) at any width
- Meet the Couple displays two side-by-side family cards on desktop and tablet, and gracefully stacks them into a single column with an elegant horizontal divider and centered ॐ symbol on mobile screens (≤680px)
- Blessings displays 6 curated wish cards in a clean 2-column, 3-row layout across all screen sizes, with a full-text modal on tap and a link to the dedicated Blessings Wall page
- The floating bottom-right controls (envelope + notice board + event itinerary + location/venue + music player) are pinned on mobile (≤680px) at `right: max(17px, calc(env(safe-area-inset-right, 0px) + 17px))` for clean edge alignment
- All interactive elements maintain a 44px minimum touch target

## 8. Images

Current placeholder photos are 6 free-to-use stock images (via Lorem
Picsum, sourced from Unsplash's royalty-free library) at
`public/images/gallery/placeholder-01.jpg` through `placeholder-06.jpg`,
random landscape/scenery shots — no copyrighted/trademarked imagery. See
`README.md` for how to swap in real photos.

## 9. Background Music

- Site-wide looping background audio (`src/components/MusicPlayer.jsx`), controlled by a circular mute/unmute button, part of the bottom-right `FloatingControls` stack (alongside the envelope, notice board, and event details buttons) — shared `.icon-button` style (44px, white surface, hairline border, soft shadow, accent-colored icon)
- Attempts to autoplay on load; if the browser blocks autoplay-with-sound (standard behavior until the visitor interacts with the page), it starts on the visitor's first click/tap anywhere on the site
- Button icon swaps between a sound-on and sound-off (crossed-out) speaker glyph based on mute state
- Hidden entirely — no button rendered at all — until a real audio file is configured (`content.music.src`), same "absent until configured" pattern as the Blessings backend. Currently set to `public/audio/background-music.mp3`. See `README.md` → "Background music" for where to legally source a track if you swap it out (music carries real copyright risk, unlike the stock photos above, so nothing was bundled by default originally)

## 10. Sparkle & Celebration Effects

Three small decorative components, layered on top of the page content, independent of any one section. All are `pointer-events: none` (never block clicks) and disabled outright under `prefers-reduced-motion`.

- **Page Sparkles** (`PageSparkles.jsx`) — ~10 small twinkle dots at fixed positions scattered across the full viewport, each fading/scaling in on its own staggered timer, visible no matter which section is scrolled into view. Distinct from Shree Ganesh's own sacred ambient shimmer and sparkles
- **Cursor Sparkle Trail** (`CursorSparkleTrail.jsx`) — small gold star-shaped sparkles spawn at the pointer as it moves and fade out over ~700ms, capped at ~20 concurrent so it stays light. Skipped entirely on touch/coarse-pointer devices (no hover cursor to trail)
- **Confetti Burst** (`ConfettiBurst.jsx`) — a one-shot, full-viewport burst of ~90 pieces (mixed accent/ivory/dark tones, matching the palette) that fall and fade over ~3.6s. Fires on successful Blessing or RSVP submission (see Blessings and RSVP above) and on scratching the Invitation scratch card fully open; each trigger fires its own independent burst

---

## How to request a change

Edit the value(s) above (e.g. change the accent color hex, swap a font,
adjust a spacing number, change a section's layout description) and tell
me what you changed — I'll translate it into the actual CSS/component edits
and rebuild.
