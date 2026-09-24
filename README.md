# Yashoratna & Mahek — Luxury Wedding Invitation Website

A high-performance, single-page luxury Indian wedding invitation built with React, Vite, and Firebase Firestore, integrated with Google Sheets, Telegram Bot moderation, and dynamic Google Drive gallery streaming.

---

## ✨ Features & Architecture

- **Interactive 3D Envelope Intro**: Realistic 3D flap rotation, card emergence, wax seal flip, and smooth fly-in animation to the invitation.
- **Sacred Invocation (`#shree-ganesh`)**: Lord Ganesha crest with ambient golden rose glow and sacred Devanagari Sanskrit shlokas (*Vakratunda Mahakaya...* across 2 rhythmic lines & *Mangalam Bhagwan Vishnuh...*).
- **Wedding Invitation (`#invitation`)**: Dedicated invitation screen with groom & bride names in royal burgundy cursive calligraphy, elegant gold ampersand connector, and monogrammed scratch-to-reveal card with animated glass shine sweep across "SAVE THE DATE", live countdown, confetti celebration, and synchronized global date reveal.
- **Navigation Drawer**: Distraction-free viewport with glassmorphic top-left floating menu, tailored 240px width, two-line stacked couple header (*Yashoratna &* / *Mahek*), and smooth section jumping.
- **Meet the Families (`#couple`)**: Traditional royal Indian wedding lineage cards with sacred Gayatri Mantra Sanskrit shloka (*॥ ॐ भूर्भुवः स्वः...*), `THE GUPTA FAMILY` titles in royal burgundy, `॥ मंगलम् ॥` (*Auspicious Beginning*) & `॥ युग्म ॥` (*Sacred Union*) symbols rendered in two-layer ghost-matched HTML typography with the couple's Hindi initials strictly on consonants (**म** & **य**) highlighted in royal burgundy, diacritics and framing elements in ceremonial gold, unified Cormorant Garamond italic typography across all contextual and relationship lines in muted gray, and luxury double borders with burgundy inner dashed accents.
- **Event Details (`#details`)**: 2-column, 3-row 3D flip cards (total 6 events: Haldi, Engagement & Sangeet, Godh Bharai & Sagai, Baraat & Ghurchari, Jaimaal, Phere) with dining notes ("Dinner to follow" / "Lunch to follow") and attire themes on back faces, 20s animated perimeter timer strokes, signature gold divider lines with center jewel dot, desktop card partition line optimization, dual unified action buttons ("Save Event Details" & "How to reach venue?") with 10% bottom viewport spacing, interactive venue navigation popup with QR code, and a dedicated itinerary modal featuring 2x2 grid layout, 30s auto-close timer, dynamic viewport bounds (`100dvh`, `100svh`), Flaticon buttons, WhatsApp sharing with short map link, and custom themed PDF generation/downloading (`The_Wedding_Events_Yash_Mahek.pdf`) featuring circular jewel dot ornaments.
- **Dynamic Memories Gallery (`#gallery`)**:
  - **Dedicated Whole-View Isolation**: Occupies its own whole view (`min-height: 100vh; min-height: 100lvh;`), cleanly separated from the Blessings Wall.
  - **Live Google Drive Integration**: Upload photos directly to a Google Drive folder to update the gallery in real-time.
  - **Zero-Error Caricature Fallback**: Automatically renders Indian wedding caricature artwork if any photo fails to load.
  - **Adaptive Matting**: Scales down 4K/DSLR portraits, landscapes, and square photos without cropping faces.
  - **3D Coverflow & Lightbox**: Perspective coverflow carousel with clean distraction-free high-res lightbox view.
- **Live Blessings Wall & RSVP (`#blessings`, `#blessings-rsvp`)**:
  - **Dedicated Whole-View Sections**: Both sections occupy full viewport heights. The Blessings & RSVP form card is vertically centered in the viewport with the header anchored at the top.
  - **Real-Time 0-Latency**: Powered by Firebase Firestore listeners with automatic Google Sheets bidirectional synchronization.
  - **Live Heart Reactions (❤️)**: Interactive heart reactions synchronized across all guests.
  - **Matching Royal Frame**: Harmonized luxury border design with burgundy inner dashed trim.
  - **Telegram Bot Notifications & Moderation**: Instant Telegram alerts for new blessings & RSVPs with native inline "🗑️ Delete from Live Wall" moderation buttons.
