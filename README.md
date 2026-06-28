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

## Design & branding
Visual identity drawn from the *mushaf* (illuminated manuscript): **deep emerald** (`#0E5E4E`), **warm gold** (`#C9A227`), parchment background, **Tajawal** Arabic type. The signature element is a thin gold rule with a centered diamond (a nod to mushaf section borders) under every screen header. Launch shows an emerald **brand splash** (`BrandSplash`) with the logo, then a branded sign-in hero (`AuthHero`). Every screen header (`ScreenHeader`) carries a back arrow (RTL → points right) and the reload button.

**Logo:** the app renders `assets/logo.svg` as a component (via `react-native-svg-transformer`). A placeholder rub-el-hizb is committed; replace `assets/logo.svg` with your own (same path + name) and restart Metro with cache clear (`./dev.sh --lan -c`). For the native app icon, replace `assets/icon.png` (1024×1024 PNG).

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
