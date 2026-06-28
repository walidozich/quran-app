# منصة تعليم القرآن — Quran Learning Platform

An Arabic, right-to-left mobile app where **students record Quran recitations** and **teachers review them with timestamped annotations** — pinning a voice correction, a text comment, and tags to the exact moment of each mistake. Students consume feedback in context, filter their mistakes by tag to study weaknesses, and respond with new attempts that form a review thread.

> **Status:** Phase 0 complete — Expo + TypeScript + Expo Router scaffold runs on Android (Expo Go). See `todo.md` for the phase plan.

## Tech stack
- **Expo (React Native)** + **TypeScript**, **Expo Router** (file-based routing)
- **Supabase** — Postgres + Storage + Auth + RLS *(added Phase 2)*
- **TanStack Query** for server state *(added Phase 2)*
- **expo-audio** for recording/playback *(added Phase 4)*
- **Tajawal** font, forced **RTL** *(added Phase 1)*

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

## Core loop
```mermaid
flowchart LR
    A[Student records] --> B[Upload + label]
    B --> C[Teacher reviews:<br/>voice + text + tags]
    C --> D[Submit review]
    D --> E[Student sees feedback]
    E --> F[Study by tag]
    E --> G[New attempt as response]
    G --> C
```

## Getting started
```bash
npm install
cp .env.example .env   # fill in Supabase keys from Phase 2 onward
npx expo start         # scan the QR code with Expo Go on Android
```

## Project layout
```
app/        Expo Router routes (screens)
src/        config, theme, i18n, components, features, lib, types
assets/     icons & images
spec.md     approved v1 design (source of truth)
todo.md     phase-by-phase implementation plan
```
