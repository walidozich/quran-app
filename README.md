# صاحبك — Quran Learning Platform

An Arabic, right-to-left mobile app where **students record Quran recitations** and **teachers review them with timestamped annotations** — pinning a voice correction, a text comment, and tags to the exact moment of each mistake. Teachers also **assign wirds (أوراد)** — Quran portions to recite — and track each student's progress. Students consume feedback in context, filter their mistakes by tag, and respond with new attempts that form a review thread.

> ## ❤️ A charity project — free forever, never for profit
> This is built as a **sadaqah (صدقة جارية)** — for good deeds, not money. Under the
> [PolyForm Noncommercial License](LICENSE.md), **any commercial use is strictly not allowed**:
> no selling, no charging for access, no paywalls, and **no advertising or monetization** of any kind.
> Use it, fork it, improve it, and share it freely — for free. Keep it that way. 🤲

> **Status:** Runs against **cloud Supabase** (supabase.com) — Postgres + Storage + Auth + RLS — so phones share one backend over the internet (no same-Wi-Fi requirement). Distributed as an **installable Android APK** (`./build-apk.sh`). Source of truth: `spec.md`; plan: `todo.md`.

---

## Quick start

Prerequisites: **Node ≥ 20**, and either the **Expo Go** app (SDK 54) for dev, or **JDK 17** + Android SDK to build the APK.

### Develop (Expo Go)
```bash
npm install
./dev.sh            # tunnel (works anywhere) — or ./dev.sh --lan on the same Wi-Fi
```
`.env` points at the cloud project (`EXPO_PUBLIC_SUPABASE_URL` + anon key). Scan the QR with Expo Go. Note: push notifications **don't** deliver in Expo Go (needs the APK).

### Build the installable APK
```bash
./build-apk.sh      # JDK-17 release build → output/quran-latest.apk
adb install -r output/quran-latest.apk
```
The script re-syncs the native project (`expo prebuild`), forces a fresh JS bundle (so the current `.env` backend is embedded), prints the embedded Supabase host for verification, and copies the APK to `output/`. Works on any network since the backend is cloud `https`.

---

## Backend

