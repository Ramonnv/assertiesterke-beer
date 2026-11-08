#!/bin/bash
# Sterke Beer - bouwt SterkeBeer.apk
cd "$(dirname "$0")/.." || exit 1
LOG="$PWD/build.log"
exec > >(tee "$LOG") 2>&1
set -e
trap 'echo; echo "=== FOUT: bouwen is mislukt (zie hierboven) ==="' ERR
export DOTNET_ROOT="$HOME/.dotnet"; export PATH="$DOTNET_ROOT:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
JDK=$(ls -d "$HOME/.sterkebeer"/jdk*/Contents/Home | head -1)
SDK="$HOME/Library/Android/sdk"
echo "=== APK bouwen $(date) ==="
rm -rf Assets && cp -r web Assets && rm -f Assets/dev-*.html
dotnet publish SterkeBeer.csproj -f net10.0-android -c Release \
  "-p:AndroidSdkDirectory=$SDK" "-p:JavaSdkDirectory=$JDK"
APK=$(ls bin/Release/net10.0-android/publish/*-Signed.apk | head -1)
cp "$APK" "$PWD/SterkeBeer.apk"
echo; echo "=== KLAAR: $PWD/SterkeBeer.apk ==="
