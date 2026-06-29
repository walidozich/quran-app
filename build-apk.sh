#!/usr/bin/env bash
#
# Build the release APK (standalone, debug-keystore signed → installable) and
# copy it into ./output. Run it yourself from anywhere:
#
#   ./build-apk.sh
#
# Requirements:
#   - JDK 17 (Gradle cannot run on Java 25). Override the path if yours differs:
#       JAVA_HOME=/path/to/jdk17 ./build-apk.sh
#   - Android SDK (defaults to ~/Android/Sdk; override with ANDROID_HOME=...)
#
# The embedded Supabase backend comes from .env (EXPO_PUBLIC_* are inlined at
# bundle time). Switch backends by editing .env, then re-run this script.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-/home/walidozich/jdks/jdk-17.0.19+10}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

echo "▶ JAVA_HOME=$JAVA_HOME"
echo "▶ ANDROID_HOME=$ANDROID_HOME"

if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "✗ JDK 17 not found at \$JAVA_HOME. Set JAVA_HOME to a JDK 17 install." >&2
  exit 1
fi

if [ -f .env ]; then
  echo "▶ Backend (.env): $(grep -E '^EXPO_PUBLIC_SUPABASE_URL' .env | head -1 || echo '(none)')"
fi

# Gradle does NOT treat .env as a build input, so an incremental build can ship a
# stale JS bundle (wrong Supabase URL). Force a fresh bundle every time by clearing
# the bundle/asset/apk outputs. (We avoid `gradlew clean` — its native CMake clean
# task is broken on this setup.)
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