Everything lives on **cloud Supabase**: accounts via Supabase Auth (hashed, server-side); audio in private Storage buckets; access scoped by **RLS** (account-scoped: a row is reachable when its profile belongs to the caller's account, `profiles.account_id = auth.uid()`). The active project is set in `.env` (`EXPO_PUBLIC_SUPABASE_URL` + anon key); schema is managed via migrations in `supabase/migrations/`.

### Auth: sign-up wizard, email verification & password reset

Email verification and password reset use **6-digit codes typed in the app** (no deep links, no browser hop — works the same in Expo Go and the APK). Requires two dashboard settings: **Confirm email ON** and the *Confirm signup* / *Reset password* email templates showing `{{ .Token }}`.

```mermaid
flowchart TD
    SU[إنشاء حساب<br/>email + password] -->|code emailed| V[أدخل الرمز<br/>6-digit verifyOtp]
    V --> PS[الملف الشخصي الأول<br/>name · sex · birth date · teach flag]
    PS --> PICK[من يقرأ الآن؟<br/>profile picker]
    SI[تسجيل الدخول] --> PICK
    SI -.->|نسيت كلمة المرور؟| F[email → recovery code<br/>→ new password] --> PICK
    PICK --> HOME[home by mode]
    PICK -.->|no profiles yet| PS
```

### Profiles, the picker & the mode switch

- **Picker on every cold start** ("من يقرأ الآن؟"): colored-initial tiles, last-used highlighted, long-press to edit, "+ إضافة فرد" (max 6). Switch anytime from حسابي → "تبديل الفرد".
- **Profile create/edit/delete**: name, sex, birth date, tile color (8 presets), "سأُدرّس" flag. Delete is hard (cascades that person's data) behind a strong confirmation.
- **Dual role**: a teacher profile gets an Airbnb-style **"التحوّل إلى التعلّم / التدريس"** switch in حسابي; each mode keeps its own clean tabs and stats, and the mode is remembered per profile. A profile can't join a class it teaches (UI message + RLS).
- **Join guideline** (soft): a student **15+** joining an **opposite-sex** teacher's class gets a warning dialog and may still proceed (`ADULT_AGE` in `src/features/profiles/constraints.ts`).
- **Multiple teachers per class**: the creator is the **owner**; other teachers join with a secret per-class **رمز المعلّمين** (kept in its own owner-readable table and validated server-side by the `join_class_as_teacher` RPC). Co-teachers get full teaching rights — review, assign wirds, mark completions — while rename/delete and roster/co-teacher administration stay with the owner. A profile can never be teacher and student in the same class. Every submitted review records **which teacher reviewed it** (`recordings.reviewed_by`), shown to both sides ("راجعه: …").
- **Shared-phone notifications**: pushes are titled with the person they're for ("فاطمة · تمت المراجعة"); tapping one auto-switches to that profile (and the right mode) before opening the recording. The device token is registered on every profile of the account.

---

## Tech stack

- **Expo SDK 54** (React Native 0.81, React 19.1) + **TypeScript**, **Expo Router** (file-based)
- **RTL** forced; all copy centralized in `src/i18n/ar.ts`
- Fonts: **Amiri** (UI, real 400/700 bold) + **Amiri Quran** (`variant="quran"`, for ayah text)
- **Supabase** — Postgres + Storage + Auth + RLS
- **TanStack Query** for server state; **expo-audio** for record/playback
- **expo-notifications** + Expo Push (FCM) for notifications; `react-native-svg` for charts/icons
- **Purposeful motion**: the logo's SVG parts animate on the splash (equalizer bars pop center-outward), profile tiles stagger in, wird completion celebrates — all skipped when the OS requests reduced motion

---

## Architecture

```mermaid
flowchart TD
    subgraph App[Expo React Native — TypeScript, RTL]
        R[Expo Router<br/>role tab-stacks]
        Q[TanStack Query]
        S[Typed Supabase client]
        AU[expo-audio]
        N[expo-notifications]
        TH[Design system + Arabic strings]
    end
    S <-->|REST| SB[(Cloud Supabase)]
    N -->|Expo Push| EXPO[Expo push service] --> FCM[(FCM)]
    SB --> DB[(Postgres + RLS)]
    SB --> ST[(Storage: recordings, corrections)]
    SB --> AUTH[(Auth: email + password)]
```

### Core data model (v2): account → person-profiles

One **auth account** (email) holds up to **6 person-profiles** (Netflix-style, for families
sharing a phone). Identity everywhere is the **profile**; teaching is a **flag**, not a role —
any profile can study, a teacher-flagged profile can also run classes (so one person can teach
and learn from the same account). Every RLS policy is scoped by
`profiles.account_id = auth.uid()`.

```mermaid
erDiagram
    AUTH_USERS ||--|{ PROFILES : "account_id (1..6)"
    PROFILES ||--o{ CLASSES : "teacher_id = owner (is_teacher only)"
    PROFILES ||--o{ CLASS_TEACHERS : "co-teacher (is_teacher only)"
    PROFILES ||--o{ CLASS_MEMBERS : "student_id (any profile)"
    CLASSES ||--o{ CLASS_MEMBERS : class_id
    CLASSES ||--o{ CLASS_TEACHERS : class_id
    CLASSES ||--|| CLASS_TEACHER_CODES : "secret co-teacher code"
    PROFILES {
        uuid id PK
        uuid account_id FK
        text full_name
        text sex "male | female"
        date birth_date
        bool is_teacher
        text avatar_color
    }
```

### Navigation (bottom tabs, per-tab stacks)

Each role is a **bottom tab navigator**; the primary tab owns a **stack** so detail screens push full-screen while the tab bar stays visible. The old side drawer was replaced by the **حسابي (Account)** tab.

```mermaid
flowchart TD
    subgraph Student
      SH["(home) stack<br/>list → class → record / recording / thread"]
      SD[إحصاءات]
      SS[ادرس]
      SA["حسابي (account)"]
    end
    subgraph Teacher
      TH2["(home) stack<br/>queue → class → review / thread"]
      TD[إحصاءات]
      TM[إدارة]
      TA["حسابي (account)"]
    end
```

### How two devices stay in sync

```mermaid
sequenceDiagram
    participant S as Student phone
    participant DB as Cloud Supabase
    participant T as Teacher phone
    S->>DB: upload recording (audio + row)
    DB-->>T: push "new recording" + refetch on focus/reload
    T->>DB: add annotations + submit review
    DB-->>S: push "review done" + feedback appears
    S->>DB: new attempt (responds_to) → thread continues
```

---

## Core loop

```mermaid
flowchart LR
    J[Student joins<br/>class] --> A[Records<br/>into a class]
    A --> B[Upload + label]
    B --> C[Teacher reviews:<br/>voice + text + tags]
    C --> D[Submit review]
    D --> E[Student sees feedback]
    E --> F[Study by tag]
    E --> G[New attempt as response]
    G --> C
```

**Multiple classes** (Google-Classroom style): a student joins many classes, each owned by a different teacher; every recording targets one class. Tapping **"add note"** while reviewing **auto-pauses** playback at that moment. Each role has a **stats dashboard** (coverage, most-recited surahs, mistakes by surah/tag).

---

## Wird (أوراد) — the attempt loop

A wird is an **iterative loop**: the teacher assigns a portion, the student records an attempt, the teacher corrects it, the student retries — until it's good and the teacher declares it complete (which feeds the stats and suggests the next portion).

```mermaid
stateDiagram-v2
    [*] --> جديد: teacher assigns (quick-assign screen)
    جديد --> بانتظار_التصحيح: student records attempt n
    بانتظار_التصحيح --> صُحّحت: teacher reviews the attempt
    صُحّحت --> بانتظار_التصحيح: student records attempt n+1
    صُحّحت --> مكتمل: teacher taps "أتمّ الورد ✓" in the review screen
    مكتمل --> [*]: celebration + "الورد التالي؟" suggestion
```

- **Student**: the dashboard leads with **"وِردُك الحالي"** cards — portion, attempt number, state, and ONE smart action: `سجّل الآن` (new) / `اعرض المحاولة` (awaiting) / `اسمع التصحيح` + `سجّل المحاولة التالية` (corrected). Recording is pre-filled and linked; retries thread onto the previous attempt.
- **Teacher — completing**: the **"أتمّ الورد ✓"** button lives right in the review screen; completing shows a celebration and suggests **the next portion continuing where this one ended** (البقرة ١–٥ → البقرة ٦–١٠, across surah/page boundaries): [إسناد الآن] [تعديل] [لاحقًا]. The class roster keeps the ✓/⏳ overview and a manual override.
- **Teacher — assigning**: a **one-screen quick assign** (portion is the hero, target defaults to the whole class, due optional, title/note collapsed) plus a "متابعة بعد آخر ورد" shortcut that pre-fills the continuation of the last assigned wird.

Overdue wirds show a `متأخر` badge.

---

## Recording review lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: student uploads
    Pending --> InReview: teacher adds first annotation (draft, hidden)
    InReview --> InReview: add/edit annotations (still hidden)
    InReview --> Reviewed: teacher submits review
    Reviewed --> Reviewed: teacher reopens + edits, then resubmits
    Reviewed --> [*]
```

---

## Notifications

On login the device's Expo push token is saved to `profiles.expo_push_token`. Pushes fire on: **review submitted** → student, **new recording** → teacher, **annotation reply** → the other party, and **wird assigned** → student(s). Each event is also written to a **`notifications` table** powering an in-app **notification center** (bell + unread badge + app-icon badge), and tapping a recording notification **deep-links** to it.

> Delivery needs the **APK** (not Expo Go) with **FCM credentials** configured via EAS + a custom sound (`assets/quran_app_notif.mp3`). Sending is currently client-side; production should move it to a Supabase **Edge Function**.

---

## Design & branding

Identity from the *mushaf*: **emerald** (`#0E5E4E`) + **gold** (`#C9A227`) on parchment (light) / **warm charcoal** (dark); **Amiri** Arabic type with a thin gold rule + diamond under each header. Light/dark palettes live in `src/theme/colors.ts` (via `ThemeProvider` + `useColors()`), toggled from the **Account** tab and persisted.

- **Ayah/page picker** (`AyahPicker`): pick **by ayah** (surah → ayah, capped, cross-surah ranges) or **by page** (1–604), Latin numerals; fills the recording/wird label (still editable).
- **Recording UI:** a pulsing `RecordingOrb` while live; recitations cap at 5 min, voice corrections at 2 min.
- **Annotations:** point **or range** (`end_ms`), per-annotation **replies + resolve**, visible markers on the seek bar with a "go to" jump.
- **Account tab:** profile (name / email / WhatsApp), dark-mode toggle, logout.
- **Teacher:** rename/delete class, remove students, copy join code, reopen-to-edit a submitted review.
- **App icon & splash** generated from `assets/logo.svg` (emerald `#01443A`).

---

## Contributing

Contributions are welcome! Please:
1. Read **[`CONTRIBUTING.md`](CONTRIBUTING.md)** — it covers setting up **your own** Supabase project
   (create one, apply `supabase/migrations/`, fill `.env`), running the app, and the PR workflow.
2. Skim **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** for the design, data model, and screen map.
3. Before a PR: `npx tsc --noEmit` and `npx expo export --platform android` must pass (CI enforces this).

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md) and that your contributions
are released under the project's [PolyForm Noncommercial License](LICENSE.md) — i.e. **non-commercial use
only** (no selling, paywalls, or ads). Report vulnerabilities privately per [`SECURITY.md`](SECURITY.md).

> The `.env` in this repo (gitignored) points at the maintainer's backend — contributors run against
> their **own** Supabase project, so you don't need any of the maintainer's keys.

## Project layout

```
app/
  (auth)/                  sign-in / sign-up
  (student)/               role tab navigator
    (home)/                home stack: index, class, record, recording, thread
    dashboard / study / more
  (teacher)/               role tab navigator
    (home)/                home stack: index, class, review, thread
    dashboard / manage-class / more
  notifications.tsx, profile.tsx
src/
  config/ theme/ i18n/ components/ lib/ types/
  features/  session, classes, recordings, annotations, tags, wirds, notifications, account, stats
supabase/migrations/       SQL schema + RLS (applied to cloud via the Supabase MCP)
build-apk.sh               JDK-17 release build → output/
spec.md / todo.md          design + plan (gitignored)
```
