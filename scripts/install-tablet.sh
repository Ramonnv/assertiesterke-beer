#!/bin/bash
# Zet de APK op een tablet die met USB is aangesloten (USB-foutopsporing aan).
cd "$(dirname "$0")/.." || exit 1
ADB="$HOME/Library/Android/sdk/platform-tools/adb"
"$ADB" devices
"$ADB" install -r SterkeBeer.apk && echo "=== Staat op de tablet! ==="
