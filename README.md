# منصة تعليم القرآن — Quran Learning Platform

An Arabic, right-to-left mobile app where **students record Quran recitations** and **teachers review them with timestamped annotations** — pinning a voice correction, a text comment, and tags to the exact moment of each mistake. Students consume feedback in context, filter their mistakes by tag to study weaknesses, and respond with new attempts that form a review thread.

> **Status:** Runs against a **self-hosted Supabase server** (default) so multiple phones share one backend — a teacher on one phone reviews a student's recording from another, in real time. The server runs locally on the dev PC via the Supabase CLI (Docker) and is seeded with **10 demo users + one class**. A fully on-device mode is kept behind a flag for single-phone testing. See `todo.md`.

## Quick start
Prerequisites: **Node ≥ 20**, **Docker** running, the **Expo Go** app (SDK 54) on each phone, and the phones on the **same Wi-Fi** as the PC.

```bash
# 1. Install dependencies
npm install

# 2. Start + seed the backend (Supabase via Docker). Leave it running.
./server.sh

# 3. (first time only) open the firewall so phones can reach the PC
sudo ufw allow from 192.168.1.0/24 to any port 8081 proto tcp   # Metro
sudo ufw allow from 192.168.1.0/24 to any port 54321 proto tcp  # Supabase API

# 4. Launch the app
./dev.sh --lan      # direct LAN (fast).  Use ./dev.sh for tunnel mode instead.
```

Scan the QR with Expo Go on each phone. Log in as a **teacher** on one and a **student** on another (credentials below). Stop the backend when done with `npx supabase stop`.

```mermaid
flowchart LR
    I["npm install"] --> S["./server.sh<br/>(Supabase + seed)"]
    S --> F{"firewall<br/>open?"}
    F -- "no (first run)" --> U["sudo ufw allow<br/>8081 + 54321"]
    F -- "yes" --> D
    U --> D["./dev.sh --lan"]
    D --> Q["scan QR in Expo Go<br/>on each phone"]
    Q --> L["log in:<br/>teacher / student"]
```

> If a phone is stuck on a white screen with a blue bar, the LAN path is blocked — use `./dev.sh` (tunnel) instead. If the PC's IP changed, update `EXPO_PUBLIC_SUPABASE_URL` in `.env`. See "Networking" below.

## Backend modes
The data layer, auth, and file storage all switch on one flag:

```ts
// src/config/backend.ts
export const USE_LOCAL_BACKEND = false; // Supabase server (default — multi-device)
// = true → fully on-device (AsyncStorage + local accounts), single phone only
```

- **Supabase (default):** profiles, classes, recordings, annotations, tags, and audio live on a shared **server**; accounts + credentials are managed by Supabase Auth (hashed, server-side); audio is stored in private Storage buckets. Required for the **two-phone teacher/student simulation**. See "Local server setup" below.
- **On-device:** flip the flag to `true`; everything lives in AsyncStorage on one phone with no network. Useful for quick UI testing, but two phones can't see each other's data.

## Tech stack
- **Expo SDK 54** (React Native 0.81, React 19.1) + **TypeScript**, **Expo Router** (file-based routing) — matches the Expo Go SDK 54 client
- **Tajawal** font, forced **RTL** — all copy in `src/i18n/ar.ts` ✅
- **Supabase** — Postgres + Storage + Auth + RLS ✅ (auth wired in Phase 9)
- **TanStack Query** for server state ✅
- **expo-audio** for recording/playback *(added Phase 4)*

## Local server setup (self-hosted Supabase + two phones)
The server runs on the dev PC via the Supabase CLI (Docker). Phones reach it over Wi-Fi.

1. **Start + seed the server** (Docker must be running):
   ```bash
   ./server.sh          # supabase start + grants + seed 10 users & 1 class
   ```
   Studio is at `http://127.0.0.1:54323`. Stop later with `npx supabase stop`.
