#!/usr/bin/env bash
#
# Build the release APK (standalone, debug-keystore signed → installable) and
# copy it into ./output. Run it yourself from anywhere:
#
#   ./build-apk.sh
#
# Requirements:
#   - JDK 17 (Gradle can't run on Java 21/25+). Uses $JAVA_HOME if it points at a
#     17, otherwise auto-detects one in common locations.
#   - Android SDK ($ANDROID_HOME, or ~/Android/Sdk).
#
# The embedded Supabase backend comes from .env (EXPO_PUBLIC_* are inlined at
# bundle time). Switch backends by editing .env, then re-run.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# --- locate a JDK 17 (portable: no hardcoded user paths) ---------------------
is_jdk17() { [ -x "$1/bin/java" ] && "$1/bin/java" -version 2>&1 | grep -q 'version "17'; }

JDK=""
if [ -n "${JAVA_HOME:-}" ] && is_jdk17 "$JAVA_HOME"; then
  JDK="$JAVA_HOME"
else
  for d in \
    /usr/lib/jvm/java-17-openjdk* \
    /usr/lib/jvm/*temurin*17* \
    /usr/lib/jvm/*-17-* \
    /usr/lib/jvm/*17* \
    "$HOME"/.sdkman/candidates/java/17* \
    "$HOME"/jdks/jdk-17* \
    /Library/Java/JavaVirtualMachines/*17*/Contents/Home; do
    if is_jdk17 "$d"; then JDK="$d"; break; fi
  done
fi

if [ -z "$JDK" ]; then
  echo "✗ JDK 17 not found. Install JDK 17 (e.g. Temurin/OpenJDK) and/or set JAVA_HOME to it." >&2
  echo "  Gradle here can't run on Java 21/25+; this project needs 17." >&2
  exit 1
fi
export JAVA_HOME="$JDK"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

if [ ! -d "$ANDROID_HOME" ]; then
  echo "✗ Android SDK not found at '$ANDROID_HOME'. Set ANDROID_HOME to your SDK location." >&2
  exit 1
fi

echo "▶ JAVA_HOME=$JAVA_HOME"
echo "▶ ANDROID_HOME=$ANDROID_HOME"

if [ -f .env ]; then
  echo "▶ Backend (.env): $(grep -E '^EXPO_PUBLIC_SUPABASE_URL' .env | head -1 || echo '(none)')"
fi

# Re-sync the native project from app.json (plugins, name, google-services, sounds).
# Plain prebuild (merge) is fast and keeps the Gradle/native cache, so it's safe
# every build. (Do NOT use --clean: it wipes android/ and forces a long native recompile.)
echo "▶ Syncing native project (expo prebuild)…"
npx expo prebuild -p android --no-install

# Gradle does NOT treat .env as a build input, so an incremental build can ship a
# stale JS bundle (wrong Supabase URL). Force a fresh bundle by clearing outputs.
echo "▶ Clearing stale bundle/asset/apk outputs…"
rm -rf android/app/build/generated/assets \
       android/app/build/intermediates/assets \
       android/app/build/intermediates/merged_assets \
       android/app/build/outputs/apk \
       android/app/build/intermediates/apk

echo "▶ Building release APK (this takes a few minutes)…"
( cd android && ./gradlew assembleRelease --no-daemon )

APK="android/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK" ]; then
  echo "✗ Build finished but APK not found at $APK" >&2
  exit 1
fi

# Confirm which Supabase host actually got baked into the bundle.
BUNDLE="android/app/build/intermediates/assets/release/mergeReleaseAssets/index.android.bundle"
if [ -f "$BUNDLE" ]; then
  echo "▶ Embedded Supabase host(s):"
  grep -ao 'https://[a-z0-9]*\.supabase\.co\|192\.168\.[0-9.]*' "$BUNDLE" | sort -u | sed 's/^/    /' || true
fi

mkdir -p output
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="output/quran-${STAMP}.apk"
cp "$APK" "$DEST"
cp "$APK" "output/quran-latest.apk"

echo ""
echo "✅ APK ready:"
ls -lh "$DEST" "output/quran-latest.apk"
echo ""
echo "Install with:"
echo "    adb install -r \"$ROOT/output/quran-latest.apk\""
