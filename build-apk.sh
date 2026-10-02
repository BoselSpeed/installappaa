#!/bin/bash
# Detached Android build helper.
#
# The sandbox kills a background process when the shell call that started it
# returns, so builds have to run under their own session (started via setsid).
# JAVA_HOME/ANDROID_SDK_ROOT are pinned here rather than exported by the caller,
# because they are lost the moment the shell call ends.
export JAVA_HOME="$HOME/toolchain/jdk-21.0.12.1+1"
export ANDROID_SDK_ROOT="$HOME/toolchain/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
cd /home/daytona/project/android || exit 1
./gradlew "$@" --no-daemon --console=plain
echo "GRADLE_EXIT=$?"