2. **Point the app at the server.** `.env` holds `EXPO_PUBLIC_SUPABASE_URL` (the PC's **LAN IP**, e.g. `http://192.168.1.213:54321`, so phones — not just `localhost` — can reach it) and the anon key. If the PC's IP changes, update `.env`.
3. **Open the firewall** so the phones can reach the PC on the API + Metro ports (`54321`, `8081`). On this Fedora box, inbound LAN is dropped by default — see "Networking" below.
4. **Run the app:** `./dev.sh --lan` (direct LAN, once the firewall is open) or `./dev.sh` (tunnel). Scan with Expo Go on each phone.
5. Log in as a **teacher** on one phone and a **student** on the other, then run the loop.

### Demo accounts (password `123456` for all)
Seeded by `server.sh`. The class **حلقة الإمام الشاطبي** (join code **`QRN-QRAN`**) is owned by أحمد with all 8 students already enrolled.

| Role | Email | Name |
|------|-------|------|
| 👨‍🏫 Teacher | `teacher1@quran.app` | الأستاذ أحمد |
| 👩‍🏫 Teacher | `teacher2@quran.app` | الأستاذة مريم |
| 👨‍🎓 Student | `student1@quran.app` | يوسف |
| 👩‍🎓 Student | `student2@quran.app` | فاطمة |
| 👨‍🎓 Student | `student3@quran.app` | عمر |
| 👩‍🎓 Student | `student4@quran.app` | عائشة |
| 👨‍🎓 Student | `student5@quran.app` | خالد |
| 👩‍🎓 Student | `student6@quran.app` | زينب |
| 👨‍🎓 Student | `student7@quran.app` | بلال |
| 👩‍🎓 Student | `student8@quran.app` | سمية |

> Auth is email + password (role chosen at signup; demo users pre-assigned). RLS is scoped to `auth.uid()` (migration `0002`): students see only their own + their class's data; teachers see only their own classes. Deploying to cloud Supabase later: run both migrations, set `.env` to the cloud URL/key, and run the seed against it.

### Networking (why `./dev.sh` defaults to tunnel)
This dev PC has many Docker bridge interfaces + Tailscale up. Two consequences: Expo mis-picks the host IP (fixed by `dev.sh`, which forces the real Wi-Fi IP), and inbound LAN traffic to the PC is dropped, so phones can't reach `54321`/`8081` directly until the firewall is opened. `./dev.sh` (tunnel) sidesteps both; `./dev.sh --lan` is faster once the firewall allows those ports.

## Architecture
```mermaid
flowchart TD
    subgraph App[Expo React Native — TypeScript, RTL]
        R[Expo Router<br/>role-based route groups]
        Q[TanStack Query]
        S[Typed Supabase client]
        AU[expo-audio]
        TH[Design system + Arabic strings]
    end
    S <-->|REST/Realtime| SB[(Supabase)]
    SB --> DB[(Postgres + RLS)]
    SB --> ST[(Storage: recordings, corrections)]
    SB --> AUTH[(Auth: email + password)]
```

### Deployment (two phones + dev PC)
The phones reach the PC's Supabase over Wi-Fi; the dev PC runs the whole backend as Docker containers behind one gateway (Kong, port `54321`).
```mermaid
flowchart LR
    subgraph Phones
      T[Teacher phone<br/>Expo Go]
      ST[Student phone<br/>Expo Go]
    end
    subgraph PC[Dev PC]
      M[Metro :8081<br/>JS bundle]
      subgraph SB[Supabase stack — Docker]
        K[Kong gateway :54321]
        K --> AU[Auth]
        K --> RE[REST]
        K --> STO[Storage]
        AU --> PG[(Postgres)]
        RE --> PG
        STO --> PG
      end
    end
    T -->|bundle| M
    ST -->|bundle| M
    T -->|API + audio| K
    ST -->|API + audio| K
```

### How two devices stay in sync
```mermaid
sequenceDiagram
    participant S as Student phone
    participant DB as Supabase server
    participant T as Teacher phone
    S->>DB: upload recording (audio + row)
    Note over T: teacher taps ⟳ reload (or refocuses app)
    T->>DB: refetch class recordings
    DB-->>T: new recording appears
    T->>DB: add annotation + submit review
    Note over S: student taps ⟳ reload
    S->>DB: refetch
    DB-->>S: review + tags appear
    S->>DB: new attempt (responds_to) → thread continues
```

## Core loop
```mermaid
flowchart LR
    J[Student joins<br/>one or more classes] --> A[Student records<br/>into a chosen class]
    A --> B[Upload + label]
    B --> C[Teacher reviews:<br/>voice + text + tags]
    C --> D[Submit review]
    D --> E[Student sees feedback]
    E --> F[Study by tag]
    E --> G[New attempt as response]
    G --> C
```

**Classes (Google-Classroom style):** a student can join **multiple classes**, each owned by a different teacher; every recording is submitted into a specific class.

**Cross-device sync:** the backend is a shared server, so a teacher and student on two phones see each other's data. Queries refetch on app-focus and after a short stale window; a **reload button** in each screen header forces an immediate refresh on demand.

**Review ergonomics:** tapping **"add note"** while reviewing **auto-pauses** playback at the current moment, so the teacher pins a remark without manually stopping first.

**Dashboards:** each role has a stats screen (charts built on `react-native-svg`, no extra chart lib). The **student** sees totals, a review-status donut, and their **most common mistakes** (top tags). The **teacher** sees class/student/recording counts, a recording-status donut, and the **most common mistakes across their students** — so they can spot which Tajweed errors to focus on.

## Offline vs online
In the default Supabase mode the data lives on a shared server, so anything that **shares or syncs** needs a connection. **Capturing** a recitation works offline; sending, reviewing, and viewing stats do not.

| Action | Works offline? |
|---|---|
| Recording a recitation (capturing audio) | ✅ — `expo-audio` writes a local file |
| Playing your own just-recorded clip (pre-upload) | ✅ — local file |
| Staying logged in across launches | ✅ — session token cached |
| Viewing data already loaded this session | 🟡 in-memory only (lost on restart) |
| Log in / sign up | ❌ Supabase Auth |
| Uploading a recording / correction audio | ❌ Supabase Storage |
| Loading classes, recordings, reviews, tags | ❌ Supabase REST |
| Teacher review (fetch + play student audio) | ❌ streamed from Storage |
| Dashboards / charts | ❌ aggregated from server data |

**Fully-offline alternative:** flip `USE_LOCAL_BACKEND = true` — everything lives on one phone (no network), but two phones can't share data (single-device only). A true *offline-first* product (queue uploads, persist cache for offline review) is future work, not yet built.

## Design & branding
Visual identity drawn from the *mushaf* (illuminated manuscript): **deep emerald** (`#0E5E4E`), **warm gold** (`#C9A227`), parchment background, **Tajawal** Arabic type. The signature element is a thin gold rule with a centered diamond (a nod to mushaf section borders) under every screen header. Launch shows an emerald **brand splash** (`BrandSplash`) with the logo, then a branded sign-in hero (`AuthHero`). Every screen header (`ScreenHeader`) carries a back arrow (RTL → points right) and the reload button.

**Logo & icon:** the app renders `assets/logo.svg` as a component (via `react-native-svg-transformer`). The native **app icon, adaptive foreground, and splash image are generated from `logo.svg`** (emerald `#01443A` background). To regenerate after changing the logo: `magick -background none -density 384 assets/logo.svg -resize 1024x1024 assets/icon.png` (and the padded `android-icon-foreground.png` / `splash-icon.png`). Restart Metro with cache clear (`./dev.sh --lan -c`).

**Empty & error states:** lists use shared `EmptyState` / `ErrorState` components; on a failed fetch the screen shows a retry button (`refetch`) instead of a blank spinner.

**Recording caps:** recitations auto-stop at **5 min**, voice corrections at **2 min** (`src/config/recording.ts`).

**Recording UI:** while recording, a pulsing **`RecordingOrb`** (voice-assistant style ripple, not a waveform) shows it's live.

**Naming a recitation:** an **ayah picker** (`AyahPicker`, all 114 surahs + optional ayah range, Arabic-Indic numerals) fills the recording label, e.g. *سورة البقرة ١–٥*. The free-text label stays editable for custom names.

**Join codes:** the teacher can **tap the join code to copy it** (manage-class screen) — shows *تم النسخ ✓*.

**Push notifications:** on login the device's Expo push token is saved to `profiles.expo_push_token` (migration `0004`). When a teacher **submits a review** the student is notified, and when a student **uploads a recording** the teacher is notified (sends go through the Expo Push API; `src/features/notifications/push.ts`). These are **not** websockets — Expo Push → FCM/APNs.
> ⚠️ Remote push requires a **dev/EAS build** (Expo Go can't receive it) and **FCM credentials** configured via EAS, plus an `eas` `projectId` in the config. It no-ops gracefully in Expo Go / on the local backend. For production, sending should move to a Supabase **Edge Function / DB trigger** (server-side) rather than from the acting client.

**Light / dark theme:** two palettes (`src/theme/colors.ts`) provided via `ThemeProvider`; components read the active palette through the `useColors()` hook (never the static `colors` import). The mode persists in AsyncStorage and is toggled from the drawer. The status bar follows the theme.

**Drawer & navigation:** every home screen has a menu button (top-start) opening a side **drawer** (`src/features/drawer/Drawer.tsx`) with the account, settings (dark-mode switch), and **logout**. Both role homes share one layout: actions first, then the class list. Detail screens carry a back arrow.

**Profile:** tapping the account card in the drawer opens a **profile screen** to edit full name, email, and WhatsApp number (`whatsapp` column added in migration `0003`; email changes go through Supabase Auth).

**Class management (teacher):** the manage-class screen (with the join codes) lets a teacher **rename** or **delete** a class (delete cascades its recordings/reviews) and **remove students** from it.

**Review re-submission:** opening an already-reviewed recording no longer changes anything. To revise it the teacher taps **"تعديل المراجعة"** (confirm), which reopens it as a draft (`in_review`); the student sees no changes until the teacher submits again.

## Recording review lifecycle
```mermaid
stateDiagram-v2
    [*] --> Pending: student uploads
    Pending --> InReview: teacher adds first annotation (draft, hidden from student)
    InReview --> InReview: add/edit annotations (saved, still hidden)
    InReview --> Reviewed: teacher submits review
    Reviewed --> Reviewed: teacher edits (live to student)
    Reviewed --> [*]
```

## On-device mode (single phone, no server)
For quick UI testing without the backend: set `USE_LOCAL_BACKEND = true` in `src/config/backend.ts`, then:
```bash
npm install
./dev.sh --lan         # or ./dev.sh for tunnel mode
```
No `.env`, Docker, or `server.sh` needed — data lives on the one phone. Create a teacher and a student account on the device and run the loop locally. (Two phones can't share data in this mode; use the default Supabase setup above for that.)

`./dev.sh` chooses the connection: `--lan` forces the PC's real Wi-Fi IP (fast, needs the firewall open); plain `./dev.sh` uses **tunnel mode** (routes through Expo's relay — slower, but works when the LAN path is blocked).

## Project layout
```
app/        Expo Router routes (screens)
src/        config, theme, i18n, components, features, lib, types
assets/     icons & images
spec.md     approved v1 design (source of truth)
todo.md     phase-by-phase implementation plan
```