- **Live Wedding Notice Board**: Real-time announcement feed popup accessible from the floating controls, designed with luxury parchment cards, 45s auto-close progress bar, and instant synchronization with Firebase Firestore and Google Sheets.
- **Telegram Host Announcements**: Hosts can broadcast live updates, ceremony timings, or venue changes directly from the Telegram bot/admin group using `/notice <message>`, `/announce <message>`, or `/alert <message>` (urgent notice). The bot replies with a native inline "🗑️ Remove from Notice Board" button for 1-tap live deletion.
- **FAQ & Footer (`#faq`)**: Curated 6-question accordion covering exact travel routes & distances, complimentary parking, dress codes, December weather breakdown, 12:00 PM check-in & 10:00 AM check-out with mandatory Aadhaar ID requirements, hospitality coordinators, 24/7 snacks availability, official wedding hashtags (`#MahekWedsYash` & `#YashKiMahek`), and interactive action buttons for venue navigation and gallery jumps.
- **Mobile Viewport Stability & Smooth Free Scrolling**: Standardized on `min-height: 100vh; min-height: 100lvh;` with global `overflow-anchor: none !important;` and `scroll-snap-type: none !important;`, preventing mobile URL bar expansion/retraction from triggering scroll jumps, erratic repositioning, or rubber-banding across iOS Safari and Android Chrome.
- **Floating Controls**: Ambient background music player, envelope re-opener, Live Notice Board button (with pulsing badge indicator), and Event Details & Itinerary popup button pinned with responsive right safe-area offset.

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173` to view the website.

---

## 🛠️ Content Configuration

All wedding details are centrally configured in **[`src/content.js`](src/content.js)**:

1. **Couple Names & Date**: `couple.partner1`, `couple.partner2`, and `wedding.dateTimeISO` (e.g. `2026-12-06T17:00:00+05:30`).
2. **Meet the Couple**: `coupleProfiles.bride` and `coupleProfiles.groom` (names, grandparentage, and parentage).
3. **Events Details**: `events` array containing all 6 wedding ceremonies (Haldi, Engagement & Sangeet, Godh Bharai & Sagai, Baraat & Ghurchari, Jaimaal, Phere).
4. **Venue & Directions**: `venue` (resort name, address, Google Maps QR link, turn-by-turn directions, and road/train/air travel guides).
5. **Background Music**: `music.src` (set to `asset("/audio/background-music.mp3")`).
6. **FAQ**: `faq` array of questions and answers.

---

## 🖼️ Dynamic Google Drive Gallery & Guest Uploads

The gallery is built on a strictly separated two-tier Google Drive & Google Sheets architecture that ensures host curation integrity while welcoming guest participation:

### 1. Curated Host Gallery (Live Website Stream)
- **Dedicated Folder**: `Wedding Invite Photo Gallery` (configured in Google Drive)
- **One-Way Host Pipeline**:
  - Hosts upload curated high-resolution wedding photos directly into the Drive folder.
  - Automatically synchronizes to the dedicated **`GALLERY`** tab in Google Sheets, generating live `=IMAGE(...)` 60px thumbnail previews, file IDs, direct links, and timestamps.
  - Streams directly into the website's 3D coverflow gallery.
- **Dynamic Deletion Reflection**:
  - Removing or trashing any photo in the Drive folder automatically clears it from the `GALLERY` sheet and instantly purges it from the live website without stale cache.

### 2. Isolated Guest Uploads (`Guest Uploaded Gallery`)
- **Dedicated Folder**: `Guest Uploaded Gallery` (created automatically as a sibling folder in Google Drive).
- **Guest Upload Modal (`#gallery`)**:
  - Guided by the elegant subtext: *"Share your captured memories with us"*, placed directly above the **`📸 Upload Photos & Videos`** button.
  - Form includes Ceremony selector (Haldi, Engagement & Sangeet, Godh Bharai & Sagai, Baraat & Ghurchari, Jaimaal, Phere, Other) and Guest Name input (with example placeholder `Rahul & Sunita Gupta`).
  - Guests can select multiple photos/videos or capture shots live using their camera.
  - **100% Write-Only Protection**: Guests never get direct write or delete permissions to Google Drive, ensuring total security and privacy.
  - **Real-Time Progress Tracking**: Displays live counter (`Uploading photo 2 of 5 (40%)`), animated progress bar, and per-file checkmarks (`✓`).
- **File Naming Format**: `UploaderName_timestamp_ceremony_originalName` (e.g., `Rohan_Gupta_20260907_Haldi_photo1.jpg`).
- **Google Sheets Logging**: Uploads are appended to the dedicated **`GUEST_UPLOADS`** sheet tab with full metadata.
- **Consolidated Telegram Alerts**: Dispatches a consolidated Telegram alert to the host group once each batch completes.

---

## 💌 Backend Integrations (Firebase, Google Sheets & Telegram)

### 1. Firebase Firestore (Live Web Tier)
- Real-time Firestore collections (`blessings` and `rsvps`) provide instant 0-latency updates for guests and live heart reaction counts (❤️).

### 2. Google Sheets ('Wedding Admin System' Tier)
- Spreadsheet Workbook: **'Wedding Admin System'**
- Apps Script Project: **'WeddingAdminScript'**
- **Instant Two-Way Synchronization**:
  - Automatically synchronized with Firebase every 1 minute and on real-time sheet edits (`onChange` installable trigger).
  - **Sheet ➔ Website Auto-Deletion**: Deleting any row directly in Google Sheets automatically identifies the removed document ID and purges it from Firebase Firestore, instantly removing it from the live website wall.
  - **Protected In-Flight Submissions**: Brand-new web submissions (<3 minutes) are preserved and never accidentally purged during sync cycles.
