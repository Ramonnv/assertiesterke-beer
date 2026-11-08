#!/bin/bash
# Sterke Beer - installeert alles wat nodig is om de APK te bouwen (eenmalig).
# Alles komt in je eigen gebruikersmap; er is geen wachtwoord nodig.
cd "$(dirname "$0")/.." || exit 1
LOG="$PWD/setup.log"
exec > >(tee "$LOG") 2>&1
set -e
trap 'echo; echo "=== FOUT: installatie is gestopt (zie hierboven) ==="' ERR
echo "=== Sterke Beer: installatie gestart $(date) ==="

TOOLS="$HOME/.sterkebeer"; mkdir -p "$TOOLS"
if [ "$(uname -m)" = "arm64" ]; then JARCH=aarch64; else JARCH=x64; fi
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1

echo; echo ">> Stap 1/4: .NET 10"
if "$DOTNET_ROOT/dotnet" --list-sdks 2>/dev/null | grep -q '^10\.'; then
  echo "   al aanwezig"
else
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$TOOLS/dotnet-install.sh"
  bash "$TOOLS/dotnet-install.sh" --channel 10.0 --install-dir "$DOTNET_ROOT"
fi
dotnet --version

echo; echo ">> Stap 2/4: Java (Microsoft OpenJDK 17)"
JDK=$(ls -d "$TOOLS"/jdk*/Contents/Home 2>/dev/null | head -1 || true)
if [ -z "$JDK" ]; then
  curl -fL --progress-bar "https://aka.ms/download-jdk/microsoft-jdk-17-macos-$JARCH.tar.gz" -o "$TOOLS/jdk.tgz"
  tar -xzf "$TOOLS/jdk.tgz" -C "$TOOLS"; rm -f "$TOOLS/jdk.tgz"
  JDK=$(ls -d "$TOOLS"/jdk*/Contents/Home | head -1)
fi
echo "   $JDK"; "$JDK/bin/java" -version

echo; echo ">> Stap 3/4: Android-onderdelen voor .NET"
dotnet workload install android

echo; echo ">> Stap 4/4: Android SDK (dit duurt even)"
SDK="$HOME/Library/Android/sdk"; mkdir -p "$SDK"
dotnet build SterkeBeer.csproj -t:InstallAndroidDependencies -f net10.0-android \
  "-p:AndroidSdkDirectory=$SDK" "-p:JavaSdkDirectory=$JDK" -p:AcceptAndroidSDKLicenses=True

echo; echo "=== KLAAR: alles is geïnstalleerd. Start nu taak '2. Bouw de APK'. ==="
