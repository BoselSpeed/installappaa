#!/bin/bash
# Detached Android build helper.
#
# The sandbox kills a background process when the shell call that started it
# returns, so builds have to run under their own session (started via setsid).
# JAVA_HOME/ANDROID_SDK_ROOT are pinned here rather than exported by the caller,
# because they are lost the moment the shell call ends.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -q 'version "21'; then
  for candidate in "$HOME"/toolchain/jdk-21* "$HOME"/.jdks/*21*; do
    if [ -x "$candidate/bin/java" ] && "$candidate/bin/java" -version 2>&1 | grep -q 'version "21'; then
      JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  for candidate in "$HOME/toolchain/android-sdk" "$HOME/Android/Sdk" /opt/android-sdk; do
    if [ -d "$candidate/platforms" ]; then
      ANDROID_SDK_ROOT="$candidate"
      break
    fi
  done
fi

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "ERROR: JDK 21 not found. Set JAVA_HOME to a JDK 21 installation." >&2
  exit 1
fi

if [ -z "${ANDROID_SDK_ROOT:-}" ] || [ ! -d "$ANDROID_SDK_ROOT/platforms" ]; then
  echo "ERROR: Android SDK not found. Set ANDROID_SDK_ROOT." >&2
  exit 1
fi

export JAVA_HOME ANDROID_SDK_ROOT
export PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
cd "$SCRIPT_DIR/android" || exit 1
./gradlew "$@" --no-daemon --console=plain
echo "GRADLE_EXIT=$?"