- Dedicated Tabs:
  - `BLESSINGS_BRIDE` & `BLESSINGS_GROOM`: `Name | Side | Message | Timestamp | Hearts (❤️) | FirebaseDocID`
  - `RSVP_BRIDE` & `RSVP_GROOM`: `Name | Side | Attending | Guests | Parking Required | Timestamp | FirebaseDocID`
  - `GALLERY`: `IMAGE_URL | PHOTO_CAPTION | DRIVE_FILE_ID | DATE_ADDED | PREVIEW` (with `=IMAGE(...)` thumbnail formula)
  - `GUEST_UPLOADS`: `BATCH_ID | FILE_NAME | UPLOADER_NAME | CEREMONY | TOTAL_COUNT | FILE_INDEX | UPLOAD_DATE | UPLOAD_TIME | DRIVE_FILE_ID | DRIVE_FILE_URL | STATUS`
  - `ANNOUNCEMENTS`: Real-time announcements synchronized with the Live Notice Board.

### 3. Telegram Bot Notifications & In-App Moderation
- Instant Telegram group notifications for every Blessing, RSVP, and completed Guest Upload batch.
- **Single-Notification Deduplication**: Uses `CacheService.getScriptCache()` and persistent ID verification to guarantee exactly **one** Telegram alert per submission, preventing duplicate messages from network retries or cross-origin redirect fallbacks.
- **Native Inline `🗑️ Delete from Live Wall` Button**:
  - In-app callback acknowledges the action in <0.2s without browser navigation.
  - Strikes through message text in Telegram and labels it `❌ REMOVED & DELETED`.
  - Immediately deletes the document from Firebase Firestore (removing it from the live website).
  - Automatically scans and removes all matching rows across all sheet tabs and forces a disk flush via `SpreadsheetApp.flush()`.
- **Live Notice Board Broadcast**: Hosts can post announcements to the live website notice board directly from Telegram via `/notice <message>`, `/announce <message>`, or `/alert <message>`.

---

## 📦 Production Build

```bash
npm run build
```

Generates optimized static production assets in the `dist/` directory ready for deployment to GitHub Pages, Vercel, Netlify, or Firebase Hosting.

---

## 📁 Project Structure

```text
src/
  content.js          ← Central copy, event details, venue & backend configuration
  index.css           ← Global design tokens, CSS variables, and typography rules
  lib/
    firebase.js       ← Real-time Firestore configuration
    smoothScroll.js   ← Eased navigation scrolling
  hooks/
    useBlessings.js   ← Live Firestore listener and sync hook
    useCountdown.js   ← Live countdown timer logic
  components/         ← Interactive section components:
    EnvelopeIntro.jsx       ← 3D envelope opening experience with wax seal
    ShreeGanesh.jsx         ← Sacred Ganesha invocation with golden rose glow & Sanskrit shlokas
    Invitation.jsx          ← Dedicated invitation screen with couple names & scratch-to-reveal card
    ScratchReveal.jsx       ← Monogrammed scratch card with glass shine animation & live countdown
    MeetFamilies.jsx        ← Royal Indian family lineage cards with Gayatri Mantra shloka
    EventDetails.jsx        ← 2-column, 3-row 3D flip cards (6 events) with calibrated heights & venue button
    VenueModal.jsx          ← Venue travel directions popup with QR code & transit options
    SaveEventsModal.jsx     ← Save Event Details modal with 2x2 grid, auto-close timer & PDF/WhatsApp tools
    NoticeBoardModal.jsx    ← Live Wedding Notice Board modal for real-time announcements
    Gallery.jsx             ← 3D coverflow carousel with adaptive matting & caricature fallback
    GalleryUploadModal.jsx  ← Guest photo/video upload modal with batch progress & ceremony picker
    Blessings.jsx           ← Curated blessings wall cards with live heart reactions (❤️)
    BlessingsRSVP.jsx       ← Tabbed blessings submission & RSVP form
    FAQ.jsx                 ← Interactive accordion with route, dress code & stay guides
    FloatingControls.jsx    ← Music player, envelope re-opener, notice board & Event Details triggers
  utils/
    generateEventPdf.js     ← Client-side luxury PDF generator with jewel dot ornaments & WhatsApp formatter
public/
  images/             ← Static vector artwork, caricature fallbacks, and monogram assets
  flaticons/          ← Traditional Indian wedding motifs
  audio/              ← Background wedding music track
google-apps-script/
  Code.gs             ← Google Sheets, Google Drive dual-gallery & Telegram bot automation
  appsscript.json     ← Apps Script manifest and OAuth scopes
```

### Latest Layout & UI Refinements
- **1-Column Event Cards:** Event details are now beautifully centered in a single vertical column with Shree Ganesh-style partition lines.
- **Typographic Consistency:** Font sizes across the Blessing and Gallery modals have been strictly normalized for a uniform reading experience.
